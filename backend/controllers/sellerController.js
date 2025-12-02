/**
 * Seller Controller
 * Handles all seller-related operations
 */

const Book = require("../models/Book");
const Order = require("../models/Order");
const Complaint = require("../models/Complaint");
const axios = require("axios");

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
    let totalRevenue = 0;
    let monthlySales = 0;
    const totalOrders = orders.length;
    let pendingOrders = 0;
    let deliveredOrders = 0;

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

          // Calculate revenue only from delivered orders
          if (order.orderStatus === "delivered") {
            // Use sellerRevenue if calculated, otherwise calculate 95% of item total
            if (order.sellerRevenue && order.sellerRevenue > 0) {
              // Calculate this seller's proportional share of the seller revenue
              const orderSubtotal = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
              const sellerShare = orderSubtotal > 0 ? (itemTotal / orderSubtotal) : 0;
              totalRevenue += order.sellerRevenue * sellerShare;
            } else {
              // Fallback for old orders: 95% of item total
              totalRevenue += itemTotal * 0.95;
            }
          }

          const orderDate = new Date(order.orderDate);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            monthlySales += itemTotal;
          }

          salesData[orderDate.getMonth()].sales += itemTotal;
        }
      });

      if (order.orderStatus === "processing") {
        pendingOrders++;
      } else if (order.orderStatus === "delivered") {
        deliveredOrders++;
      }
    });

    // Calculate book status breakdown
    const booksByStatus = {
      approved: books.filter(book => book.isApproved === true).length,
      pending: books.filter(book => book.isApproved === false && !book.rejectionReason).length,
      rejected: books.filter(book => book.isApproved === false && book.rejectionReason).length,
    };

    const topBooks = books.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
    const recentOrders = orders.slice(0, 5);

    // Stock alerts - Out of stock and low stock books
    const outOfStockBooks = books.filter(book => book.stock === 0 && book.isApproved === true);
    const lowStockBooks = books.filter(book => book.stock > 0 && book.stock <= 5 && book.isApproved === true);

    res.json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        totalSales,
        totalRevenue,
        monthlySales,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        salesData,
        topBooks,
        recentOrders,
        totalBooks: books.length,
        booksByStatus,
        stockAlerts: {
          outOfStock: outOfStockBooks.map(book => ({
            _id: book._id,
            title: book.title,
            coverImage: book.coverImage
          })),
          lowStock: lowStockBooks.map(book => ({
            _id: book._id,
            title: book.title,
            stock: book.stock,
            coverImage: book.coverImage
          }))
        }
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

    // Build search query conditions
    const searchConditions = [];
    if (search) {
      searchConditions.push({ title: { $regex: search, $options: "i" } });
      searchConditions.push({ author: { $regex: search, $options: "i" } });
    }

    // Filter by status
    if (status === "approved") {
      query.isApproved = true;
    } else if (status === "pending") {
      query.isApproved = false;
      query.$and = [
        {
          $or: [
            { rejectionReason: null },
            { rejectionReason: { $exists: false } }
          ]
        }
      ];
    } else if (status === "rejected") {
      query.isApproved = false;
      query.rejectionReason = { $exists: true, $ne: null };
    }

    // Add search conditions to query
    if (searchConditions.length > 0) {
      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }
    // If no status filter, show all books

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

// Helper function to map Google Books data to our format
const mapGoogleBookData = (volumeInfo, volumeId) => {
  // Extract ISBN from industryIdentifiers
  let isbn = "";
  if (volumeInfo.industryIdentifiers) {
    const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
    const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_10");
    isbn = isbn13?.identifier || isbn10?.identifier || "";
  }

  return {
    id: volumeId,
    title: volumeInfo.title || "",
    subtitle: volumeInfo.subtitle || "",
    author: volumeInfo.authors ? volumeInfo.authors.join(", ") : "",
    description: volumeInfo.description || "",
    isbn: isbn,
    publisher: volumeInfo.publisher || "",
    publishedDate: volumeInfo.publishedDate || "",
    pageCount: volumeInfo.pageCount || null,
    language: volumeInfo.language ? volumeInfo.language.toUpperCase() : "EN",
    genres: volumeInfo.categories || [],
    coverImage: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') ||
      volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:') || "",
    averageRating: volumeInfo.averageRating || null,
    ratingsCount: volumeInfo.ratingsCount || null,
  };
};

