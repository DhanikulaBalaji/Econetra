import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('supabase_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('supabase_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions
export const apiClient = {
  // Products
  products: {
    getAll: (params = {}) => api.get('/api/products', { params }),
    getById: (id) => api.get(`/api/products/${id}`),
    create: (data) => api.post('/api/products', data),
    update: (id, data) => api.put(`/api/products/${id}`, data),
    delete: (id) => api.delete(`/api/products/${id}`),
  },

  // DPPs
  dpps: {
    getAll: (params = {}) => api.get('/api/dpps', { params }),
    getById: (id) => api.get(`/api/dpps/${id}`),
    getPublic: (id) => api.get(`/api/dpps/public/${id}`),
    create: (data) => api.post('/api/dpps', data),
    verify: (hash) => api.get(`/api/dpps/verify/${hash}`),
  },

  // QR Codes
  qrCodes: {
    generate: (dppId) => api.get(`/api/qr_codes/${dppId}`),
    download: (dppId) => api.get(`/api/qr_codes/${dppId}/download`, {
      responseType: 'blob'
    }),
    generateBatch: (dppIds) => api.post('/api/qr_codes/batch', { dpp_ids: dppIds }),
    getAll: (params = {}) => api.get('/api/qr_codes', { params }),
  },

  // Users
  users: {
    getAll: (params = {}) => api.get('/api/users', { params }),
    getById: (id) => api.get(`/api/users/${id}`),
    create: (data) => api.post('/api/users', data),
    update: (id, data) => api.put(`/api/users/${id}`, data),
    delete: (id) => api.delete(`/api/users/${id}`),
  },
}

export default api

