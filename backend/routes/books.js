/**
 * General Book Routes — publicly accessible
 */

const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

/**
 * @swagger
 * /api/books/browse:
 *   get:
 *     tags: [Books]
 *     summary: Browse books with flexible search and filtering
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *         description: Search term matched against title, author, and description
 *       - name: genre
 *         in: query
 *         schema: { type: string }
 *         example: Fiction
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
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated book list
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
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/browse', async (req, res) => {
    try {
        const { search, genre, condition, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
        const query = { isApproved: true, isAvailable: true };
        const andConditions = [];
        if (search) {
            const searchTerms = search.trim().split(/\s+/);
            const searchRegex = new RegExp(searchTerms.join('|'), 'i');
            andConditions.push({ $or: [{ title: searchRegex }, { author: searchRegex }, { description: searchRegex }] });
        }
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
            andConditions.push({ $or: priceQuery });
        }
        if (andConditions.length > 0) query.$and = andConditions;
        let sortOption = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        const totalBooks = await Book.countDocuments(query);
        const books = await Book.find(query).sort(sortOption).populate('seller', 'name').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
        res.json({ success: true, data: { books, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(totalBooks / parseInt(limit)), totalBooks, limit: parseInt(limit) } } });
    } catch (err) {
        console.error('Error browsing books:', err);
        res.status(500).json({ success: false, message: 'Error fetching books', error: err.message });
    }
});

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get full details of a single book by ID
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     book: { $ref: '#/components/schemas/BookSummary' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('seller', 'name email').populate('originalOwner', 'name');
        if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
        res.json({ success: true, data: { book } });
    } catch (err) {
        console.error('Error fetching book details:', err);
        if (err.kind === 'ObjectId') return res.status(404).json({ success: false, message: 'Book not found' });
        res.status(500).json({ success: false, message: 'Error fetching book details', error: err.message });
    }
});

module.exports = router;
