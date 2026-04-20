process.env.NODE_ENV = "test";

jest.mock("../../models/Order", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock("../../models/Book", () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../models/Cart", () => ({
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  del: jest.fn(),
}));

const Order = require("../../models/Order");
const Book = require("../../models/Book");
const Cart = require("../../models/Cart");
const cacheService = require("../../utils/cacheService");
const orderController = require("../../controllers/orderController");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createBookQuery = (book) => ({
  populate: jest.fn().mockResolvedValue(book),
});

describe("orderController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects order creation without items", async () => {
    const req = { body: { items: [] }, user: { _id: "buyer-1" } };
    const res = createRes();

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/No items provided/i);
  });

  it("rejects order creation when buyer is missing", async () => {
    const req = {
      body: {
        items: [{ bookId: "507f1f77bcf86cd799439011", quantity: 1, price: 100 }],
        paymentMethod: "upi",
      },
      user: {},
    };
    const res = createRes();
    Book.findById.mockReturnValue(createBookQuery({
      _id: "507f1f77bcf86cd799439011",
      title: "Test Book",
      author: "Author",
      coverImage: "/img/books/default.jpg",
      stock: 10,
      seller: { _id: "seller-1", name: "Seller", email: "seller@example.com" },
    }));

    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json.mock.calls[0][0].message).toMatch(/Please log in/i);
  });

  it("creates an order and invalidates caches", async () => {
    const req = {
      body: {
        items: [{ bookId: "507f1f77bcf86cd799439011", quantity: 2, price: 150 }],
        shippingAddress: {
          name: "Buyer",
          address: "Street 1",
          city: "Pune",
          state: "MH",
          pincode: "411001",
          phone: "9999999999",
        },
        paymentMethod: "upi",
        totalAmount: 300,
        subtotal: 300,
        tax: 0,
        shippingCost: 0,
      },
      user: { _id: "buyer-1" },
    };
    const res = createRes();
    const book = {
      _id: "507f1f77bcf86cd799439011",
      title: "Test Book",
      author: "Author",
      coverImage: "/img/books/default.jpg",
      stock: 10,
      seller: { _id: "seller-1", name: "Seller", email: "seller@example.com" },
    };
    const updatedBook = { ...book, stock: 8 };

    Book.findById.mockReturnValue(createBookQuery(book));
    Book.findByIdAndUpdate.mockReturnValue(createBookQuery(updatedBook));
    Order.create.mockResolvedValue({ _id: "order-1" });
    Order.findById.mockReturnValue({
      populate: jest.fn()
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValueOnce({
            populate: jest.fn().mockResolvedValue({ _id: "order-1", buyer: {}, items: [] }),
          }),
        }),
    });
    Cart.findOneAndUpdate.mockResolvedValue({});
    cacheService.del.mockResolvedValue(1);

    await orderController.createOrder(req, res);

    expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({ buyer: "buyer-1", totalAmount: 300 }));
    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { user: "buyer-1" },
      { $set: { items: [], savedForLater: [] } }
    );
    expect(cacheService.del).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("blocks unauthorized order access", async () => {
    const req = { params: { id: "order-1" }, user: { _id: "buyer-2", role: "buyer" } };
    const res = createRes();
    Order.findById.mockReturnValue({
      populate: jest.fn()
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValueOnce({
            populate: jest.fn().mockResolvedValue({
              _id: "order-1",
              buyer: { _id: "buyer-1" },
              items: [{ seller: { _id: "seller-1" } }],
            }),
          }),
        }),
    });

    await orderController.getOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0][0].message).toMatch(/Not authorized/i);
  });

  it("allows the buyer to cancel an order and restores stock", async () => {
    const req = { params: { id: "order-1" }, user: { id: "buyer-1" } };
    const res = createRes();
    const order = {
      buyer: { toString: () => "buyer-1" },
      orderStatus: "processing",
      orderId: "ORD001",
      items: [{ book: "book-1", quantity: 1 }],
      save: jest.fn().mockResolvedValue(true),
    };

    Order.findById.mockResolvedValue(order);
    Book.findByIdAndUpdate.mockResolvedValue({ title: "Book" });

    await orderController.cancelOrder(req, res);

    expect(Book.findByIdAndUpdate).toHaveBeenCalledWith("book-1", { $inc: { stock: 1 } }, { new: true });
    expect(order.orderStatus).toBe("cancelled");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects return requests outside the window", async () => {
    const req = { params: { id: "order-1" }, user: { id: "buyer-1" }, body: { reason: "Broken" } };
    const res = createRes();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() - 12);

    Order.findById.mockResolvedValue({
      buyer: { toString: () => "buyer-1" },
      orderStatus: "delivered",
      deliveryDate,
      save: jest.fn(),
    });

    await orderController.requestReturn(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Return window has expired/i);
  });
});