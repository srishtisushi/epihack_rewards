export const POINTS_PER_ELIGIBLE_REPORT = 10;
export const REPORT_WINDOW_DAYS = 7;
export const COUPON_UNLOCK_COST = 50;

export const zipCentroids = {
  "86045": { label: "Tuba City, AZ", lat: 36.1349, lon: -111.2399, districtId: "tuba-city" },
  "86033": { label: "Kayenta, AZ", lat: 36.7278, lon: -110.2546, districtId: "kayenta" },
  "86503": { label: "Chinle, AZ", lat: 36.1544, lon: -109.5526, districtId: "chinle" },
  "86515": { label: "Window Rock, AZ", lat: 35.6806, lon: -109.0526, districtId: "window-rock" },
  "86001": { label: "Flagstaff, AZ", lat: 35.1983, lon: -111.6513, districtId: "flagstaff" },
  "85719": { label: "Tucson, AZ", lat: 32.2476, lon: -110.9491, districtId: "university-of-arizona" },
  "85281": { label: "Tempe, AZ", lat: 33.4255, lon: -111.9400, districtId: "tempe" },
  "85004": { label: "Phoenix, AZ", lat: 33.4510, lon: -112.0714, districtId: "phoenix" }
};

export const districts = [
  { id: "tuba-city", name: "Tuba City", group: "navajo-nation", population: 8611, activeRegisteredUsers: 980, reportsThisPeriod: 844, previousPeriodRank: 2 },
  { id: "kayenta", name: "Kayenta", group: "navajo-nation", population: 5189, activeRegisteredUsers: 640, reportsThisPeriod: 488, previousPeriodRank: 1 },
  { id: "chinle", name: "Chinle", group: "navajo-nation", population: 4518, activeRegisteredUsers: 530, reportsThisPeriod: 402, previousPeriodRank: 3 },
  { id: "fort-defiance", name: "Fort Defiance", group: "navajo-nation", population: 3624, activeRegisteredUsers: 430, reportsThisPeriod: 304, previousPeriodRank: 4 },
  { id: "shiprock", name: "Shiprock", group: "navajo-nation", population: 8156, activeRegisteredUsers: 760, reportsThisPeriod: 636, previousPeriodRank: 5 },
  { id: "window-rock", name: "Window Rock", group: "navajo-nation", population: 2487, activeRegisteredUsers: 310, reportsThisPeriod: 214, previousPeriodRank: 6 },
  { id: "university-of-arizona", name: "University of Arizona", group: "university", population: 53400, activeRegisteredUsers: 6200, reportsThisPeriod: 4290, previousPeriodRank: 1 }
];

export const stores = [
  {
    id: "walmart-tuba-city",
    name: "Walmart Supercenter",
    brand: "Walmart",
    categories: ["groceries", "pharmacy", "medicine", "household", "ppe", "baby"],
    address: "1017 W Haul Rd, Tuba City, AZ 86040",
    lat: 36.1267,
    lon: -111.2538,
    sourceLabel: "CitySquares listing",
    sourceUrl: "https://citysquares.com/b/walmart-supercenter-15658825"
  },
  {
    id: "bashas-tuba-city",
    name: "Bashas' Dine Market",
    brand: "Bashas'",
    categories: ["groceries", "household", "baby", "food"],
    address: "Hwy 160 and Hwy 264, Tuba City, AZ 86045",
    lat: 36.1358,
    lon: -111.2390,
    sourceLabel: "Bashas store page",
    sourceUrl: "https://www.bashas.com/stores/bashas-dine-market-hwy-160-hwy-264/"
  },
  {
    id: "tcrh-pharmacy",
    name: "Tuba City Regional Health Care Pharmacy",
    brand: "TCRHCC",
    categories: ["pharmacy", "medicine", "healthcare"],
    address: "167 N Main St, Tuba City, AZ 86045",
    lat: 36.1362,
    lon: -111.2399,
    sourceLabel: "Arizona pharmacy directory listing",
    sourceUrl: "https://kansashealthsystembenefits.com/wp-content/uploads/2022/10/Navitus-Participating-Pharmacies-Network-Listing-09-30-22.pdf"
  },
  {
    id: "bashas-kayenta",
    name: "Bashas' Dine Market",
    brand: "Bashas'",
    categories: ["groceries", "pharmacy", "food", "household", "baby"],
    address: "US-160/US-163, Kayenta, AZ 86033",
    lat: 36.7137,
    lon: -110.2604,
    sourceLabel: "Loc8NearMe listing",
    sourceUrl: "https://www.loc8nearme.com/arizona/kayenta/bashas/5117211/"
  },
  {
    id: "kayenta-pharmacy",
    name: "Kayenta Pharmacy",
    brand: "Kayenta Pharmacy",
    categories: ["pharmacy", "medicine", "healthcare"],
    address: "US Highway 160, S MP 394, Kayenta, AZ 86033",
    lat: 36.7206,
    lon: -110.2598,
    sourceLabel: "NPI Profile",
    sourceUrl: "https://npiprofile.com/npi/1285750125"
  },
  {
    id: "chinle-health-pharmacy",
    name: "Chinle Comprehensive Health Care Facility Pharmacy",
    brand: "IHS",
    categories: ["pharmacy", "medicine", "healthcare"],
    address: "Off Hwy 191 Hospital Road, Chinle, AZ 86503",
    lat: 36.1561,
    lon: -109.5785,
    sourceLabel: "NPI Profile",
    sourceUrl: "https://npiprofile.com/npi/1255460127"
  },
  {
    id: "window-rock-bashas",
    name: "Bashas' Dine Market",
    brand: "Bashas'",
    categories: ["groceries", "pharmacy", "household", "food"],
    address: "112 Window Rock Loop Rd, Window Rock, AZ 86515",
    lat: 35.6808,
    lon: -109.0520,
    sourceLabel: "Yellow Pages listing",
    sourceUrl: "https://www.yellowpages.com/window-rock-az/grocery-stores"
  },
  {
    id: "window-rock-lowes",
    name: "Lowe's Shop N' Save",
    brand: "Lowe's Market",
    categories: ["groceries", "food", "household"],
    address: "12 Arizona 264, Window Rock, AZ 86515",
    lat: 35.6786,
    lon: -109.0485,
    sourceLabel: "Yellow Pages listing",
    sourceUrl: "https://www.yellowpages.com/window-rock-az/grocery-stores"
  },
  {
    id: "petsmart-flagstaff",
    name: "PetSmart Flagstaff",
    brand: "PetSmart",
    categories: ["pets", "pet-food", "pet-care"],
    address: "Flagstaff, AZ",
    lat: 35.2177,
    lon: -111.5838,
    sourceLabel: "Seeded demo location",
    sourceUrl: ""
  },
  {
    id: "cvs-tucson-oracle",
    name: "CVS Pharmacy",
    brand: "CVS",
    categories: ["pharmacy", "medicine", "ppe", "healthcare"],
    address: "4365 N Oracle Rd, Tucson, AZ 85705",
    lat: 32.2860,
    lon: -110.9780,
    sourceLabel: "Arizona pharmacy directory listing",
    sourceUrl: "https://kansashealthsystembenefits.com/wp-content/uploads/2022/10/Navitus-Participating-Pharmacies-Network-Listing-09-30-22.pdf"
  },
  {
    id: "walmart-tempe",
    name: "Walmart Pharmacy",
    brand: "Walmart",
    categories: ["pharmacy", "medicine", "groceries", "ppe", "household"],
    address: "800 E Southern Ave, Tempe, AZ 85282",
    lat: 33.3926,
    lon: -111.9288,
    sourceLabel: "Arizona pharmacy directory listing",
    sourceUrl: "https://kansashealthsystembenefits.com/wp-content/uploads/2022/10/Navitus-Participating-Pharmacies-Network-Listing-09-30-22.pdf"
  }
];

