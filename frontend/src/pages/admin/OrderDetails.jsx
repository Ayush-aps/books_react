/**
 * Admin Order Details Page
 * View and manage individual order details
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

  // Form state for updates
  const [orderStatus, setOrderStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      const orderData = response.data.data || response.data;
      setOrder(orderData);
      
      // Initialize form fields
      setOrderStatus(orderData.orderStatus || orderData.status || 'ordered');
      setTrackingNumber(orderData.trackingInfo?.trackingNumber || '');
      setCarrier(orderData.trackingInfo?.carrier || '');
      setTrackingUrl(orderData.trackingInfo?.trackingUrl || '');
      setAdminNotes(orderData.adminNotes || '');
      setExpectedDelivery(orderData.expectedDelivery ? new Date(orderData.expectedDelivery).toISOString().split('T')[0] : '');
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.put(`/admin/orders/${id}`, {
        orderStatus,
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
        trackingUrl: trackingUrl || undefined,
        adminNotes: adminNotes || undefined,
        expectedDelivery: expectedDelivery || undefined
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
            <Button onClick={() => navigate('/admin/orders')} variant="outline">
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/admin/orders')}
              variant="ghost"
              size="sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </Button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="heading-1 text-charcoal mb-2">Order #{order.orderId || order._id.slice(-8)}</h1>
              <p className="body text-charcoal/70">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Badge variant={getStatusVariant(order.orderStatus || order.status)} size="lg">
                {(order.orderStatus || order.status || 'ordered').charAt(0).toUpperCase() + 
                 (order.orderStatus || order.status || 'ordered').slice(1)}
              </Badge>
              <Badge variant={getPaymentStatusVariant(order.paymentStatus)} size="lg">
                Payment: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
              </Badge>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-6"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header>
                  <h2 className="heading-3 text-charcoal">Order Items</h2>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-surface last:border-0 last:pb-0">
                        <img
                          src={item.coverImage || '/img/books/default-book.jpg'}
                          alt={item.title}
                          className="w-20 h-28 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-charcoal mb-1">{item.title}</h4>
                          <p className="body-sm text-charcoal/70 mb-2">by {item.author}</p>
                          <div className="flex items-center gap-4">
                            <p className="body-sm text-charcoal/60">Qty: {item.quantity}</p>
                            <p className="body-sm text-charcoal/60">•</p>
                            <p className="body-sm font-medium text-brown">₹{item.price.toFixed(2)} each</p>
                          </div>
                          {item.seller && (
                            <p className="body-sm text-charcoal/50 mt-2">
                              Seller: {item.seller.name} ({item.seller.email})
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="heading-5 text-brown">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-6 pt-6 border-t-2 border-surface space-y-2">
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Subtotal</span>
                      <span>₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Tax</span>
                      <span>₹{(order.totalAmount * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between body text-charcoal/70">
                      <span>Shipping</span>
                      <span>₹5.99</span>
                    </div>
                    <div className="flex justify-between heading-4 text-charcoal pt-2 border-t border-surface">
                      <span>Total</span>
                      <span className="text-brown">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>

            {/* Customer Information */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Card.Header>
                  <h2 className="heading-3 text-charcoal">Customer Information</h2>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3">Buyer Details</h4>
                      <p className="body text-charcoal">{order.buyer?.name || 'N/A'}</p>
                      <p className="body-sm text-charcoal/70">{order.buyer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-charcoal mb-3">Shipping Address</h4>
                      <p className="body text-charcoal">{order.shippingAddress.name}</p>
                      <p className="body-sm text-charcoal/70">{order.shippingAddress.address}</p>
                      <p className="body-sm text-charcoal/70">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                      </p>
                      <p className="body-sm text-charcoal/70 mt-2">Phone: {order.shippingAddress.phone}</p>
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
                <Card.Header>
                  <h2 className="heading-3 text-charcoal">Payment Information</h2>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="body-sm text-charcoal/60 mb-1">Payment Method</p>
                      <p className="body font-medium text-charcoal">
                        {order.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="body-sm text-charcoal/60 mb-1">Payment Status</p>
                      <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                        {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                      </Badge>
                    </div>
                    {order.paymentDetails?.paymentId && (
                      <div className="col-span-2">
                        <p className="body-sm text-charcoal/60 mb-1">Transaction ID</p>
                        <p className="body-sm font-mono text-charcoal">{order.paymentDetails.paymentId}</p>
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
                <Card.Header>
                  <h2 className="heading-3 text-charcoal">Update Order</h2>
                </Card.Header>
                <Card.Body>
                  <form onSubmit={handleUpdateOrder} className="space-y-4">
                    <Input.Select
                      id="orderStatus"
                      label="Order Status"
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      required
                    >
                      <option value="ordered">Ordered</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </Input.Select>

                    <Input
                      id="expectedDelivery"
                      type="date"
                      label="Expected Delivery Date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                    />

                    <Input
                      id="carrier"
                      label="Shipping Carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g., FedEx, UPS, USPS"
                    />

                    <Input
                      id="trackingNumber"
                      label="Tracking Number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />

                    <Input
                      id="trackingUrl"
                      label="Tracking URL"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://..."
                    />

                    <Input.Textarea
                      id="adminNotes"
                      label="Admin Notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this order..."
                      rows={4}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={updating}
                      disabled={updating}
                    >
                      Update Order
                    </Button>
                  </form>

                  {/* Order Timeline */}
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-surface">
                      <h3 className="font-semibold text-charcoal mb-4">Order Timeline</h3>
                      <div className="space-y-3">
                        {order.statusHistory.map((history, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-brown mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="body-sm font-medium text-charcoal">
                                {history.status?.charAt(0).toUpperCase() + history.status?.slice(1)}
                              </p>
                              <p className="body-sm text-charcoal/60">
                                {new Date(history.date).toLocaleString()}
                              </p>
                              {history.note && (
                                <p className="body-sm text-charcoal/70 mt-1">{history.note}</p>
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
