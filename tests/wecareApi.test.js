import assert from "node:assert/strict";
import {
  buildRecommendations,
  getBimonthlyLeaderboard,
  getReportAwardPreview,
  previewCouponUnlock
} from "../src/wecareApi.js";

async function test(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await test("user earns 10 points when weekly reporting window is open", () => {
  const result = getReportAwardPreview({
    rewardPoints: 40,
    now: "2026-05-20T12:00:00.000Z",
    lastRewardedReportAt: "2026-05-12T12:00:00.000Z"
  });

  assert.equal(result.eligible, true);
  assert.equal(result.pointsAwarded, 10);
  assert.equal(result.projectedPoints, 50);
});

await test("user earns no extra points for a second report in the same week", () => {
  const result = getReportAwardPreview({
    rewardPoints: 40,
    now: "2026-05-20T12:00:00.000Z",
    lastRewardedReportAt: "2026-05-18T12:00:00.000Z"
  });

  assert.equal(result.eligible, false);
  assert.equal(result.pointsAwarded, 0);
  assert.equal(result.projectedPoints, 40);
});

await test("coupon unlock preview spends 50 points when user has enough", () => {
  const result = previewCouponUnlock({ couponId: "coupon-walmart-medicine", rewardPoints: 80 });

  assert.equal(result.canUnlock, true);
  assert.equal(result.pointsAfterUnlock, 30);
});

await test("coupon unlock preview stays locked and reports remaining points", () => {
  const result = previewCouponUnlock({ couponId: "coupon-walmart-medicine", rewardPoints: 40 });

  assert.equal(result.canUnlock, false);
  assert.equal(result.pointsRemaining, 10);
  assert.equal(result.pointsAfterUnlock, 40);
});

await test("medicine classifier returns nearby pharmacy resources and locked coupon state", async () => {
  const result = await buildRecommendations({
    zipcode: "86045",
    rewardPoints: 40,
    useSeededStores: true,
    classifier: {
      symptoms: ["cough"],
      categories: ["medicine", "pharmacy"],
      hasPets: false
    }
  });

  assert.equal(result.stores.length > 0, true);
  assert.equal(result.stores.some((store) => store.categories.includes("pharmacy")), true);

  const coupon = result.stores.flatMap((store) => store.coupons).find(Boolean);
  assert.equal(coupon.status, "locked");
  assert.equal(coupon.pointsRemaining, 10);
});

await test("pets classifier returns pet-related resource when in range", async () => {
  const result = await buildRecommendations({
    zipcode: "86001",
    rewardPoints: 50,
    useSeededStores: true,
    classifier: {
      categories: ["pets"],
      hasPets: true
    }
  });

  assert.equal(result.stores.some((store) => store.brand === "PetSmart"), true);
  const petCoupon = result.stores.flatMap((store) => store.coupons).find((coupon) => coupon.brand === "PetSmart");
  assert.equal(petCoupon.canUnlock, true);
});

await test("district leaderboard uses reports per 1,000 residents", () => {
  const result = getBimonthlyLeaderboard({ districtGroup: "navajo-nation" });
  const first = result.rows[0];
  const expected = Number(((first.rawReports / first.population) * 1000).toFixed(1));

  assert.equal(first.normalizedReportsPer1000, expected);
  assert.equal(result.scoring, "rawReports / population * 1000");
});
