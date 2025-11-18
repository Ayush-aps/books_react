/**
 * Upload Video Page (Buyer)
 * Upload video review for purchased books
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import useFormValidation from '../../hooks/useFormValidation';
import { validateRequired, validateLength } from '../../utils/validation';

const UploadVideo = () => {
  const navigate = useNavigate();
  const [ownedBooks, setOwnedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validation schema
  const validationSchema = {
    bookId: (value) => validateRequired(value, 'Book'),
    title: (value) => validateRequired(value, 'Title'),
    description: (value) => {
      const requiredCheck = validateRequired(value, 'Description');
      if (!requiredCheck.isValid) return requiredCheck;
      return validateLength(value, 10, 500, 'Description');
    },
    videoFile: (value) => {
      if (!value) {
        return { isValid: false, error: 'Please select a video file' };
      }
      return { isValid: true, error: '' };
    }
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isValid
  } = useFormValidation(
    {
      bookId: '',
      title: '',
      description: '',
      videoFile: null
    },
    validationSchema
  );

  useEffect(() => {
    fetchOwnedBooks();
  }, []);

  const fetchOwnedBooks = async () => {
    try {
      setLoadingBooks(true);
      const response = await api.get('/library');
      setOwnedBooks(response.data.data.library || []);
    } catch (err) {
      console.error('Failed to load owned books:', err);
      setOwnedBooks([]); // Ensure ownedBooks is always an array
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size must be less than 50MB');
        return;
      }

      setFieldValue('videoFile', file);
      setError(null);
    }
  };

  const onSubmit = async (formData) => {
    setError(null);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bookId', formData.bookId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('video', formData.videoFile);

      await api.post('/videos/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      navigate('/buyer/video-feed', { 
        state: { success: 'Video uploaded successfully! It will appear after admin approval.' } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload video');
      setUploadProgress(0);
    }
  };

  if (loadingBooks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Video Review</h1>
          <p className="text-gray-600 mt-2">
            Share your thoughts about a book you've purchased by uploading a video review
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {ownedBooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No books in your library</h3>
            <p className="text-gray-600 mb-4">
              You need to purchase books before you can upload video reviews
            </p>
            <button
              onClick={() => navigate('/buyer/browse')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Books
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Book Selection */}
            <div>
              <label htmlFor="bookId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Book <span className="text-red-500">*</span>
              </label>
              <select
                id="bookId"
                name="bookId"
                value={values.bookId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.bookId && errors.bookId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
              >
                <option value="">Choose a book from your library...</option>
                {ownedBooks.map((item) => (
                  <option key={item._id} value={item.book._id}>
                    {item.book.title} by {item.book.author}
                  </option>
                ))}
              </select>
              {touched.bookId && errors.bookId && (
                <p className="text-red-500 text-sm mt-1">{errors.bookId}</p>
              )}
            </div>

            {/* Video Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Video Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${
                  touched.title && errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
                placeholder="Give your video a catchy title"
              />
              {touched.title && errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="4"
                className={`w-full px-3 py-2 border ${
                  touched.description && errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2 resize-none`}
                placeholder="Describe what viewers will learn from your video review (minimum 10 characters)"
              />
              {touched.description && errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {values.description.length}/500 characters
              </p>
            </div>

            {/* Video File Upload */}
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-2">
                Video File <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="videoFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a video</span>
                      <input
                        id="videoFile"
                        name="videoFile"
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">MP4, MOV, AVI up to 50MB</p>
                  {values.videoFile && (
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      Selected: {values.videoFile.name}
                    </p>
                  )}
                </div>
              </div>
              {touched.videoFile && errors.videoFile && (
                <p className="text-red-500 text-sm mt-1">{errors.videoFile}</p>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Guidelines</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Keep videos under 5 minutes for best engagement</li>
                <li>• Ensure good audio and video quality</li>
                <li>• Be honest and constructive in your review</li>
                <li>• Videos will be reviewed by admin before publishing</li>
                <li>• Inappropriate content will be removed</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/buyer/video-feed')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Uploading...
                  </span>
                ) : (
                  'Upload Video'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadVideo;
