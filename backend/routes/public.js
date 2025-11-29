/**
 * Public API routes for home page, about, pricing, and contact
 */

const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Complaint = require("../models/Complaint");

/**
 * @route   GET /api/public/home
 * @desc    Get home page data
 * @access  Public
 */
router.get("/home", async (req, res) => {
  try {
    // Get featured books
    const featuredBooks = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ rating: -1 })
      .limit(8);

    // Get new arrivals
    const newArrivals = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ createdAt: -1 })
      .limit(8);

    // Get trending books (based on review count)
    const trendingBooks = await Book.find({ isApproved: true, isAvailable: true })
      .sort({ reviewCount: -1 })
      .limit(8);

    res.json({
      success: true,
      message: "Home data retrieved successfully",
      data: {
        featuredBooks,
        newArrivals,
        trendingBooks,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching home data",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/public/about
 * @desc    Get about page data
 * @access  Public
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
 * @route   GET /api/public/pricing
 * @desc    Get pricing plans and seller fees
 * @access  Public
 */
router.get("/pricing", (req, res) => {
  // Define pricing plans
  const plans = [
    {
      name: "Free",
      price: 0,
      features: [
        "Browse all books",
        "Purchase physical books",
        "Basic recommendation system",
        "Standard delivery",
      ],
    },
    {
      name: "Premium",
      price: 199,
      period: "month",
      features: [
        "All Free features",
        "Access to e-books and audiobooks",
        "Advanced recommendation system",
        "Priority delivery",
        "Exclusive discounts",
      ],
    },
    {
      name: "Premium Plus",
      price: 499,
      period: "month",
      features: [
        "All Premium features",
        "Unlimited e-book access",
        "Monthly free physical book",
        "Free express delivery",
        "Early access to new releases",
      ],
    },
  ];

  // Define seller fees
  const sellerFees = [
    {
      name: "Basic Seller",
      fee: "10%",
      features: ["List up to 50 books", "Standard visibility", "Basic analytics"],
    },
    {
      name: "Professional Seller",
      fee: "8%",
      monthlyFee: 499,
      features: [
        "Unlimited book listings",
        "Enhanced visibility",
        "Advanced analytics",
        "Priority support",
      ],
    },
  ];

  res.json({
    success: true,
    message: "Pricing data retrieved successfully",
    data: {
      plans,
      sellerFees,
    },
  });
});

/**
 * @route   POST /api/public/contact
 * @desc    Process contact form submission and create complaint entry
 * @access  Public
 */
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Create a complaint record for all contact form submissions
    let newComplaint;

    if (req.isAuthenticated && req.isAuthenticated()) {
      // For logged-in users
      newComplaint = new Complaint({
        subject: subject,
        description: message,
        category: type || "General Inquiry",
        user: req.user._id,
        userRole: req.user.role,
        status: "pending",
        source: "contact_form",
      });
    } else {
      // For guest users
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required for guest users",
        });
      }

      newComplaint = new Complaint({
        subject: subject,
        description: message,
        category: type || "General Inquiry",
        guestInfo: {
          name: name,
          email: email,
        },
        userRole: "guest",
        status: "pending",
        source: "contact_form",
      });
    }

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent. We will get back to you soon.",
      data: { complaint: newComplaint },
    });
  } catch (err) {
    console.error("Error submitting contact form:", err);
    res.status(500).json({
      success: false,
      message: "There was an error submitting your message. Please try again.",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/public/books/browse
 * @desc    Public browse books page
 * @access  Public
 */
router.get("/books/browse", async (req, res) => {
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

    // Price range filtering using $or to handle discount price
    if (minPrice || maxPrice) {
      const priceQuery = [];

      // Books with no discount (use price field)
      const regularPriceQuery = { discountPrice: { $exists: false } };
      if (minPrice) regularPriceQuery.price = { $gte: Number(minPrice) };
      if (maxPrice) regularPriceQuery.price = { ...regularPriceQuery.price, $lte: Number(maxPrice) };

      // Books with discount (use discountPrice field)
      const discountPriceQuery = { discountPrice: { $exists: true } };
      if (minPrice) discountPriceQuery.discountPrice = { $gte: Number(minPrice) };
      if (maxPrice)
        discountPriceQuery.discountPrice = { ...discountPriceQuery.discountPrice, $lte: Number(maxPrice) };

      priceQuery.push(regularPriceQuery, discountPriceQuery);
      query.$or = priceQuery;
    }

    // Get all genres for filter
    const genres = await Book.distinct("genres");

    // Prepare the aggregation pipeline for sorting by effective price if needed
    let books = [];
    let totalBooks = 0;

    if (sort === "price-asc" || sort === "price-desc") {
      // For price sorting, we need to use aggregation to sort by effective price
      const sortOrder = sort === "price-asc" ? 1 : -1;

      // Create aggregation pipeline
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            effectivePrice: { $ifNull: ["$discountPrice", "$price"] },
          },
        },
        { $sort: { effectivePrice: sortOrder } },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }],
          },
        },
      ];

      const result = await Book.aggregate(pipeline);
      books = result[0].data;
      totalBooks = result[0].metadata[0] ? result[0].metadata[0].total : 0;
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

      // Count total books
      totalBooks = await Book.countDocuments(query);

      // Use normal find with populate for other sort options
      books = await Book.find(query)
        .sort(sortOption)
        .populate("seller", "name")
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        genres,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBooks / parseInt(limit)),
          totalBooks,
          limit: parseInt(limit),
        },
        filters: {
          search,
          genre,
          condition,
          minPrice,
          maxPrice,
          sort,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
      error: err.message,
    });
  }
});

module.exports = router;
