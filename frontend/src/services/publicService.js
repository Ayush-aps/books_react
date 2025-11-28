import api from './api';

export const publicService = {
    // Get public book details
    getBook: async (id) => {
        return await api.get(`/books/${id}`);
    },

    // Browse books publicly
    browseBooks: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.genre) params.append('genre', filters.genre);
        if (filters.sort) params.append('sort', filters.sort);

        return await api.get(`/books/browse?${params.toString()}`);
    }
};

export default publicService;
