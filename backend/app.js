/**
 * Bookish - Online Book Marketplace
 * Backend API Server
 */

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const passport = require("passport");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const buyerRoutes = require("./routes/buyer");
const sellerRoutes = require("./routes/seller");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const { router: subscriptionRouter } = require('./routes/subscription');
const libraryRouter = require('./routes/library');
const videosRouter = require('./routes/videos');
const ordersRoutes = require("./routes/orders");
const reviewsRoutes = require("./routes/reviews");
const booksRoutes = require("./routes/books");
const highlightRoutes = require("./routes/highlight");
const moderatorRoutes = require("./routes/moderator");
const employeeRoutes = require("./routes/employee");

// Import database connection
const connectDB = require("./config/db");

// Import subscription cron jobs
const { startSubscriptionJobs } = require("./config/subscriptionCron");

// Import enhanced logger
const { requestLogger, slowRequestLogger } = require("./middleware/logger");

// Initialize Express app
const app = express();

// Connect to MongoDB 
connectDB();

// Start subscription cron jobs (Netflix-like workflow)
startSubscriptionJobs();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware - Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Enhanced Morgan logging (replaces basic morgan)
app.use(requestLogger);
app.use(slowRequestLogger(1000)); // Log requests slower than 1 second

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessions",
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: false, // Allow frontend to access the cookie
    secure: false, // Set to false for development (http)
    sameSite: 'lax' // Allow same-site requests
  },
  name: 'bookish.sid' // Custom session name
}));

// Flash messages
app.use(flash());

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// API Routes
app.use("/api/public", publicRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/library", libraryRouter);
app.use("/api/videos", videosRouter);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/highlights", highlightRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin/moderator", moderatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler for API
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? "Internal server error" : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`CORS enabled for: ${corsOptions.origin}`);
});

module.exports = app;
