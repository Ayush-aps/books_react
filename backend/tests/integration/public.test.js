process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../../app");

describe("Public API endpoints", () => {
  it("GET /api/public/about returns about payload", async () => {
    const response = await request(app).get("/api/public/about");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("title");
    expect(response.body.data).toHaveProperty("description");
  });

  it("GET /api/public/pricing returns plans and seller fees", async () => {
    const response = await request(app).get("/api/public/pricing");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.plans)).toBe(true);
    expect(Array.isArray(response.body.data.sellerFees)).toBe(true);
  });
});
