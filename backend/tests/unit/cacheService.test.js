jest.mock("../../utils/redisClient", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

const redisClient = require("../../utils/redisClient");
const cacheService = require("../../utils/cacheService");

describe("cacheService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed object on cache hit", async () => {
    redisClient.get.mockResolvedValueOnce(JSON.stringify({ id: "u1", name: "User" }));

    const result = await cacheService.get("user:u1");

    expect(redisClient.get).toHaveBeenCalledWith("user:u1");
    expect(result).toEqual({ id: "u1", name: "User" });
  });

  it("returns null on cache miss", async () => {
    redisClient.get.mockResolvedValueOnce(null);

    const result = await cacheService.get("user:missing");

    expect(result).toBeNull();
  });

  it("stores value with ttl", async () => {
    redisClient.set.mockResolvedValueOnce("OK");

    const result = await cacheService.set("list:users", [{ id: 1 }], 120);

    expect(redisClient.set).toHaveBeenCalledWith("list:users", JSON.stringify([{ id: 1 }]), "EX", 120);
    expect(result).toBe(true);
  });

  it("deletes single key", async () => {
    redisClient.del.mockResolvedValueOnce(1);

    const deleted = await cacheService.del("list:users");

    expect(redisClient.del).toHaveBeenCalledWith("list:users");
    expect(deleted).toBe(1);
  });

  it("deletes multiple keys when array is provided", async () => {
    redisClient.del.mockResolvedValueOnce(2);

    const deleted = await cacheService.del(["user:1", "list:users"]);

    expect(redisClient.del).toHaveBeenCalledWith("user:1", "list:users");
    expect(deleted).toBe(2);
  });
});
