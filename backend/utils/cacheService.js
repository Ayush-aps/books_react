const redisClient = require("./redisClient");

async function get(key) {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`[Cache] GET failed for ${key}:`, error.message);
    return null;
  }
}

async function set(key, value, ttl = 300) {
  if (!redisClient) return false;

  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
    return true;
  } catch (error) {
    console.error(`[Cache] SET failed for ${key}:`, error.message);
    return false;
  }
}

async function del(key) {
  if (!redisClient) return 0;

  try {
    if (Array.isArray(key)) {
      if (key.length === 0) return 0;
      return await redisClient.del(...key);
    }

    return await redisClient.del(key);
  } catch (error) {
    console.error("[Cache] DEL failed:", error.message);
    return 0;
  }
}

module.exports = {
  get,
  set,
  del,
};
