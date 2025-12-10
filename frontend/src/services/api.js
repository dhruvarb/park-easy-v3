import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to unwrap data
api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload),
  login: (payload) => api.post('/auth/login', payload),
};

export const userApi = {
  me: () => api.get('/auth/me'),
  getSlot: (id) => api.get(`/user/slots/${id}`),
  addReview: (data) => api.post("/user/reviews", data),
  getReviews: (id) => api.get(`/user/slots/${id}/reviews`),
  getPayments: () => api.get("/user/payments"),
  requestRefund: (data) => api.post("/user/refunds", data),
};

export const adminApi = {
  getAnalytics: () => api.get("/admin/analytics/overview"),
  getBookings: () => api.get("/admin/bookings"),
  getLots: () => api.get("/admin/parking-lots"),
  addLot: (data) => api.post("/admin/parking-lots", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  deleteLot: (id) => api.delete(`/admin/parking-lots/${id}`),
  getEarnings: () => api.get("/admin/earnings"),
  getReviews: () => api.get("/admin/reviews"),
  getMessages: () => api.get("/admin/messages").then((res) => res.data),
  submitSupport: (data) => api.post("/admin/support", data).then((res) => res.data),
  getRefunds: () => api.get("/admin/refunds").then((res) => res.data),
  handleRefund: (id, data) => api.post(`/admin/refunds/${id}/handle`, data).then((res) => res.data),
};

export default api;
