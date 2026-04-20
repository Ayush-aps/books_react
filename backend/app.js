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
const compression = require("compression");

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
const { setupSwagger } = require("./config/swagger");

// Import subscription cron jobs
const { startSubscriptionJobs } = require("./config/subscriptionCron");

// Import enhanced logger
const { requestLogger, slowRequestLogger } = require("./middleware/logger");

// Initialize Express app
const app = express();
const isTestEnv = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  // Required on Render/Heroku-style proxies so secure cookies work correctly.
  app.set("trust proxy", 1);
}

if (!isTestEnv) {
  // Connect to MongoDB and auto-seed default accounts
  connectDB().then(async () => {
    try {
      const User = require("./models/User");

      // Auto-seed moderator account if none exists
      const moderatorExists = await User.findOne({ role: "moderator" });
      if (!moderatorExists) {
        const moderator = new User({
          name: "Moderator",
          email: "moderator1@gmail.com",
          password: "Moderator@1",
          role: "moderator",
          isVerified: true,
        });
        await moderator.save();
        console.log("✅ Default moderator account created (moderator1@gmail.com)");
      }
    } catch (err) {
      console.error("⚠️ Auto-seed error:", err.message);
    }
  });

  // Start subscription cron jobs (Netflix-like workflow)
  startSubscriptionJobs();
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from any origin. This keeps local dev/preview and deployments flexible.
    // Also allow requests without Origin header (e.g., curl/Postman/health checks).
    if (!origin) {
      return callback(null, true);
    }
    return callback(null, true);
  },
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
app.use(compression());

// Enhanced Morgan logging (replaces basic morgan)
if (!isTestEnv) {
  app.use(requestLogger);
  app.use(slowRequestLogger(1000)); // Log requests slower than 1 second
}

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

if (!isTestEnv) {
  // Session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax"
    },
    name: 'bookish.sid' // Custom session name
  };

  if (process.env.MONGODB_URI) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    });
  }

  app.use(session(sessionConfig));

  // Flash messages
  app.use(flash());

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());
  require("./config/passport")(passport);
} else {
  // Lightweight auth/session stubs for test environment.
  app.use((req, res, next) => {
    req.user = null;
    req.isAuthenticated = () => false;
    req.flash = () => [];
    next();
  });
}

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

// Swagger API documentation
if (!isTestEnv) {
  setupSwagger(app);
}

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
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log("CORS enabled for all origins");
  });
}

module.exports = app;
