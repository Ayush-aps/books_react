const axios = require("axios");
require("dotenv").config();
const cacheService = require("../utils/cacheService");

const API_BASE = process.env.BACKEND_URL || "http://localhost:3000";
const RUNS = Number(process.env.BENCH_RUNS || 8);
const COLD_START = String(process.env.BENCH_COLD_START || "true").toLowerCase() === "true";

const TOKENS = {
  auth: process.env.BENCH_AUTH_TOKEN || process.env.BENCH_BUYER_TOKEN || "",
  buyer: process.env.BENCH_BUYER_TOKEN || "",
  seller: process.env.BENCH_SELLER_TOKEN || "",
  admin: process.env.BENCH_ADMIN_TOKEN || "",
};

const CREDS = {
  buyer: {
    email: process.env.BENCH_BUYER_EMAIL || "user1@gmail.com",
    password: process.env.BENCH_BUYER_PASSWORD || "123456",
  },
  seller: {
    email: process.env.BENCH_SELLER_EMAIL || "seller1@gmail.com",
    password: process.env.BENCH_SELLER_PASSWORD || "123456",
  },
  admin: {
    email: process.env.BENCH_ADMIN_EMAIL || "admin1@gmail.com",
    password: process.env.BENCH_ADMIN_PASSWORD || "123456",
  },
};

const endpointMatrix = [
  { name: "Books Browse", path: "/api/books/browse", role: "public", cacheKeys: () => ["list:books"] },
  { name: "Auth Check", path: "/api/auth/check", role: "auth", cacheKeys: ({ ids }) => [ids.auth ? `user:${ids.auth}` : null] },
  { name: "Buyer Dashboard", path: "/api/buyer/dashboard", role: "buyer", cacheKeys: ({ ids }) => [ids.buyer ? `buyer:dashboard:${ids.buyer}` : null] },
  { name: "Buyer Profile", path: "/api/buyer/profile", role: "buyer", cacheKeys: ({ ids }) => [ids.buyer ? `user:${ids.buyer}` : null] },
  { name: "Seller Dashboard", path: "/api/seller/dashboard", role: "seller", cacheKeys: ({ ids }) => [ids.seller ? `seller:dashboard:${ids.seller}` : null] },
  { name: "Seller Inventory", path: "/api/seller/inventory", role: "seller", cacheKeys: ({ ids }) => [ids.seller ? `seller:inventory:${ids.seller}:default` : null] },
  { name: "Seller Books", path: "/api/seller/books", role: "seller", cacheKeys: () => ["seller:books:browse:default"] },
  { name: "Admin Users", path: "/api/admin/users", role: "admin", cacheKeys: () => ["list:users"] },
  { name: "Admin Dashboard", path: "/api/admin/dashboard", role: "admin", cacheKeys: () => ["admin:dashboard:summary"] },
  { name: "Admin Orders", path: "/api/admin/orders", role: "admin", cacheKeys: () => ["admin:orders:list:default"] },
  { name: "Admin Books", path: "/api/admin/books", role: "admin", cacheKeys: () => ["admin:books:list:default"] },
];

const hrMs = (start) => Number(process.hrtime.bigint() - start) / 1e6;

function getHeadersForRole(role) {
  if (role === "public") return {};

  const token = TOKENS[role];
  if (!token) return null;

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function loginAndGetToken(role) {
  const creds = CREDS[role];
  if (!creds || !creds.email || !creds.password) return "";

  try {
    const response = await axios.post(
      `${API_BASE}/api/auth/login`,
      { email: creds.email, password: creds.password },
      { timeout: 15000 }
    );

    return response.data?.token || "";
  } catch (error) {
    return "";
  }
}

async function hydrateTokens() {
  if (!TOKENS.buyer) {
    TOKENS.buyer = await loginAndGetToken("buyer");
  }
  if (!TOKENS.seller) {
    TOKENS.seller = await loginAndGetToken("seller");
  }
  if (!TOKENS.admin) {
    TOKENS.admin = await loginAndGetToken("admin");
  }
  if (!TOKENS.auth) {
    TOKENS.auth = TOKENS.buyer || TOKENS.seller || TOKENS.admin || "";
  }
}

function decodeTokenId(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return json?.id || null;
  } catch (error) {
    return null;
  }
}

