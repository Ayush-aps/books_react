const express = require("express")
const router = express.Router()
const Book = require("../models/Book")
const { ensureAuthenticated } = require("../middleware/auth")

/**
 * @route   GET /books/browse
 * @desc    Browse books with search and filter
 * @access  Private (All authenticated users)
 */
router.get("/browse", ensureAuthenticated, async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort } = req.query

    // Build query
    const query = {}

    // Set default filters based on user role
    if (req.user.role === 'admin') {
      // Admins can see all books
      query.isAvailable = true
    } else if (req.user.role === 'seller') {
      // Sellers can see their books and approved books
      query.$or = [
        { seller: req.user._id },
        { isApproved: true, isAvailable: true }
      ]
    } else {
      // Regular users can only see approved and available books
      query.isApproved = true
      query.isAvailable = true
    }

    if (search) {
      query.$text = { $search: search }
    }

    if (genre) {
      query.genres = genre
    }

    if (condition) {
      query.condition = condition
    }

    // Price range filtering using $or to handle discount price
    if (minPrice || maxPrice) {
      const priceQuery = []
      
      // Books with no discount (use price field)
      const regularPriceQuery = { discountPrice: { $exists: false } }
      if (minPrice) regularPriceQuery.price = { $gte: Number(minPrice) }
      if (maxPrice) regularPriceQuery.price = { ...regularPriceQuery.price, $lte: Number(maxPrice) }
      
      // Books with discount (use discountPrice field)
      const discountPriceQuery = { discountPrice: { $exists: true } }
      if (minPrice) discountPriceQuery.discountPrice = { $gte: Number(minPrice) }
      if (maxPrice) discountPriceQuery.discountPrice = { ...discountPriceQuery.discountPrice, $lte: Number(maxPrice) }
      
      priceQuery.push(regularPriceQuery, discountPriceQuery)
      query.$or = priceQuery
    }

    // Get all genres for filter
    const genres = await Book.distinct("genres")

    // Prepare the aggregation pipeline for sorting by effective price if needed
    let books = [];
    
    if (sort === "price-asc" || sort === "price-desc") {
      // For price sorting, we need to use aggregation to sort by effective price
      const sortOrder = sort === "price-asc" ? 1 : -1;
      
      // Create aggregation pipeline
      const pipeline = [
        { $match: query },
        { 
          $addFields: {
            effectivePrice: { $ifNull: ["$discountPrice", "$price"] }
          }
        },
        { $sort: { effectivePrice: sortOrder } },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "originalOwner",
            foreignField: "_id",
            as: "originalOwner"
          }
        },
        { 
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$originalOwner",
            preserveNullAndEmptyArrays: true
          }
        }
      ];
      
      books = await Book.aggregate(pipeline);
    } else {
      // Standard sorting options
      let sortOption = {};
      if (sort === "newest") {
        sortOption = { createdAt: -1 };
      } else if (sort === "rating") {
        sortOption = { rating: -1 };
      } else {
        // Default sort
        sortOption = { createdAt: -1 };
      }
      
      // Use normal find with populate for other sort options
      books = await Book.find(query)
        .sort(sortOption)
        .populate("seller", "name")
        .populate("originalOwner", "name");
    }

    res.render("books/browse", {
      title: "Browse Books - Bookish",
      books,
      genres,
      filters: {
        search,
        genre,
        condition,
        minPrice,
        maxPrice,
        sort,
      },
      user: req.user,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching books")
    res.redirect("/")
  }
})

/**
 * @route   GET /books/:id
 * @desc    View book details
 * @access  Private (All authenticated users)
 */
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("seller", "name")
      .populate("originalOwner", "name")

    if (!book) {
      req.flash("error_msg", "Book not found")
      return res.redirect("/books/browse")
    }

    // Get recommended books based on genre
    const recommendedBooks = await Book.find({
      _id: { $ne: book._id },
      genres: { $in: book.genres },
      isApproved: true,
      isAvailable: true,
    })
      .limit(4)
      .populate("seller", "name")

    res.render("books/book-details", {
      title: `${book.title} - Bookish`,
      book,
      recommendedBooks,
      user: req.user,
    })
  } catch (err) {
    console.error(err)
    req.flash("error_msg", "Error fetching book details")
    res.redirect("/books/browse")
  }
})

module.exports = router 