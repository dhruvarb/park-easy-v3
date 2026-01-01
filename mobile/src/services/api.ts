import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('pe_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Bypass LocalTunnel warning page
            config.headers['Bypass-Tunnel-Reminder'] = 'true';
        } catch (error) {
            console.error('Error retrieving token', error);
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
    signup: (payload: any) => api.post('/auth/signup', payload) as Promise<any>,
    login: (payload: any) => api.post('/auth/login', payload) as Promise<any>,
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }) as Promise<any>,
    resetPassword: (payload: any) => api.post('/auth/reset-password', payload) as Promise<any>,
    me: () => api.get('/auth/me') as Promise<any>,
    updateProfile: (data: any) => api.patch('/auth/me', data) as Promise<any>,
};

export const userApi = {
    getLots: (config?: any) => api.get('/user/slots', config) as Promise<any>,
    getLot: (id: string) => api.get(`/user/slots/${id}`) as Promise<any>,
    getBookings: () => api.get('/user/bookings') as Promise<any>,
    createBooking: (data: any) => api.post('/user/bookings', data) as Promise<any>,
    cancelBooking: (id: string) => api.post(`/user/bookings/${id}/cancel`) as Promise<any>,
    checkoutBooking: (id: string) => api.post(`/user/bookings/${id}/checkout`) as Promise<any>,
    requestRefund: (data: any) => api.post('/user/refunds', data) as Promise<any>,
    getFavorites: () => api.get('/user/favorites') as Promise<any>,
    addFavorite: (lotId: string) => api.post('/user/favorites', { lotId }) as Promise<any>,
    removeFavorite: (lotId: string) => api.delete(`/user/favorites/${lotId}`) as Promise<any>,
    getWalletBalance: () => api.get('/user/wallet/balance') as Promise<any>,
    topUpWallet: (amount: number) => api.post('/user/wallet/topup', { amount }) as Promise<any>,
    getReviews: (lotId: string) => api.get(`/user/slots/${lotId}/reviews`) as Promise<any>,
    addReview: (data: any) => api.post('/user/reviews', data) as Promise<any>,
};

export const adminApi = {
    getLots: () => api.get('/admin/lots') as Promise<any>,
    addLot: (data: any) => api.post('/admin/lots', data) as Promise<any>,
    deleteLot: (id: string) => api.delete(`/admin/lots/${id}`) as Promise<any>,
    getBookings: () => api.get('/admin/bookings') as Promise<any>,
    getEarnings: () => api.get('/admin/earnings') as Promise<any>,
    getReviews: () => api.get('/admin/reviews') as Promise<any>,
    submitSupport: (data: any) => api.post('/admin/support', data) as Promise<any>,
};

export default api;
