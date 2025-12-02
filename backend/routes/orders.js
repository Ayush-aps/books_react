const express = require('express');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  requestReturn
} = require('../controllers/orderController');

const {
  ensureAuthenticated,
  ensureBuyer,
  ensureSeller,
  ensureAdmin
} = require('../middleware/auth');

const router = express.Router();

// API Routes
// Buyer routes
router.post('/create-payment-intent', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { amount, items, shippingAddress } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in paise (INR smallest unit)
      currency: 'inr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user._id.toString(),
        items: JSON.stringify(items),
        shippingAddress: JSON.stringify(shippingAddress)
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
});

router.post('/', ensureAuthenticated, ensureBuyer, createOrder);
router.get('/my-orders', ensureAuthenticated, ensureBuyer, getMyOrders);

// Buyer cancellation and return routes
router.put('/:id/cancel', ensureAuthenticated, ensureBuyer, cancelOrder);
router.put('/:id/return', ensureAuthenticated, ensureBuyer, requestReturn);

// Seller routes
router.get('/seller-orders', ensureAuthenticated, ensureSeller, getSellerOrders);

// Admin routes
router.get('/', ensureAuthenticated, ensureAdmin, getAllOrders);

// Common routes (accessible by buyer, seller, and admin)
router.get('/:id', ensureAuthenticated, getOrder);

// Update order status - accessible by seller and admin
router.put('/:id/status', ensureAuthenticated, async (req, res, next) => {
  if (req.user.role === 'seller' || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. This resource is only for sellers and administrators.'
  });
}, updateOrderStatus);

// View Routes
// Buyer view
router.get('/buyer/orders', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('items.book', 'title author coverImage')
      .populate('items.seller', 'name email');

    res.render('buyer/orders', { orders });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error fetching orders');
    res.redirect('/');
  }
});

// Seller view
router.get('/seller/orders', ensureAuthenticated, ensureSeller, async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.user.id })
    .populate('buyer', 'name email')
    .populate('items.book', 'title author coverImage');

  res.render('orders/seller-orders', { orders });
});

// Admin view
router.get('/admin/orders', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { status, startDate, endDate } = req.query;
  let query = {};

  if (status) {
    query.orderStatus = status;
  }

  if (startDate && endDate) {
    query.orderDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const orders = await Order.find(query)
    .populate('buyer', 'name email')
    .populate('items.seller', 'name email')
    .populate('items.book', 'title author coverImage');

  res.render('orders/admin-orders', { orders });
});

/**
 * @route   GET /orders/buyer/order/:id
 * @desc    View order details
 * @access  Private (Buyer)
 */
router.get('/buyer/order/:id', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    console.log('Fetching order details for ID:', req.params.id); // Debug log

    const order = await Order.findOne({
      _id: req.params.id,
      buyer: req.user._id
    })
      .populate('items.book', 'title author coverImage')
      .populate('items.seller', 'name email');

    if (!order) {
      console.log('Order not found'); // Debug log
      req.flash('error_msg', 'Order not found');
      return res.redirect('/orders/buyer/orders');
    }

    console.log('Order found:', {
      id: order._id,
      shippingAddress: order.shippingAddress,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate
    }); // Debug log

    res.render('buyer/order-details', {
      title: `Order #${order.orderId} - Bookish`,
      order,
      user: req.user
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    req.flash('error_msg', 'Error fetching order details');
    res.redirect('/orders/buyer/orders');
  }
});

module.exports = router;