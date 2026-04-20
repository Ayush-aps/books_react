process.env.NODE_ENV = "test";

jest.mock("../../models/User", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock("../../models/Book", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("../../models/Order", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("../../models/Complaint", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}));

const User = require("../../models/User");
const Book = require("../../models/Book");
const Order = require("../../models/Order");
const Complaint = require("../../models/Complaint");
const cacheService = require("../../utils/cacheService");
const adminController = require("../../controllers/adminController");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const chainQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue(result),
  }),
  lean: jest.fn().mockResolvedValue(result),
  populate: jest.fn().mockReturnThis(),
});

describe("adminController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns cached dashboard summary when available", async () => {
    const req = {};
    const res = createRes();
    cacheService.get.mockResolvedValue({ totalUsers: 10 });

    await adminController.getDashboard(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ source: "redis" }));
  });

  it("builds dashboard summary from database when cache misses", async () => {
    const req = {};
    const res = createRes();
    cacheService.get.mockResolvedValue(null);
    User.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    Book.countDocuments
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    Complaint.countDocuments.mockResolvedValueOnce(2);
    Order.find.mockReturnValue(chainQuery([
      { _id: "order-1", orderId: "ORD1", totalAmount: 100, status: "processing", orderStatus: "processing", createdAt: new Date("2026-01-01"), buyer: { name: "Buyer" } },
    ]));
    Order.aggregate.mockResolvedValueOnce([{ totalRevenue: 50 }]);
    cacheService.set.mockResolvedValue(true);

    await adminController.getDashboard(req, res);

    expect(cacheService.set).toHaveBeenCalledWith("admin:dashboard:summary", expect.any(Object), 60);
    expect(res.json.mock.calls[0][0].data).toHaveProperty("totalUsers", 10);
    expect(res.json.mock.calls[0][0].data).toHaveProperty("totalRevenue", 50);
  });

  it("returns report analytics", async () => {
    const req = {};
    const res = createRes();

    User.countDocuments
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    User.find.mockReturnValue({
      sort: () => ({
        limit: () => Promise.resolve([
          { _id: "u1", name: "A" },
          { _id: "u2", name: "B" },
        ]),
      }),
    });
    Book.countDocuments
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1);
    Order.countDocuments
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    Order.find
      .mockReturnValueOnce({
        populate: () => ({
          sort: () => ({
            limit: () => Promise.resolve([
              { _id: "order-1", orderId: "ORD1", totalAmount: 100, status: "processing", orderStatus: "processing", createdAt: new Date("2026-01-01"), buyer: { name: "Buyer" } },
            ]),
          }),
        }),
      })
      .mockReturnValueOnce(Promise.resolve([
        {
          items: [{ price: 100, quantity: 1 }],
          adminCommission: 5,
          subtotal: 100,
          totalAmount: 100,
          orderStatus: "delivered",
        },
      ]));
    Order.aggregate
      .mockResolvedValueOnce([{ title: "Book", author: "Author", coverImage: "/x.jpg", soldCount: 2, revenue: 200 }])
      .mockResolvedValueOnce([{ sellerId: "seller-1", name: "Seller", email: "seller@example.com", totalSales: 2, revenue: 200, booksListed: 1 }])
      .mockResolvedValueOnce([{ month: "Jan", revenue: 500, orders: 2 }]);
    Book.aggregate.mockResolvedValueOnce([{ name: "Fiction", count: 3, revenue: 300, percentage: 33 }]);

    await adminController.getReports(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].success).toBe(true);
    expect(res.json.mock.calls[0][0].data).toHaveProperty("systemHealth");
    expect(res.json.mock.calls[0][0].data).toHaveProperty("topSellers");
  });

  it("rejects invalid role updates", async () => {
    const req = { params: { id: "user-1" }, body: { role: "superadmin" } };
    const res = createRes();

    await adminController.updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Invalid role/i);
  });
});
