/**
 * Seller Controller
 * Handles all seller-related operations
 */

const Book = require("../models/Book");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");

// ============================================
// DASHBOARD
// ============================================

// @desc    Get seller dashboard analytics
// @route   GET /api/seller/dashboard
// @access  Private (Seller)
exports.getDashboard = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user._id });

    const orders = await Order.find({
      "items.seller": req.user._id,
      orderStatus: { $in: ["processing", "shipped", "delivered"] },
    })
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage")
      .sort({ orderDate: -1 });

    let totalSales = 0;
    let monthlySales = 0;
    const totalOrders = orders.length;
    let pendingOrders = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const salesData = Array(12)
      .fill()
      .map((_, i) => ({
        month: new Date(0, i).toLocaleString("default", { month: "short" }),
        sales: 0,
      }));

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.seller && item.seller.toString() === req.user._id.toString()) {
          const itemTotal = item.price * item.quantity;
          totalSales += itemTotal;

          const orderDate = new Date(order.orderDate);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlySales += itemTotal;
          }

          salesData[orderDate.getMonth()].sales += itemTotal;
        }
      });

      if (order.orderStatus === "processing") {
        pendingOrders++;
      }
    });

    const topBooks = books.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
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
};

// ============================================
// INVENTORY MANAGEMENT
// ============================================

// @desc    Get seller's book inventory
// @route   GET /api/seller/inventory
// @access  Private (Seller)
exports.getInventory = async (req, res) => {
  try {
    const { search, status, sort } = req.query;

    const query = { seller: req.user._id };

    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { author: { $regex: search, $options: "i" } }];
    }

    if (status === "approved") {
      query.isApproved = true;
    } else if (status === "pending") {
      query.isApproved = false;
    }

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
};

// ============================================
// BOOK MANAGEMENT
// ============================================

// @desc    Upload a new book
// @route   POST /api/seller/books
// @access  Private (Seller)
exports.createBook = async (req, res) => {
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

    if (!title || !author || !description || !isbn || !price || !publisher || !genres || !stock || !format) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    let finalCoverImage =
      coverImageUrl && coverImageUrl.trim() !== "" ? coverImageUrl.trim() : "https://nnpdev.wustl.edu/img/BookCovers/genericBookCover.jpg";

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
};

// @desc    Get book details
// @route   GET /api/seller/books/:id
// @access  Private (Seller)
exports.getBookDetails = async (req, res) => {
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
};

// @desc    Update book
// @route   PUT /api/seller/books/:id
// @access  Private (Seller)
exports.updateBook = async (req, res) => {
  try {
    const { title, author, description, price, discountPrice, stock, isAvailable } = req.body;

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
};

// @desc    Delete book
// @route   DELETE /api/seller/books/:id
// @access  Private (Seller)
exports.deleteBook = async (req, res) => {
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
};

// @desc    Browse all books with filtering and sorting options
// @route   GET /api/seller/books
// @access  Private (Seller)
exports.getAllBooks = async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort, approvalStatus } = req.query;

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
        sortOptions = { createdAt: -1 };
    }

    const genres = await Book.distinct("genres");
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
};

// ============================================
// ORDER MANAGEMENT
// ============================================

// @desc    Get all orders for the seller
// @route   GET /api/seller/orders
// @access  Private (Seller)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      "items.seller": req.user._id,
    };

    if (req.query.status) {
      query.orderStatus = req.query.status;
    }

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("buyer", "name email")
      .populate("items.book", "title author coverImage")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

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
};

// @desc    Get order details for a specific order
// @route   GET /api/seller/orders/:id
// @access  Private (Seller)
exports.getOrderDetails = async (req, res) => {
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

    const sellerItems = order.items.filter((item) => item.seller.toString() === req.user._id.toString());
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
};

// @desc    Update order status
// @route   PUT /api/seller/orders/:id/status
// @access  Private (Seller)
exports.updateOrderStatus = async (req, res) => {
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
};

// ============================================
// COMPLAINT MANAGEMENT
// ============================================

// @desc    Get seller's complaints
// @route   GET /api/seller/complaints
// @access  Private (Seller)
exports.getAllComplaints = async (req, res) => {
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
};

// @desc    Submit a new complaint
// @route   POST /api/seller/complaints
// @access  Private (Seller)
exports.createComplaint = async (req, res) => {
  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

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
};

