import {
  COUPON_UNLOCK_COST,
  POINTS_PER_ELIGIBLE_REPORT,
  REPORT_WINDOW_DAYS,
  coupons,
  demoProfiles,
  districts,
  zipCentroids
} from "./data.js";
import { fetchLiveStores, geocodeZipcode, getSeededFallbackStores } from "./livePlaces.js";

const symptomCategoryMap = {
  cough: ["medicine", "pharmacy"],
  fever: ["medicine", "pharmacy"],
  "sore throat": ["medicine", "pharmacy"],
  fatigue: ["healthcare", "medicine"],
  rash: ["pharmacy", "medicine"],
  "food insecurity": ["groceries", "food"],
  "needs diapers": ["baby", "household"]
};

const professionCategoryMap = {
  teacher: ["ppe", "medicine"],
  nurse: ["healthcare", "ppe", "medicine"],
  "health aide": ["healthcare", "ppe", "pharmacy"],
  student: ["medicine", "pharmacy"],
  farmer: ["ppe", "household"]
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceMiles(a, b) {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).toLowerCase()))];
}

function inferCategories(classifier = {}) {
  const direct = Array.isArray(classifier.categories) ? classifier.categories : [];
  const fromSymptoms = (classifier.symptoms || []).flatMap((symptom) => symptomCategoryMap[String(symptom).toLowerCase()] || []);
  const fromProfession = professionCategoryMap[String(classifier.profession || "").toLowerCase()] || [];
  const fromPets = classifier.hasPets ? ["pets", "pet-food", "pet-care"] : [];
  return unique([...direct, ...fromSymptoms, ...fromProfession, ...fromPets]);
}

async function resolveLocation(input = {}) {
  if (input.location?.lat && input.location?.lon) {
    return {
      lat: Number(input.location.lat),
      lon: Number(input.location.lon),
      label: input.location.label || "Custom location",
      districtId: input.districtId || input.location.districtId || null
    };
  }

  if (input.zipcode) {
    try {
      const liveLocation = await geocodeZipcode(String(input.zipcode).trim());
      return {
        ...liveLocation,
        districtId: input.districtId || liveLocation.districtId
      };
    } catch (error) {
      const zip = zipCentroids[String(input.zipcode || "").trim()];
      if (!zip) throw error;
      return {
        ...zip,
        districtId: input.districtId || zip.districtId,
        source: "seeded_zip_fallback",
        warning: error.message
      };
    }
  }

  const zip = zipCentroids[String(input.zipcode || "").trim()];
  if (!zip) {
    throw new Error("Provide a supported Arizona zipcode or a location with lat/lon.");
  }

  return { ...zip, districtId: input.districtId || zip.districtId };
}

function getCouponsForStore(store, desiredCategories, rewardPoints) {
  const normalizedStoreBrand = store.brand.toLowerCase();
  return coupons
    .filter((coupon) => {
      const normalizedCouponBrand = coupon.brand.toLowerCase();
      return normalizedStoreBrand.includes(normalizedCouponBrand) || normalizedCouponBrand.includes(normalizedStoreBrand);
    })
    .filter((coupon) => coupon.categories.some((category) => desiredCategories.includes(category)))
    .map((coupon) => ({
      ...coupon,
      unlockCost: COUPON_UNLOCK_COST,
      status: rewardPoints >= COUPON_UNLOCK_COST ? "available_to_unlock" : "locked",
      canUnlock: rewardPoints >= COUPON_UNLOCK_COST,
      pointsRemaining: Math.max(COUPON_UNLOCK_COST - rewardPoints, 0)
    }));
}

function getMatchReason(store, desiredCategories) {
  const matched = store.categories.filter((category) => desiredCategories.includes(category));
  if (matched.length === 0) return "Nearby general resource";
  return `Matches ${matched.slice(0, 3).join(", ")}`;
}

function rankStores({ storesToRank, location, desiredCategories, rewardPoints, limit }) {
  return storesToRank
    .map((store) => {
      const distance = distanceMiles(location, store);
      const matchedCategories = store.categories.filter((category) => desiredCategories.includes(category));
      const relevanceScore = matchedCategories.length * 100 - distance;
      return {
        ...store,
        distanceMiles: Number(distance.toFixed(1)),
        matchedCategories,
        relevanceScore
      };
    })
    .filter((store) => store.matchedCategories.length > 0 || store.distanceMiles <= 15)
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      return a.distanceMiles - b.distanceMiles;
    })
    .slice(0, limit)
    .map((store) => {
      const storeCoupons = getCouponsForStore(store, desiredCategories, rewardPoints);
      return {
        id: store.id,
        name: store.name,
        brand: store.brand,
        address: store.address,
        distanceMiles: store.distanceMiles,
        categories: store.categories,
        matchedCategories: store.matchedCategories,
        matchReason: getMatchReason(store, desiredCategories),
        source: { label: store.sourceLabel, url: store.sourceUrl },
        coupons: storeCoupons,
        couponSummary: storeCoupons.length === 0
          ? { hasCoupons: false, status: "none" }
          : {
              hasCoupons: true,
              status: rewardPoints >= COUPON_UNLOCK_COST ? "available_to_unlock" : "locked",
              pointsRemaining: Math.max(COUPON_UNLOCK_COST - rewardPoints, 0)
            }
      };
    });
}

