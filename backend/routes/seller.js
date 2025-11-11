/**
 * Seller API routes for managing book inventory and sales
 */

const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const { ensureAuthenticated, ensureSeller } = require("../middleware/auth");

/**
 * @route   GET /api/seller/dashboard
 * @desc    Get seller dashboard analytics
 * @access  Private (Seller)
 */
router.get("/dashboard", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    // Get seller's books
    const books = await Book.find({ seller: req.user._id });

    // Get orders containing seller's books
    const orders = await Order.find({
      "items.seller": req.user._id,
      orderStatus: { $in: ["processing", "shipped", "delivered"] },
    })
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage")
      .sort({ orderDate: -1 });

    // Calculate total sales
    let totalSales = 0;
    let monthlySales = 0;
    const totalOrders = orders.length;
    let pendingOrders = 0;

    // Current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Initialize sales data for each month
    const salesData = Array(12)
      .fill()
      .map((_, i) => ({
        month: new Date(0, i).toLocaleString("default", { month: "short" }),
        sales: 0,
      }));

    orders.forEach((order) => {
      // Calculate total sales
      order.items.forEach((item) => {
        if (item.seller && item.seller.toString() === req.user._id.toString()) {
          const itemTotal = item.price * item.quantity;
          totalSales += itemTotal;

          // Calculate monthly sales
          const orderDate = new Date(order.orderDate);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlySales += itemTotal;
          }

          // Add to monthly sales data
          salesData[orderDate.getMonth()].sales += itemTotal;
        }
      });

      // Count pending orders
      if (order.orderStatus === "processing") {
        pendingOrders++;
      }
    });

    // Get top selling books
    const topBooks = books.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);

    // Get recent orders
    const recentOrders = orders.slice(0, 5);

    res.json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        totalSales,
        monthlySales,
        totalOrders,
        pendingOrders,
        salesData,
        topBooks,
        recentOrders,
        totalBooks: books.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading dashboard data",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/inventory
 * @desc    Get seller's book inventory
 * @access  Private (Seller)
 */
router.get("/inventory", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { search, status, sort } = req.query;

    // Build query
    const query = { seller: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "approved") {
      query.isApproved = true;
    } else if (status === "pending") {
      query.isApproved = false;
    }

    // Build sort options
    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") sortOptions = { price: 1 };
    else if (sort === "price-desc") sortOptions = { price: -1 };
    else if (sort === "title") sortOptions = { title: 1 };

    const books = await Book.find(query).sort(sortOptions);

    res.json({
      success: true,
      message: "Inventory retrieved successfully",
      data: { books },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/seller/upload
 * @desc    Upload a new book
 * @access  Private (Seller)
 */
router.post("/upload", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      isbn,
      price,
      discountPrice,
      publisher,
      publishedDate,
      pageCount,
      language,
      genres,
      condition,
      stock,
      format,
      coverImageUrl,
    } = req.body;

    // Validate required fields
    if (!title || !author || !description || !isbn || !price || !publisher || !genres || !stock || !format) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    let finalCoverImage =
      coverImageUrl && coverImageUrl.trim() !== ""
        ? coverImageUrl.trim()
        : "https://nnpdev.wustl.edu/img/BookCovers/genericBookCover.jpg";

    // Create new book
    const newBook = new Book({
      title,
      author,
      description,
      isbn,
      price,
      discountPrice: discountPrice || price,
      publisher,
      publishedDate,
      pageCount,
      language,
      genres: Array.isArray(genres) ? genres : [genres],
      condition,
      seller: req.user._id,
      stock,
      format,
      // If book is used, set current seller as original owner
      originalOwner: condition === "used" ? req.user._id : null,
      coverImage: finalCoverImage,
    });

    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book uploaded successfully and pending approval",
      data: { book: newBook },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error uploading book",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/book/:id
 * @desc    Get book details
 * @access  Private (Seller)
 */
router.get("/book/:id", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      seller: req.user._id,
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or you are not authorized",
      });
    }

    res.json({
      success: true,
      message: "Book retrieved successfully",
      data: { book },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching book",
      error: err.message,
    });
  }
});

