const Redis = require("ioredis");

const extractRedisUrl = (rawValue) => {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  // Support accidental CLI-style values like:
  // redis-cli --tls -u redis://default:password@host:6379
  const cliUrlMatch = trimmed.match(/-u\s+([^\s]+)/i);
  if (cliUrlMatch?.[1]) {
    return cliUrlMatch[1].trim();
  }

  return trimmed;
};

const normalizeRedisUrl = (url) => {
  if (!url) {
    return null;
  }

  // Upstash endpoints require TLS in production.
  if (url.startsWith("redis://") && /upstash\.io/i.test(url)) {
    return url.replace(/^redis:\/\//i, "rediss://");
  }

  return url;
};

const redisUrl = normalizeRedisUrl(extractRedisUrl(process.env.REDIS_URL));
let client = null;

if (redisUrl) {
  client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableAutoPipelining: true,
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });
} else {
  console.warn("[Redis] REDIS_URL not set. Cache will be bypassed.");
}

module.exports = client;