async function clearEndpointCache(endpoint, ids) {
  if (!endpoint.cacheKeys) return;
  const keys = endpoint.cacheKeys({ ids }).filter(Boolean);
  if (keys.length === 0) return;
  await cacheService.del(keys);
}

async function hitOnce(url, headers) {
  const started = process.hrtime.bigint();
  const response = await axios.get(url, { timeout: 15000, headers });
  const duration = hrMs(started);

  return {
    duration,
    status: response.status,
    source: response.data?.source || response.data?.data?.source || "unknown",
  };
}

function summarize(name, path, role, samples) {
  const first = samples[0];
  const warm = samples.slice(1);
  const avgWarm = warm.length > 0
    ? warm.reduce((sum, r) => sum + r.duration, 0) / warm.length
    : first.duration;
  const minWarm = warm.length > 0 ? Math.min(...warm.map((r) => r.duration)) : first.duration;
  const maxWarm = warm.length > 0 ? Math.max(...warm.map((r) => r.duration)) : first.duration;
  const improvement = first.duration > 0
    ? ((first.duration - avgWarm) / first.duration) * 100
    : 0;
  const warmHitCount = warm.filter((w) => w.source === "redis").length;
  const hasExplicitSourceSignal = first.source === "redis" || warm.some((w) => w.source === "redis");
  const heuristicLikely = improvement >= 20;
  const cacheHitLikely = hasExplicitSourceSignal
    ? (warm.length > 0 ? warmHitCount >= Math.ceil(warm.length * 0.6) : first.source === "redis")
    : heuristicLikely;

  return {
    endpoint: name,
    path,
    role,
    firstMs: Number(first.duration.toFixed(2)),
    firstSource: first.source,
    warmAvgMs: Number(avgWarm.toFixed(2)),
    warmMinMs: Number(minWarm.toFixed(2)),
    warmMaxMs: Number(maxWarm.toFixed(2)),
    improvementPct: Number(improvement.toFixed(2)),
    cacheHitLikely,
    warmHitPct: warm.length > 0 ? Number(((warmHitCount / warm.length) * 100).toFixed(2)) : 0,
    statuses: [...new Set(samples.map((s) => s.status))].join(","),
  };
}

async function runEndpointBench(endpoint) {
  const { name, path, role } = endpoint;
  const headers = getHeadersForRole(role);

  if (headers === null) {
    return {
      endpoint: name,
      path,
      role,
      firstMs: "SKIP",
      firstSource: `missing BENCH_${role.toUpperCase()}_TOKEN`,
      warmAvgMs: "-",
      warmMinMs: "-",
      warmMaxMs: "-",
      improvementPct: "-",
      cacheHitLikely: "-",
      warmHitPct: "-",
      statuses: "-",
    };
  }

  const url = `${API_BASE}${path}`;
  const samples = [];

  const ids = {
    auth: decodeTokenId(TOKENS.auth),
    buyer: decodeTokenId(TOKENS.buyer),
    seller: decodeTokenId(TOKENS.seller),
    admin: decodeTokenId(TOKENS.admin),
  };

  if (COLD_START) {
    await clearEndpointCache(endpoint, ids);
  }

  for (let i = 0; i < RUNS; i += 1) {
    const result = await hitOnce(url, headers);
    samples.push(result);
  }

  return summarize(name, path, role, samples);
}