export const coupons = [
  { id: "coupon-walmart-medicine", brand: "Walmart", title: "$5 off cold & flu essentials", categories: ["medicine", "pharmacy", "ppe"], expiresInDays: 12 },
  { id: "coupon-bashas-grocery", brand: "Bashas'", title: "10% off fresh groceries", categories: ["groceries", "food"], expiresInDays: 9 },
  { id: "coupon-petsmart-food", brand: "PetSmart", title: "15% off pet food", categories: ["pets", "pet-food"], expiresInDays: 18 },
  { id: "coupon-cvs-care", brand: "CVS", title: "$4 off health supplies", categories: ["pharmacy", "medicine", "ppe"], expiresInDays: 7 },
  { id: "coupon-lowes-food", brand: "Lowe's Market", title: "$3 off household staples", categories: ["groceries", "household"], expiresInDays: 15 },
  { id: "coupon-tcrh-care", brand: "TCRHCC", title: "Community care kit pickup reminder", categories: ["healthcare", "medicine"], expiresInDays: 5 },
  { id: "coupon-ihs-care", brand: "IHS", title: "Pharmacy refill support reminder", categories: ["healthcare", "medicine", "pharmacy"], expiresInDays: 5 }
];

export const demoProfiles = [
  {
    id: "demo-tuba-40",
    name: "Tuba City parent with cold symptoms",
    zipcode: "86045",
    districtId: "tuba-city",
    rewardPoints: 40,
    classifier: {
      symptoms: ["cough", "fever"],
      profession: "teacher",
      categories: ["medicine", "pharmacy", "groceries", "ppe"],
      hasPets: false
    }
  },
  {
    id: "demo-kayenta-50",
    name: "Kayenta pet owner",
    zipcode: "86033",
    districtId: "kayenta",
    rewardPoints: 50,
    classifier: {
      symptoms: [],
      profession: "health aide",
      categories: ["pets", "groceries", "pharmacy"],
      hasPets: true
    }
  },
  {
    id: "demo-chinle-80",
    name: "Chinle healthcare worker",
    zipcode: "86503",
    districtId: "chinle",
    rewardPoints: 80,
    classifier: {
      symptoms: ["fatigue"],
      profession: "nurse",
      categories: ["healthcare", "medicine", "ppe"],
      hasPets: false
    }
  },
  {
    id: "demo-ua-20",
    name: "University student",
    zipcode: "85719",
    districtId: "university-of-arizona",
    rewardPoints: 20,
    classifier: {
      symptoms: ["sore throat"],
      profession: "student",
      categories: ["medicine", "pharmacy"],
      hasPets: false
    }
  }
];
