const Order = require('../models/Order');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount, paymentIntentId, subtotal, tax, shippingCost } = req.body;
    const Book = require('../models/Book');
    const Cart = require('../models/Cart');
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
      // Support both bookId and book field
      const bookId = item.bookId || item.book;

      // Validate bookId is a valid MongoDB ObjectId
      if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
        invalidBookIds.push(bookId || 'undefined');
        continue;
      }

      const book = await Book.findById(bookId).populate('seller', '_id name email');

      if (!book) {
        notFoundBooks.push(bookId);
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
        seller: book.seller._id
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
    const paymentStatus = paymentMethod === 'cash_on_delivery' || paymentMethod === 'cod' ? 'pending' : 'completed';

    // Prepare order data
    const orderData = {
      buyer: req.user.id,
      items: orderItems,
      totalAmount: calculatedTotal,
      subtotal: subtotal || orderItems.reduce((t, item) => t + (item.price * item.quantity), 0),
      tax: tax || 0,
      shippingCost: shippingCost || 0,
      shippingAddress,
      paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : paymentMethod,
      paymentStatus: paymentStatus,
      orderStatus: 'processing',
      status: 'processing'
    };

    // Add payment details if Stripe payment
    if (paymentIntentId) {
      orderData.paymentDetails = {
        paymentId: paymentIntentId,
        amount: calculatedTotal,
        status: 'completed'
      };
    }

    const order = await Order.create(orderData);

    // Update book stock and check for low/out of stock
    const lowStockNotifications = [];
    const outOfStockNotifications = [];

    await Promise.all(
      orderItems.map(async (item) => {
        const updatedBook = await Book.findByIdAndUpdate(
          item.book,
          {
            $inc: {
              stock: -item.quantity
            }
          },
          { new: true }
        ).populate('seller', '_id name email');

        // Check stock levels after update
        if (updatedBook) {
          if (updatedBook.stock === 0) {
            outOfStockNotifications.push({
              bookId: updatedBook._id,
              bookTitle: updatedBook.title,
              sellerId: updatedBook.seller._id,
              sellerName: updatedBook.seller.name,
              sellerEmail: updatedBook.seller.email
            });
          } else if (updatedBook.stock <= 5 && updatedBook.stock > 0) {
            lowStockNotifications.push({
              bookId: updatedBook._id,
              bookTitle: updatedBook.title,
              currentStock: updatedBook.stock,
              sellerId: updatedBook.seller._id,
              sellerName: updatedBook.seller.name,
              sellerEmail: updatedBook.seller.email
            });
          }
        }
      })
    );

    // Log stock notifications (in production, send emails/notifications)
    if (outOfStockNotifications.length > 0) {
      console.log('⚠️ OUT OF STOCK ALERT:', outOfStockNotifications);
      // TODO: Send email/notification to sellers and admin
    }

    if (lowStockNotifications.length > 0) {
      console.log('⚠️ LOW STOCK WARNING:', lowStockNotifications);
      // TODO: Send email/notification to sellers and admin
    }

    // Clear buyer's cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [], savedForLater: [] } }
    );

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name email')
      .populate('items.book', 'title author coverImage')
      .populate('items.seller', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrder
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
    const Book = require('../models/Book');

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

    // **STOCK RESTORATION: Restore stock if order is being cancelled**
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      console.log('📦 Restoring stock for cancelled order:', order.orderId);
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

    // Update order status
    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    order.lastStatusUpdate = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
      message: orderStatus === 'cancelled'
        ? 'Order cancelled and stock restored successfully'
        : 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel order (Buyer)
// @route   PUT /api/orders/:id/cancel
// @access  Private (Buyer)
exports.cancelOrder = async (req, res, next) => {
  try {
    const Book = require('../models/Book');
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if buyer owns this order
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only allow cancellation if order is not shipped or delivered
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered. Please request a return instead.'
      });
    }

    // Already cancelled
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Restore stock
    console.log('📦 Buyer cancelling order, restoring stock:', order.orderId);
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

    // Update order status
    order.orderStatus = 'cancelled';
    order.lastStatusUpdate = Date.now();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Request return for delivered order (Buyer)
// @route   PUT /api/orders/:id/return
// @access  Private (Buyer)
exports.requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if buyer owns this order
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to request return for this order'
      });
    }

    // Only allow return request for delivered orders
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only request return for delivered orders'
      });
    }

    // Check if already requested
    if (order.orderStatus === 'return_requested' || order.orderStatus === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Return already requested for this order'
      });
    }

    // **10-DAY RETURN WINDOW: Check if order was delivered within last 10 days**
    if (order.deliveryDate) {
      const deliveryDate = new Date(order.deliveryDate);
      const currentDate = new Date();
      const daysSinceDelivery = Math.floor((currentDate - deliveryDate) / (1000 * 60 * 60 * 24));

      if (daysSinceDelivery > 10) {
        return res.status(400).json({
          success: false,
          message: `Return window has expired. Returns are only allowed within 10 days of delivery. This order was delivered ${daysSinceDelivery} days ago.`
        });
      }
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for return'
      });
    }

    // Update order with return request
    order.orderStatus = 'return_requested';
    order.returnRequest = {
      requestedAt: Date.now(),
      reason: reason.trim(),
      status: 'pending'
    };
    order.lastStatusUpdate = Date.now();

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully. Admin will review your request.',
      data: order
    });
  } catch (error) {
    console.error('Request return error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};