/**
 * @route   PUT /api/seller/book/:id
 * @desc    Update book
 * @access  Private (Seller)
 */
router.put("/book/:id", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { title, author, description, price, discountPrice, stock, isAvailable } = req.body;

    // Find book
    const book = await Book.findOne({
      _id: req.params.id,
      seller: req.user._id,
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or you are not authorized",
      });
    }

    // Update book
    book.title = title;
    book.author = author;
    book.description = description;
    book.price = price;
    book.discountPrice = discountPrice || price;
    book.stock = stock;
    book.isAvailable = isAvailable;

    await book.save();

    res.json({
      success: true,
      message: "Book updated successfully",
      data: { book },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating book",
      error: err.message,
    });
  }
});

/**
 * @route   DELETE /api/seller/book/:id
 * @desc    Delete book
 * @access  Private (Seller)
 */
router.delete("/book/:id", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      seller: req.user._id,
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or you are not authorized",
      });
    }

    await book.remove();

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting book",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/orders
 * @desc    Get all orders for the seller
 * @access  Private (Seller)
 */
router.get("/orders", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      "items.seller": req.user._id,
    };

    // Add status filter if provided
    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate total sales and monthly sales
    let totalSales = 0;
    let monthlySales = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.seller && item.seller.toString() === req.user._id.toString()) {
          const itemTotal = item.price * item.quantity;
          totalSales += itemTotal;

          const orderDate = new Date(order.orderDate);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlySales += itemTotal;
          }
        }
      });
    });

    // Calculate pending orders
    const pendingOrders = orders.filter((order) => order.orderStatus === "processing").length;

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        totalSales,
        monthlySales,
        totalOrders,
        pendingOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        status: req.query.status || "all",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading orders",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/orders/:id
 * @desc    Get order details for a specific order
 * @access  Private (Seller)
 */
router.get("/orders/:id", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      "items.seller": req.user._id,
    })
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Filter items for this seller only
    const sellerItems = order.items.filter((item) => item.seller.toString() === req.user._id.toString());

    // Calculate total for this seller's items
    const sellerTotal = sellerItems.reduce((total, item) => total + item.price * item.quantity, 0);

    res.json({
      success: true,
      message: "Order details retrieved successfully",
      data: {
        order,
        sellerItems,
        sellerTotal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading order details",
      error: err.message,
    });
  }
});

/**
 * @route   PUT /api/seller/order/:id/status
 * @desc    Update order status
 * @access  Private (Seller)
 */
router.put("/order/:id/status", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      "items.seller": req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = status;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/complaints
 * @desc    Get seller's complaints
 * @access  Private (Seller)
 */
router.get("/complaints", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id, userRole: "seller" }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Complaints retrieved successfully",
      data: { complaints },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading complaints",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/seller/complaints
 * @desc    Submit a new complaint
 * @access  Private (Seller)
 */
router.post("/complaints", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    // Create new complaint
    const newComplaint = new Complaint({
      subject,
      description,
      user: req.user._id,
      userRole: "seller",
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: { complaint: newComplaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error submitting complaint",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/seller/books
 * @desc    Browse all books with filtering and sorting options
 * @access  Private (Seller)
 */
router.get("/books", ensureAuthenticated, ensureSeller, async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort, approvalStatus } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { author: { $regex: search, $options: "i" } }];
    }

    if (genre) {
      query.genres = genre;
    }

    if (condition) query.condition = condition;
    if (approvalStatus) query.isApproved = approvalStatus === "approved";

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "price-asc":
        sortOptions = { price: 1 };
        break;
      case "price-desc":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 }; // newest first
    }

    // Get all unique genres for filter dropdown
    const genres = await Book.distinct("genres");

    // Get books with seller information
    const books = await Book.find(query).populate("seller", "name").sort(sortOptions);

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        genres,
        filters: {
          search,
          genre,
          condition,
          minPrice,
          maxPrice,
          sort,
          approvalStatus,
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
