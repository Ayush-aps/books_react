/**
 * Auth Service
 * API calls for authentication
 */

import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Login
  login: async (email, password) => {
    return await api.post('/auth/login', { email, password });
  },

  // Logout
  logout: async () => {
    return await api.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  // Check authentication status
  checkAuth: async () => {
    return await api.get('/auth/check');
  },
};

export default authService;
