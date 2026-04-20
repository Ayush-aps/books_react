process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

jest.mock("../../models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const authMiddleware = require("../../middleware/auth");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves session user first", async () => {
    const req = {
      isAuthenticated: jest.fn(() => true),
      user: { _id: "user-1", role: "buyer" },
      headers: {},
    };

    await expect(authMiddleware.resolveAuthenticatedUser(req)).resolves.toEqual(req.user);
  });

  it("resolves bearer token user when no session exists", async () => {
    const req = {
      isAuthenticated: jest.fn(() => false),
      headers: { authorization: "Bearer token-123" },
    };

    jwt.verify.mockReturnValue({ id: "user-1" });
    User.findById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ _id: "user-1", role: "seller" }),
      }),
    });

    await expect(authMiddleware.resolveAuthenticatedUser(req)).resolves.toEqual({ _id: "user-1", role: "seller" });
  });

  it("denies unauthenticated users", async () => {
    const req = { isAuthenticated: jest.fn(() => false), headers: {} };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware.ensureAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("allows buyers through buyer guard and blocks sellers", async () => {
    const buyerReq = { isAuthenticated: jest.fn(() => true), user: { role: "buyer" }, headers: {} };
    const buyerRes = createRes();
    const buyerNext = jest.fn();

    await authMiddleware.ensureBuyer(buyerReq, buyerRes, buyerNext);
    expect(buyerNext).toHaveBeenCalled();

    const sellerReq = { isAuthenticated: jest.fn(() => true), user: { role: "seller" }, headers: {} };
    const sellerRes = createRes();
    const sellerNext = jest.fn();

    await authMiddleware.ensureBuyer(sellerReq, sellerRes, sellerNext);
    expect(sellerNext).not.toHaveBeenCalled();
    expect(sellerRes.status).toHaveBeenCalledWith(403);
  });

  it("supports generic role checks", async () => {
    const req = { isAuthenticated: jest.fn(() => true), user: { role: "admin" }, headers: {} };
    const res = createRes();
    const next = jest.fn();

    await authMiddleware.checkRole("admin", "moderator")(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});