/**
 * Axios API Service
 * Centralized HTTP client for making API requests
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth tokens if using JWT
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response; // Return the full response object
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - let the component handle it
        // window.location.href = '/login'; // Removed to prevent loop
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ message: 'No response from server' });
    } else {
      // Something else happened
      return Promise.reject({ message: error.message });
    }
  }
);

// =====================
// Auth API
// =====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  checkAuth: () => api.get('/auth/check'),
  getMe: () => api.get('/auth/me'),
};

// =====================
// Public API
// =====================
export const publicAPI = {
  getHome: () => api.get('/public/home'),
  getAbout: () => api.get('/public/about'),
  getPricing: () => api.get('/public/pricing'),
  sendContact: (data) => api.post('/public/contact', data),
  browseBooksPublic: (params) => api.get('/public/books/browse', { params }),
};

// =====================
// Buyer API
// =====================
export const buyerAPI = {
  // Dashboard
  getDashboard: () => api.get('/buyer/dashboard'),

  // Browse & Books
  browse: (params) => api.get('/buyer/browse', { params }),
  getBook: (id) => api.get(`/buyer/book/${id}`),

  // Cart
  getCart: () => api.get('/buyer/cart'),
  addToCart: (bookId, quantity = 1) => api.post(`/buyer/cart/add/${bookId}`, { quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/buyer/cart/update/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/buyer/cart/remove/${itemId}`),
  clearCart: () => api.delete('/buyer/cart/clear'),

  // Checkout & Orders
  getCheckout: () => api.get('/buyer/checkout'),
  getMyOrders: () => api.get('/orders/my-orders'),
  getBuyerOrders: () => api.get('/orders/buyer/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  getBuyerOrder: (id) => api.get(`/orders/buyer/order/${id}`),

  // Addresses
  getAddresses: () => api.get('/buyer/addresses'),
  createAddress: (data) => api.post('/buyer/addresses', data),
  updateAddress: (id, data) => api.put(`/buyer/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/buyer/addresses/${id}`),

  // Profile
  getProfile: () => api.get('/buyer/profile'),
  updateProfile: (data) => api.put('/buyer/profile', data),

  // Complaints
  getComplaints: () => api.get('/buyer/complaints'),
  createComplaint: (data) => api.post('/buyer/complaints', data),
  getComplaint: (id) => api.get(`/buyer/complaints/${id}`),
};

// =====================
// Seller API
// =====================
export const sellerAPI = {
  // Dashboard
  getDashboard: () => api.get('/seller/dashboard'),

  // Inventory & Books
  getInventory: (params) => api.get('/seller/inventory', { params }),
  getBooks: (params) => api.get('/seller/books', { params }),
  getBook: (id) => api.get(`/seller/book/${id}`),
  uploadBook: (data) => api.post('/seller/upload', data),
  updateBook: (id, data) => api.put(`/seller/book/${id}`, data),
  deleteBook: (id) => api.delete(`/seller/book/${id}`),

  // Orders
  getOrders: (params) => api.get('/seller/orders', { params }),
  getSellerOrders: () => api.get('/orders/seller-orders'),
  getOrder: (id) => api.get(`/seller/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/seller/order/${id}/status`, { status }),

  // Complaints
  getComplaints: () => api.get('/seller/complaints'),
  createComplaint: (data) => api.post('/seller/complaints', data),
};

// =====================
// Admin API
// =====================
export const adminAPI = {
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.put(`/admin/user/${id}/role`, { role }),
  updateUserStatus: (id, status) => api.put(`/admin/user/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/user/${id}`),

  // Books & Content
  getBooks: (params) => api.get('/admin/books', { params }),
  getContent: (params) => api.get('/admin/content', { params }),
  getContentItem: (id) => api.get(`/admin/content/${id}`),
  approveContent: (id) => api.post(`/admin/content/${id}/approve`),
  rejectContent: (id, reason) => api.post(`/admin/content/${id}/reject`, { reason }),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getAdminOrders: () => api.get('/orders/admin/orders'),
  updateOrder: (id, data) => api.put(`/admin/order/${id}`, data),

  // Reports
  getReports: (params) => api.get('/admin/reports', { params }),

  // Complaints
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  respondToComplaint: (id, response) => api.post(`/admin/complaints/${id}/respond`, { response }),
};

// =====================
// Library API
// =====================
export const libraryAPI = {
  getLibrary: () => api.get('/library'),
  addToLibrary: (bookId) => api.post(`/library/add/${bookId}`),
  getLibraryBook: (bookId) => api.get(`/library/book/${bookId}`),
  updateProgress: (data) => api.put('/library/update-progress', data),
  removeFromLibrary: (bookId) => api.delete(`/library/remove/${bookId}`),
  getProgressData: () => api.get('/library/progress-data'),
  createBookmark: (data) => api.post('/library/bookmark', data),
  getBookmarks: (bookId) => api.get(`/library/bookmark/${bookId}`),
};

// =====================
// Books API
// =====================
export const booksAPI = {
  browse: (params) => api.get('/books/browse', { params }),
  getBook: (id) => api.get(`/books/${id}`),
};

// =====================
// Video API
// =====================
export const videoAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getBookVideos: (params) => api.get('/videos/books', { params }),
  uploadVideo: (formData) => api.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getVideo: (id) => api.get(`/videos/${id}`),
  likeVideo: (id) => api.post(`/videos/${id}/like`),
  commentOnVideo: (id, comment) => api.post(`/videos/${id}/comment`, { comment }),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
};

// =====================
// Subscription API
// =====================
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getStatus: () => api.get('/subscription/status'),
  createCheckoutSession: (planId) => api.post('/subscription/create-checkout-session', { planId }),
  verifySession: (sessionId) => api.get('/subscription/verify-session', { params: { sessionId } }),
  cancelSubscription: () => api.post('/subscription/cancel'),
};

// =====================
// Payment/Orders API
// =====================
export const paymentAPI = {
  createPaymentIntent: (data) => api.post('/orders/create-payment-intent', data),
  createOrder: (data) => api.post('/orders', data),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// =====================
// Moderator API
// =====================
export const moderatorAPI = {
  getPendingUsers: (params) => api.get('/admin/moderator/pending-users', { params }),
  verifyUser: (userId, action) => api.post('/admin/moderator/verify-user', { userId, action }),
  getEmployeeStats: () => api.get('/admin/moderator/employee-stats'),
  getApprovedBooks: (params) => api.get('/admin/moderator/approved-books', { params }),
  getApprovedUsers: (params) => api.get('/admin/moderator/approved-users', { params }),
  // User Management
  getUsers: (params) => api.get('/admin/moderator/users', { params }),
  getUser: (userId) => api.get(`/admin/moderator/users/${userId}`),
  deleteUser: (userId) => api.delete(`/admin/moderator/users/${userId}`),
  promoteEmployee: (userId) => api.put(`/admin/moderator/users/${userId}/promote`),
  // Global Stats
  getGlobalStats: () => api.get('/admin/moderator/global-stats'),
  // Book Locking
  claimBook: (bookId) => api.patch(`/admin/moderator/books/${bookId}/claim`),
  releaseBook: (bookId) => api.patch(`/admin/moderator/books/${bookId}/release`),
  // Orders & Reports
  getOrders: (params) => api.get('/admin/moderator/orders', { params }),
  updateOrderStatus: (orderId, data) => api.patch(`/admin/moderator/orders/${orderId}/status`, data),
  getReports: () => api.get('/admin/moderator/reports'),
};

// =====================
// Employee API
// =====================
export const employeeAPI = {
  getPendingBooks: (params) => api.get('/employee/pending-books', { params }),
  reviewBook: (data) => api.post('/employee/review-book', data),
  // Orders
  getOrders: (params) => api.get('/employee/orders', { params }),
  updateOrderStatus: (orderId, data) => api.patch(`/employee/orders/${orderId}/status`, data),
  // Complaints
  getComplaints: (params) => api.get('/employee/complaints', { params }),
  claimComplaint: (complaintId) => api.patch('/employee/claim-complaint', { complaintId }),
  resolveComplaint: (data) => api.post('/employee/resolve-complaint', data),
  escalateComplaint: (data) => api.post('/employee/escalate-complaint', data),
};

export default api;
