process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/Library", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../models/Order", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("../../models/Complaint", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/Book", () => ({
  find: jest.fn(),
  distinct: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(0),
}));

const User = require("../../models/User");
const Library = require("../../models/Library");
const Order = require("../../models/Order");
const Complaint = require("../../models/Complaint");
const Book = require("../../models/Book");
const app = require("../../app");

const makeToken = (id, role, email) => jwt.sign({ id, role, email }, process.env.JWT_SECRET, { expiresIn: "1h" });

describe("Dashboard bearer auth coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the buyer dashboard with bearer auth", async () => {
    const token = makeToken("buyer-1", "buyer", "buyer@example.com");

    User.findById.mockImplementation(() => ({
      select: () => ({
        lean: () => Promise.resolve({
          _id: "buyer-1",
          name: "Buyer One",
          email: "buyer@example.com",
          role: "buyer",
          avatar: "/img/users/default-avatar.jpg",
          isVerified: true,
        }),
      }),
      populate: () => Promise.resolve({
        recentlyViewed: [
          {
            book: {
              _id: "book-1",
              title: "Redis in Action",
              author: "John Doe",
              price: 499,
              coverImage: "/img/books/default.jpg",
            },
          },
        ],
      }),
    }));

    Library.findOne.mockResolvedValue({ items: [{ _id: "library-item-1" }] });
    Order.find
      .mockResolvedValueOnce([
        { orderStatus: "processing", status: "processing" },
        { orderStatus: "delivered", status: "delivered" },
      ])
      .mockReturnValueOnce({
        sort: () => ({
          limit: () => ({
            select: () => Promise.resolve([
              {
                _id: "order-1",
                orderId: "ORD001",
                totalAmount: 500,
                status: "processing",
                orderStatus: "processing",
                createdAt: new Date().toISOString(),
              },
            ]),
          }),
        }),
      });
    Complaint.find.mockReturnValue({
      sort: () => ({
        select: () => Promise.resolve([
          { _id: "c-1", subject: "Need help", status: "pending", createdAt: new Date().toISOString() },
        ]),
      }),
    });

    const response = await request(app)
      .get("/api/buyer/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.libraryCount).toBe(1);
    expect(response.body.activeOrders).toBe(1);
    expect(response.body.completedOrders).toBe(1);
    expect(response.body.recentOrders).toHaveLength(1);
    expect(response.body.recentlyViewed).toHaveLength(1);
  });

  it("loads the seller dashboard with bearer auth", async () => {
    const token = makeToken("seller-1", "seller", "seller@example.com");

    User.findById.mockImplementation(() => ({
      select: () => ({
        lean: () => Promise.resolve({
          _id: "seller-1",
          name: "Seller One",
          email: "seller@example.com",
          role: "seller",
          avatar: "/img/users/default-avatar.jpg",
          isVerified: true,
        }),
      }),
    }));

    Book.find.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([
          { _id: "book-1", title: "Redis in Action", reviewCount: 5, stock: 2, isApproved: true, coverImage: "/img/books/default.jpg" },
          { _id: "book-2", title: "Express Deep Dive", reviewCount: 3, stock: 0, isApproved: true, coverImage: "/img/books/default.jpg" },
        ]),
      }),
    });

    Order.find.mockReturnValue({
      select: () => ({
        sort: () => ({
          lean: () => Promise.resolve([
            {
              _id: "order-1",
              orderDate: new Date().toISOString(),
              orderStatus: "delivered",
              totalAmount: 500,
              sellerRevenue: 475,
              items: [
                { seller: "seller-1", price: 500, quantity: 1, book: "book-1" },
              ],
            },
          ]),
        }),
      }),
    });

    const response = await request(app)
      .get("/api/seller/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totalBooks).toBe(2);
    expect(response.body.data.totalOrders).toBe(1);
    expect(response.body.data.stockAlerts.outOfStock).toHaveLength(1);
  });
});
