/**
 * Video Feed Page (Buyer) - Instagram Reels Style
 * Compact card-based reels with circular array and mouse wheel navigation
 */

import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [activeCommentVideo, setActiveCommentVideo] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
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
        // Pause all other videos
        videoRefs.current.forEach((video, idx) => {
          if (video && idx !== currentVideoIndex) {
            video.pause();
          }
        });
        // Play current video
        currentVideo.play().catch(err => console.log('Autoplay prevented:', err));
      }
    }
  }, [currentVideoIndex, videos]);

  // Mouse wheel navigation for circular scroll
  useEffect(() => {
    const handleWheel = (e) => {
      if (showComments) return; // Don't navigate while comments open
      
      e.preventDefault();
      
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current);
      }
      
      wheelTimeout.current = setTimeout(() => {
        if (e.deltaY > 0) {
          // Scroll down - next video (circular)
          goToVideo((currentVideoIndex + 1) % videos.length);
        } else if (e.deltaY < 0) {
          // Scroll up - previous video (circular)
          goToVideo((currentVideoIndex - 1 + videos.length) % videos.length);
        }
      }, 150);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current);
      }
    };
  }, [currentVideoIndex, videos.length, showComments]);

  // Keyboard navigation for desktop
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
          if (currentVideo.paused) {
            currentVideo.play();
            setIsPlaying(true);
          } else {
            currentVideo.pause();
            setIsPlaying(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, videos.length, showComments]);

  // Fetch more videos when near the end
  useEffect(() => {
    if (currentVideoIndex >= videos.length - 2 && hasMore && !loadingMore) {
      fetchVideos(page + 1);
    }
  }, [currentVideoIndex]);

  const fetchVideos = async (pageNum) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

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
      if (diff > 0 && currentVideoIndex < videos.length - 1) {
        // Swipe up - next video
        goToVideo(currentVideoIndex + 1);
      } else if (diff < 0 && currentVideoIndex > 0) {
        // Swipe down - previous video
        goToVideo(currentVideoIndex - 1);
      }
    }
  };

  const goToVideo = (index) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    setCurrentVideoIndex(index);
    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
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
      
      // Update comments count
      setVideos(prev => prev.map(v => 
        v._id === videoId 
          ? { 
              ...v, 
              comments: [...(v.comments || []), response.data.data.comment]
            }
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
        setIsPlaying(true);
      } else {
        currentVideo.pause();
        setIsPlaying(false);
      }
      
      // Show pause/play icon briefly
      setShowPauseIcon(true);
      if (pauseIconTimeout.current) {
        clearTimeout(pauseIconTimeout.current);
      }
      pauseIconTimeout.current = setTimeout(() => {
        setShowPauseIcon(false);
      }, 600);
    }
  };

  const handleCommentToggle = (videoId) => {
    if (showComments && activeCommentVideo === videoId) {
      setShowComments(false);
      setActiveCommentVideo(null);
    } else {
      setShowComments(true);
      setActiveCommentVideo(videoId);
      setCommentText('');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" message="Loading videos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <ErrorMessage message={error} onRetry={() => fetchVideos(1)} />
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center text-white px-4">
          <div className="mb-6 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">No Videos Yet</h2>
          <p className="text-gray-300 mb-8 text-lg">Be the first to share your book review!</p>
          <button
            onClick={() => navigate('/buyer/upload-video')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Elegant Header */}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-white font-bold text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Reels
                </h1>
                <p className="text-white/50 text-sm">Book Reviews</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/buyer/upload-video')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Card Style Reel */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-8 px-4">
        <div className="flex items-center gap-8 max-w-7xl w-full">
          
          {/* Left Side - Book & User Info */}
          <motion.div
            key={`info-${currentVideo._id}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex flex-col gap-6 w-80"
          >
            {/* Book Card */}
            {currentVideo.book && (
              <Link
                to={`/buyer/book/${currentVideo.book._id}`}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex gap-4 items-start mb-4">
                  {currentVideo.book.coverImage && (
                    <img
                      src={currentVideo.book.coverImage}
                      alt={currentVideo.book.title}
                      className="w-20 h-28 rounded-lg object-cover shadow-xl group-hover:shadow-purple-500/30 transition-shadow"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {currentVideo.book.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-3">
                      by {currentVideo.book.author}
                    </p>
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold">
                      <span>View Book</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs">📚 Click to explore this book</p>
                </div>
              </Link>
            )}

            {/* Creator Info */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {currentVideo.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    {currentVideo.user?.name || 'Anonymous'}
                  </h4>
                  <p className="text-white/50 text-sm">Content Creator</p>
                </div>
              </div>
              
              {/* Video Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="text-white text-xl font-bold">
                    {formatCount(currentVideo.views || 0)}
                  </div>
                  <div className="text-white/50 text-xs">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-xl font-bold">
                    {formatCount(currentVideo.likeCount || 0)}
                  </div>
                  <div className="text-white/50 text-xs">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-xl font-bold">
                    {activeComments.length}
                  </div>
                  <div className="text-white/50 text-xs">Comments</div>
                </div>
              </div>
            </div>

            {/* Upload Date & Tags */}
            <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
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
                    <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Center - Video Card (Instagram Reel Style) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVideo._id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
              className="relative"
            >
            {/* Video Player */}
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
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-6">
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

            {/* Video Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pb-20">
              {/* Book Info */}
              {currentVideo.book && (
                <Link
                  to={`/buyer/book/${currentVideo.book._id}`}
                  className="inline-flex items-center gap-2 mb-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/30 transition-colors"
                >
                  {currentVideo.book.coverImage && (
                    <img
                      src={currentVideo.book.coverImage}
                      alt={currentVideo.book.title}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="text-white text-sm font-medium">
                    {currentVideo.book.title}
                  </span>
                </Link>
              )}

              {/* User Info */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {currentVideo.user?.name?.charAt(0) || '?'}
                </div>
                <span className="text-white font-semibold">
                  {currentVideo.user?.name || 'Anonymous'}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-white text-lg font-semibold mb-2 line-clamp-2">
                {currentVideo.title}
              </h2>

              {/* Description */}
              {currentVideo.description && (
                <p className="text-white/90 text-sm line-clamp-2 mb-3">
                  {currentVideo.description}
                </p>
              )}

              {/* Tags */}
              {currentVideo.tags && currentVideo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentVideo.tags.map((tag, idx) => (
                    <span key={idx} className="text-white/80 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-40">
          {/* Like Button */}
          <button
            onClick={() => handleLike(currentVideo._id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              currentVideo.isLiked 
                ? 'bg-red-500 scale-110' 
                : 'bg-white/20 backdrop-blur-sm group-hover:bg-white/30'
            }`}>
              <svg 
                className={`w-7 h-7 transition-colors ${
                  currentVideo.isLiked ? 'text-white' : 'text-white'
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
            <span className="text-white text-xs font-semibold">
              {formatCount(currentVideo.likeCount || 0)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">
              {formatCount(currentVideo.comments?.length || 0)}
            </span>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">Share</span>
          </button>

          {/* Views */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">
              {formatCount(currentVideo.views || 0)}
            </span>
          </div>
        </div>

        {/* Navigation Indicators */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-20 flex flex-col gap-1 z-30">
          {videos.map((_, idx) => (
            <div
              key={idx}
              className={`w-1 h-8 rounded-full transition-all ${
                idx === currentVideoIndex 
                  ? 'bg-white' 
                  : idx < currentVideoIndex 
                    ? 'bg-white/50' 
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Scroll Hints */}
        {currentVideoIndex < videos.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          >
            <div className="flex flex-col items-center text-white/60">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-xs">Swipe up</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 h-2/3 bg-white rounded-t-3xl z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {currentVideo.comments?.length || 0} Comments
                </h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentVideo.comments && currentVideo.comments.length > 0 ? (
                  currentVideo.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {comment.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                          <p className="font-semibold text-sm">{comment.user?.name || 'Anonymous'}</p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <p>No comments yet</p>
                    <p className="text-sm">Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="border-t p-4 bg-gray-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleComment(currentVideo._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleComment(currentVideo._id)}
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 z-30">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