async function main() {
  console.log(`Benchmark target base: ${API_BASE}`);
  console.log(`Runs per endpoint: ${RUNS}`);
  console.log(`Cold-first mode: ${COLD_START ? "on" : "off"}`);
  console.log("Set tokens for private routes: BENCH_BUYER_TOKEN, BENCH_SELLER_TOKEN, BENCH_ADMIN_TOKEN.");
  console.log("Or set credentials for auto-login: BENCH_BUYER_EMAIL/PASSWORD, BENCH_SELLER_EMAIL/PASSWORD, BENCH_ADMIN_EMAIL/PASSWORD.");

  await hydrateTokens();
  console.log(`Token status -> auth:${TOKENS.auth ? "yes" : "no"}, buyer:${TOKENS.buyer ? "yes" : "no"}, seller:${TOKENS.seller ? "yes" : "no"}, admin:${TOKENS.admin ? "yes" : "no"}`);

  const rows = [];

  for (const endpoint of endpointMatrix) {
    try {
      const row = await runEndpointBench(endpoint);
      rows.push(row);
    } catch (error) {
      rows.push({
        endpoint: endpoint.name,
        path: endpoint.path,
        role: endpoint.role,
        firstMs: "ERR",
        firstSource: error.response?.data?.message || error.message,
        warmAvgMs: "-",
        warmMinMs: "-",
        warmMaxMs: "-",
        improvementPct: "-",
        cacheHitLikely: "-",
        warmHitPct: "-",
        statuses: error.response?.status || "-",
      });
    }
  }

  const displayRows = rows.map((row) => ({
    endpoint: row.endpoint,
    role: row.role,
    firstMs: row.firstMs,
    warmAvgMs: row.warmAvgMs,
    warmMinMs: row.warmMinMs,
    warmMaxMs: row.warmMaxMs,
    improvementPct: row.improvementPct,
    firstSource: row.firstSource,
    warmHitPct: row.warmHitPct,
    cacheHitLikely: row.cacheHitLikely === "-" ? "-" : row.cacheHitLikely ? "YES" : "NO",
    statuses: row.statuses,
  }));

  const successfulRows = rows.filter((r) => typeof r.improvementPct === "number");
  const skippedRows = rows.filter((r) => r.firstMs === "SKIP").length;
  const errorRows = rows.filter((r) => r.firstMs === "ERR").length;

  const pad = (value, width) => String(value).padEnd(width, " ");
  const header = [
    pad("Endpoint", 20),
    pad("Role", 8),
    pad("Cold(ms)", 10),
    pad("WarmAvg(ms)", 12),
    pad("WarmMin", 10),
    pad("WarmMax", 10),
    pad("Gain(%)", 9),
    pad("FirstSrc", 10),
    pad("Hit(%)", 8),
    pad("Cache", 7),
    pad("HTTP", 6),
  ].join(" ");

  console.log("\n========== Cache Benchmark ==========");
  console.log(header);
  console.log("-".repeat(header.length));
  displayRows.forEach((r) => {
    console.log([
      pad(r.endpoint, 20),
      pad(r.role, 8),
      pad(r.firstMs, 10),
      pad(r.warmAvgMs, 12),
      pad(r.warmMinMs, 10),
      pad(r.warmMaxMs, 10),
      pad(r.improvementPct, 9),
      pad(r.firstSource, 10),
      pad(r.warmHitPct, 8),
      pad(r.cacheHitLikely, 7),
      pad(r.statuses, 6),
    ].join(" "));
  });

  if (successfulRows.length > 0) {
    const avgImprovement = successfulRows.reduce((sum, r) => sum + r.improvementPct, 0) / successfulRows.length;
    const likelyHits = successfulRows.filter((r) => r.cacheHitLikely === true).length;
    console.log("Summary");
    console.log(`- Benchmarked endpoints: ${successfulRows.length}`);
    console.log(`- Average improvement: ${avgImprovement.toFixed(2)}%`);
    console.log(`- Cache hit likely (warm calls): ${likelyHits}/${successfulRows.length}`);
  }

  if (skippedRows > 0 || errorRows > 0) {
    console.log("Notes");
    if (skippedRows > 0) console.log(`- Skipped endpoints: ${skippedRows} (missing tokens/credentials)`);
    if (errorRows > 0) console.log(`- Error endpoints: ${errorRows} (check status/message column)`);
  }
}

main().catch((error) => {
  const msg = error.response?.data || error.message;
  console.error("Benchmark failed:", msg);
  console.error("Make sure backend is running (npm run dev) and tokens are set for protected routes.");
  process.exit(1);
});
