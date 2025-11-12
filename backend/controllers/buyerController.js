/**
 * Buyer Controller
 * Handles all buyer-related operations
 */

const Order = require("../models/Order");
const Library = require("../models/Library");
const Complaint = require("../models/Complaint");
const Book = require("../models/Book");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ============================================
// DASHBOARD
// ============================================

// @desc    Get buyer dashboard data
// @route   GET /api/buyer/dashboard
// @access  Private (Buyer)
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Fetching dashboard for user:", userId);

    // Get library count
    const library = await Library.findOne({ user: userId });
    const libraryCount = library ? library.items.length : 0;
    console.log("Library count:", libraryCount);

    // Get orders
    const allOrders = await Order.find({ buyer: userId });
    console.log("Total orders found:", allOrders.length);
    
    const activeOrders = allOrders.filter((order) => ["pending", "processing", "shipped"].includes(order.status)).length;
    const completedOrders = allOrders.filter((order) => order.status === "delivered").length;
    console.log("Active orders:", activeOrders, "Completed orders:", completedOrders);

    // Get recent orders
    const recentOrders = await Order.find({ buyer: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id totalAmount status createdAt");
    console.log("Recent orders:", recentOrders.length);

    // Get complaints
    const complaints = await Complaint.find({
      user: userId,
      status: { $ne: "resolved" },
    })
      .sort({ createdAt: -1 })
      .select("_id subject status createdAt");
    console.log("Complaints found:", complaints.length);

    // Get recently viewed books
    const recentlyViewed = await Book.find({
      isApproved: true,
      isAvailable: true,
    })
      .sort({ views: -1 })
      .limit(3)
      .select("_id title author price coverImage");
    console.log("Recently viewed books:", recentlyViewed.length);

    res.json({
      libraryCount,
      activeOrders,
      completedOrders,
      recentOrders,
      complaints,
      recentlyViewed,
    });
  } catch (err) {
    console.error("Buyer dashboard error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      success: false, 
      message: "Server error loading dashboard",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// CART MANAGEMENT
// ============================================

// @desc    View shopping cart
// @route   GET /api/buyer/cart
// @access  Private (Buyer)
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage price discountPrice discountPercentage condition stock isAvailable isApproved",
    });

    if (!cart) {
      cart = { items: [], totalAmount: 0 };
    } else {
      // Filter out items where book is null or not available
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => 
        item.book && 
        item.book.isAvailable && 
        item.book.isApproved
      );

      // If items were removed, save the cart
      if (cart.items.length < originalLength) {
        await cart.save();
        console.log(`Removed ${originalLength - cart.items.length} unavailable items from cart`);
      }
    }

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
    });
  }
};

// @desc    Add book to cart
// @route   POST /api/buyer/cart/add/:bookId
// @access  Private (Buyer)
exports.addToCart = async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const bookId = req.params.bookId;

    const book = await Book.findById(bookId);

    if (!book || !book.isAvailable || !book.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Book not available",
      });
    }

    if (book.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
        totalAmount: 0,
      });
    }

    const itemIndex = cart.items.findIndex((item) => item.book.toString() === bookId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        book: bookId,
        quantity: Number(quantity),
        price: book.discountPrice || book.price,
      });
    }

    await cart.save();

    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice",
    });

    res.status(200).json({
      success: true,
      message: "Book added to cart",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding book to cart",
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/buyer/cart/update/:itemId
// @access  Private (Buyer)
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    item.quantity = Number(quantity);
    await cart.save();

    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice",
    });

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating cart",
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/buyer/cart/remove/:itemId
// @access  Private (Buyer)
exports.removeFromCart = async (req, res) => {
  try {
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items.pull(itemId);
    await cart.save();

    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice",
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
    });
  }
};

// @desc    Clear all items from cart
// @route   DELETE /api/buyer/cart/clear
// @access  Private (Buyer)
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
    });
  }
};

// ============================================
// CHECKOUT
// ============================================

