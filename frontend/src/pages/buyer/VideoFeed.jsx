/**
 * Video Feed Page (Buyer) - Instagram Reels Style
 * Compact card-based reels with circular array and mouse wheel navigation
 */

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const VideoFeed = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const isScrolling = useRef(false);
  const pauseIconTimeout = useRef(null);
  const wheelTimeout = useRef(null);

  useEffect(() => {
    fetchVideos(1);
  }, []);

  // Auto-play current video
  useEffect(() => {
    if (videos.length > 0 && videoRefs.current[currentVideoIndex]) {
      const currentVideo = videoRefs.current[currentVideoIndex];
      if (currentVideo) {
        videoRefs.current.forEach((video, idx) => {
          if (video && idx !== currentVideoIndex) {
            video.pause();
          }
        });
        currentVideo.play().catch(err => console.log('Autoplay prevented:', err));
      }
    }
  }, [currentVideoIndex, videos]);

  // Mouse wheel navigation (circular)
  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments) return;
      e.preventDefault();
      
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      
      wheelTimeout.current = setTimeout(() => {
        if (e.deltaY > 0) {
          goToVideo((currentVideoIndex + 1) % videos.length);
        } else if (e.deltaY < 0) {
          goToVideo((currentVideoIndex - 1 + videos.length) % videos.length);
        }
      }, 150);
    };

    const container = containerRef.current;
    if (container && videos.length > 0) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
    };
  }, [currentVideoIndex, videos.length, showComments]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showComments) return;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToVideo((currentVideoIndex - 1 + videos.length) % videos.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToVideo((currentVideoIndex + 1) % videos.length);
      } else if (e.key === ' ') {
        e.preventDefault();
        const currentVideo = videoRefs.current[currentVideoIndex];
        if (currentVideo) {
          currentVideo.paused ? currentVideo.play() : currentVideo.pause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length, showComments]);

  // Load more videos when near end
  useEffect(() => {
    if (currentVideoIndex >= videos.length - 2 && hasMore && !loadingMore) {
      fetchVideos(page + 1);
    }
  }, [currentVideoIndex]);

  const fetchVideos = async (pageNum) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.get(`/videos?page=${pageNum}&limit=10`);
      const newVideos = response.data.data.videos || [];
      const pagination = response.data.data.pagination;

      if (pageNum === 1) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }

      setPage(pageNum);
      setHasMore(pagination.currentPage < pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isScrolling.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToVideo((currentVideoIndex + 1) % videos.length);
      } else {
        goToVideo((currentVideoIndex - 1 + videos.length) % videos.length);
      }
    }
  };

  const goToVideo = (index) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    setCurrentVideoIndex(index);
    setTimeout(() => { isScrolling.current = false; }, 500);
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleLike = async (videoId) => {
    try {
      const response = await api.post(`/videos/${videoId}/like`);
      setVideos(prev => prev.map(v => 
        v._id === videoId 
          ? { ...v, isLiked: response.data.data.liked, likeCount: response.data.data.likeCount }
          : v
      ));
    } catch (err) {
      console.error('Failed to like video:', err);
    }
  };

  const handleComment = async (videoId) => {
    if (!commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const response = await api.post(`/videos/${videoId}/comment`, {
        content: commentText
      });
      
      setVideos(prev => prev.map(v => 
        v._id === videoId 
          ? { ...v, comments: [...(v.comments || []), response.data.data.comment] }
          : v
      ));
      
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVideoClick = () => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play();
      } else {
        currentVideo.pause();
      }
      
      setShowPauseIcon(true);
      if (pauseIconTimeout.current) clearTimeout(pauseIconTimeout.current);
      pauseIconTimeout.current = setTimeout(() => setShowPauseIcon(false), 600);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" message="Loading reels..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <ErrorMessage message={error} onRetry={() => fetchVideos(1)} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center text-charcoal px-4">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto bg-brown rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-charcoal">No Videos Yet</h2>
          <p className="text-secondary mb-8 text-lg">Be the first to share your book review!</p>
          <button
            onClick={() => navigate('/buyer/upload-video')}
            className="bg-brown text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            📹 Upload Your First Video
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const activeComments = currentVideo?.comments || [];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-cream"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-secondary hover:text-charcoal p-2 hover:bg-cream rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-charcoal font-bold text-2xl font-serif">
                  Reels
                </h1>
                <p className="text-secondary text-sm">Book Reviews</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/buyer/upload-video')}
              className="bg-brown text-white px-6 py-2 rounded-full font-semibold hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] py-8 px-4">
        <div className="flex items-start gap-8 max-w-7xl w-full">
          
          {/* Left - Book & User Info */}
          <motion.div
            key={`info-${currentVideo._id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex flex-col gap-6 w-80 flex-shrink-0"
          >
            {/* Book Card */}
            {currentVideo.book && (
              <Link
                to={`/buyer/book/${currentVideo.book._id}`}
                className="bg-white border border-primary rounded-2xl p-6 hover:border-brown hover:shadow-md transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex gap-4 items-start mb-4">
                  {currentVideo.book.coverImage && (
                    <img
                      src={currentVideo.book.coverImage}
                      alt={currentVideo.book.title}
                      className="w-20 h-28 rounded-lg object-cover shadow-xl"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-charcoal font-bold text-lg mb-2 line-clamp-2 font-serif">
                      {currentVideo.book.title}
                    </h3>
                    <p className="text-secondary text-sm mb-3">
                      by {currentVideo.book.author}
                    </p>
                    <div className="flex items-center gap-2 text-brown text-sm font-semibold">
                      <span>View Book</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-light">
                  <p className="text-tertiary text-xs">📚 Click to explore this book</p>
                </div>
              </Link>
            )}

            {/* Creator Info */}
            <div className="bg-white border border-primary rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-brown flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {currentVideo.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 className="text-charcoal font-semibold text-lg">
                    {currentVideo.user?.name || 'Anonymous'}
                  </h4>
                  <p className="text-secondary text-sm">Content Creator</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-light">
                <div className="text-center">
                  <div className="text-charcoal text-xl font-bold">
                    {formatCount(currentVideo.views || 0)}
                  </div>
                  <div className="text-tertiary text-xs">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-charcoal text-xl font-bold">
                    {formatCount(currentVideo.likeCount || 0)}
                  </div>
                  <div className="text-tertiary text-xs">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-charcoal text-xl font-bold">
                    {activeComments.length}
                  </div>
                  <div className="text-tertiary text-xs">Comments</div>
                </div>
              </div>
            </div>

            {/* Upload Date & Tags */}
            <div className="bg-white border border-primary rounded-2xl p-5">
              <div className="flex items-center gap-2 text-secondary text-sm mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(currentVideo.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              {currentVideo.tags && currentVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentVideo.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-cream text-brown text-xs rounded-full border border-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Center - Video Card */}
          <div className="flex-1 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVideo._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-[400px]"
              >
                {/* Video Container with Card Style */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-primary" style={{ aspectRatio: '9/14', maxHeight: '600px' }}>
                  <video
                    ref={(el) => videoRefs.current[currentVideoIndex] = el}
                    src={currentVideo.videoUrl}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    onClick={handleVideoClick}
                  />

                  {/* Play/Pause Indicator */}
                  <AnimatePresence>
                    {showPauseIcon && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div className="bg-black/60 backdrop-blur-sm rounded-full p-6">
                          {videoRefs.current[currentVideoIndex]?.paused ? (
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          ) : (
                            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
                    {/* Title */}
                    <h2 className="text-white text-lg font-bold mb-2 line-clamp-2">
                      {currentVideo.title}
                    </h2>

                    {/* Description */}
                    {currentVideo.description && (
                      <p className="text-white/80 text-sm line-clamp-2 mb-3">
                        {currentVideo.description}
                      </p>
                    )}

                    {/* Mobile Book Info */}
                    {currentVideo.book && (
                      <Link
                        to={`/buyer/book/${currentVideo.book._id}`}
                        className="lg:hidden inline-flex items-center gap-2 mb-3 bg-brown/90 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-brown transition-colors"
                      >
                        {currentVideo.book.coverImage && (
                          <img
                            src={currentVideo.book.coverImage}
                            alt={currentVideo.book.title}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-white text-xs font-medium">
                          {currentVideo.book.title}
                        </span>
                      </Link>
                    )}

                    {/* Mobile User Info */}
                    <div className="lg:hidden flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brown flex items-center justify-center text-white text-sm font-bold">
                        {currentVideo.user?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-white text-sm font-semibold">
                        {currentVideo.user?.name || 'Anonymous'}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions Panel */}
                  <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
                    {/* Like */}
                    <button
                      onClick={() => handleLike(currentVideo._id)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                        currentVideo.isLiked 
                          ? 'bg-red-500 scale-110' 
                          : 'bg-white/95 hover:bg-white'
                      }`}>
                        <svg 
                          className={`w-6 h-6 ${
                            currentVideo.isLiked ? 'text-white' : 'text-red-500'
                          }`}
                          fill={currentVideo.isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                          />
                        </svg>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {formatCount(currentVideo.likeCount || 0)}
                      </span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center hover:bg-white transition-all shadow-md">
                        <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">
                        {activeComments.length}
                      </span>
                    </button>

                    {/* Share */}
                    <button className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center hover:bg-white transition-all shadow-md">
                        <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-lg">Share</span>
                    </button>
                  </div>
                </div>

                {/* Navigation Hints */}
                <div className="text-center mt-4 text-tertiary text-sm">
                  {videos.length > 1 && (
                    <p>Scroll or use ↑↓ keys • Video {currentVideoIndex + 1} of {videos.length}</p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary bg-cream">
              <h3 className="text-charcoal text-lg font-semibold">
                {activeComments.length} Comments
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-cream-dark rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeComments.length > 0 ? (
                activeComments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brown flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-cream rounded-2xl px-4 py-3">
                        <p className="font-semibold text-sm text-charcoal">{comment.user?.name || 'Anonymous'}</p>
                        <p className="text-secondary mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-tertiary mt-1 ml-4">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-secondary py-12">
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-primary p-4 bg-cream">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 rounded-full bg-white border border-primary text-charcoal placeholder-tertiary focus:outline-none focus:border-brown"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleComment(currentVideo._id);
                  }}
                />
                <button
                  onClick={() => handleComment(currentVideo._id)}
                  disabled={!commentText.trim() || submittingComment}
                  className="bg-brown text-white px-6 py-2 rounded-full font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