export async function buildRecommendations(input = {}) {
  const location = await resolveLocation(input);
  const rewardPoints = Number(input.rewardPoints || 0);
  const desiredCategories = inferCategories(input.classifier || {});
  const limit = Number(input.limit || 6);
  let storeSource = "openstreetmap_live";
  let sourceWarning = null;
  let storesToRank = [];

  if (Array.isArray(input.storesOverride)) {
    storeSource = "test_override";
    storesToRank = input.storesOverride;
  } else if (input.useSeededStores === true) {
    storeSource = "seeded_requested";
    storesToRank = getSeededFallbackStores();
  } else {
    try {
      storesToRank = await fetchLiveStores({
        location,
        desiredCategories,
        radiusMeters: Number(input.radiusMeters || 40000)
      });
    } catch (error) {
      storeSource = "seeded_fallback";
      sourceWarning = error.message;
      storesToRank = getSeededFallbackStores();
    }
  }

  if (storesToRank.length === 0) {
    storeSource = `${storeSource}_empty`;
  }

  const rankedStores = rankStores({ storesToRank, location, desiredCategories, rewardPoints, limit });

  return {
    user: {
      userId: input.userId || "demo-user",
      rewardPoints,
      zipcode: input.zipcode || null,
      districtId: location.districtId
    },
    request: {
      location,
      desiredCategories,
      classifier: input.classifier || {}
    },
    dataSource: {
      stores: storeSource,
      warning: sourceWarning
    },
    rewardsPolicy: {
      pointsPerEligibleReport: POINTS_PER_ELIGIBLE_REPORT,
      reportWindowDays: REPORT_WINDOW_DAYS,
      couponUnlockCost: COUPON_UNLOCK_COST,
      sourceOfTruth: "WeCare app owns reward balance; this API only evaluates coupon eligibility from the provided rewardPoints."
    },
    stores: rankedStores
  };
}

export function previewCouponUnlock(input = {}) {
  const rewardPoints = Number(input.rewardPoints || 0);
  return {
    couponId: input.couponId || null,
    rewardPoints,
    unlockCost: COUPON_UNLOCK_COST,
    canUnlock: rewardPoints >= COUPON_UNLOCK_COST,
    pointsRemaining: Math.max(COUPON_UNLOCK_COST - rewardPoints, 0),
    pointsAfterUnlock: rewardPoints >= COUPON_UNLOCK_COST ? rewardPoints - COUPON_UNLOCK_COST : rewardPoints,
    mutation: "preview_only"
  };
}

export function getReportAwardPreview(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const lastRewardedReportAt = input.lastRewardedReportAt ? new Date(input.lastRewardedReportAt) : null;
  const elapsedDays = lastRewardedReportAt
    ? (now.getTime() - lastRewardedReportAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const eligible = elapsedDays >= REPORT_WINDOW_DAYS;
  const currentPoints = Number(input.rewardPoints || 0);

  return {
    eligible,
    pointsAwarded: eligible ? POINTS_PER_ELIGIBLE_REPORT : 0,
    currentPoints,
    projectedPoints: currentPoints + (eligible ? POINTS_PER_ELIGIBLE_REPORT : 0),
    nextEligibleAt: eligible
      ? now.toISOString()
      : new Date(lastRewardedReportAt.getTime() + REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    mutation: "preview_only"
  };
}

export function getBimonthlyLeaderboard({ districtGroup = "navajo-nation" } = {}) {
  const period = getCurrentBimonthlyPeriod();
  const rows = districts
    .filter((district) => district.group === districtGroup)
    .map((district) => {
      const normalizedReportsPer1000 = (district.reportsThisPeriod / district.population) * 1000;
      const activePercent = (district.reportsThisPeriod / district.activeRegisteredUsers) * 100;
      return {
        id: district.id,
        name: district.name,
        population: district.population,
        rawReports: district.reportsThisPeriod,
        activeRegisteredUsers: district.activeRegisteredUsers,
        normalizedReportsPer1000: Number(normalizedReportsPer1000.toFixed(1)),
        activePercent: Number(Math.min(activePercent, 100).toFixed(0)),
        previousPeriodRank: district.previousPeriodRank
      };
    })
    .sort((a, b) => b.normalizedReportsPer1000 - a.normalizedReportsPer1000)
    .map((district, index) => ({
      ...district,
      rank: index + 1,
      rankDelta: district.previousPeriodRank - (index + 1)
    }));

  return {
    period,
    scoring: "rawReports / population * 1000",
    districtGroup,
    rows
  };
}

export function getCurrentBimonthlyPeriod(date = new Date()) {
  const year = date.getFullYear();
  const startMonth = Math.floor(date.getMonth() / 2) * 2;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 2, 0, 23, 59, 59));
  return {
    id: `${year}-${String(startMonth + 1).padStart(2, "0")}`,
    label: `${start.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}-${end.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${year}`,
    startsAt: start.toISOString(),
    endsAt: end.toISOString()
  };
}

export function getDemoProfiles() {
  return demoProfiles;
}

export function getServiceMetadata() {
  return {
    service: "wecare-nearby-resources-api",
    version: "0.1.0",
    contract: {
      recommendations: "POST /api/recommendations",
      couponUnlockPreview: "POST /api/coupons/unlock-preview",
      reportAwardPreview: "POST /api/rewards/report-preview",
      leaderboard: "GET /api/leaderboard?districtGroup=navajo-nation"
    },
    rewardModel: {
      appOwnsRewardBalance: true,
      pointsPerEligibleReport: POINTS_PER_ELIGIBLE_REPORT,
      reportWindowDays: REPORT_WINDOW_DAYS,
      couponUnlockCost: COUPON_UNLOCK_COST
    },
    supportedZipcodes: "Any Arizona ZIP code that Nominatim can geocode; seeded fallbacks exist for demo ZIPs.",
    placesProvider: "Live OpenStreetMap search through Nominatim + Overpass API",
    note: "Coupons are mocked. Store/resource locations are live by default and fall back to seeded demo data only if the live provider is unavailable."
  };
}
