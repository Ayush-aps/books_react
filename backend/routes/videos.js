/**
 * Videos API routes for book review videos
 */

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureBuyerOnly } = require("../middleware/auth");
const { videoUpload } = require("../middleware/upload");
const { uploadVideo, deleteVideo } = require("../config/cloudinary");
const Book = require("../models/Book");
const BookVideo = require("../models/BookVideo");
const VideoComment = require("../models/VideoComment");

/**
 * @route   GET /api/videos
 * @desc    Get all videos (video feed)
 * @access  Private
 */
router.get("/", ensureAuthenticated, ensureBuyerOnly, async (req, res) => {
  try {

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

    // Get comments for each video (for reels-style feed)
    const videoIds = videos.map(v => v._id);
    const allComments = await VideoComment.find({ video: { $in: videoIds } })
      .populate("user", "name avatar")
      .sort("-createdAt");

    // Group comments by video ID
    const commentsByVideo = allComments.reduce((acc, comment) => {
      const videoId = comment.video.toString();
      if (!acc[videoId]) acc[videoId] = [];
      acc[videoId].push(comment);
      return acc;
    }, {});

    // Add like status and comments for current user
    const videosWithLikeStatus = videos.map((video) => ({
      ...video.toObject(),
      isLiked: video.likes.includes(req.user._id),
      likeCount: video.likes.length,
      comments: commentsByVideo[video._id.toString()] || [],
    }));

    // Disable caching for videos endpoint to ensure fresh comment data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

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
router.get("/books", ensureAuthenticated, ensureBuyerOnly, async (req, res) => {
  try {

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
 * @route   GET /api/videos/upload
 * @desc    Return error for GET on upload endpoint (frontend handles upload page)
 * @access  Private
 */
router.get("/upload", ensureAuthenticated, (req, res) => {
  res.status(405).json({
    success: false,
    message: "This endpoint only accepts POST requests for video uploads",
  });
});

/**
 * @route   POST /api/videos/upload
 * @desc    Process video upload to Cloudinary
 * @access  Private (Buyer)
 */
router.post("/upload", ensureAuthenticated, ensureBuyerOnly, videoUpload.single("video"), async (req, res) => {
  let uploadedFilePath = null;

  try {

    const { title, description, bookId, tags } = req.body;

    // Validate input
    if (!title || !bookId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (title, bookId, video file)",
      });
    }

    // Verify book exists
    const book = await Book.findById(bookId);
    if (!book) {
      // Clean up uploaded file
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    uploadedFilePath = req.file.path;

    // Upload video to Cloudinary
    console.log("Uploading video to Cloudinary...");
    const cloudinaryResult = await uploadVideo(req.file.path, {
      public_id: `book-reviews/${req.user._id}-${Date.now()}`,
      transformation: [
        { quality: "auto", fetch_format: "auto" }
      ]
    });

    console.log("Cloudinary upload successful:", cloudinaryResult.url);

    // Create new video document with Cloudinary URL
    const newVideo = new BookVideo({
      title,
      description: description || "",
      videoUrl: cloudinaryResult.url,
      thumbnailUrl: cloudinaryResult.thumbnail,
      cloudinaryPublicId: cloudinaryResult.publicId,
      book: bookId,
      user: req.user._id,
      views: 0,
      likes: [],
      duration: Math.round(cloudinaryResult.duration) || 0,
      tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    });

    await newVideo.save();

    // Clean up local file after successful Cloudinary upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: { video: newVideo },
    });
  } catch (err) {
    console.error("Error uploading video:", err);

    // Clean up local file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

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
router.get("/:id", ensureAuthenticated, ensureBuyerOnly, async (req, res) => {
  try {

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
router.post("/:id/like", ensureAuthenticated, ensureBuyerOnly, async (req, res) => {
  try {

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
router.post("/:id/comment", ensureAuthenticated, ensureBuyerOnly, async (req, res) => {
  try {

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

    // Delete video from Cloudinary if it has a public ID
    if (video.cloudinaryPublicId) {
      try {
        await deleteVideo(video.cloudinaryPublicId);
        console.log("Video deleted from Cloudinary:", video.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Failed to delete from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    } else {
      // Delete local video file if it's stored locally
      const videoPath = path.join(__dirname, "..", "public", video.videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    // Delete comments associated with this video
    await VideoComment.deleteMany({ video: req.params.id });

    // Delete video document
    await BookVideo.findByIdAndDelete(req.params.id);

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
