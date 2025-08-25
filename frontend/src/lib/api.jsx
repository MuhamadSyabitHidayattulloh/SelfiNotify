import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Applications API functions
export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
  regenerateToken: (id) => api.post(`/applications/${id}/regenerate-token`),
  bulkDelete: (ids) => api.post('/applications/bulk-delete', { ids }),
};

// Notifications API functions
export const notificationsAPI = {
  send: (data) => api.post('/notifications/send', data),
  bulkSend: (data) => api.post('/notifications/bulk-send', { data }),
  sendTest: (application_id) => api.post('/notifications/test', { application_id }),
  getHistory: (params = {}) => api.get('/notifications/history', { params }),
  getStats: () => api.get('/notifications/stats'),
  getById: (id) => api.get(`/notifications/${id}`),
  resend: (id) => api.post(`/notifications/${id}/resend`),
  delete: (id) => api.delete(`/notifications/${id}`),
  bulkDelete: (ids) => api.post('/notifications/bulk-delete', { ids }),
};

// Socket/Connection API functions
export const socketAPI = {
  getConnectionStats: () => api.get('/socket/connection-stats'),
};

export default api;

