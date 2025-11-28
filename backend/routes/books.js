/**
 * General Book Routes
 * Publicly accessible routes for books
 */

const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

/**
 * @route   GET /api/books/browse
 * @desc    Browse books (Public)
 * @access  Public
 */
router.get('/browse', async (req, res) => {
    try {
        const { search, genre, condition, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

        // Build query
        const query = { isApproved: true, isAvailable: true };

        if (search) {
            query.$text = { $search: search };
        }

        if (genre) {
            query.genres = genre;
        }

        if (condition) {
            query.condition = condition;
        }

        // Price range filtering
        if (minPrice || maxPrice) {
            const priceQuery = [];

            // Books with no discount
            const regularPriceQuery = { discountPrice: { $exists: false } };
            if (minPrice) regularPriceQuery.price = { $gte: Number(minPrice) };
            if (maxPrice) regularPriceQuery.price = { ...regularPriceQuery.price, $lte: Number(maxPrice) };

            // Books with discount
            const discountPriceQuery = { discountPrice: { $exists: true } };
            if (minPrice) discountPriceQuery.discountPrice = { $gte: Number(minPrice) };
            if (maxPrice) discountPriceQuery.discountPrice = { ...discountPriceQuery.discountPrice, $lte: Number(maxPrice) };

            priceQuery.push(regularPriceQuery, discountPriceQuery);
            query.$or = priceQuery;
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // Default: Newest
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };

        const totalBooks = await Book.countDocuments(query);
        const books = await Book.find(query)
            .sort(sortOption)
            .populate('seller', 'name')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: {
                books,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBooks / parseInt(limit)),
                    totalBooks,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (err) {
        console.error('Error browsing books:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching books',
            error: err.message
        });
    }
});

/**
 * @route   GET /api/books/:id
 * @desc    Get book details by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('seller', 'name email')
            .populate('originalOwner', 'name');

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            data: { book }
        });
    } catch (err) {
        console.error('Error fetching book details:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching book details',
            error: err.message
        });
    }
});

module.exports = router;
