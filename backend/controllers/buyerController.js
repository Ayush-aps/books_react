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

    const activeOrders = allOrders.filter((order) => {
      const orderStatus = order.orderStatus || order.status;
      return ["ordered", "pending", "processing", "shipped"].includes(orderStatus);
    }).length;
    const completedOrders = allOrders.filter((order) => {
      const orderStatus = order.orderStatus || order.status;
      return orderStatus === "delivered";
    }).length;
    console.log("Active orders:", activeOrders, "Completed orders:", completedOrders);

    // Get recent orders
    const recentOrders = await Order.find({ buyer: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id orderId totalAmount status orderStatus createdAt");
    console.log("Recent orders:", recentOrders.length);

    // Get complaints
    const complaints = await Complaint.find({
      user: userId,
      status: { $ne: "resolved" },
    })
      .sort({ createdAt: -1 })
      .select("_id subject status createdAt");
    console.log("Complaints found:", complaints.length);

    // Get recently viewed books - user's actual viewed books
    const user = await User.findById(userId).populate({
      path: 'recentlyViewed.book',
      select: '_id title author price coverImage',
      match: { isApproved: true, isAvailable: true }
    });

    // Extract books from recentlyViewed array, filter out nulls (deleted books)
    // Handle case where recentlyViewed might not exist for existing users
    const recentlyViewed = (user.recentlyViewed || [])
      .map(item => item && item.book ? item.book : null)
      .filter(book => book !== null) // Remove deleted books
      .slice(0, 3); // Get only the 3 most recent
    console.log("Recently viewed books:", recentlyViewed.length);

    // Transform recentOrders to include 'total' field for frontend compatibility
    const transformedRecentOrders = recentOrders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      total: order.totalAmount,
      status: order.status,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt
    }));

    res.json({
      libraryCount,
      activeOrders,
      completedOrders,
      recentOrders: transformedRecentOrders,
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

// @desc    Track book view
// @route   POST /api/buyer/track-view/:bookId
// @access  Private (Buyer)
exports.trackBookView = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookId = req.params.bookId;

    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Get user and update recently viewed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove existing entry for this book if it exists
    user.recentlyViewed = user.recentlyViewed.filter(
      item => item.book && item.book.toString() !== bookId
    );

    // Add to beginning of array (most recent first)
    user.recentlyViewed.unshift({
      book: bookId,
      viewedAt: new Date()
    });

    // Keep only last 20 viewed books
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    await user.save();

    res.json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (err) {
    console.error('Error tracking book view:', err);
    res.status(500).json({
      success: false,
      message: 'Error tracking book view',
      error: err.message
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
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.book",
        select: "title author coverImage price discountPrice discountPercentage condition stock isAvailable isApproved",
      })
      .populate({
        path: "savedItems.book",
        select: "title author coverImage price discountPrice discountPercentage condition stock isAvailable isApproved",
      });

    if (!cart) {
      cart = { items: [], savedItems: [], totalAmount: 0 };
    } else {
      // Filter out items where book is null or not available
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item =>
        item.book &&
        item.book.isAvailable &&
        item.book.isApproved
      );

      // Filter out saved items where book is null
      if (cart.savedItems) {
        cart.savedItems = cart.savedItems.filter(item => item.book);
      } else {
        cart.savedItems = [];
      }

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

// @desc    Save item for later
// @route   POST /api/buyer/cart/save-for-later/:itemId
// @access  Private (Buyer)
exports.saveForLater = async (req, res) => {
  try {
    const id = req.params.itemId; // Could be cart item ID or Book ID
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
        savedItems: [],
        totalAmount: 0
      });
    }

    // 1. Try to find item in cart by Item ID
    let itemIndex = cart.items.findIndex(item => item._id.toString() === id);

    // 2. If not found, try to find item in cart by Book ID
    if (itemIndex === -1) {
      itemIndex = cart.items.findIndex(item => item.book.toString() === id);
    }

    if (itemIndex !== -1) {
      // Found in cart, move to saved
      const item = cart.items[itemIndex];

      // Check if already in saved (by book ID) to avoid duplicates
      const savedIndex = cart.savedItems.findIndex(saved => saved.book.toString() === item.book.toString());

      if (savedIndex === -1) {
        cart.savedItems.push(item);
      }

      // Remove from cart
      cart.items.splice(itemIndex, 1);
    } else {
      // 3. Not in cart. Check if it's a valid Book ID to add directly to saved

      // Check if already in saved
      const savedIndex = cart.savedItems.findIndex(saved => saved.book.toString() === id);

      if (savedIndex === -1) {
        // Verify it's a book
        const book = await Book.findById(id);
        if (book) {
          cart.savedItems.push({
            book: book._id,
            quantity: 1,
            price: book.discountPrice || book.price
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Item or Book not found",
          });
        }
      }
      // If already in saved, we just return success
    }

    await cart.save();

    await cart.populate([
      {
        path: "items.book",
        select: "title author coverImage price discountPrice",
      },
      {
        path: "savedItems.book",
        select: "title author coverImage price discountPrice",
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Item saved for later",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error saving item for later",
    });
  }
};

// @desc    Move item back to cart
// @route   POST /api/buyer/cart/move-to-cart/:itemId
// @access  Private (Buyer)
exports.moveToCart = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.savedItems.findIndex(item => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in saved list",
      });
    }

    const item = cart.savedItems[itemIndex];

    // Check if item already exists in cart
    const existingCartItemIndex = cart.items.findIndex(cartItem =>
      cartItem.book.toString() === item.book.toString()
    );

    if (existingCartItemIndex > -1) {
      cart.items[existingCartItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    cart.savedItems.splice(itemIndex, 1);

    await cart.save();

    await cart.populate([
      {
        path: "items.book",
        select: "title author coverImage price discountPrice",
      },
      {
        path: "savedItems.book",
        select: "title author coverImage price discountPrice",
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Item moved to cart",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error moving item to cart",
    });
  }
};

// @desc    Remove item from saved list
// @route   DELETE /api/buyer/cart/saved/:itemId
// @access  Private (Buyer)
exports.removeFromSaved = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.savedItems.pull(itemId);
    await cart.save();

    await cart.populate([
      {
        path: "items.book",
        select: "title author coverImage price discountPrice",
      },
      {
        path: "savedItems.book",
        select: "title author coverImage price discountPrice",
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Item removed from saved list",
      data: { cart },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error removing item from saved list",
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
    console.log('Creating address with data:', req.body);
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const addressData = {
      user: req.user._id,
      name: fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault: isDefault || false,
    };

    console.log('Address data to save:', addressData);

    const address = await Address.create(addressData);

    console.log('Address created successfully:', address._id);

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (err) {
    console.error('Error creating address:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: err.message || "Error creating address",
    });
  }
};

// @desc    Update an address
// @route   PUT /api/buyer/addresses/:id
// @access  Private (Buyer)
exports.updateAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, zipCode, isDefault } = req.body;

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

    // Update fields - map frontend fields to model fields
    address.name = fullName || address.name;
    address.phone = phone || address.phone;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Error updating address",
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

    console.log('Update profile request:', { 
      name, 
      email, 
      phone, 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      hasFile: !!req.file 
    });

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update basic fields
    if (name && name.trim() !== '') user.name = name;
    if (email && email.trim() !== '') user.email = email;
    if (phone !== undefined) user.phone = phone; // Allow empty string to clear phone

    // Handle avatar upload if file was provided
    if (req.file) {
      console.log('Avatar uploaded:', req.file.filename);
      // Delete old avatar if it's not the default
      if (user.avatar && user.avatar !== '/img/users/default-avatar.jpg') {
        const fs = require('fs');
        const path = require('path');
        const oldAvatarPath = path.join(__dirname, '../public', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      user.avatar = `/img/users/${req.file.filename}`;
    }

    // Only check password if both currentPassword and newPassword are provided and not empty
    if (currentPassword && newPassword && 
        currentPassword.trim() !== '' && newPassword.trim() !== '') {
      
      console.log('Attempting password change...');
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        console.log('Current password incorrect');
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      // Set the plain password - the pre-save hook will hash it automatically
      user.password = newPassword;
      console.log('Password will be changed');
    }

    await user.save();
    console.log('User saved successfully');

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
    const complaints = await Complaint.find({ 
      user: req.user._id, 
      userRole: 'buyer' 
    })
    .sort({ createdAt: -1 })
    .populate("book", "title coverImage")
    .populate("order", "totalAmount createdAt")
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
      userRole: 'buyer',
      subject,
      description,
      category,
      book: bookId || null,
      order: orderId || null,
      status: "pending",
      priority: 'medium'
    });

    await complaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint filed successfully. Our team will review it within 24-48 hours.",
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
      userRole: 'buyer'
    })
      .populate("book", "title coverImage author")
      .populate({
        path: "order",
        select: "totalAmount createdAt _id",
        populate: {
          path: "items.seller",
          select: "name email"
        }
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
// @route   POST /api/buyer/complaints/:id/comment
// @access  Private (Buyer)
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
      userRole: 'buyer'
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
      userRole: 'buyer',
      message: message.trim()
    });

    await complaint.save();

    // Populate the new comment
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
    const andConditions = [];

    // Production-grade search with regex for flexible matching
    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      const searchRegex = new RegExp(searchTerms.join('|'), 'i');
      
      andConditions.push({
        $or: [
          { title: searchRegex },
          { author: searchRegex },
          { description: searchRegex }
        ]
      });
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
      andConditions.push({ $or: priceQuery });
    }

    // Combine all $and conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Get all distinct genres and normalize them
    const rawGenres = await Book.distinct("genres");
    
    // Normalize genres: remove quotes, trim, capitalize properly, and deduplicate
    const genreMap = new Map();
    
    rawGenres.forEach(genre => {
      if (!genre || typeof genre !== 'string') return;
      
      // Remove quotes (both single and double) and trim whitespace
      let normalized = genre.replace(/^["']|["']$/g, '').trim();
      
      // Skip empty strings
      if (!normalized) return;
      
      // Create a key for case-insensitive comparison
      const key = normalized.toLowerCase();
      
      // If we haven't seen this genre yet, or if the current one is better formatted
      // (has proper capitalization), use it
      if (!genreMap.has(key)) {
        // Capitalize first letter of each word
        normalized = normalized.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        genreMap.set(key, normalized);
      } else {
        // If we already have this genre, prefer the one with proper capitalization
        const existing = genreMap.get(key);
        // Check if current is better formatted (has capital letters)
        if (normalized !== normalized.toLowerCase() && existing === existing.toLowerCase()) {
          normalized = normalized.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          genreMap.set(key, normalized);
        }
      }
    });
    
    // Convert map values to array and sort alphabetically
    const genres = Array.from(genreMap.values()).sort();

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
        pagination: {
          totalBooks: books.length,
          currentPage: 1,
          totalPages: 1,
          limit: books.length
        }
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
      .sort({ $natural: -1 }); // Sort by insertion order (newest first)

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

