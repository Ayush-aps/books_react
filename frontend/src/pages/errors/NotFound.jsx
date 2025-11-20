/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        className="max-w-2xl w-full text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* 404 Illustration */}
        <div className="mb-12">
          <h1 className="text-9xl font-bold text-brown mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>404</h1>
          <div className="relative">
            <svg
              className="w-64 h-64 mx-auto text-taupe/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Content Card */}
        <Card className="max-w-xl mx-auto">
          <Card.Body className="p-8">
            <h2 className="heading-2 text-charcoal mb-4">
              Page Not Found
            </h2>
            <p className="body text-charcoal/70 mb-8">
              We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL was mistyped.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                as={Link}
                to="/"
                variant="primary"
                size="lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                size="lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go Back
              </Button>
            </div>

            {/* Help Section */}
            <div className="pt-6 border-t border-charcoal/10">
              <p className="body-sm text-charcoal/60 mb-4">Looking for something specific?</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/buyer/browse" className="body-sm text-brown hover:text-brown/80 font-semibold transition-colors">
                  Browse Books
                </Link>
                <Link to="/about" className="body-sm text-brown hover:text-brown/80 font-semibold transition-colors">
                  About Us
                </Link>
                <Link to="/contact" className="body-sm text-brown hover:text-brown/80 font-semibold transition-colors">
                  Contact Support
                </Link>
                <Link to="/pricing" className="body-sm text-brown hover:text-brown/80 font-semibold transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
};

export default NotFound;
