/**
 * Seller Service
 * API calls for seller operations
 */

import api from './api';

const sellerService = {
  // Get dashboard analytics
  getDashboard: async () => {
    const response = await api.get('/seller/dashboard');
    return response.data;
  },

  // Get inventory
  getInventory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort) params.append('sort', filters.sort);

    const response = await api.get(`/seller/inventory?${params.toString()}`);
    return response.data;
  },

  // Search books by title/author from Google Books API
  searchBooks: async (query, maxResults = 10) => {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('maxResults', maxResults);
    const response = await api.get(`/seller/books/search?${params.toString()}`);
    return response.data;
  },

  // Lookup book by ISBN from Google Books API
  lookupBookByISBN: async (isbn) => {
    const response = await api.get(`/seller/books/lookup/${isbn}`);
    return response.data;
  },

  // Upload a new book
  uploadBook: async (bookData, epubFile = null) => {
    const formData = new FormData();
    
    // Append all book data
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });
    
    // Append ePub file if provided
    if (epubFile) {
      formData.append('epubFile', epubFile);
    }
    
    const response = await api.post('/seller/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get book details
  getBookDetails: async (bookId) => {
    const response = await api.get(`/seller/books/${bookId}`);
    return response.data;
  },

  // Get book (alias for getBookDetails for backward compatibility)
  getBook: async (bookId) => {
    const response = await api.get(`/seller/books/${bookId}`);
    return response.data;
  },

  // Update book
  updateBook: async (bookId, bookData, epubFile = null) => {
    const formData = new FormData();
    
    // Append all book data
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });
    
    // Append ePub file if provided
    if (epubFile) {
      formData.append('epubFile', epubFile);
    }
    
    const response = await api.put(`/seller/books/${bookId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete book
  deleteBook: async (bookId) => {
    const response = await api.delete(`/seller/books/${bookId}`);
    return response.data;
  },

  // Get orders
  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/seller/orders?${params.toString()}`);
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId) => {
    const response = await api.get(`/seller/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/seller/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Get complaints
  getComplaints: async () => {
    const response = await api.get('/seller/complaints');
    return response.data;
  },

  // Submit complaint
  submitComplaint: async (complaintData) => {
    const response = await api.post('/seller/complaints', complaintData);
    return response.data;
  },

  // Browse all books
  browseBooks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);

    const response = await api.get(`/seller/books?${params.toString()}`);
    return response.data;
  },
};

export default sellerService;
export { sellerService };
