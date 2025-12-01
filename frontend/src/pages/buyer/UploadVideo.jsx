/**
 * Upload Video Page (Buyer)
 * Upload video review for purchased books
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
// Removed: useFormValidation and manual validation utils

// RHF Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { videoUploadSchema } from '../../schemas/allFormSchemas';

const UploadVideo = () => {
  const navigate = useNavigate();
  const [ownedBooks, setOwnedBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    resolver: zodResolver(videoUploadSchema),
    mode: 'onTouched',
    defaultValues: {
      bookId: '',
      title: '',
      description: '',
      tags: '',
      videoFile: null
    }
  });

  const descriptionValue = watch('description', '');
  const videoFileValue = watch('videoFile');

  useEffect(() => {
    fetchOwnedBooks();
  }, []);

  const fetchOwnedBooks = async () => {
    try {
      setLoadingBooks(true);
      const response = await api.get('/library');
      console.log('Library response:', response.data);
      // Extract library items from response and filter out items with null books
      const libraryItems = (response.data.data?.library || []).filter(item => item.book && item.book._id);
      setOwnedBooks(libraryItems);
    } catch (err) {
      console.error('Failed to load owned books:', err);
      setError('Failed to load your library. Please try again.');
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        e.target.value = '';
        return;
      }
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file must be less than 50MB');
        e.target.value = '';
        return;
      }
      setValue('videoFile', file, { shouldValidate: true, shouldDirty: true });
      setError(null);
    }
  };

  const onSubmit = async (data) => {
    setError(null);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bookId', data.bookId);
      formDataToSend.append('title', data.title);
      formDataToSend.append('description', data.description);
      if (data.tags) {
        formDataToSend.append('tags', data.tags);
      }
      formDataToSend.append('video', data.videoFile);

      console.log('Uploading video to Cloudinary...');

      await api.post('/videos/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Video uploaded successfully!');
      navigate('/buyer/video-feed', {
        state: { success: 'Video uploaded successfully and is now available for all buyers to watch!' }
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload video. Please try again.');
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
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal font-serif">Upload Video Review</h1>
          <p className="text-secondary mt-2">
            Share your thoughts about a book you've purchased by uploading a video review
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {ownedBooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-primary p-12 text-center">
            <svg
              className="w-16 h-16 text-taupe mx-auto mb-4"
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
            <h3 className="text-lg font-semibold text-charcoal mb-2 font-serif">No books in your library</h3>
            <p className="text-secondary mb-4">
              You need to purchase books before you can upload video reviews
            </p>
            <button
              onClick={() => navigate('/buyer/browse')}
              className="bg-brown text-white px-6 py-2 rounded-lg font-semibold hover:shadow-md hover:scale-105 transition-all"
            >
              Browse Books
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-primary p-6 space-y-6">
            {/* Book Selection */}
            <div>
              <label htmlFor="bookId" className="block text-sm font-medium text-charcoal mb-2">
                Select Book <span className="text-red-500">*</span>
              </label>
              <select
                id="bookId"
                {...register("bookId")}
                className={`w-full px-3 py-2 border ${errors.bookId
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-primary focus:ring-brown'
                  } rounded-md focus:outline-none focus:ring-2`}
              >
                <option value="">Choose a book from your library...</option>
                {ownedBooks.map((item) => (
                  item.book ? (
                    <option key={item._id} value={item.book._id}>
                      {item.book.title} by {item.book.author}
                    </option>
                  ) : null
                ))}
              </select>
              {errors.bookId && (
                <p className="text-red-500 text-sm mt-1">{errors.bookId.message}</p>
              )}
            </div>

            {/* Video Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-charcoal mb-2">
                Video Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                {...register("title")}
                className={`w-full px-3 py-2 border ${errors.title
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-primary focus:ring-brown'
                  } rounded-md focus:outline-none focus:ring-2`}
                placeholder="Give your video a catchy title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows="4"
                className={`w-full px-3 py-2 border ${errors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-primary focus:ring-brown'
                  } rounded-md focus:outline-none focus:ring-2 resize-none`}
                placeholder="Describe what viewers will learn from your video review (minimum 10 characters)"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
              <p className="text-tertiary text-sm mt-1">
                {descriptionValue.length}/500 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-charcoal mb-2">
                Tags <span className="text-tertiary">(Optional)</span>
              </label>
              <input
                type="text"
                id="tags"
                {...register("tags")}
                className="w-full px-3 py-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brown"
                placeholder="fiction, mystery, thriller (comma-separated)"
              />
              <p className="text-tertiary text-xs mt-1">
                Add tags to help others discover your review
              </p>
            </div>

            {/* Video File Upload */}
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-charcoal mb-2">
                Video File <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-primary border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-taupe"
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
                  <div className="flex text-sm text-secondary">
                    <label
                      htmlFor="videoFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-brown hover:text-brown focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brown"
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
                  <p className="text-xs text-tertiary">MP4, MOV, AVI up to 50MB</p>
                  {videoFileValue && (
                    <p className="text-sm text-green-600 font-semibold mt-2">
                      Selected: {videoFileValue.name}
                    </p>
                  )}
                </div>
              </div>
              {errors.videoFile && (
                <p className="text-red-500 text-sm mt-1">{errors.videoFile.message}</p>
              )}
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-sm text-secondary mb-1">
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

            {/* Info Box */}
            <div className="bg-cream border border-medium rounded-lg p-4">
              <h3 className="font-semibold text-charcoal mb-2 font-serif">Video Review Guidelines</h3>
              <ul className="text-sm text-secondary space-y-1">
                <li>• Keep videos under 5 minutes for best engagement</li>
                <li>• Ensure good audio and video quality</li>
                <li>• Be honest and constructive in your review</li>
                <li>• Videos are uploaded to Cloudinary and available immediately</li>
                <li>• All buyers can watch, like, and comment on your review</li>
                <li>• Upload may take 1-3 minutes depending on file size</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t border-light">
              <button
                type="button"
                onClick={() => navigate('/buyer/video-feed')}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-primary rounded-lg text-secondary font-semibold hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 bg-brown text-white py-3 px-6 rounded-lg font-semibold hover:shadow-md hover:scale-105 disabled:bg-taupe disabled:cursor-not-allowed transition-all"
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
