/**
 * Admin Order Details Page
 * View and manage individual order details
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderUpdateSchema } from '../../schemas/allFormSchemas';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import SuccessToast from '../../components/SuccessToast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // React Hook Form setup
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      orderStatus: 'ordered',
      expectedDelivery: '',
      carrier: '',
      trackingNumber: '',
      trackingUrl: '',
      adminNotes: ''
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data.data || response.data;
      setOrder(orderData);

      // Initialize form fields with React Hook Form
      reset({
        orderStatus: orderData.orderStatus || orderData.status || 'ordered',
        trackingNumber: orderData.trackingInfo?.trackingNumber || '',
        carrier: orderData.trackingInfo?.carrier || '',
        trackingUrl: orderData.trackingInfo?.trackingUrl || '',
        adminNotes: orderData.adminNotes || '',
        expectedDelivery: orderData.expectedDelivery ? new Date(orderData.expectedDelivery).toISOString().split('T')[0] : ''
      });

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (data) => {
    try {
      setUpdating(true);
      await api.put(`/admin/orders/${id}`, {
        orderStatus: data.orderStatus,
        trackingNumber: data.trackingNumber || undefined,
        carrier: data.carrier || undefined,
        trackingUrl: data.trackingUrl || undefined,
        adminNotes: data.adminNotes || undefined,
        expectedDelivery: data.expectedDelivery || undefined
      });

      setSuccessMessage('Order updated successfully');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Refresh order details
      fetchOrderDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      ordered: 'info',
      processing: 'info',
      shipped: 'default',
      delivered: 'success',
      cancelled: 'error'
    };
    return variants[status] || 'default';
  };

  const getPaymentStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      completed: 'success',
      failed: 'error',
      refunded: 'default'
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage message="Order not found" />
          <div className="mt-6">
            <button 
              onClick={() => navigate('/admin/orders')}
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
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <button 
              onClick={() => navigate('/admin/orders')}
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
              Back to Orders
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-charcoal mb-1 sm:mb-2">Order #{order.orderId || order._id.slice(-8)}</h1>
              <p className="text-xs sm:text-sm text-charcoal/70">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Badge variant={getStatusVariant(order.orderStatus || order.status)} size="lg" className="text-xs sm:text-sm">
                {(order.orderStatus || order.status || 'ordered').charAt(0).toUpperCase() +
                  (order.orderStatus || order.status || 'ordered').slice(1)}
              </Badge>
              <Badge variant={getPaymentStatusVariant(order.paymentStatus)} size="lg" className="text-xs sm:text-sm">
                Payment: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
              </Badge>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 sm:mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Items */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-white font-serif">Order Items</h2>
                </Card.Header>
                <Card.Body className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-surface last:border-0 last:pb-0">
                        <img
                          src={item.coverImage || '/img/books/default-book.jpg'}
                          alt={item.title}
                          className="w-16 h-20 sm:w-20 sm:h-28 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-charcoal mb-1 text-sm sm:text-base">{item.title}</h4>
                          <p className="text-xs sm:text-sm text-charcoal/70 mb-2">by {item.author}</p>
                          {item.seller && (
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-2">
                              Seller: <span className="font-medium text-charcoal">{item.seller.name}</span>
                              {item.seller.email && (
                                <span className="text-charcoal/50"> ({item.seller.email})</span>
                              )}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            <p className="text-charcoal/60">Qty: {item.quantity}</p>
                            <p className="text-charcoal/60">•</p>
                            <p className="font-medium text-brown">₹{item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-brown">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-surface space-y-2">
                    <div className="flex justify-between text-sm sm:text-base text-charcoal/70">
                      <span>Subtotal</span>
                      <span>₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-charcoal/70">
                      <span>Tax</span>
                      <span>₹{(order.totalAmount * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base text-charcoal/70">
                      <span>Shipping</span>
                      <span>₹5.99</span>
                    </div>
                    <div className="flex justify-between text-lg sm:text-xl font-bold text-charcoal pt-2 border-t border-surface">
                      <span>Total</span>
                      <span className="text-brown">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Customer Information - Mobile Optimized */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-white font-serif">Customer Information</h2>
                </Card.Header>
                <Card.Body className="p-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2 sm:mb-3 text-sm sm:text-base">Buyer Details</h4>
                      <p className="text-sm sm:text-base text-charcoal">{order.buyer?.name || 'N/A'}</p>
                      <p className="text-xs sm:text-sm text-charcoal/70">{order.buyer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-charcoal mb-2 sm:mb-3 text-sm sm:text-base">Shipping Address</h4>
                      <p className="text-sm sm:text-base text-charcoal">{order.shippingAddress.name}</p>
                      <p className="text-xs sm:text-sm text-charcoal/70">{order.shippingAddress.address}</p>
                      <p className="text-xs sm:text-sm text-charcoal/70">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                      </p>
                      <p className="text-xs sm:text-sm text-charcoal/70 mt-2">Phone: {order.shippingAddress.phone}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Payment Information */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-white font-serif">Payment Information</h2>
                </Card.Header>
                <Card.Body className="p-3 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Payment Method</p>
                      <p className="text-sm sm:text-base font-medium text-charcoal">
                        {order.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Payment Status</p>
                      <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs sm:text-sm">
                        {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                      </Badge>
                    </div>
                    {order.paymentDetails?.paymentId && (
                      <div className="col-span-2">
                        <p className="text-xs sm:text-sm text-charcoal/60 mb-1">Transaction ID</p>
                        <p className="text-xs sm:text-sm font-mono text-charcoal break-all">{order.paymentDetails.paymentId}</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Update Order Status */}
          <div className="lg:col-span-1">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header className="bg-brown">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-white font-serif">Update Order</h2>
                </Card.Header>
                <Card.Body className="p-3 sm:p-6">
                  <form onSubmit={handleSubmit(handleUpdateOrder)} className="space-y-3 sm:space-y-4">
                    <div>
                      <Input.Select
                        id="orderStatus"
                        label="Order Status"
                        {...register('orderStatus')}
                        error={errors.orderStatus?.message}
                      >
                        <option value="ordered">Ordered</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Input.Select>
                    </div>

                    <Input
                      id="expectedDelivery"
                      type="date"
                      label="Expected Delivery Date"
                      {...register('expectedDelivery')}
                      error={errors.expectedDelivery?.message}
                    />

                    <Input
                      id="carrier"
                      label="Shipping Carrier"
                      {...register('carrier')}
                      placeholder="e.g., FedEx, UPS, USPS"
                      error={errors.carrier?.message}
                    />

                    <Input
                      id="trackingNumber"
                      label="Tracking Number"
                      {...register('trackingNumber')}
                      placeholder="Enter tracking number"
                      error={errors.trackingNumber?.message}
                    />

                    <Input
                      id="trackingUrl"
                      label="Tracking URL"
                      {...register('trackingUrl')}
                      placeholder="https://..."
                      error={errors.trackingUrl?.message}
                    />

                    <Input.Textarea
                      id="adminNotes"
                      label="Admin Notes"
                      {...register('adminNotes')}
                      placeholder="Internal notes about this order..."
                      rows={4}
                      error={errors.adminNotes?.message}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={updating}
                      disabled={updating}
                      className="text-sm sm:text-base"
                    >
                      Update Order
                    </Button>
                  </form>

                  {/* Order Timeline */}
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-surface">
                      <h3 className="font-semibold text-charcoal mb-3 sm:mb-4 text-sm sm:text-base">Order Timeline</h3>
                      <div className="space-y-2 sm:space-y-3">
                        {order.statusHistory.map((history, index) => (
                          <div key={index} className="flex gap-2 sm:gap-3">
                            <div className="w-2 h-2 rounded-full bg-brown mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-medium text-charcoal">
                                {history.status?.charAt(0).toUpperCase() + history.status?.slice(1)}
                              </p>
                              <p className="text-xs sm:text-sm text-charcoal/60">
                                {new Date(history.date).toLocaleString()}
                              </p>
                              {history.note && (
                                <p className="text-xs sm:text-sm text-charcoal/70 mt-1">{history.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
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
    </div>
  );
};

export default OrderDetails;
