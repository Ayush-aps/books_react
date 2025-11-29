/**
 * Home Page - Premium Landing Experience
 * Curated book discovery with hero carousel and collections
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { addToCart } from '../redux/actions/cartActions';
import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useToast } from '../components/Toast';
import { fadeInUp, staggerContainer, staggerItem, imageZoom } from '../utils/animations';

const Home = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const toast = useToast();
  const [data, setData] = useState({
    featuredBooks: [],
    newBooks: [],
    trendingBooks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Discover Your Next Great Read",
      subtitle: "Curated selection of exceptional books from verified sellers",
      image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=600&fit=crop",
      cta: "Explore Collection",
      link: "/buyer/browse",
      theme: "primary"
    },
    {
      title: "Share Your Literary Treasures",
      subtitle: "Turn your beloved books into opportunities for others",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop",
      cta: "Start Selling",
      link: "/seller/upload",
      theme: "secondary"
    },
    {
      title: "Premium Reading Experience",
      subtitle: "Unlimited access to our digital library and exclusive content",
      image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=600&fit=crop",
      cta: "View Plans",
      link: "/pricing",
      theme: "accent"
    }
  ];

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/home');
      const apiData = response.data.data;
      // Map backend field names to frontend expectations
      setData({
        featuredBooks: apiData.featuredBooks || [],
        newBooks: apiData.newArrivals || [],
        trendingBooks: apiData.trendingBooks || []
      });
      setError(null);
    } catch (err) {
      console.error('Home page error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load home page data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (bookId) => {
    if (!isAuthenticated) {
      toast.warning('Please login to add items to cart', 3000);
      return;
    }
    
    try {
      const result = await dispatch(addToCart(bookId, 1));
      if (result.success) {
        // Find the book that was added to show its title in the toast
        const addedBook = [...data.featuredBooks, ...data.newBooks, ...data.trendingBooks]
          .find(book => book._id === bookId);
        const bookTitle = addedBook?.title || 'Book';
        toast.success(`"${bookTitle}" added to cart!`, 3000);
      } else {
        toast.error(result.message || 'Failed to add to cart', 3000);
      }
    } catch (error) {
      toast.error('An error occurred while adding to cart', 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage message={error} onRetry={fetchHomeData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Hero Carousel */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-charcoal z-0">
        <AnimatePresence mode="wait">
          {heroSlides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-transparent z-10" />
                
                {/* Background Image */}
                <motion.img
                  variants={imageZoom}
                  initial="initial"
                  animate="animate"
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Content */}
                <div className="absolute inset-0 z-20 flex items-center">
                  <div className="container-custom">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="max-w-2xl pl-12 md:pl-16"
                    >
                      <div className="inline-block mb-6 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(139, 115, 85, 0.9)' }}>
                        <span className="text-white text-sm font-semibold">Featured Collection</span>
                      </div>
                      <h1 className="heading-1 text-white mb-6">
                        {slide.title}
                      </h1>
                      <p className="text-xl md:text-2xl text-white mb-8 leading-relaxed">
                        {slide.subtitle}
                      </p>
                      <Link to={slide.link}>
                        <button className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium text-sm transition-all shadow-lg hover:shadow-xl" style={{ backgroundColor: '#8B7355' }}>
                          {slide.cta}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {/* Elegant Carousel Indicators */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-accent-brown w-12' 
                  : 'bg-white/40 w-8 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Premium Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all flex items-center justify-center"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all flex items-center justify-center"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      {/* Quick Actions for Authenticated Users */}
      {isAuthenticated && user?.role === 'buyer' && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream border-b border-charcoal/10"
        >
          <div className="container-custom py-8">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <motion.div variants={staggerItem}>
                <Link to="/buyer/browse">
                  <Card hoverable padding="lg" className="text-center group">
                    <div className="w-12 h-12 bg-accent-brown/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-brown/20 transition-colors">
                      <svg className="w-6 h-6 text-accent-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-primary">Browse Books</span>
                  </Card>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Link to="/buyer/library">
                  <Card hoverable padding="lg" className="text-center group">
                    <div className="w-12 h-12 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-green/20 transition-colors">
                      <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-primary">My Library</span>
                  </Card>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Link to="/buyer/video-feed">
                  <Card hoverable padding="lg" className="text-center group">
                    <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-info/20 transition-colors">
                      <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-primary">Video Reviews</span>
                  </Card>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem}>
                <Link to="/buyer/cart">
                  <Card hoverable padding="lg" className="text-center group">
                    <div className="w-12 h-12 bg-accent-brown/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-accent-brown/20 transition-colors">
                      <svg className="w-6 h-6 text-accent-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-primary">Shopping Cart</span>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Featured Books */}
      {data.featuredBooks && data.featuredBooks.length > 0 && (
        <section className="py-8 md:py-12 bg-white">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Featured Collection</h2>
                <p className="text-sm text-gray-500">Handpicked selections curated just for you</p>
              </motion.div>
              <Link to="/buyer/browse" className="hidden md:block">
                <button className="text-accent-brown hover:text-accent-brown/80 font-semibold text-sm flex items-center gap-1 transition-colors">
                  VIEW ALL
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            >
              {data.featuredBooks.slice(0, 6).map(book => (
                <motion.div key={book._id} variants={staggerItem}>
                  <BookCard book={book} compact={true} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {data.newBooks && data.newBooks.length > 0 && (
        <section className="py-8 md:py-12 bg-gray-50">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">New Arrivals</h2>
                <p className="text-sm text-gray-500">Discover the latest additions to our collection</p>
              </motion.div>
              <Link to="/buyer/browse?sort=newest" className="hidden md:block">
                <button className="text-accent-brown hover:text-accent-brown/80 font-semibold text-sm flex items-center gap-1 transition-colors">
                  VIEW ALL
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            >
              {data.newBooks.slice(0, 6).map(book => (
                <motion.div key={book._id} variants={staggerItem}>
                  <BookCard book={book} compact={true} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Trending Books */}
      {data.trendingBooks && data.trendingBooks.length > 0 && (
        <section className="py-8 md:py-12 bg-white">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Trending Now</h2>
                <p className="text-sm text-gray-500">Most popular books this week</p>
              </motion.div>
              <Link to="/buyer/browse?sort=rating" className="hidden md:block">
                <button className="text-accent-brown hover:text-accent-brown/80 font-semibold text-sm flex items-center gap-1 transition-colors">
                  VIEW ALL
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5"
            >
              {data.trendingBooks.slice(0, 6).map(book => (
                <motion.div key={book._id} variants={staggerItem}>
                  <BookCard book={book} compact={true} onAddToCart={handleAddToCart} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section - Premium */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="heading-2 mb-4">Why Choose Bookish</h2>
            <p className="body-lg text-text-secondary max-w-2xl mx-auto">
              Experience a marketplace built for book lovers, by book lovers
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={staggerItem}>
              <Card elevated hoverable padding="lg" className="text-center h-full">
                <div className="w-16 h-16 bg-accent-brown/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-accent-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="heading-4 mb-3">Curated Collection</h3>
                <p className="body text-text-secondary">
                  Browse thousands of hand-picked books across every genre, carefully selected by our community of readers.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card elevated hoverable padding="lg" className="text-center h-full">
                <div className="w-16 h-16 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="heading-4 mb-3">Trusted Platform</h3>
                <p className="body text-text-secondary">
                  All sellers are verified and every book is quality-checked to ensure you get exactly what you expect.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem}>
              <Card elevated hoverable padding="lg" className="text-center h-full">
                <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="heading-4 mb-3">Swift Delivery</h3>
                <p className="body text-text-secondary">
                  Fast processing and reliable shipping partners ensure your books arrive quickly and in perfect condition.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative py-16 md:py-20 bg-gradient-to-br from-charcoal via-charcoal to-accent-brown overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-accent-brown rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-green rounded-full blur-3xl"></div>
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
              <Badge variant="success" size="lg" className="mb-4">
                Join Our Community
              </Badge>
              <h2 className="heading-1 text-cream mb-4">
                Ready to Start Your Reading Journey?
              </h2>
              <p className="body-xl text-cream/80 mb-8 max-w-2xl mx-auto">
                  Join thousands of book lovers. Browse our curated collection or start sharing your own literary treasures today.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/register">
                  <button className="group inline-flex items-center justify-center gap-2 text-white px-8 py-3 rounded-lg font-medium text-base transition-all duration-300 shadow-lg hover:shadow-2xl min-w-[200px] whitespace-nowrap hover:scale-105 hover:brightness-110" style={{ backgroundColor: '#8B7355' }}>
                    Sign Up Now!
                    <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </Link>
                <Link to="/about">
                  <button className="inline-flex items-center justify-center border-2 border-cream text-cream hover:bg-cream hover:text-charcoal px-8 py-3 rounded-lg font-medium text-base transition-all duration-300 shadow-lg hover:shadow-2xl min-w-[200px] whitespace-nowrap hover:scale-105">
                    Learn More
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
