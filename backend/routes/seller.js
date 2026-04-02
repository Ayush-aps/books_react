/**
 * Seller Routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureSeller } = require("../middleware/auth");
const { pdfUpload } = require("../middleware/upload");
const {
  getDashboard,
  getInventory,
  createBook, searchBooks, lookupBookByISBN, getBookDetails, updateBook, deleteBook, getAllBooks,
  getAllOrders, getOrderDetails, updateOrderStatus,
  getAllComplaints, createComplaint, getComplaintDetails, addComplaintComment,
} = require("../controllers/sellerController");

/**
 * @swagger
 * /api/seller/dashboard:
 *   get:
 *     tags: [Seller]
 *     summary: Get seller dashboard statistics
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dashboard", ensureAuthenticated, ensureSeller, getDashboard);

/**
 * @swagger
 * /api/seller/inventory:
 *   get:
 *     tags: [Seller]
 *     summary: Get seller inventory summary
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by title or author
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [approved, pending, rejected] }
 *         description: Filter by approval status
 *       - name: sort
 *         in: query
 *         schema: { type: string, enum: [price-asc, price-desc, title] }
 *     responses:
 *       200:
 *         description: Inventory data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/inventory", ensureAuthenticated, ensureSeller, getInventory);

/**
 * @swagger
 * /api/seller/books:
 *   get:
 *     tags: [Seller]
 *     summary: Browse all books with filtering and sorting
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search by title, author, or description
 *       - name: genre
 *         in: query
 *         schema: { type: string }
 *       - name: condition
 *         in: query
 *         schema: { type: string, enum: [new, like-new, good, fair] }
 *       - name: minPrice
 *         in: query
 *         schema: { type: number }
 *       - name: maxPrice
 *         in: query
 *         schema: { type: number }
 *       - name: sort
 *         in: query
 *         schema: { type: string, enum: [price-asc, price-desc, rating] }
 *       - name: approvalStatus
 *         in: query
 *         schema: { type: string, enum: [approved, pending] }
 *     responses:
 *       200:
 *         description: Book list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Seller]
 *     summary: Upload / list a new book (multipart/form-data with optional PDF)
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, author, isbn, price, stock, format]
 *             properties:
 *               title:          { type: string, example: "The Great Gatsby" }
 *               author:         { type: string, example: "F. Scott Fitzgerald" }
 *               description:    { type: string, example: "A classic novel" }
 *               isbn:           { type: string, example: "9780743273565" }
 *               price:          { type: number, example: 299 }
 *               discountPrice:  { type: number, example: 249 }
 *               publisher:      { type: string, example: "Scribner" }
 *               publishedDate:  { type: string, example: "1925-04-10" }
 *               pageCount:      { type: integer, example: 180 }
 *               language:       { type: string, example: "English" }
 *               genres:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Fiction", "Classic"]
 *               condition:      { type: string, enum: [new, like-new, good, fair, used], example: new }
 *               stock:          { type: integer, example: 10 }
 *               format:         { type: string, enum: [paperback, hardcover, ebook], example: paperback }
 *               coverImageUrl:  { type: string, format: uri, description: Cover image URL from Google Books }
 *               coverImage:     { type: string, format: uri, description: Fallback cover image URL }
 *               epubFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF/ePub file (max 50 MB)
 *     responses:
 *       201:
 *         description: Book created and queued for review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or duplicate ISBN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/books", ensureAuthenticated, ensureSeller, getAllBooks);
router.post("/books", ensureAuthenticated, ensureSeller, pdfUpload.single('epubFile'), createBook);

/**
 * @swagger
 * /api/seller/books/search:
 *   get:
 *     tags: [Seller]
 *     summary: Search books by title/author using Google Books API
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         description: Search term (title/author)
 *         example: "Harry Potter"
 *       - name: maxResults
 *         in: query
 *         schema: { type: integer, default: 10, maximum: 40 }
 *         description: Max number of results (1-40)
 *     responses:
 *       200:
 *         description: Matching books from Google Books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       400:
 *         description: Missing query parameter
 *       404:
 *         description: No books found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/books/search", ensureAuthenticated, ensureSeller, searchBooks);

/**
 * @swagger
 * /api/seller/books/lookup/{isbn}:
 *   get:
 *     tags: [Seller]
 *     summary: Auto-populate book metadata from ISBN via Open Library
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: isbn
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "9780743273565"
 *     responses:
 *       200:
 *         description: Book metadata from Open Library
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/books/lookup/:isbn", ensureAuthenticated, ensureSeller, lookupBookByISBN);

/**
 * @swagger
 * /api/seller/books/{id}:
 *   get:
 *     tags: [Seller]
 *     summary: Get full details of one of the seller's books
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Seller]
 *     summary: Update a book listing (multipart/form-data, re-upload PDF optional)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:              { type: string }
 *               author:             { type: string }
 *               description:        { type: string }
 *               price:              { type: number }
 *               discountPrice:      { type: number }
 *               discountPercentage: { type: number, description: "Alternative to discountPrice — calculates discount from price" }
 *               stock:              { type: integer }
 *               isAvailable:        { type: boolean }
 *               isbn:               { type: string }
 *               genre:
 *                 type: array
 *                 items: { type: string }
 *               condition:          { type: string, enum: [new, like-new, good, fair, used] }
 *               publicationYear:    { type: integer, example: 2020 }
 *               coverImage:         { type: string, format: uri }
 *               resubmit:           { type: boolean, description: "Set to true to resubmit a rejected book for review" }
 *               epubFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Book updated (or resubmitted for review)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Seller]
 *     summary: Delete a book listing
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/books/:id", ensureAuthenticated, ensureSeller, getBookDetails);
router.put("/books/:id", ensureAuthenticated, ensureSeller, pdfUpload.single('epubFile'), updateBook);
router.delete("/books/:id", ensureAuthenticated, ensureSeller, deleteBook);

/**
 * @swagger
 * /api/seller/orders:
 *   get:
 *     tags: [Seller]
 *     summary: List orders containing the seller's books
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [processing, shipped, delivered, cancelled, return_requested, returned] }
 *     responses:
 *       200:
 *         description: Seller order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/orders", ensureAuthenticated, ensureSeller, getAllOrders);

/**
 * @swagger
 * /api/seller/orders/{id}:
 *   get:
 *     tags: [Seller]
 *     summary: Get details of a specific seller order
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/orders/:id", ensureAuthenticated, ensureSeller, getOrderDetails);

/**
 * @swagger
 * /api/seller/orders/{id}/status:
 *   put:
 *     tags: [Seller]
 *     summary: Update the fulfilment status of an order
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ordered, processing, shipped, delivered, cancelled, return_requested, returned]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Status updated (stock restored on cancel)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/orders/:id/status", ensureAuthenticated, ensureSeller, updateOrderStatus);

/**
 * @swagger
 * /api/seller/complaints:
 *   get:
 *     tags: [Seller]
 *     summary: List all complaints related to the seller
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Complaint list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Seller]
 *     summary: Raise a new complaint
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description, category]
 *             properties:
 *               subject:     { type: string, example: Payment not received }
 *               description: { type: string, example: I fulfilled the order but payment has not reflected. }
 *               category:    { type: string, example: Payment }
 *     responses:
 *       201:
 *         description: Complaint raised
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/complaints", ensureAuthenticated, ensureSeller, getAllComplaints);
router.post("/complaints", ensureAuthenticated, ensureSeller, createComplaint);

/**
 * @swagger
 * /api/seller/complaints/{id}:
 *   get:
 *     tags: [Seller]
 *     summary: Get details of a specific complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Complaint details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/complaints/:id", ensureAuthenticated, ensureSeller, getComplaintDetails);

/**
 * @swagger
 * /api/seller/complaints/{id}/comment:
 *   post:
 *     tags: [Seller]
 *     summary: Add a follow-up comment to a complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: Please expedite the resolution. }
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/complaints/:id/comment", ensureAuthenticated, ensureSeller, addComplaintComment);

module.exports = router;
