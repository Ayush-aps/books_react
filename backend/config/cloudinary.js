/**
 * Cloudinary Configuration
 * For video and image uploads
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload video to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with URL
 */
const uploadVideo = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: 'book-videos',
      chunk_size: 6000000, // 6MB chunks for large files
      eager: [
        { width: 300, height: 300, crop: 'pad', audio_codec: 'none' },
        { width: 160, height: 100, crop: 'crop', gravity: 'south', audio_codec: 'none' }
      ],
      eager_async: true,
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      thumbnail: result.eager?.[0]?.secure_url || result.secure_url.replace(/\.[^.]+$/, '.jpg')
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};

/**
 * Delete video from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete video: ${error.message}`);
  }
};

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result with URL
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: 'book-images',
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary image delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Upload book file (ePub or PDF) to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Upload options (can include original_filename)
 * @returns {Promise<object>} Upload result with URL
 */
const uploadBookFile = async (filePath, options = {}) => {
  try {
    const path = require('path');
    const filename = options.original_filename || path.basename(filePath);

    // Ensure extension is included in public_id
    const filenameWithoutExt = filename.replace(/\.(epub|pdf)$/i, '');
    const extension = path.extname(filename).substring(1).toLowerCase();

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Changed from 'raw' to 'auto' for better public access
      folder: 'book-files',
      public_id: filenameWithoutExt,
      use_filename: true,
      unique_filename: true,
      ...options
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary book file upload error:', error);
    throw new Error(`Failed to upload book file: ${error.message}`);
  }
};

/**
 * Delete book file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteBookFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto' // Changed from 'raw' to 'auto'
    });
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary book file delete error:', error);
    throw new Error(`Failed to delete book file: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadVideo,
  deleteVideo,
  uploadImage,
  deleteImage,
  uploadBookFile,
  deleteBookFile
};
