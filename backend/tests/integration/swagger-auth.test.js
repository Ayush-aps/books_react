process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { setupSwagger } = require("../../config/swagger");
const authRoutes = require("../../routes/auth");
const buyerRoutes = require("../../routes/buyer");
const sellerRoutes = require("../../routes/seller");
const adminRoutes = require("../../routes/admin");

jest.mock("../../models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(0),
}));

const User = require("../../models/User");
const app = require("../../app");

const swaggerApp = express();
swaggerApp.use("/api/auth", authRoutes);
swaggerApp.use("/api/buyer", buyerRoutes);
swaggerApp.use("/api/seller", sellerRoutes);
swaggerApp.use("/api/admin", adminRoutes);
setupSwagger(swaggerApp);

describe("Swagger and bearer auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes bearer auth in the OpenAPI spec", async () => {
    const response = await request(swaggerApp).get("/api/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.components.securitySchemes).toHaveProperty("bearerAuth");
    expect(response.body.components.securitySchemes).toHaveProperty("sessionCookie");
    expect(response.body.paths["/api/buyer/dashboard"].get.security).toEqual(
      [{ bearerAuth: [] }, { sessionCookie: [] }]
    );
  });

  it("authenticates via bearer token on /api/auth/check", async () => {
    const token = jwt.sign(
      { id: "user-1", role: "buyer", email: "buyer@example.com" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    User.findById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({
          _id: "user-1",
          name: "Buyer One",
          email: "buyer@example.com",
          role: "buyer",
          avatar: "/img/users/default-avatar.jpg",
          phone: "",
          address: {},
          isVerified: true,
          createdAt: new Date().toISOString(),
        }),
      }),
    });

    const response = await request(app)
      .get("/api/auth/check")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.authenticated).toBe(true);
    expect(response.body.user).toHaveProperty("_id", "user-1");
    expect(response.body.source).toBe("db");
  });
});
