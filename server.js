import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRecommendations,
  getBimonthlyLeaderboard,
  getDemoProfiles,
  getReportAwardPreview,
  getServiceMetadata,
  previewCouponUnlock
} from "./src/wecareApi.js";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(rootDir, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(content);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "wecare-nearby-resources-api" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/meta") {
      sendJson(res, 200, getServiceMetadata());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/demo-profiles") {
      sendJson(res, 200, getDemoProfiles());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/leaderboard") {
      sendJson(res, 200, getBimonthlyLeaderboard({
        districtGroup: url.searchParams.get("districtGroup") || "navajo-nation"
      }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/recommendations") {
      sendJson(res, 200, await buildRecommendations(await readJson(req)));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/coupons/unlock-preview") {
      sendJson(res, 200, previewCouponUnlock(await readJson(req)));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/rewards/report-preview") {
      sendJson(res, 200, getReportAwardPreview(await readJson(req)));
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(res, 404, { error: "Unknown API route" });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Bad request" });
  }
});

server.listen(port, host, () => {
  console.log(`WeCare API + demo UI running at http://${host}:${port}`);
});
