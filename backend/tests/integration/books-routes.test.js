process.env.NODE_ENV = "test";

const express = require("express");
const request = require("supertest");

jest.mock("../../models/Book", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../../utils/cacheService", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const Book = require("../../models/Book");
const cacheService = require("../../utils/cacheService");
const booksRoutes = require("../../routes/books");

const createBrowseChain = (books) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(books),
  }),
});

describe("books routes", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use("/api/books", booksRoutes);
  });

  it("returns cached browse results when available", async () => {
    cacheService.get.mockResolvedValue({ success: true, data: { books: [{ _id: "b1" }], pagination: { currentPage: 1, totalPages: 1, totalBooks: 1, limit: 12 } } });

    const response = await request(app).get("/api/books/browse");

    expect(response.status).toBe(200);
    expect(response.body.source).toBe("redis");
  });

  it("browses books from database when cache misses", async () => {
    cacheService.get.mockResolvedValue(null);
    Book.countDocuments.mockResolvedValue(1);
    Book.find.mockReturnValue(createBrowseChain([{ _id: "b1", title: "Book One" }]));
    cacheService.set.mockResolvedValue(true);

    const response = await request(app).get("/api/books/browse");

    expect(response.status).toBe(200);
    expect(response.body.data.books).toHaveLength(1);
    expect(response.body.source).toBe("db");
  });

  it("returns 404 for missing book details", async () => {
    Book.findById.mockReturnValue({
      populate: () => ({
        populate: () => Promise.resolve(null),
      }),
    });

    const response = await request(app).get("/api/books/invalid-id");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/Book not found/i);
  });
});
