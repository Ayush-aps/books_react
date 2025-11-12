/**
 * 500 Server Error Page
 */

import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../utils/animations';

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <motion.div 
        className="max-w-2xl w-full text-center"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        {/* 500 Illustration */}
        <div className="mb-12">
          <h1 className="text-9xl font-bold text-brown mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>500</h1>
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content Card */}
        <Card className="max-w-xl mx-auto">
          <Card.Body className="p-8">
            <h2 className="heading-2 text-charcoal mb-4">
              Server Error
            </h2>
            <p className="body text-charcoal/70 mb-8">
              Something went wrong on our end. We're working to fix the issue. Please try again in a few moments.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={handleRefresh}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </Button>
              <Button
                as={Link}
                to="/"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </Button>
            </div>

            {/* Error Details */}
            <div className="pt-6 border-t border-charcoal/10">
              <details className="text-left">
                <summary className="cursor-pointer body-sm text-charcoal/70 hover:text-charcoal font-semibold mb-4 text-center">
                  Technical Details
                </summary>
                <div className="bg-charcoal/5 rounded-lg p-4 body-sm text-charcoal/80 font-mono mt-4">
                  <p className="mb-2"><strong>Error Code:</strong> 500 Internal Server Error</p>
                  <p className="mb-2"><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                  <p className="mb-2"><strong>URL:</strong> {window.location.href}</p>
                  <p className="text-xs text-charcoal/50 mt-4">
                    If this error persists, please contact support with the above information.
                  </p>
                </div>
              </details>
            </div>

            {/* Contact Support */}
            <div className="mt-6 pt-6 border-t border-charcoal/10">
              <p className="body-sm text-charcoal/60 mb-3">Need immediate assistance?</p>
              <Link
                to="/contact"
                className="inline-flex items-center body-sm text-brown hover:text-brown/80 font-semibold transition-colors"
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact Support
              </Link>
            </div>
          </Card.Body>
        </Card>
      </motion.div>
    </div>
  );
};

export default ServerError;
