/**
 * Buyer Service
 * API calls for buyer-specific operations
 */

import api from './api';

export const buyerService = {
  // Browse books
  browseBooks: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    return await api.get(`/buyer/browse?${queryString}`);
  },

  // Get book details
  getBookDetails: async (bookId) => {
    return await api.get(`/buyer/book/${bookId}`);
  },

  // Cart operations
  getCart: async () => {
    return await api.get('/buyer/cart');
  },

  addToCart: async (bookId, quantity = 1) => {
    return await api.post(`/buyer/cart/add/${bookId}`, { quantity });
  },

  updateCartItem: async (itemId, quantity) => {
    return await api.put(`/buyer/cart/update/${itemId}`, { quantity });
  },

  removeFromCart: async (itemId) => {
    return await api.delete(`/buyer/cart/remove/${itemId}`);
  },

  clearCart: async () => {
    return await api.delete('/buyer/cart/clear');
  },

  // Save for Later
  saveForLater: async (itemId) => {
    return await api.post(`/buyer/cart/save-for-later/${itemId}`);
  },

  moveToCart: async (itemId) => {
    return await api.post(`/buyer/cart/move-to-cart/${itemId}`);
  },

  removeFromSaved: async (itemId) => {
    return await api.delete(`/buyer/cart/saved/${itemId}`);
  },

  // Checkout
  getCheckoutData: async () => {
    return await api.get('/buyer/checkout');
  },

  createPaymentIntent: async (amount) => {
    return await api.post('/buyer/create-payment-intent', { amount });
  },

  confirmPayment: async (paymentData) => {
    return await api.post('/buyer/confirm-payment', paymentData);
  },

  // Orders
  getOrders: async () => {
    return await api.get('/buyer/orders');
  },

  getOrderDetails: async (orderId) => {
    return await api.get(`/buyer/orders/${orderId}`);
  },

  // Profile
  getProfile: async () => {
    return await api.get('/buyer/profile');
  },

  updateProfile: async (profileData) => {
    return await api.put('/buyer/profile', profileData);
  },

  // Addresses
  getAddresses: async () => {
    return await api.get('/buyer/addresses');
  },

  createAddress: async (addressData) => {
    return await api.post('/buyer/addresses', addressData);
  },

  updateAddress: async (addressId, addressData) => {
    return await api.put(`/buyer/addresses/${addressId}`, addressData);
  },

  deleteAddress: async (addressId) => {
    return await api.delete(`/buyer/addresses/${addressId}`);
  },

  // Library
  getLibrary: async () => {
    return await api.get('/buyer/library');
  },

  // Video feed
  getVideoFeed: async () => {
    return await api.get('/buyer/video-feed');
  },

  getVideoDetails: async (videoId) => {
    return await api.get(`/buyer/video-feed/watch/${videoId}`);
  },

  likeVideo: async (videoId) => {
    return await api.post(`/buyer/video-feed/like/${videoId}`);
  },

  commentOnVideo: async (videoId, content) => {
    return await api.post(`/buyer/video-feed/comment/${videoId}`, { content });
  },

  // Complaints
  getComplaints: async () => {
    return await api.get('/buyer/complaints');
  },

  getComplaintDetails: async (complaintId) => {
    return await api.get(`/buyer/complaints/${complaintId}`);
  },

  registerComplaint: async (complaintData) => {
    return await api.post('/buyer/complaints', complaintData);
  },
};

export default buyerService;
