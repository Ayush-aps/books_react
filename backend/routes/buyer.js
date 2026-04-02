/**
 * Buyer Routes
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureBuyer } = require("../middleware/auth");
const { avatarUpload } = require("../middleware/upload");

const {
  getDashboard, trackBookView,
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  getCheckout,
  getAllAddresses, createAddress, updateAddress, deleteAddress,
  getProfile, updateProfile,
  getAllComplaints, createComplaint, getComplaintDetails, addComplaintComment,
  browseBooks, getBookDetails,
  getAllOrders, getOrderDetails,
  saveForLater, moveToCart, removeFromSaved,
} = require("../controllers/buyerController");

// ============================================
// DASHBOARD
// ============================================

/**
 * @swagger
 * /api/buyer/dashboard:
 *   get:
 *     tags: [Buyer]
 *     summary: Get buyer dashboard summary
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dashboard", ensureAuthenticated, ensureBuyer, getDashboard);

/**
 * @swagger
 * /api/buyer/track-view/{bookId}:
 *   post:
 *     tags: [Buyer]
 *     summary: Track a book view for recommendation analytics
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/BookIdParam'
 *     responses:
 *       200:
 *         description: View tracked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/track-view/:bookId", ensureAuthenticated, ensureBuyer, trackBookView);

// ============================================
// CART
// ============================================

/**
 * @swagger
 * /api/buyer/cart:
 *   get:
 *     tags: [Buyer]
 *     summary: Get the current user's cart
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Cart contents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/cart", ensureAuthenticated, getCart);

/**
 * @swagger
 * /api/buyer/cart/add/{bookId}:
 *   post:
 *     tags: [Buyer]
 *     summary: Add a book to the cart
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/BookIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Book added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/cart/add/:bookId", ensureAuthenticated, addToCart);

/**
 * @swagger
 * /api/buyer/cart/update/{itemId}:
 *   put:
 *     tags: [Buyer]
 *     summary: Update quantity of a cart item
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cart item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/cart/update/:itemId", ensureAuthenticated, updateCartItem);

/**
 * @swagger
 * /api/buyer/cart/remove/{itemId}:
 *   delete:
 *     tags: [Buyer]
 *     summary: Remove a single item from the cart
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/cart/remove/:itemId", ensureAuthenticated, removeFromCart);

/**
 * @swagger
 * /api/buyer/cart/clear:
 *   delete:
 *     tags: [Buyer]
 *     summary: Clear all items from the cart
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Cart cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/cart/clear", ensureAuthenticated, clearCart);

/**
 * @swagger
 * /api/buyer/cart/save-for-later/{itemId}:
 *   post:
 *     tags: [Buyer]
 *     summary: Move a cart item to "saved for later"
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item saved for later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/cart/save-for-later/:itemId", ensureAuthenticated, saveForLater);

/**
 * @swagger
 * /api/buyer/cart/move-to-cart/{itemId}:
 *   post:
 *     tags: [Buyer]
 *     summary: Move a saved item back to the active cart
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item moved to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/cart/move-to-cart/:itemId", ensureAuthenticated, moveToCart);

/**
 * @swagger
 * /api/buyer/cart/saved/{itemId}:
 *   delete:
 *     tags: [Buyer]
 *     summary: Remove an item from the saved-for-later list
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: itemId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Saved item removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/cart/saved/:itemId", ensureAuthenticated, removeFromSaved);

// ============================================
// CHECKOUT
// ============================================

/**
 * @swagger
 * /api/buyer/checkout:
 *   get:
 *     tags: [Buyer]
 *     summary: Get checkout page data (cart + saved addresses)
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Checkout data
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
router.get("/checkout", ensureAuthenticated, ensureBuyer, getCheckout);

// ============================================
// ADDRESSES
// ============================================

/**
 * @swagger
 * /api/buyer/addresses:
 *   get:
 *     tags: [Buyer]
 *     summary: List all saved delivery addresses
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Address list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     addresses:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Address' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Buyer]
 *     summary: Add a new delivery address
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/addresses", ensureAuthenticated, ensureBuyer, getAllAddresses);
router.post("/addresses", ensureAuthenticated, ensureBuyer, createAddress);

/**
 * @swagger
 * /api/buyer/addresses/{id}:
 *   put:
 *     tags: [Buyer]
 *     summary: Update a saved address
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Buyer]
 *     summary: Delete a saved address
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Address deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/addresses/:id", ensureAuthenticated, ensureBuyer, updateAddress);
router.delete("/addresses/:id", ensureAuthenticated, ensureBuyer, deleteAddress);

// ============================================
// PROFILE
// ============================================

/**
 * @swagger
 * /api/buyer/profile:
 *   get:
 *     tags: [Buyer]
 *     summary: Get buyer profile
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Buyer profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/UserSummary' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags: [Buyer]
 *     summary: Update buyer profile (supports avatar upload via multipart/form-data)
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:            { type: string, example: Jane Doe }
 *               email:           { type: string, format: email, example: jane@example.com }
 *               phone:           { type: string, example: "9876543210" }
 *               currentPassword: { type: string, format: password, description: Required when changing password }
 *               newPassword:     { type: string, format: password, minLength: 6, description: New password (min 6 chars) }
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPEG/PNG, max 2 MB)
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Current password incorrect or new password too short
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/profile", ensureAuthenticated, ensureBuyer, getProfile);
router.put("/profile", ensureAuthenticated, ensureBuyer, avatarUpload.single('avatar'), updateProfile);

// ============================================
// COMPLAINTS
// ============================================

/**
 * @swagger
 * /api/buyer/complaints:
 *   get:
 *     tags: [Buyer]
 *     summary: List all complaints raised by the buyer
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Complaint list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Buyer]
 *     summary: Create a new complaint
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, description, category]
 *             properties:
 *               subject:     { type: string, example: Wrong book received }
 *               description: { type: string, example: I ordered a new copy but received a used one. }
 *               category:    { type: string, example: Order Issue }
 *               bookId:      { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1", description: Optional book reference }
 *               orderId:     { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1", description: Optional order reference }
 *     responses:
 *       201:
 *         description: Complaint created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/complaints", ensureAuthenticated, ensureBuyer, getAllComplaints);
router.post("/complaints", ensureAuthenticated, ensureBuyer, createComplaint);

/**
 * @swagger
 * /api/buyer/complaints/{id}:
 *   get:
 *     tags: [Buyer]
 *     summary: Get details of a specific complaint
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Complaint details
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
router.get("/complaints/:id", ensureAuthenticated, ensureBuyer, getComplaintDetails);

/**
 * @swagger
 * /api/buyer/complaints/{id}/comment:
 *   post:
 *     tags: [Buyer]
 *     summary: Add a follow-up comment to a complaint
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
 *             required: [message]
 *             properties:
 *               message: { type: string, example: Still waiting for a resolution. }
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/complaints/:id/comment", ensureAuthenticated, ensureBuyer, addComplaintComment);

// ============================================
// BOOK BROWSING
// ============================================

/**
 * @swagger
 * /api/buyer/browse:
 *   get:
 *     tags: [Buyer]
 *     summary: Browse available books (authenticated view with personalisation)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *       - name: genre
 *         in: query
 *         schema: { type: string }
 *       - name: condition
 *         in: query
 *         schema: { type: string, enum: [new, like-new, good, fair] }
 *       - name: minPrice
 *         in: query
 *         schema: { type: number }
 *       - name: maxPrice
 *         in: query
 *         schema: { type: number }
 *       - name: sort
 *         in: query
 *         schema: { type: string, enum: [newest, price-asc, price-desc, rating] }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated book list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/browse", ensureAuthenticated, browseBooks);

/**
 * @swagger
 * /api/buyer/browse/{id}:
 *   get:
 *     tags: [Buyer]
 *     summary: Get book details (browse path variant)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book details
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
router.get("/browse/:id", ensureAuthenticated, getBookDetails);

/**
 * @swagger
 * /api/buyer/book/{id}:
 *   get:
 *     tags: [Buyer]
 *     summary: Get book details (canonical buyer path)
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Book details
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
router.get("/book/:id", ensureAuthenticated, getBookDetails);

// ============================================
// ORDERS
// ============================================

/**
 * @swagger
 * /api/buyer/orders:
 *   get:
 *     tags: [Buyer]
 *     summary: List all orders made by the buyer
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Order list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/orders", ensureAuthenticated, ensureBuyer, getAllOrders);

/**
 * @swagger
 * /api/buyer/orders/{id}:
 *   get:
 *     tags: [Buyer]
 *     summary: Get details of a specific buyer order
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
router.get("/orders/:id", ensureAuthenticated, ensureBuyer, getOrderDetails);

module.exports = router;
