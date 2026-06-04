# WeCare Nearby Rewards API Demo

Prototype API and temporary UI for WeCare's nearby rewards flow.

## What It Does

- Accepts a user's ZIP code, reward point balance, and classifier categories.
- Geocodes Arizona ZIP codes and searches live nearby resources through OpenStreetMap services.
- Shows mock coupons matched to live nearby stores/resources.
- Locks coupons until the user has enough reward points.
- Simulates an unlock flow by spending 50 demo points.
- Shows a bimonthly, population-normalized community leaderboard.

## Run Locally

```sh
node server.js
```

Then open:

```text
http://127.0.0.1:4173
```

## Test

```sh
node tests/wecareApi.test.js
```

## API Routes

- `GET /api/health`
- `GET /api/meta`
- `GET /api/demo-profiles`
- `GET /api/leaderboard?districtGroup=navajo-nation`
- `POST /api/recommendations`
- `POST /api/coupons/unlock-preview`
- `POST /api/rewards/report-preview`

## Notes

Coupon scraping is mocked for the hackathon prototype. Store/resource locations are live by default via ZIP geocoding and OpenStreetMap place lookup, with seeded fallback data for demo resilience.
