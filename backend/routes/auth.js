/**
 * Authentication API routes — register, login, logout, session check
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../middleware/auth");
const {
  register,
  login,
  logout,
  getMe,
  checkAuth,
} = require("../controllers/authController");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, password2, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "secret123"
 *               password2:
 *                 type: string
 *                 format: password
 *                 example: "secret123"
 *               role:
 *                 type: string
 *                 enum: [buyer, seller, employee]
 *                 example: buyer
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error (duplicate email, password mismatch, invalid role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg: { type: string }
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive a session cookie
 *     description: >
 *       On success the server sets the `bookish.sid` cookie.
 *       All subsequent requests from Swagger UI will carry it automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@bookish.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin@123"
 *     responses:
 *       200:
 *         description: Login successful — session cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Login successful }
 *                 user:
 *                   $ref: '#/components/schemas/UserSummary'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Destroy the current session
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's full profile
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:
 *                   $ref: '#/components/schemas/UserSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", ensureAuthenticated, getMe);

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     tags: [Auth]
 *     summary: Check whether the current browser session is authenticated
 *     description: >
 *       Returns `authenticated: true` and a fresh user object when the
 *       `bookish.sid` cookie resolves to a valid session; returns
 *       `authenticated: false` with `user: null` when not logged in.
 *       This endpoint never returns 401 — it is always safe to call.
 *     responses:
 *       200:
 *         description: Auth status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:       { type: boolean, example: true }
 *                 authenticated: { type: boolean, example: true }
 *                 user:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/UserSummary'
 *                     - type: 'null'
 */
router.get("/check", checkAuth);

module.exports = router;
