import axios from 'axios';
import { User } from '../types';

// Configuration de l'URL de l'API selon l'environnement
const API_URL = import.meta.env.PROD 
    ? 'https://wealthsensepro-esg.onrender.com/api'  // URL de production AVEC /api
    : import.meta.env.VITE_API_URL || 'http://localhost:3006/api';  // URL de développement AVEC /api

// Configuration d'axios pour inclure les cookies
axios.defaults.withCredentials = true;

// Intercepteur pour logger toutes les requêtes
axios.interceptors.request.use(
    (config) => {
        console.log('🚀 Requête envoyée:', {
            url: config.url,
            method: config.method,
            withCredentials: config.withCredentials,
            headers: config.headers
        });
        return config;
    },
    (error) => {
        console.error('❌ Erreur requête:', error);
        return Promise.reject(error);
    }
);

// Variables pour l'auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

// Intercepteur pour logger toutes les réponses et gérer l'auto-refresh
axios.interceptors.response.use(
    (response) => {
        console.log('✅ Réponse reçue:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        console.error('❌ Erreur réponse:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });

        // Si c'est une erreur 401 et qu'on n'est pas déjà en train de rafraîchir
        if (error.response?.status === 401 && !isRefreshing && !originalRequest._retry) {
            if (isRefreshing) {
                // Si on est déjà en train de rafraîchir, on met en queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axios(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('🔄 Tentative de refresh token...');
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, { 
                    withCredentials: true 
                });
                
                if (response.data.success) {
                    console.log('✅ Token rafraîchi avec succès');
                    processQueue(null, response.data.token);
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ Erreur lors du refresh:', refreshError);
                processQueue(refreshError, null);
                
                // Rediriger vers la page d'accueil si le refresh échoue
                window.location.href = '/';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);



export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupPayload {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    referralSource: string;
    otherReferralSource?: string;
    disclaimerAccepted: boolean;
    disclaimerAcceptedAt: number;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<User> {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, credentials);
            return response.data.user;
        } catch (error: any) {
            if (error.response?.data?.code) {
                const customError = new Error(error.response.data.error) as Error & { code?: string };
                customError.code = error.response.data.code;
                throw customError;
            }
            throw error;
        }
    },

    async signup(payload: SignupPayload): Promise<User> {
        const response = await axios.post(`${API_URL}/auth/signup`, payload, { withCredentials: true });
        return response.data.user;
    },

    async logout(): Promise<void> {
        await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    },

    async checkAuth(): Promise<User | null> {
        try {
            const response = await axios.get(`${API_URL}/protected`, { withCredentials: true });
            return response.data.user;
        } catch (error: any) {
            console.log('checkAuth error:', error.response?.status, error.response?.data);
            return null;
        }
    },

    async updateProfile(firstName: string, lastName: string): Promise<void> {
        await axios.put(`${API_URL}/auth/profile`, { firstName, lastName }, { withCredentials: true });
    },

    async updatePassword(newPassword: string): Promise<void> {
        await axios.put(`${API_URL}/auth/password`, { newPassword }, { withCredentials: true });
    },

    async resetPassword(email: string): Promise<void> {
        await axios.post(`${API_URL}/auth/reset-password`, { email }, { withCredentials: true });
    },

    async refreshToken(): Promise<boolean> {
        try {
            const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            return response.data.success;
        } catch (error) {
            console.error('❌ Erreur refresh token:', error);
            return false;
        }
    }
}; 