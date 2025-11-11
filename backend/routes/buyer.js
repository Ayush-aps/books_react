/**
 * Buyer API routes - Converted from EJS to JSON API
 * This file demonstrates the pattern for converting all buyer routes
 */

const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Subscription = require("../models/Subscription");
const Library = require("../models/Library");
const BookVideo = require("../models/BookVideo");
const VideoComment = require('../models/VideoComment');
const User = require('../models/User');
const Address = require('../models/Address');
const Complaint = require('../models/Complaint');
const { ensureAuthenticated, ensureBuyer } = require("../middleware/auth");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * @route   GET /api/buyer/dashboard
 * @desc    Get buyer dashboard data
 * @access  Private (Buyer)
 */
router.get("/dashboard", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get library count
    const library = await Library.findOne({ user: userId });
    const libraryCount = library ? library.books.length : 0;

    // Get orders summary
    const allOrders = await Order.find({ buyer: userId });
    const activeOrders = allOrders.filter(order => 
      ['pending', 'processing', 'shipped'].includes(order.status)
    ).length;
    const completedOrders = allOrders.filter(order => 
      order.status === 'delivered'
    ).length;

    // Get recent orders (last 5)
    const recentOrders = await Order.find({ buyer: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id total status createdAt');

    // Get open complaints
    const complaints = await Complaint.find({ 
      user: userId, 
      status: { $ne: 'resolved' } 
    })
      .sort({ createdAt: -1 })
      .select('_id subject status createdAt');

    // Get recently viewed books (you might want to track this separately)
    // For now, return random popular books
    const recentlyViewed = await Book.find({ 
      isApproved: true, 
      isAvailable: true 
    })
      .sort({ views: -1 })
      .limit(3)
      .select('_id title author price coverImage');

    res.json({
      libraryCount,
      activeOrders,
      completedOrders,
      recentOrders,
      complaints,
      recentlyViewed
    });
  } catch (err) {
    console.error('Buyer dashboard error:', err);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
});

/**
 * @route   GET /api/buyer/browse
 * @desc    Browse books with search and filter
 * @access  Private (Buyer)
 */
router.get("/browse", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { search, genre, condition, minPrice, maxPrice, sort } = req.query;

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
      
      const regularPriceQuery = { discountPrice: { $exists: false } };
      if (minPrice) regularPriceQuery.price = { $gte: Number(minPrice) };
      if (maxPrice) regularPriceQuery.price = { ...regularPriceQuery.price, $lte: Number(maxPrice) };
      
      const discountPriceQuery = { discountPrice: { $exists: true } };
      if (minPrice) discountPriceQuery.discountPrice = { $gte: Number(minPrice) };
      if (maxPrice) discountPriceQuery.discountPrice = { ...discountPriceQuery.discountPrice, $lte: Number(maxPrice) };
      
      priceQuery.push(regularPriceQuery, discountPriceQuery);
      query.$or = priceQuery;
    }

    // Get all genres for filter
    const genres = await Book.distinct("genres");

    let books = [];
    
    if (sort === "price-asc" || sort === "price-desc") {
      const sortOrder = sort === "price-asc" ? 1 : -1;
      
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
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true
          }
        }
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
      
      books = await Book.find(query)
        .sort(sortOption)
        .populate("seller", "name")
        .populate("originalOwner", "name");
    }

    res.status(200).json({
      success: true,
      data: {
        books,
        genres,
        filters: { search, genre, condition, minPrice, maxPrice, sort }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching books"
    });
  }
});

/**
 * @route   GET /api/buyer/book/:id
 * @desc    View book details
 * @access  Private (Buyer)
 */
router.get("/book/:id", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("seller", "name")
      .populate("originalOwner", "name");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Get recommended books
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
        recommendedBooks
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching book details"
    });
  }
});

/**
 * @route   GET /api/buyer/cart
 * @desc    View shopping cart
 * @access  Private (Buyer)
 */
router.get("/cart", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage price discountPrice condition stock",
    });

    if (!cart) {
      cart = { items: [], totalAmount: 0 };
    }

    res.status(200).json({
      success: true,
      data: { cart }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching cart"
    });
  }
});

/**
 * @route   POST /api/buyer/cart/add/:bookId
 * @desc    Add book to cart
 * @access  Private (Buyer)
 */
router.post("/cart/add/:bookId", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const bookId = req.params.bookId;

    // Find book
    const book = await Book.findById(bookId);

    if (!book || !book.isAvailable || !book.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Book not available"
      });
    }

    // Check stock
    if (book.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available"
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
        totalAmount: 0,
      });
    }

    // Check if book already in cart
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

    // Populate cart items before sending response
    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice"
    });

    res.status(200).json({
      success: true,
      message: "Book added to cart",
      data: { cart }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error adding book to cart"
    });
  }
});

