import { stores } from "./data.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const ZIPPOPOTAM_URL = "https://api.zippopotam.us/us";
const DEFAULT_RADIUS_METERS = 40000;
const USER_AGENT = "WeCareHackathonPrototype/0.1";

const categoryTagMap = {
  pharmacy: [
    ['amenity', 'pharmacy'],
    ['healthcare', 'pharmacy'],
    ['shop', 'chemist']
  ],
  medicine: [
    ['amenity', 'pharmacy'],
    ['healthcare', 'pharmacy'],
    ['shop', 'chemist']
  ],
  healthcare: [
    ['amenity', 'pharmacy'],
    ['amenity', 'clinic'],
    ['amenity', 'hospital'],
    ['healthcare', 'pharmacy']
  ],
  pets: [
    ['shop', 'pet'],
    ['shop', 'pet_grooming'],
    ['amenity', 'veterinary']
  ],
  "pet-food": [
    ['shop', 'pet']
  ],
  "pet-care": [
    ['shop', 'pet'],
    ['amenity', 'veterinary']
  ],
  groceries: [
    ['shop', 'supermarket'],
    ['shop', 'convenience'],
    ['shop', 'grocery']
  ],
  food: [
    ['shop', 'supermarket'],
    ['shop', 'convenience'],
    ['shop', 'grocery']
  ],
  household: [
    ['shop', 'supermarket'],
    ['shop', 'convenience'],
    ['shop', 'department_store'],
    ['shop', 'general']
  ],
  baby: [
    ['shop', 'supermarket'],
    ['shop', 'convenience'],
    ['shop', 'baby_goods']
  ],
  ppe: [
    ['amenity', 'pharmacy'],
    ['shop', 'chemist'],
    ['shop', 'medical_supply'],
    ['shop', 'supermarket']
  ]
};

function uniqueTagPairs(desiredCategories) {
  const pairs = desiredCategories.flatMap((category) => categoryTagMap[category] || []);
  const keyed = new Map(pairs.map(([key, value]) => [`${key}:${value}`, [key, value]]));
  return [...keyed.values()];
}

function escapeOverpassValue(value) {
  return String(value).replaceAll('"', '\\"');
}

function buildOverpassQuery({ lat, lon, desiredCategories, radiusMeters }) {
  const pairs = uniqueTagPairs(desiredCategories);
  const filters = pairs.flatMap(([key, value]) => {
    const escapedKey = escapeOverpassValue(key);
    const escapedValue = escapeOverpassValue(value);
    return [
      `node["${escapedKey}"="${escapedValue}"](around:${radiusMeters},${lat},${lon});`,
      `way["${escapedKey}"="${escapedValue}"](around:${radiusMeters},${lat},${lon});`,
      `relation["${escapedKey}"="${escapedValue}"](around:${radiusMeters},${lat},${lon});`
    ];
  });

  return `
    [out:json][timeout:12];
    (
      ${filters.join("\n")}
    );
    out center tags 40;
  `;
}

function getElementPoint(element) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lon: element.lon };
  }

  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  return null;
}

function inferStoreCategories(tags = {}) {
  const categories = [];
  for (const [category, pairs] of Object.entries(categoryTagMap)) {
    if (pairs.some(([key, value]) => tags[key] === value)) {
      categories.push(category);
    }
  }
  return [...new Set(categories)];
}

function inferBrand(tags = {}) {
  return tags.brand || tags.operator || tags.name?.split(" ")[0] || "Local resource";
}

function formatAddress(tags = {}) {
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"];
  const state = tags["addr:state"];
  const postcode = tags["addr:postcode"];
  return [street, city, state, postcode].filter(Boolean).join(", ") || "Address unavailable";
}

export async function geocodeZipcode(zipcode) {
  const zippopotamResponse = await fetch(`${ZIPPOPOTAM_URL}/${encodeURIComponent(zipcode)}`, {
    headers: {
      "accept": "application/json",
      "user-agent": USER_AGENT
    }
  });

  if (zippopotamResponse.ok) {
    const payload = await zippopotamResponse.json();
    const place = payload.places?.find((item) => item["state abbreviation"] === "AZ") || payload.places?.[0];
    if (place) {
      return {
        lat: Number(place.latitude),
        lon: Number(place.longitude),
        label: `${place["place name"]}, ${place["state abbreviation"]}`,
        districtId: null,
        source: "zippopotam"
      };
    }
  }

  const params = new URLSearchParams({
    postalcode: String(zipcode),
    country: "United States",
    state: "Arizona",
    format: "jsonv2",
    limit: "1"
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      "accept": "application/json",
      "user-agent": USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Could not geocode ZIP ${zipcode}.`);
  }

  const results = await response.json();
  const result = results[0];
  if (!result) {
    throw new Error(`No Arizona location found for ZIP ${zipcode}.`);
  }

  return {
    lat: Number(result.lat),
    lon: Number(result.lon),
    label: result.display_name?.split(",").slice(0, 3).join(", ") || `${zipcode}, AZ`,
    districtId: null,
    source: "nominatim"
  };
}

export async function fetchLiveStores({ location, desiredCategories, radiusMeters = DEFAULT_RADIUS_METERS }) {
  const query = buildOverpassQuery({
    lat: location.lat,
    lon: location.lon,
    desiredCategories,
    radiusMeters
  });

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": USER_AGENT
    },
    body: new URLSearchParams({ data: query })
  });

  if (!response.ok) {
    throw new Error(`Overpass place search failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const seen = new Set();

  return (payload.elements || [])
    .map((element) => {
      const point = getElementPoint(element);
      const tags = element.tags || {};
      if (!point || !tags.name) return null;

      const id = `osm-${element.type}-${element.id}`;
      if (seen.has(id)) return null;
      seen.add(id);

      const categories = inferStoreCategories(tags);
      if (categories.length === 0) return null;

      return {
        id,
        name: tags.name,
        brand: inferBrand(tags),
        categories,
        address: formatAddress(tags),
        lat: point.lat,
        lon: point.lon,
        sourceLabel: "OpenStreetMap live result",
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
      };
    })
    .filter(Boolean);
}

export function getSeededFallbackStores() {
  return stores;
}
