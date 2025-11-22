/**
 * Video Feed Page (Buyer)
 * Browse and discover book review videos
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';

const VideoFeed = () => {
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalVideos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookId = searchParams.get('bookId');
  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    fetchVideos();
  }, [page, bookId]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString() });
      if (bookId) params.append('bookId', bookId);

      const response = await api.get(`/videos?${params.toString()}`);
      setVideos(response.data.data.videos || []);
      setPagination(response.data.data.pagination || { currentPage: 1, totalPages: 1, totalVideos: 0 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading videos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {bookId ? 'Book Videos' : 'Video Feed'}
          </h1>
          <p className="text-gray-600 mt-2">
            {pagination.totalVideos} video{pagination.totalVideos !== 1 ? 's' : ''} available
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchVideos} />
          </div>
        )}

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No videos found</h2>
            <p className="text-gray-600 mb-6">
              {bookId ? 'No videos available for this book yet' : 'Be the first to upload a video review!'}
            </p>
            {!bookId && (
              <Link
                to="/buyer/upload-video"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upload Video
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Link
                  key={video._id}
                  to={`/buyer/videos/${video._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900">
                    {video.thumbnailUrl && video.thumbnailUrl !== '/img/default-thumbnail.jpg' ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          console.error('Thumbnail load error:', e);
                        }}
                      />
                    ) : (
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={(e) => console.error('Video preview error:', e)}
                      />
                    )}
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform">
                        <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                      {video.title}
                    </h3>

                    {/* Book Info */}
                    {video.book && (
                      <Link
                        to={`/buyer/book/${video.book._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-blue-600 hover:text-blue-800 line-clamp-1 mb-2"
                      >
                        {video.book.title}
                      </Link>
                    )}

                    {/* Creator */}
                    <p className="text-sm text-gray-600 mb-2">
                      by {video.user?.name || 'Anonymous'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{formatViews(video.views || 0)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{video.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{video.comments?.length || 0}</span>
                      </div>
                    </div>

                    {/* Upload Date */}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(video.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(newPage) => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', newPage.toString());
                    window.location.search = params.toString();
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Upload CTA */}
        {!bookId && videos.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Share Your Book Reviews</h3>
            <p className="mb-6 opacity-90">
              Help others discover great books by sharing your video reviews
            </p>
            <Link
              to="/buyer/upload-video"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Upload Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFeed;
