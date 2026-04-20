process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

jest.mock("passport", () => ({
  authenticate: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "signed-token"),
}));

jest.mock("../../models/User", () => {
  const UserMock = jest.fn();
  UserMock.findOne = jest.fn();
  UserMock.findById = jest.fn();
  return UserMock;
});

jest.mock("../../middleware/logger", () => ({
  securityLogger: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

jest.mock("../../middleware/auth", () => ({
  resolveAuthenticatedUser: jest.fn(),
}));

const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const cacheService = require("../../utils/cacheService");
const { securityLogger } = require("../../middleware/logger");
const { resolveAuthenticatedUser } = require("../../middleware/auth");
const authController = require("../../controllers/authController");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects register when required fields are missing", async () => {
    const req = { body: { name: "", email: "", password: "", password2: "", role: "buyer" } };
    const res = createRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].errors.length).toBeGreaterThanOrEqual(1);
  });

  it("registers a new buyer", async () => {
    const save = jest.fn().mockResolvedValue(true);
    User.findOne.mockResolvedValue(null);
    User.mockImplementation(function UserMock(data) {
      Object.assign(this, data, { save });
    });
    const req = {
      body: {
        name: "New Buyer",
        email: "buyer@example.com",
        password: "secret12",
        password2: "secret12",
        role: "buyer",
      },
    };
    const res = createRes();

    await authController.register(req, res);

    expect(save).toHaveBeenCalled();
    expect(securityLogger).toHaveBeenCalledWith(
      "USER_REGISTERED",
      req,
      expect.objectContaining({ email: "buyer@example.com", role: "buyer" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 401 for invalid login", async () => {
    passport.authenticate.mockImplementation((strategy, callback) => (req, res, next) => {
      callback(null, null, { message: "Invalid credentials" });
    });
    const req = { body: { email: "bad@example.com" } };
    const res = createRes();

    authController.login(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(securityLogger).toHaveBeenCalledWith(
      "LOGIN_FAILED",
      req,
      expect.objectContaining({ email: "bad@example.com" })
    );
  });

  it("returns token and user on successful login", () => {
    const user = {
      _id: "user-1",
      name: "Buyer One",
      email: "buyer@example.com",
      role: "buyer",
      avatar: "/img/users/default-avatar.jpg",
      isVerified: true,
    };
    passport.authenticate.mockImplementation((strategy, callback) => (req, res, next) => {
      callback(null, user, {});
    });
    const req = {
      body: { email: "buyer@example.com" },
      logIn: jest.fn((loggedInUser, callback) => callback()),
    };
    const res = createRes();

    authController.login(req, res, jest.fn());

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", role: "buyer", email: "buyer@example.com" }),
      process.env.JWT_SECRET,
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].token).toBe("signed-token");
  });

  it("logs out users", () => {
    const req = { user: { _id: "user-1", email: "buyer@example.com" }, logout: jest.fn((callback) => callback()) };
    const res = createRes();

    authController.logout(req, res, jest.fn());

    expect(securityLogger).toHaveBeenCalledWith("LOGOUT", req, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns the current user payload", () => {
    const req = {
      user: {
        _id: "user-1",
        name: "Buyer One",
        email: "buyer@example.com",
        role: "buyer",
        avatar: "/img/users/default-avatar.jpg",
        phone: "1234567890",
        address: { city: "Pune" },
        isVerified: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };
    const res = createRes();

    authController.getMe(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].user).toHaveProperty("email", "buyer@example.com");
  });

  it("returns auth status from cache when available", async () => {
    resolveAuthenticatedUser.mockResolvedValue({ _id: "user-1" });
    cacheService.get.mockResolvedValue({ _id: "user-1", name: "Cached User" });
    const req = { user: { _id: "user-1", name: "Buyer One", email: "buyer@example.com", role: "buyer", avatar: "/img/users/default-avatar.jpg" } };
    const res = createRes();

    await authController.checkAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].source).toBe("redis");
  });

  it("falls back to unauthenticated when no session or token exists", async () => {
    resolveAuthenticatedUser.mockResolvedValue(null);
    const req = {};
    const res = createRes();

    await authController.checkAuth(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ authenticated: false, user: null });
  });
});