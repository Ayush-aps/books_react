/**
 * Review Form Component
 * Amazon-style review form with text, images, and video
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Upload, X, Image, Video, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ReviewForm = ({ bookId, onReviewSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - images.length;
    
    if (files.length > remainingSlots) {
      setError(`You can only upload ${MAX_IMAGES} images total`);
      return;
    }

    const validFiles = [];
    const validPreviews = [];
    
    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`Image ${file.name} is too large. Max size is 5MB`);
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not a valid image`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setImages([...images, ...validFiles]);
    setImagePreviews([...imagePreviews, ...validPreviews]);
    setError(null);
  };

  // Remove image
  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Handle video selection
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE) {
      setError('Video is too large. Max size is 50MB');
      return;
    }

    if (!file.type.startsWith('video/')) {
      setError('File is not a valid video');
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  // Remove video
  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideo(null);
    setVideoPreview(null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!reviewText && images.length === 0 && !video) {
      setError('Please provide at least some review content (text, images, or video)');
      return;
    }

    // Validate review text if provided
    if (reviewText && reviewText.trim().length > 0) {
      // Must contain at least one alphabetic character
      if (!/[a-zA-Z]/.test(reviewText)) {
        setError('Review must contain at least one alphabetic character');
        return;
      }

      // Cannot be only numbers
      if (/^\d+$/.test(reviewText.trim())) {
        setError('Review cannot contain only numbers');
        return;
      }

      // Cannot be only special characters
      if (/^[^a-zA-Z0-9\s]+$/.test(reviewText.trim())) {
        setError('Review cannot contain only special characters');
        return;
      }

      // Cannot be only numbers and special characters (no alphabets)
      if (/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(reviewText.trim())) {
        setError('Review must contain at least one alphabetic character');
        return;
      }
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('bookId', bookId);
      formData.append('rating', rating);
      formData.append('reviewText', reviewText);

      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      // Add video
      if (video) {
        formData.append('video', video);
      }

      // Submit review
      const response = await api.post('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.success) {
        // Clean up previews
        imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
        if (videoPreview) URL.revokeObjectURL(videoPreview);
        
        // Notify parent
        onReviewSubmit(response.data.data.review);
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-primary p-6 mb-6"
    >
      <h3 className="text-xl font-bold text-charcoal mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-tertiary">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Your Review
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={6}
            maxLength={2000}
            className="w-full px-4 py-3 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brown resize-none"
          />
          <div className="text-right text-sm text-tertiary mt-1">
            {reviewText.length}/2000
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Add Photos (Optional)
          </label>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-brown transition-colors">
              <div className="text-center">
                <Image className="mx-auto text-taupe mb-1" size={24} />
                <span className="text-sm text-tertiary">
                  Add photos ({images.length}/{MAX_IMAGES})
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
          )}
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Add Video (Optional)
          </label>
          
          {videoPreview ? (
            <div className="relative group">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-64 rounded-lg border border-primary"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-brown transition-colors">
              <div className="text-center">
                <Video className="mx-auto text-taupe mb-1" size={24} />
                <span className="text-sm text-tertiary">Add a video review</span>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Upload Progress */}
        {isSubmitting && uploadProgress > 0 && (
          <div>
            <div className="flex justify-between text-sm text-tertiary mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-cream rounded-full h-2">
              <div
                className="bg-brown h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-primary rounded-lg text-charcoal hover:bg-cream transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-6 py-2 bg-brown text-white rounded-lg hover:bg-brown/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={18} />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReviewForm;
