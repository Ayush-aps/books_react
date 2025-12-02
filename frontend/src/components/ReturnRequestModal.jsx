/**
 * Return Request Modal Component
 * A modal form for submitting return requests with proper validation
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const ReturnRequestModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            setError('Please provide a reason for return');
            return;
        }

        if (reason.trim().length < 10) {
            setError('Reason must be at least 10 characters');
            return;
        }

        // Check if reason contains only numbers
        if (/^\d+$/.test(reason.trim())) {
            setError('Reason cannot contain only numbers. Please provide a meaningful description.');
            return;
        }

        // Check if reason contains at least one letter
        if (!/[a-zA-Z]/.test(reason.trim())) {
            setError('Reason must contain at least some letters to describe the issue.');
            return;
        }

        onSubmit(reason.trim());
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
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
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        Request Return
                                    </h3>
                                    <button
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="mb-4">
                                    <label htmlFor="return-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Return <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="return-reason"
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            setError('');
                                        }}
                                        disabled={isLoading}
                                        placeholder="Describe the issue with your order. Please provide a meaningful description (minimum 10 characters, must contain text)..."
                                        rows={5}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {error}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        {reason.length}/500 characters
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex gap-3">
                                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-medium mb-1">Return Policy</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Returns accepted within 10 days of delivery</li>
                                                <li>Admin will review your request</li>
                                                <li>You'll be notified of the decision</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        onClick={handleClose}
                                        variant="outline"
                                        size="lg"
                                        fullWidth
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        fullWidth
                                        disabled={isLoading || !reason.trim()}
                                        isLoading={isLoading}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                        {isLoading ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReturnRequestModal;