// @desc    Get checkout data
// @route   GET /api/buyer/checkout
// @access  Private (Buyer)
exports.getCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage price discountPrice condition stock seller",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    let outOfStock = [];
    cart.items.forEach((item) => {
      if (item.book.stock < item.quantity) {
        outOfStock.push(item.book.title);
      }
    });

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following items are out of stock: ${outOfStock.join(", ")}`,
      });
    }

    const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    const shipping = 50;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const defaultAddress = await Address.findOne({
      user: req.user._id,
      isDefault: true,
    });

    res.status(200).json({
      success: true,
      data: {
        cart,
        subtotal,
        shipping,
        tax,
        total,
        defaultAddress,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading checkout page",
    });
  }
};

// ============================================
// ADDRESS MANAGEMENT
// ============================================

// @desc    Get all addresses for logged-in buyer
// @route   GET /api/buyer/addresses
// @access  Private (Buyer)
exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      message: "Addresses retrieved successfully",
      data: { addresses },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching addresses",
    });
  }
};

// @desc    Create a new address
// @route   POST /api/buyer/addresses
// @access  Private (Buyer)
exports.createAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const address = new Address({
      user: req.user._id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
    });

    await address.save();

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: { address },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating address",
    });
  }
};

// @desc    Update an address
// @route   PUT /api/buyer/addresses/:id
// @access  Private (Buyer)
exports.updateAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { $set: { isDefault: false } });
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2;
    address.city = city || address.city;
    address.state = state || address.state;
    address.pincode = pincode || address.pincode;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: { address },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating address",
    });
  }
};

// @desc    Delete an address
// @route   DELETE /api/buyer/addresses/:id
// @access  Private (Buyer)
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (address.isDefault) {
      const newDefault = await Address.findOne({ user: req.user._id });
      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save();
      }
    }

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting address",
    });
  }
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

// @desc    Get buyer profile
// @route   GET /api/buyer/profile
// @access  Private (Buyer)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

// @desc    Update buyer profile
// @route   PUT /api/buyer/profile
// @access  Private (Buyer)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

// ============================================
// COMPLAINT MANAGEMENT
// ============================================

// @desc    Get all complaints filed by buyer
// @route   GET /api/buyer/complaints
// @access  Private (Buyer)
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("book", "title coverImage");

    res.json({
      success: true,
      message: "Complaints retrieved successfully",
      data: { complaints },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
    });
  }
};

// @desc    File a new complaint
// @route   POST /api/buyer/complaints
// @access  Private (Buyer)
exports.createComplaint = async (req, res) => {
  try {
    const { subject, description, category, bookId, orderId } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide subject, description, and category",
      });
    }

    const complaint = new Complaint({
      user: req.user._id,
      subject,
      description,
      category,
      book: bookId || null,
      order: orderId || null,
      status: "pending",
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint filed successfully",
      data: { complaint },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error filing complaint",
    });
  }
};

// @desc    Get complaint details
// @route   GET /api/buyer/complaints/:id
// @access  Private (Buyer)
exports.getComplaintDetails = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("book", "title coverImage")
      .populate("order", "orderNumber totalAmount");

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

// ============================================
// BOOK BROWSING
// ============================================

// @desc    Browse books with search and filter
// @route   GET /api/buyer/browse
// @access  Private (Buyer)
exports.browseBooks = async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort } = req.query;

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

    if (minPrice || maxPrice) {
      const priceQuery = [];

      const regularPriceQuery = { discountPrice: { $exists: false } };
      if (minPrice) regularPriceQuery.price = { $gte: Number(minPrice) };
      if (maxPrice) regularPriceQuery.price = { ...regularPriceQuery.price, $lte: Number(maxPrice) };

      const discountPriceQuery = { discountPrice: { $exists: true } };
      if (minPrice) discountPriceQuery.discountPrice = { $gte: Number(minPrice) };
      if (maxPrice) discountPriceQuery.discountPrice = { ...discountPriceQuery.discountPrice, $lte: Number(maxPrice) };

      priceQuery.push(regularPriceQuery, discountPriceQuery);
      query.$or = priceQuery;
    }

    const genres = await Book.distinct("genres");

    let books = [];

    if (sort === "price-asc" || sort === "price-desc") {
      const sortOrder = sort === "price-asc" ? 1 : -1;

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
      ];

      books = await Book.aggregate(pipeline);
    } else {
      let sortOption = {};
      if (sort === "newest") {
        sortOption = { createdAt: -1 };
      } else if (sort === "rating") {
        sortOption = { rating: -1 };
      } else {
        sortOption = { createdAt: -1 };
      }

      books = await Book.find(query).sort(sortOption).populate("seller", "name").populate("originalOwner", "name");
    }

    res.status(200).json({
      success: true,
      data: {
        books,
        genres,
        filters: { search, genre, condition, minPrice, maxPrice, sort },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
    });
  }
};

// @desc    View book details
// @route   GET /api/buyer/browse/:id
// @access  Private (Buyer)
exports.getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("seller", "name").populate("originalOwner", "name");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const recommendedBooks = await Book.find({
      _id: { $ne: book._id },
      genres: { $in: book.genres },
      isApproved: true,
      isAvailable: true,
    })
      .limit(4)
      .populate("seller", "name");

    res.status(200).json({
      success: true,
      data: {
        book,
        recommendedBooks,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching book details",
    });
  }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

// @desc    Get all orders for the buyer
// @route   GET /api/buyer/orders
// @access  Private (Buyer)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.book", "title author coverImage condition")
      .populate("items.seller", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: { orders },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

// @desc    View order details
// @route   GET /api/buyer/orders/:id
// @access  Private (Buyer)
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user._id,
    })
      .populate("items.book", "title author coverImage condition")
      .populate("items.seller", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order details retrieved successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order details",
    });
  }
};