// @desc    Search books by title and/or author using Google Books API
// @route   GET /api/seller/books/search
// @access  Private (Seller)
exports.searchBooks = async (req, res) => {
  try {
    const { query, maxResults = 10 } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Call Google Books API
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes`,
      {
        params: {
          q: query,
          maxResults: Math.min(parseInt(maxResults), 40),
          key: apiKey,
          printType: 'books',
          orderBy: 'relevance'
        }
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No books found matching your search",
      });
    }

    // Map all results to our format
    const books = response.data.items.map(item =>
      mapGoogleBookData(item.volumeInfo, item.id)
    );

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books,
        totalResults: response.data.totalItems || books.length
      },
    });
  } catch (err) {
    console.error("Google Books API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error searching for books",
      error: err.message,
    });
  }
};

// @desc    Lookup book by ISBN using Google Books API
// @route   GET /api/seller/books/lookup/:isbn
// @access  Private (Seller)
exports.lookupBookByISBN = async (req, res) => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      return res.status(400).json({
        success: false,
        message: "ISBN is required",
      });
    }

    // Call Google Books API
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
    );

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No book found with this ISBN",
      });
    }

    const mappedBook = mapGoogleBookData(response.data.items[0].volumeInfo, response.data.items[0].id);

    res.json({
      success: true,
      message: "Book information retrieved successfully",
      data: { book: mappedBook },
    });
  } catch (err) {
    console.error("Google Books API Error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching book information",
      error: err.message,
    });
  }
};

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
      coverImage,
    } = req.body;

    if (!title || !author || !isbn || !price || !stock || !format) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    let finalCoverImage =
      coverImageUrl && coverImageUrl.trim() !== ""
        ? coverImageUrl.trim()
        : coverImage && coverImage.trim() !== ""
          ? coverImage.trim()
          : "https://nnpdev.wustl.edu/img/BookCovers/genericBookCover.jpg";

    // Handle book file upload if provided
    let epubFile = null;
    if (req.file) {
      console.log('📚 Book file received:', req.file.originalname);
      console.log('📤 Uploading file to Cloudinary...');
      const { uploadBookFile } = require('../config/cloudinary');
      const uploadResult = await uploadBookFile(req.file.path, {
        original_filename: req.file.originalname
      });
      epubFile = uploadResult.url;
      console.log('✅ File uploaded successfully!');
      console.log('   URL:', epubFile);

      // Clean up local file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }

    const newBook = new Book({
      title,
      author,
      description: description || "No description available",
      isbn,
      price,
      discountPrice: discountPrice || price,
      publisher: publisher || "Unknown Publisher",
      publishedDate,
      pageCount,
      language: language || "English",
      genres: Array.isArray(genres) ? genres : genres ? [genres] : ["Other"],
      condition,
      seller: req.user._id,
      stock,
      format,
      originalOwner: condition === "used" ? req.user._id : null,
      coverImage: finalCoverImage,
      epubFile: epubFile,
    });

    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book uploaded successfully and pending approval",
      data: { book: newBook },
    });
  } catch (err) {
    console.error(err);

    // Handle duplicate ISBN error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.isbn) {
      return res.status(400).json({
        success: false,
        message: "A book with this ISBN already exists in the system",
      });
    }

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
    const {
      title,
      author,
      description,
      price,
      discountPrice,
      stock,
      isAvailable,
      isbn,
      genre,
      condition,
      publicationYear,
      coverImage,
      discountPercentage,
      resubmit
    } = req.body;

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

    // Check if this is a resubmission of a rejected book
    const wasRejected = book.rejectionReason !== null && book.rejectionReason !== undefined;
    const isResubmission = resubmit === true || (wasRejected && !book.isApproved);

    // Handle book file upload if provided
    if (req.file) {
      console.log('📚 Book file received:', req.file.originalname);
      console.log('📤 Uploading file to Cloudinary...');
      const { uploadBookFile } = require('../config/cloudinary');
      const uploadResult = await uploadBookFile(req.file.path, {
        original_filename: req.file.originalname
      });
      book.epubFile = uploadResult.url;
      console.log('✅ File uploaded successfully!');
      console.log('   URL:', book.epubFile);

      // Clean up local file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }

    // Update book fields
    book.title = title || book.title;
    book.author = author || book.author;
    book.description = description || book.description;
    book.price = price || book.price;
    book.discountPrice = discountPrice || (discountPercentage ? price * (1 - discountPercentage / 100) : price) || book.discountPrice;
    book.stock = stock !== undefined ? stock : book.stock;
    book.isAvailable = isAvailable !== undefined ? isAvailable : book.isAvailable;

    // Update additional fields if provided
    if (isbn) book.isbn = isbn;
    if (genre) book.genres = Array.isArray(genre) ? genre : [genre];
    if (condition) book.condition = condition;
    if (publicationYear) book.publishedDate = new Date(publicationYear, 0, 1);
    if (coverImage) book.coverImage = coverImage;

    // Handle resubmission logic - clear rejection and set back to pending
    if (isResubmission) {
      book.rejectionReason = null;
      book.rejectionDate = null;
      book.isApproved = false; // Set to pending for admin review
      book.approvalDate = null;
    }

    await book.save();

    res.json({
      success: true,
      message: isResubmission
        ? "Book resubmitted successfully and is pending admin approval"
        : "Book updated successfully",
      data: { book, isResubmission },
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

    await Book.findByIdAndDelete(req.params.id);

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
      // Production-grade search - split terms for better matching
      const searchTerms = search.trim().split(/\s+/);
      const searchRegex = new RegExp(searchTerms.join('|'), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { description: searchRegex }
      ];
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
    const Book = require('../models/Book');

    if (!status || !["ordered", "processing", "shipped", "delivered", "cancelled", "return_requested", "returned"].includes(status)) {
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

    // **STOCK RESTORATION: Restore stock if order is being cancelled**
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
      console.log('📦 Seller cancelling order, restoring stock:', order.orderId);
      await Promise.all(
        order.items.map(async (item) => {
          const updatedBook = await Book.findByIdAndUpdate(
            item.book,
            { $inc: { stock: item.quantity } },
            { new: true }
          );
          console.log(`  ✅ Restored ${item.quantity} units to book: ${updatedBook?.title}`);
        })
      );
    }

    order.orderStatus = status;
    await order.save();

    res.json({
      success: true,
      message: status === 'cancelled'
        ? 'Order cancelled and stock restored successfully'
        : 'Order status updated successfully',
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
    const complaints = await Complaint.find({
      user: req.user._id,
      userRole: "seller"
    })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name email");

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
    const { subject, description, category } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Subject, description, and category are required",
      });
    }

    const newComplaint = new Complaint({
      subject,
      description,
      category,
      user: req.user._id,
      userRole: "seller",
      status: "pending",
      priority: "medium"
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully. Our team will review it within 24-48 hours.",
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

// @desc    Get complaint details
// @route   GET /api/seller/complaints/:id
// @access  Private (Seller)
exports.getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id,
      userRole: "seller"
    })
      .populate("assignedTo", "name email")
      .populate("comments.user", "name role")
      .populate("resolution.resolvedBy", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      message: "Complaint details retrieved successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint details",
    });
  }
};

// @desc    Add comment to complaint
// @route   POST /api/seller/complaints/:id/comment
// @access  Private (Seller)
exports.addComplaintComment = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id,
      userRole: "seller"
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.status === 'closed' || complaint.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: "Cannot add comments to closed or resolved complaints",
      });
    }

    complaint.comments.push({
      user: req.user._id,
      userRole: 'seller',
      message: message.trim()
    });

    await complaint.save();
    await complaint.populate('comments.user', 'name role');

    res.json({
      success: true,
      message: "Comment added successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
    });
  }
};

