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
    me: () => api.get('/auth/me') as Promise<any>,
};

export const userApi = {
    getLots: () => api.get('/user/slots') as Promise<any>,
};

export default api;
