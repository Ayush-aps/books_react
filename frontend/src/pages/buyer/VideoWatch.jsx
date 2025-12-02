/**
 * Video Watch Page (Buyer)
 * Watch video with player, like/dislike, and comments
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';

const VideoWatch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/videos/${id}`);
      const videoData = response.data.data.video;
      setVideo(videoData);
      setComments(response.data.data.comments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      setError('Please login to like videos');
      return;
    }

    try {
      const response = await api.post(`/videos/${id}/like`);
      // Update video with new like status and count
      setVideo(prev => ({
        ...prev,
        isLiked: response.data.data.liked,
        likeCount: response.data.data.likeCount
      }));
      setSuccessMessage(response.data.data.liked ? 'Video liked!' : 'Like removed');
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to like video');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to comment');
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/videos/${id}/comment`, {
        content: commentText
      });
      setComments([response.data.data.comment, ...comments]);
      setCommentText('');
      setSuccessMessage('Comment added!');
      setShowSuccessToast(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading video..." />
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchVideoDetails} />
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                src={video.videoUrl}
                controls
                className="w-full aspect-video"
                controlsList="nodownload"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.error('Video load error:', e);
                  console.error('Video URL:', video.videoUrl);
                  setError('Failed to load video. Please try again or contact support.');
                }}
                onLoadedData={() => {
                  console.log('Video loaded successfully');
                  setError(null);
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <span>{video.views || 0} views</span>
                <span>•</span>
                <span>
                  {new Date(video.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    video.isLiked 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span className="font-medium">{video.likeCount || 0} {video.isLiked ? 'Liked' : 'Likes'}</span>
                </button>
              </div>

              {/* Creator Info */}
              <div className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold">
                    {video.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {video.user?.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {video.user?.role === 'seller' ? 'Seller' : 'Buyer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Comments ({comments.length})
              </h2>

              {/* Comment Form */}
              {user ? (
                <form onSubmit={handleComment} className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setCommentText('')}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                      Login
                    </Link>
                    {' '}to add comments
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-300 text-gray-700 rounded-full h-8 w-8 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {comment.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {comment.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Book */}
            {video.book && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Featured Book</h2>
                <Link to={`/buyer/book/${video.book._id}`} className="block group">
                  <img
                    src={video.book.coverImage || '/placeholder-book.png'}
                    alt={video.book.title}
                    className="w-full h-64 object-cover rounded-lg mb-3 group-hover:opacity-90 transition-opacity"
                  />
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                    {video.book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">by {video.book.author}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{video.book.price?.toFixed(2) || 'N/A'}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      View Details →
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* More Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">More Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/buyer/video-feed')}
                  className="text-charcoal text-xs sm:text-sm rounded-lg transition-all duration-300 hover:scale-105 hover:brightness-110 focus:outline-none hover:shadow-md whitespace-nowrap inline-flex items-center border-none"
                  style={{ 
                    backgroundColor: 'transparent',
                    padding: '0.625rem 1.5rem',
                    border: 'none',
                    lineHeight: '1.5',
                    height: '50px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Videos
                </button>
                <Link
                  to="/buyer/upload-video"
                  className="block text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Upload Your Video →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default VideoWatch;
