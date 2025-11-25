/**
 * Admin Service
 * API calls for admin operations
 */

import api from './api';

const adminService = {
  // Get all users
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Toggle user status
  toggleUserStatus: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/status`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get system reports
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  // Get content for moderation
  getContent: async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/content${params}`);
    return response.data;
  },

  // Get book details
  getBookDetails: async (bookId) => {
    const response = await api.get(`/admin/content/${bookId}`);
    return response.data;
  },

  // Approve book
  approveBook: async (bookId) => {
    const response = await api.post(`/admin/content/${bookId}/approve`);
    return response.data;
  },

  // Reject book
  rejectBook: async (bookId, reason) => {
    const response = await api.post(`/admin/content/${bookId}/reject`, { reason });
    return response.data;
  },

  // Get all complaints
  getComplaints: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    if (filters.source) params.append('source', filters.source);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/admin/complaints?${params.toString()}`);
    return response.data;
  },

  // Get complaint details
  getComplaintDetails: async (complaintId) => {
    const response = await api.get(`/admin/complaints/${complaintId}`);
    return response.data;
  },

  // Respond to complaint
  respondToComplaint: async (complaintId, responseData) => {
    const response = await api.post(`/admin/complaints/${complaintId}/respond`, responseData);
    return response.data;
  },

  // Get all orders
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    const response = await api.put(`/admin/orders/${orderId}`, orderData);
    return response.data;
  },

  // Browse all books
  getBooks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);

    const response = await api.get(`/admin/books?${params.toString()}`);
    return response.data;
  },

  // Seed admin account
  seedAdmin: async () => {
    const response = await api.get('/admin/seed-admin');
    return response.data;
  },
};

export default adminService;
export { adminService };
