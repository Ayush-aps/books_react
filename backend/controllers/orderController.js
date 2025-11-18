const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    const Book = require('../models/Book');
    const mongoose = require('mongoose');

    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items provided for order'
      });
    }

    // Validate and transform items
    const orderItems = [];
    const notFoundBooks = [];
    const insufficientStockBooks = [];
    const invalidBookIds = [];

    for (const item of items) {
      // Validate bookId is a valid MongoDB ObjectId
      if (!item.bookId || !mongoose.Types.ObjectId.isValid(item.bookId)) {
        invalidBookIds.push(item.bookId || 'undefined');
        continue;
      }
      
      const book = await Book.findById(item.bookId).populate('seller', '_id');
      
      if (!book) {
        notFoundBooks.push(item.bookId);
        continue;
      }
      
      if (book.stock < item.quantity) {
        insufficientStockBooks.push({
          title: book.title,
          available: book.stock,
          requested: item.quantity
        });
        continue;
      }

      orderItems.push({
        book: book._id,
        title: book.title,
        author: book.author,
        coverImage: book.coverImage,
        quantity: item.quantity,
        price: item.price,
        seller: book.seller
      });
    }

    // Check for errors
    if (invalidBookIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid book IDs found. Please refresh your cart.`,
        details: { invalidBookIds }
      });
    }
    
    if (notFoundBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some books are no longer available. Please refresh your cart.`,
        details: { notFoundBooks }
      });
    }

    if (insufficientStockBooks.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for some items`,
        details: { insufficientStockBooks }
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items to order'
      });
    }

    // Calculate total amount if not provided
    const calculatedTotal = totalAmount || orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Set payment status based on payment method
    const paymentStatus = paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed';
    
    const order = await Order.create({
      buyer: req.user.id,
      items: orderItems,
      totalAmount: calculatedTotal,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      paymentStatus: paymentStatus
    });

    // Update book stock
    await Promise.all(
      orderItems.map(async (item) => {
        await Book.findByIdAndUpdate(
          item.book,
          { $inc: { stock: -item.quantity } }
        );
      })
    );

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// @desc    Get all orders for logged in user (Buyer)
// @route   GET /api/orders/my-orders
// @access  Private (Buyer)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('items.book', 'title author coverImage condition')
      .populate('items.seller', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders for logged in seller
// @route   GET /api/orders/seller-orders
// @access  Private (Seller)
exports.getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ 'items.seller': req.user.id })
      .populate('buyer', 'name email')
      .populate('items.book', 'title author coverImage condition');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('buyer', 'name email')
      .populate('items.seller', 'name email')
      .populate('items.book', 'title author coverImage condition');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('items.seller', 'name email')
      .populate('items.book', 'title author coverImage condition');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`
      });
    }

    // Check if user is authorized to view this order
    const buyerId = order.buyer._id ? order.buyer._id.toString() : order.buyer.toString();
    if (req.user.role !== 'admin' && 
        buyerId !== req.user.id && 
        !order.items.some(item => {
          const sellerId = item.seller._id ? item.seller._id.toString() : item.seller.toString();
          return sellerId === req.user.id;
        })) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Seller/Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber, deliveryDate } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`
      });
    }

    // Check if user is authorized to update this order
    if (req.user.role !== 'admin' && 
        !order.items.some(item => item.seller.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update order status
    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    order.lastStatusUpdate = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};