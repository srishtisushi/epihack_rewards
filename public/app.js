const profileSelect = document.querySelector("#profileSelect");
const zipcodeInput = document.querySelector("#zipcodeInput");
const pointsInput = document.querySelector("#pointsInput");
const categoriesInput = document.querySelector("#categoriesInput");
const petsInput = document.querySelector("#petsInput");
const refreshButton = document.querySelector("#refreshButton");
const storesList = document.querySelector("#storesList");
const leaderboardList = document.querySelector("#leaderboardList");
const locationLabel = document.querySelector("#locationLabel");
const periodLabel = document.querySelector("#periodLabel");
const pointsValue = document.querySelector("#pointsValue");
const unlockValue = document.querySelector("#unlockValue");
const remainingValue = document.querySelector("#remainingValue");
const progressFill = document.querySelector("#progressFill");

let profiles = [];
let refreshTimer = null;
const unlockedCouponIds = new Set();

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });

  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

function setProfile(profile) {
  zipcodeInput.value = profile.zipcode;
  pointsInput.value = profile.rewardPoints;
  categoriesInput.value = profile.classifier.categories.join(", ");
  petsInput.checked = Boolean(profile.classifier.hasPets);
}

function getRequestPayload() {
  const baseProfile = profiles.find((profile) => profile.id === profileSelect.value) || profiles[0];
  return {
    userId: baseProfile?.id || "demo-user",
    zipcode: zipcodeInput.value.trim(),
    districtId: baseProfile?.districtId,
    rewardPoints: Number(pointsInput.value || 0),
    classifier: {
      categories: categoriesInput.value
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
      hasPets: petsInput.checked
    }
  };
}

function renderRewards(response) {
  const points = response.user.rewardPoints;
  const cost = response.rewardsPolicy.couponUnlockCost;
  const progress = Math.min((points / cost) * 100, 100);
  pointsValue.textContent = points;
  unlockValue.textContent = cost;
  remainingValue.textContent = Math.max(cost - points, 0);
  progressFill.style.width = `${progress}%`;
}

function renderStores(response) {
  locationLabel.textContent = response.request.location.label;

  storesList.innerHTML = response.stores
    .map((store) => {
      const coupons = store.coupons.length
        ? store.coupons
            .map((coupon) => {
              const wasUnlocked = unlockedCouponIds.has(coupon.id);
              const available = coupon.canUnlock && !wasUnlocked;
              const status = wasUnlocked
                ? "Unlocked in this demo"
                : available
                ? `Available to unlock for ${coupon.unlockCost} points`
                : `${coupon.pointsRemaining} points remaining`;
              const action = wasUnlocked
                ? `<span class="coupon-spent">Unlocked</span>`
                : available
                  ? `<button class="unlock-button" data-coupon-id="${coupon.id}" type="button">Unlock</button>`
                  : "";
              return `
                <div class="coupon ${available || wasUnlocked ? "unlocked" : ""}">
                  <div class="coupon-copy">
                    <strong>${coupon.title}</strong>
                    <span>${status} · expires in ${coupon.expiresInDays} days</span>
                  </div>
                  ${action}
                </div>
              `;
            })
            .join("")
        : `<div class="coupon"><div class="coupon-copy"><strong>No coupon found yet</strong><span>Still shown because it matches the user's needs.</span></div></div>`;

      const source = store.source.url
        ? `<a href="${store.source.url}" target="_blank" rel="noreferrer">${store.source.label}</a>`
        : store.source.label;

      return `
        <article class="store-card">
          <div class="store-head">
            <div>
              <h3>${store.name}</h3>
              <address>${store.address}</address>
            </div>
            <span class="distance">${store.distanceMiles} mi</span>
          </div>
          <p class="match-reason">${store.matchReason}</p>
          ${coupons}
          <p class="source-line">Place source: ${source}</p>
        </article>
      `;
    })
    .join("") || `<article class="store-card"><h3>No matching resources found</h3><p class="match-reason">Try a broader category like pharmacy, groceries, pets, or healthcare.</p></article>`;
}

async function unlockCoupon(couponId) {
  const preview = await api("/api/coupons/unlock-preview", {
    method: "POST",
    body: JSON.stringify({
      couponId,
      rewardPoints: Number(pointsInput.value || 0)
    })
  });

  if (!preview.canUnlock) {
    await refresh();
    return;
  }

  unlockedCouponIds.add(couponId);
  pointsInput.value = preview.pointsAfterUnlock;
  await refresh();
}

function renderLeaderboard(leaderboard) {
  periodLabel.textContent = leaderboard.period.label;
  leaderboardList.innerHTML = leaderboard.rows
    .map((row) => {
      const delta = row.rankDelta === 0 ? "same" : row.rankDelta > 0 ? `up ${row.rankDelta}` : `down ${Math.abs(row.rankDelta)}`;
      return `
        <article class="leaderboard-row">
          <span class="rank">${row.rank}</span>
          <div>
            <strong>${row.name}</strong>
            <p>${row.rawReports} reports · ${row.population.toLocaleString()} residents</p>
          </div>
          <div class="metric">
            ${row.normalizedReportsPer1000}
            <small>/1k · ${delta}</small>
          </div>
        </article>
      `;
    })
    .join("");
}

async function refresh() {
  storesList.innerHTML = `<article class="store-card"><h3>Finding nearby resources...</h3><p class="match-reason">Searching live places for this ZIP and classifier.</p></article>`;
  const [recommendations, leaderboard] = await Promise.all([
    api("/api/recommendations", {
      method: "POST",
      body: JSON.stringify(getRequestPayload())
    }),
    api("/api/leaderboard?districtGroup=navajo-nation")
  ]);

  renderRewards(recommendations);
  renderStores(recommendations);
  renderLeaderboard(leaderboard);
}

function scheduleRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(refresh, 550);
}

async function init() {
  profiles = await api("/api/demo-profiles");
  profileSelect.innerHTML = profiles
    .map((profile) => `<option value="${profile.id}">${profile.name}</option>`)
    .join("");
  setProfile(profiles[0]);
  profileSelect.addEventListener("change", () => {
    const profile = profiles.find((item) => item.id === profileSelect.value);
    unlockedCouponIds.clear();
    setProfile(profile);
    refresh();
  });
  refreshButton.addEventListener("click", refresh);
  storesList.addEventListener("click", (event) => {
    const unlockButton = event.target.closest("[data-coupon-id]");
    if (!unlockButton) return;
    unlockCoupon(unlockButton.dataset.couponId);
  });
  zipcodeInput.addEventListener("input", scheduleRefresh);
  pointsInput.addEventListener("input", scheduleRefresh);
  categoriesInput.addEventListener("input", scheduleRefresh);
  petsInput.addEventListener("change", refresh);
  await refresh();
}

init().catch((error) => {
  storesList.innerHTML = `<article class="store-card"><h3>Something went wrong</h3><p>${error.message}</p></article>`;
});
