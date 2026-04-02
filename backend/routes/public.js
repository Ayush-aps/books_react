/**
 * Public API routes — home, about, pricing, contact, public book browse
 */

const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Complaint = require("../models/Complaint");

/**
 * @swagger
 * /api/public/home:
 *   get:
 *     tags: [Public]
 *     summary: Get home page data (featured, new arrivals, trending books)
 *     responses:
 *       200:
 *         description: Home page data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     featuredBooks:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/BookSummary' }
 *                     newArrivals:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/BookSummary' }
 *                     trendingBooks:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/BookSummary' }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/home", async (req, res) => {
  try {
    const featuredBooks = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ rating: -1 })
      .limit(8);

    const newArrivals = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(8);

    const trendingBooks = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ reviewCount: -1 })
      .limit(8);

    res.json({
      success: true,
      message: "Home data retrieved successfully",
      data: { featuredBooks, newArrivals, trendingBooks },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching home data", error: err.message });
  }
});

/**
 * @swagger
 * /api/public/about:
 *   get:
 *     tags: [Public]
 *     summary: Get about page content
 *     responses:
 *       200:
 *         description: About page data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:       { type: string }
 *                     description: { type: string }
 */
router.get("/about", (req, res) => {
  res.json({
    success: true,
    message: "About data retrieved successfully",
    data: {
      title: "About Bookish",
      description: "Your one-stop destination for buying and selling books",
    },
  });
});

/**
 * @swagger
 * /api/public/pricing:
 *   get:
 *     tags: [Public]
 *     summary: Get subscription plans and seller fee tiers
 *     responses:
 *       200:
 *         description: Pricing plans and seller fees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     plans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:     { type: string, example: Premium }
 *                           price:    { type: number, example: 199 }
 *                           period:   { type: string, example: month }
 *                           features: { type: array, items: { type: string } }
 *                     sellerFees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:       { type: string }
 *                           fee:        { type: string }
 *                           monthlyFee: { type: number }
 *                           features:   { type: array, items: { type: string } }
 */
router.get("/pricing", (req, res) => {
  const plans = [
    { name: "Free", price: 0, features: ["Browse all books", "Purchase physical books", "Basic recommendation system", "Standard delivery"] },
    { name: "Premium", price: 199, period: "month", features: ["All Free features", "Access to e-books and audiobooks", "Advanced recommendation system", "Priority delivery", "Exclusive discounts"] },
    { name: "Premium Plus", price: 499, period: "month", features: ["All Premium features", "Unlimited e-book access", "Monthly free physical book", "Free express delivery", "Early access to new releases"] },
  ];

  const sellerFees = [
    { name: "Basic Seller", fee: "10%", features: ["List up to 50 books", "Standard visibility", "Basic analytics"] },
    { name: "Professional Seller", fee: "8%", monthlyFee: 499, features: ["Unlimited book listings", "Enhanced visibility", "Advanced analytics", "Priority support"] },
  ];

  res.json({ success: true, message: "Pricing data retrieved successfully", data: { plans, sellerFees } });
});

/**
 * @swagger
 * /api/public/contact:
 *   post:
 *     tags: [Public]
 *     summary: Submit a contact / support message
 *     description: >
 *       Logged-in users only need `subject`, `message`, and optionally `type`.
 *       Guest users must also provide `name` and `email`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Smith
 *                 description: Required for guest (unauthenticated) users
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *                 description: Required for guest (unauthenticated) users
 *               subject:
 *                 type: string
 *                 example: Issue with my order
 *               message:
 *                 type: string
 *                 example: I have not received my order yet.
 *               type:
 *                 type: string
 *                 example: Order Issue
 *                 description: Category of the enquiry (defaults to "General Inquiry")
 *     responses:
 *       201:
 *         description: Message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    let newComplaint;

    if (req.isAuthenticated && req.isAuthenticated()) {
      newComplaint = new Complaint({ subject, description: message, category: type || "General Inquiry", user: req.user._id, userRole: req.user.role, status: "pending", source: "contact_form" });
    } else {
      if (!name || !email) {
        return res.status(400).json({ success: false, message: "Name and email are required for guest users" });
      }
      newComplaint = new Complaint({ subject, description: message, category: type || "General Inquiry", guestInfo: { name, email }, userRole: "guest", status: "pending", source: "contact_form" });
    }

    await newComplaint.save();
    res.status(201).json({ success: true, message: "Your message has been sent. We will get back to you soon.", data: { complaint: newComplaint } });
  } catch (err) {
    console.error("Error submitting contact form:", err);
    res.status(500).json({ success: false, message: "There was an error submitting your message. Please try again.", error: err.message });
  }
});

/**
 * @swagger
 * /api/public/books/browse:
 *   get:
 *     tags: [Public]
 *     summary: Browse and filter all publicly available books
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Full-text search term
 *       - name: genre
 *         in: query
 *         schema: { type: string }
 *         description: Filter by genre (e.g. Fiction)
 *       - name: condition
 *         in: query
 *         schema: { type: string, enum: [new, like-new, good, fair] }
 *       - name: minPrice
 *         in: query
 *         schema: { type: number }
 *         example: 100
 *       - name: maxPrice
 *         in: query
 *         schema: { type: number }
 *         example: 500
 *       - name: sort
 *         in: query
 *         schema: { type: string, enum: [newest, price-asc, price-desc, rating] }
 *         description: Sort order (default newest)
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/BookSummary' }
 *                     genres:
 *                       type: array
 *                       items: { type: string }
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/books/browse", async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true, isAvailable: true };
    if (search) query.$text = { $search: search };
    if (genre) query.genres = genre;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      const priceQuery = [];
      const rq = { discountPrice: { $exists: false } };
      if (minPrice) rq.price = { $gte: Number(minPrice) };
      if (maxPrice) rq.price = { ...rq.price, $lte: Number(maxPrice) };
      const dq = { discountPrice: { $exists: true } };
      if (minPrice) dq.discountPrice = { $gte: Number(minPrice) };
      if (maxPrice) dq.discountPrice = { ...dq.discountPrice, $lte: Number(maxPrice) };
      priceQuery.push(rq, dq);
      query.$or = priceQuery;
    }
    const genres = await Book.distinct("genres");
    let books = [], totalBooks = 0;
    if (sort === "price-asc" || sort === "price-desc") {
      const sortOrder = sort === "price-asc" ? 1 : -1;
      const pipeline = [
        { $match: query },
        { $addFields: { effectivePrice: { $ifNull: ["$discountPrice", "$price"] } } },
        { $sort: { effectivePrice: sortOrder } },
        { $lookup: { from: "users", localField: "seller", foreignField: "_id", as: "seller" } },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
        { $facet: { metadata: [{ $count: "total" }], data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }] } },
      ];
      const result = await Book.aggregate(pipeline);
      books = result[0].data;
      totalBooks = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    } else {
      let sortOption = {};
      if (sort === "newest") sortOption = { createdAt: -1 };
      else if (sort === "rating") sortOption = { rating: -1 };
      else sortOption = { createdAt: -1 };
      totalBooks = await Book.countDocuments(query);
      books = await Book.find(query).sort(sortOption).populate("seller", "name").skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    }
    res.json({ success: true, message: "Books retrieved successfully", data: { books, genres, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalBooks / parseInt(limit)), totalBooks, limit: parseInt(limit) }, filters: { search, genre, condition, minPrice, maxPrice, sort } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching books", error: err.message });
  }
});

module.exports = router;
