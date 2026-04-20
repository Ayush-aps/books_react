process.env.NODE_ENV = "test";

jest.mock("../../models/Highlight", () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
}));

const Highlight = require("../../models/Highlight");
const highlightController = require("../../controllers/highlightController");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("highlightController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns highlights for a book", async () => {
    const req = { params: { bookId: "book-1" }, user: { _id: "user-1" } };
    const res = createRes();
    const highlights = [{ _id: "h1" }, { _id: "h2" }];

    Highlight.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(highlights),
    });

    await highlightController.getHighlights(req, res);

    expect(Highlight.find).toHaveBeenCalledWith({ userId: "user-1", bookId: "book-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ success: true, count: 2 });
  });

  it("rejects invalid highlight payloads", async () => {
    const req = { user: { _id: "user-1" }, body: { bookId: "book-1", text: "hi", page: 1, position: {} } };
    const res = createRes();

    await highlightController.createHighlight(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/Position must include/i);
  });

  it("creates a highlight", async () => {
    const req = {
      user: { _id: "user-1" },
      body: {
        bookId: "book-1",
        text: "Important text",
        page: 12,
        color: "#ff0",
        position: { startOffset: 1, endOffset: 8 },
      },
    };
    const res = createRes();
    Highlight.create.mockResolvedValue({ _id: "h1" });

    await highlightController.createHighlight(req, res);

    expect(Highlight.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", bookId: "book-1" }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 404 when deleting an unknown highlight", async () => {
    const req = { params: { highlightId: "missing" }, user: { _id: "user-1" } };
    const res = createRes();
    Highlight.findOne.mockResolvedValue(null);

    await highlightController.deleteHighlight(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toMatch(/Highlight not found/i);
  });

  it("deletes a highlight", async () => {
    const req = { params: { highlightId: "h1" }, user: { _id: "user-1" } };
    const res = createRes();
    Highlight.findOne.mockResolvedValue({ _id: "h1" });
    Highlight.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await highlightController.deleteHighlight(req, res);

    expect(Highlight.deleteOne).toHaveBeenCalledWith({ _id: "h1" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deletes all highlights for a book", async () => {
    const req = { params: { bookId: "book-1" }, user: { _id: "user-1" } };
    const res = createRes();
    Highlight.deleteMany.mockResolvedValue({ deletedCount: 3 });

    await highlightController.deleteAllHighlights(req, res);

    expect(Highlight.deleteMany).toHaveBeenCalledWith({ userId: "user-1", bookId: "book-1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ deletedCount: 3 });
  });
});
