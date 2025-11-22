/**
 * Register Complaint Page (Buyer)
 * Submit complaints about orders or sellers
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import useFormValidation from '../../hooks/useFormValidation';
import { validateRequired, validateLength } from '../../utils/validation';

const RegisterComplaint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);

  const complaintCategories = [
    'Product Quality',
    'Delivery Issue',
    'Wrong Item',
    'Damaged Item',
    'Missing Item',
    'Seller Communication',
    'Refund Issue',
    'Other'
  ];

  const priorityLevels = {
    'Damaged Item': 'high',
    'Wrong Item': 'high',
    'Missing Item': 'high',
    'Delivery Issue': 'medium',
    'Refund Issue': 'medium',
    'Product Quality': 'medium',
    'Seller Communication': 'low',
    'Other': 'low'
  };

  // Validation schema
  const validationSchema = {
    orderId: (value) => validateRequired(value, 'Order'),
    category: (value) => validateRequired(value, 'Category'),
    subject: (value) => validateRequired(value, 'Subject'),
    description: (value) => {
      const requiredCheck = validateRequired(value, 'Description');
      if (!requiredCheck.isValid) return requiredCheck;
      return validateLength(value, 20, 1000, 'Description');
    }
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isValid
  } = useFormValidation(
    {
      orderId: orderId || '',
      category: '',
      subject: '',
      description: ''
    },
    validationSchema
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await api.get('/buyer/orders');
      setOrders(response.data.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const onSubmit = async (formData) => {
    setError(null);

    try {
      await api.post('/buyer/complaints', formData);
      navigate('/buyer/profile', {
        state: { success: 'Complaint registered successfully. We will review it and get back to you soon.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    }
  };

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register Complaint</h1>
          <p className="text-gray-600 mt-2">
            Have an issue with your order? Let us know and we'll help resolve it.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Order Selection */}
          <div>
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Select Order <span className="text-red-500">*</span>
            </label>
            <select
              id="orderId"
              name="orderId"
              value={values.orderId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${touched.orderId && errors.orderId
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  Order #{order._id.slice(-8)} - {new Date(order.createdAt).toLocaleDateString()} - ${order.totalAmount.toFixed(2)}
                </option>
              ))}
            </select>
            {touched.orderId && errors.orderId && (
              <p className="text-red-500 text-sm mt-1">{errors.orderId}</p>
            )}
            {orders.length === 0 && (
              <p className="text-gray-500 text-sm mt-1">
                You need to have at least one order to register a complaint.
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={values.category}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${touched.category && errors.category
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
            >
              <option value="">Select category...</option>
              {complaintCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {touched.category && errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border ${touched.subject && errors.subject
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2`}
              placeholder="Brief summary of your issue"
            />
            {touched.subject && errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="6"
              className={`w-full px-3 py-2 border ${touched.description && errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                } rounded-md focus:outline-none focus:ring-2 resize-none`}
              placeholder="Please provide detailed information about your complaint (minimum 20 characters)..."
            />
            {touched.description && errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {values.description.length}/1000 characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our team will review your complaint within 24-48 hours</li>
              <li>• You'll receive updates via email</li>
              <li>• We'll work with the seller to resolve the issue</li>
              <li>• You can track complaint status in your profile</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || orders.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Submitting...
                </span>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterComplaint;