/**
 * @route   PUT /api/buyer/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private (Buyer)
 */
router.put("/cart/update/:itemId", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    item.quantity = Number(quantity);
    await cart.save();

    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice"
    });

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: { cart }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating cart"
    });
  }
});

/**
 * @route   DELETE /api/buyer/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private (Buyer)
 */
router.delete("/cart/remove/:itemId", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const itemId = req.params.itemId;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items.pull(itemId);
    await cart.save();

    await cart.populate({
      path: "items.book",
      select: "title author coverImage price discountPrice"
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: { cart }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error removing item from cart"
    });
  }
});

/**
 * @route   DELETE /api/buyer/cart/clear
 * @desc    Clear all items from cart
 * @access  Private (Buyer)
 */
router.delete("/cart/clear", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }
    
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: { cart }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error clearing cart"
    });
  }
});

/**
 * @route   GET /api/buyer/checkout
 * @desc    Get checkout data
 * @access  Private (Buyer)
 */
router.get("/checkout", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.book",
      select: "title author coverImage price discountPrice condition stock seller",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty"
      });
    }

    // Check stock
    let outOfStock = [];
    cart.items.forEach(item => {
      if (item.book.stock < item.quantity) {
        outOfStock.push(item.book.title);
      }
    });

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following items are out of stock: ${outOfStock.join(', ')}`
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 50;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    // Get default address
    const defaultAddress = await Address.findOne({ 
      user: req.user._id,
      isDefault: true 
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
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error loading checkout page"
    });
  }
});

/**
 * @route   GET /api/buyer/addresses
 * @desc    Get all addresses for logged-in buyer
 * @access  Private (Buyer)
 */
router.get("/addresses", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      message: "Addresses retrieved successfully",
      data: { addresses }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching addresses"
    });
  }
});

/**
 * @route   POST /api/buyer/addresses
 * @desc    Create a new address
 * @access  Private (Buyer)
 */
router.post("/addresses", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    // If this is set as default, unset all other defaults
    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
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
      isDefault: isDefault || false
    });

    await address.save();

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: { address }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating address"
    });
  }
});

/**
 * @route   PUT /api/buyer/addresses/:id
 * @desc    Update an address
 * @access  Private (Buyer)
 */
router.put("/addresses/:id", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // If this is set as default, unset all other defaults
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: req.params.id } },
        { $set: { isDefault: false } }
      );
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
      data: { address }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating address"
    });
  }
});

/**
 * @route   DELETE /api/buyer/addresses/:id
 * @desc    Delete an address
 * @access  Private (Buyer)
 */
router.delete("/addresses/:id", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const newDefault = await Address.findOne({ user: req.user._id });
      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save();
      }
    }

    res.json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error deleting address"
    });
  }
});

/**
 * @route   GET /api/buyer/profile
 * @desc    Get buyer profile
 * @access  Private (Buyer)
 */
router.get("/profile", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile"
    });
  }
});

/**
 * @route   PUT /api/buyer/profile
 * @desc    Update buyer profile
 * @access  Private (Buyer)
 */
router.put("/profile", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update basic fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error updating profile"
    });
  }
});

/**
 * @route   GET /api/buyer/complaints
 * @desc    Get all complaints filed by buyer
 * @access  Private (Buyer)
 */
router.get("/complaints", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('book', 'title coverImage');

    res.json({
      success: true,
      message: "Complaints retrieved successfully",
      data: { complaints }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints"
    });
  }
});

/**
 * @route   POST /api/buyer/complaints
 * @desc    File a new complaint
 * @access  Private (Buyer)
 */
router.post("/complaints", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { subject, description, category, bookId, orderId } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide subject, description, and category"
      });
    }

    const complaint = new Complaint({
      user: req.user._id,
      subject,
      description,
      category,
      book: bookId || null,
      order: orderId || null,
      status: 'pending'
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint filed successfully",
      data: { complaint }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error filing complaint"
    });
  }
});

/**
 * @route   GET /api/buyer/complaints/:id
 * @desc    Get complaint details
 * @access  Private (Buyer)
 */
router.get("/complaints/:id", ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('book', 'title coverImage')
      .populate('order', 'orderNumber totalAmount');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.json({
      success: true,
      message: "Complaint details retrieved successfully",
      data: { complaint }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint details"
    });
  }
});

module.exports = router;
