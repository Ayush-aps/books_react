/**
 * SubscriptionModal Component
 * Netflix-like modal that blocks access to premium features for unsubscribed users
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

const SubscriptionModal = ({ isOpen, onClose, message, showCloseButton = true }) => {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    navigate('/pricing');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/buyer/dashboard');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-charcoal/90 backdrop-blur-sm z-modal-backdrop"
            onClick={showCloseButton ? handleClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden pointer-events-auto"
            >
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-brown to-accent-brown p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                    <svg 
                      className="w-8 h-8 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                  </div>
                  <h2 className="heading-2 mb-2">Premium Feature</h2>
                  <p className="body-lg opacity-90">
                    Subscribe to unlock access
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="body-lg text-text-secondary mb-6 leading-relaxed">
                  {message || "Library access is only available for subscribed users. Subscribe now to access thousands of books and start your reading journey!"}
                </p>

                {/* Features List */}
                <div className="mb-8 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="body-md text-text-primary font-medium">Unlimited Access</p>
                      <p className="body-sm text-text-secondary">Access entire library of books</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="body-md text-text-primary font-medium">Video Reviews</p>
                      <p className="body-sm text-text-secondary">Watch and share book video reviews</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="body-md text-text-primary font-medium">Progress Tracking</p>
                      <p className="body-sm text-text-secondary">Track your reading progress</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleViewPlans}
                    className="font-semibold"
                  >
                    View Subscription Plans
                  </Button>
                  {showCloseButton && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleClose}
                      className="sm:w-auto"
                    >
                      Close
                    </Button>
                  )}
                </div>

                {/* Pricing Preview */}
                <div className="mt-6 pt-6 border-t border-border-light">
                  <p className="body-sm text-text-tertiary text-center">
                    Plans starting at <span className="font-semibold text-brown">₹199/month</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
