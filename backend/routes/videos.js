/**
 * Videos API routes for book review videos
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { ensureAuthenticated } = require("../middleware/auth");
const Book = require("../models/Book");
const BookVideo = require("../models/BookVideo");
const VideoComment = require("../models/VideoComment");

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "public/uploads/videos";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

/**
 * @route   GET /api/videos
 * @desc    Get all videos (video feed)
 * @access  Private
 */
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can view videos",
      });
    }

    const { search, bookId, sort, page = 1, limit = 12 } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (bookId) {
      query.book = bookId;
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "views":
        sortOptions = { views: -1 };
        break;
      case "likes":
        sortOptions = { likes: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 }; // newest first
    }

    // Count total videos
    const totalVideos = await BookVideo.countDocuments(query);

    // Get videos with pagination
    const videos = await BookVideo.find(query)
      .populate("user", "name avatar")
      .populate("book", "title author coverImage")
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Add like status for current user
    const videosWithLikeStatus = videos.map((video) => ({
      ...video.toObject(),
      isLiked: video.likes.includes(req.user._id),
      likeCount: video.likes.length,
    }));

    res.json({
      success: true,
      message: "Videos retrieved successfully",
      data: {
        videos: videosWithLikeStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalVideos / parseInt(limit)),
          totalVideos,
          limit: parseInt(limit),
        },
      },
    });
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching videos",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/videos/books
 * @desc    Get all books for video upload form
 * @access  Private
 */
router.get("/books", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can access this resource",
      });
    }

    const books = await Book.find({ isApproved: true }).select("title author coverImage").sort("title");

    res.json({
      success: true,
      message: "Books retrieved successfully",
      data: { books },
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({
      success: false,
      message: "Error loading books",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/videos/upload
 * @desc    Process video upload
 * @access  Private (Buyer)
 */
router.post("/upload", ensureAuthenticated, upload.single("video"), async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can upload videos",
      });
    }

    const { title, description, bookId, tags } = req.body;

    // Validate input
    if (!title || !bookId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (title, bookId, video file)",
      });
    }

    // Create thumbnail (here we'd normally generate one from the video)
    // For now, use a default thumbnail
    const thumbnailUrl = "/img/default-thumbnail.jpg";

    // Create new video document
    const newVideo = new BookVideo({
      title,
      description: description || "",
      videoUrl: `/uploads/videos/${req.file.filename}`,
      thumbnailUrl,
      book: bookId,
      user: req.user._id,
      views: 0,
      likes: [],
      duration: 90, // Default 90 seconds; in a real app, you'd extract this from the video
      tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    });

    await newVideo.save();

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: { video: newVideo },
    });
  } catch (err) {
    console.error("Error uploading video:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading video",
      error: err.message,
    });
  }
});

/**
 * @route   GET /api/videos/:id
 * @desc    Get a specific video with details
 * @access  Private (Buyer)
 */
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers can view videos",
      });
    }

    const videoId = req.params.id;

    // Find video and increment view count
    const video = await BookVideo.findById(videoId)
      .populate("user", "name avatar")
      .populate("book", "title author coverImage");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Increment views
    video.views = (video.views || 0) + 1;
    await video.save();

    // Get comments
    const comments = await VideoComment.find({ video: videoId })
      .populate("user", "name avatar")
      .sort("-createdAt");

    // Get related videos (by same book or tags)
    const relatedVideos = await BookVideo.find({
      _id: { $ne: videoId },
      $or: [{ book: video.book._id }, { tags: { $in: video.tags } }],
    })
      .limit(5)
      .populate("user", "name avatar")
      .sort("-views");

    // Check if current user liked the video
    const isLiked = video.likes.includes(req.user._id);

    res.json({
      success: true,
      message: "Video retrieved successfully",
      data: {
        video: {
          ...video.toObject(),
          isLiked,
          likeCount: video.likes.length,
        },
        comments,
        relatedVideos,
      },
    });
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(500).json({
      success: false,
      message: "Error loading video",
      error: err.message,
    });
  }
});

/**
 * @route   POST /api/videos/:id/like
 * @desc    Like/unlike a video
 * @access  Private (Buyer)
 */
router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ success: false, message: "Only buyers can like videos" });
    }

    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await BookVideo.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Check if already liked
    const likeIndex = video.likes.indexOf(userId);

    if (likeIndex === -1) {
      // Add like
      video.likes.push(userId);
    } else {
      // Remove like
      video.likes.splice(likeIndex, 1);
    }

    await video.save();

    res.json({
      success: true,
      message: likeIndex === -1 ? "Video liked" : "Video unliked",
      data: {
        liked: likeIndex === -1,
        likeCount: video.likes.length,
      },
    });
  } catch (err) {
    console.error("Error liking video:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   POST /api/videos/:id/comment
 * @desc    Add a comment to a video
 * @access  Private (Buyer)
 */
router.post("/:id/comment", ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ success: false, message: "Only buyers can comment" });
    }

    const { content } = req.body;
    const videoId = req.params.id;

    if (!content) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    // Check if video exists
    const video = await BookVideo.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    // Create and save comment
    const newComment = new VideoComment({
      content,
      video: videoId,
      user: req.user._id,
    });

    await newComment.save();

    // Populate user info for response
    await newComment.populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { comment: newComment },
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete a video
 * @access  Private (Buyer - own videos only)
 */
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const video = await BookVideo.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check if user owns the video
    if (video.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own videos",
      });
    }

    // Delete video file from filesystem
    const videoPath = path.join(__dirname, "..", "public", video.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete comments associated with this video
    await VideoComment.deleteMany({ video: req.params.id });

    // Delete video document
    await video.remove();

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting video:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting video",
      error: err.message,
    });
  }
});

module.exports = router;
