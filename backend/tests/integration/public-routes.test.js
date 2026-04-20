process.env.NODE_ENV = "test";

const express = require("express");
const request = require("supertest");

jest.mock("../../models/Book", () => ({
  find: jest.fn(),
  distinct: jest.fn(),
}));

jest.mock("../../models/Complaint", () => {
  const ComplaintMock = jest.fn();
  return ComplaintMock;
});

const Book = require("../../models/Book");
const Complaint = require("../../models/Complaint");
const publicRoutes = require("../../routes/public");

const createChain = (result) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(result),
});

describe("public routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.isAuthenticated = () => req.headers["x-authenticated"] === "true";
      if (req.isAuthenticated()) {
        req.user = { _id: "user-1", role: "buyer" };
      }
      next();
    });
    app.use("/api/public", publicRoutes);
  });

  it("returns home data", async () => {
    Book.find
      .mockReturnValueOnce(createChain([{ _id: "b1" }]))
      .mockReturnValueOnce(createChain([{ _id: "b2" }]))
      .mockReturnValueOnce(createChain([{ _id: "b3" }]));

    const response = await request(app).get("/api/public/home");

    expect(response.status).toBe(200);
    expect(response.body.data.featuredBooks).toHaveLength(1);
    expect(response.body.data.trendingBooks).toHaveLength(1);
  });

  it("rejects guest contact requests without name and email", async () => {
    const response = await request(app)
      .post("/api/public/contact")
      .send({ subject: "Help", message: "Need help" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Name and email are required/i);
  });

  it("creates guest contact complaint", async () => {
    const save = jest.fn().mockResolvedValue(true);
    Complaint.mockImplementation(function ComplaintMock(data) {
      Object.assign(this, data, { save });
    });

    const response = await request(app)
      .post("/api/public/contact")
      .send({ name: "Guest", email: "guest@example.com", subject: "Help", message: "Need help" });

    expect(response.status).toBe(201);
    expect(save).toHaveBeenCalled();
    expect(response.body.data.complaint.userRole).toBe("guest");
  });

  it("creates authenticated contact complaint", async () => {
    const save = jest.fn().mockResolvedValue(true);
    Complaint.mockImplementation(function ComplaintMock(data) {
      Object.assign(this, data, { save });
    });

    const response = await request(app)
      .post("/api/public/contact")
      .set("x-authenticated", "true")
      .send({ subject: "Help", message: "Need help" });

    expect(response.status).toBe(201);
    expect(response.body.data.complaint.user).toBe("user-1");
  });
});
