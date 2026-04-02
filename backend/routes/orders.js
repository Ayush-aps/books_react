const express = require('express');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createOrder, getMyOrders, getSellerOrders, getAllOrders, getOrder, updateOrderStatus, cancelOrder, requestReturn } = require('../controllers/orderController');
const { ensureAuthenticated, ensureBuyer, ensureSeller, ensureAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/orders/create-payment-intent:
 *   post:
 *     tags: [Orders]
 *     summary: Create a Stripe PaymentIntent and get a client secret
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, items]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Total amount in INR (not paise)
 *                 example: 599
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     bookId:   { type: string }
 *                     quantity: { type: integer }
 *               shippingAddress:
 *                 $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: PaymentIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientSecret:    { type: string }
 *                     paymentIntentId: { type: string }
 *       400:
 *         description: Invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/create-payment-intent', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const { amount, items, shippingAddress } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user._id.toString(), items: JSON.stringify(items), shippingAddress: JSON.stringify(shippingAddress) }
    });
    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id } });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment intent' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress, paymentMethod]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [bookId, quantity, price]
 *                   properties:
 *                     bookId:   { type: string, description: Book ID (also accepts 'book') }
 *                     book:     { type: string, description: Alternative to bookId }
 *                     quantity: { type: integer, minimum: 1, example: 1 }
 *                     price:    { type: number, example: 299 }
 *               shippingAddress:
 *                 $ref: '#/components/schemas/Address'
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, cash_on_delivery, cod]
 *                 example: card
 *               paymentIntentId: { type: string, example: pi_xxx, description: "Required for card payments" }
 *               totalAmount:     { type: number, example: 599, description: "Auto-calculated if omitted" }
 *               subtotal:        { type: number, example: 549 }
 *               tax:             { type: number, example: 30 }
 *               shippingCost:    { type: number, example: 20 }
 *     responses:
 *       201:
 *         description: Order created and cart cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid items, insufficient stock, or invalid book IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   get:
 *     tags: [Orders]
 *     summary: List all orders — admin only
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: All orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', ensureAuthenticated, ensureBuyer, createOrder);
router.get('/', ensureAuthenticated, ensureAdmin, getAllOrders);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders placed by the current buyer
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Buyer order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/my-orders', ensureAuthenticated, ensureBuyer, getMyOrders);

/**
 * @swagger
 * /api/orders/seller-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders that include the current seller's books
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Seller order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/seller-orders', ensureAuthenticated, ensureSeller, getSellerOrders);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel an order (buyer only, within cancellation window)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/cancel', ensureAuthenticated, ensureBuyer, cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/return:
 *   put:
 *     tags: [Orders]
 *     summary: Request a return for a delivered order (buyer only, within 10 days)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: Item damaged on arrival }
 *     responses:
 *       200:
 *         description: Return requested
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Return window expired or invalid order status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/return', ensureAuthenticated, ensureBuyer, requestReturn);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update the fulfilment status of an order (seller or admin)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderStatus]
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [processing, shipped, delivered, cancelled, return_requested, returned]
 *                 example: shipped
 *               trackingNumber: { type: string, example: "TRK789" }
 *               deliveryDate:   { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Status updated (stock restored on cancel)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/status', ensureAuthenticated, async (req, res, next) => {
  if (req.user.role === 'seller' || req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied. This resource is only for sellers and administrators.' });
}, updateOrderStatus);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get details of a single order (buyer sees own; seller sees orders with their items; admin sees all)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', ensureAuthenticated, getOrder);

// Legacy view routes (server-render, not documented in API spec)
router.get('/buyer/orders', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).populate('items.book', 'title author coverImage').populate('items.seller', 'name email');
    res.render('buyer/orders', { orders });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error fetching orders');
    res.redirect('/');
  }
});

router.get('/seller/orders', ensureAuthenticated, ensureSeller, async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.user.id }).populate('buyer', 'name email').populate('items.book', 'title author coverImage');
  res.render('orders/seller-orders', { orders });
});

router.get('/admin/orders', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { status, startDate, endDate } = req.query;
  let query = {};
  if (status) query.orderStatus = status;
  if (startDate && endDate) query.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  const orders = await Order.find(query).populate('buyer', 'name email').populate('items.seller', 'name email').populate('items.book', 'title author coverImage');
  res.render('orders/admin-orders', { orders });
});

/**
 * @swagger
 * /api/orders/buyer/order/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get buyer order details (legacy view route)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Order details (rendered view)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/buyer/order/:id', ensureAuthenticated, ensureBuyer, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id }).populate('items.book', 'title author coverImage').populate('items.seller', 'name email');
    if (!order) { req.flash('error_msg', 'Order not found'); return res.redirect('/orders/buyer/orders'); }
    res.render('buyer/order-details', { title: `Order #${order.orderId} - Bookish`, order, user: req.user });
  } catch (error) {
    console.error('Error fetching order details:', error);
    req.flash('error_msg', 'Error fetching order details');
    res.redirect('/orders/buyer/orders');
  }
});

module.exports = router;