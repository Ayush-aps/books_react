/**
 * Centralized File Upload Middleware
 * Multer configurations for different file types
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Avatar Upload Configuration
 * For user profile pictures
 * Max size: 5MB
 * Allowed: jpeg, jpg, png, gif
 */
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/img/users');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

module.exports.avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
});

/**
 * PDF Upload Configuration
 * For book files (seller uploads)
 * Max size: 50MB
 * Allowed: PDF only
 */
module.exports.pdfUpload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.originalname.endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf files are allowed'), false);
        }
    }
});

/**
 * Video Upload Configuration
 * For book review videos
 * Max size: 50MB
 * Allowed: Video files only
 */
const videoStorage = multer.diskStorage({
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

module.exports.videoUpload = multer({
    storage: videoStorage,
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
 * Review Media Upload Configuration
 * For review images and videos
 * Max size: 50MB
 * Max files: 6 (5 images + 1 video)
 */
const reviewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = file.mimetype.startsWith("video/")
            ? "public/uploads/review-videos"
            : "public/uploads/review-images";

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

module.exports.reviewMediaUpload = multer({
    storage: reviewStorage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 6 // Max 5 images + 1 video
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image and video files are allowed!"), false);
        }
    },
});
