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
        // Vérifier si la session est révoquée
        const isSessionRevoked = localStorage.getItem('mobileSessionRevoked') || 
                                localStorage.getItem('sessionRevoked');
        
        if (isSessionRevoked) {
            return Promise.reject(new Error('SESSION_REVOKED_BLOCKED'));
        }
        
        // Ajouter le token depuis la mémoire si disponible
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        // Ajouter le header X-Requested-With pour CSRF
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        return config;
    },
    (error) => {
        console.error('❌ Erreur requête:', error);
        return Promise.reject(error);
    }
);

// Variables pour l'auto-refresh
let isRefreshing = false;
let refreshFailed = false;
let accessToken: string | null = null;
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

        // Intercepteur pour gérer l'auto-refresh et les sessions révoquées
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

        // Gestion spéciale des erreurs SESSION_REVOKED - PRIORITÉ MAXIMALE
        if (error.response?.data?.code === 'SESSION_REVOKED') {
            // Détection de l'environnement mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Sur mobile : stocker et émettre l'événement
                localStorage.setItem('mobileSessionRevoked', JSON.stringify(error.response.data));
                localStorage.setItem('mobileSessionRevokedTimestamp', Date.now().toString());
                
                const mobileSessionRevokedEvent = new CustomEvent('mobileSessionRevoked', {
                    detail: error.response.data
                });
                window.dispatchEvent(mobileSessionRevokedEvent);
                
            } else {
                // Sur PC : émettre l'événement pour la modale desktop
                const sessionRevokedEvent = new CustomEvent('sessionRevoked', {
                    detail: error.response.data
                });
                window.dispatchEvent(sessionRevokedEvent);
            }
            
            // Ne pas essayer de rafraîchir le token si la session est révoquée
            return Promise.reject(error);
        }

        // Si c'est une erreur 401 et qu'on n'est pas déjà en train de rafraîchir
        // MAIS SEULEMENT si ce n'est pas une erreur SESSION_REVOKED
        if (error.response?.status === 401 && 
            error.response?.data?.code !== 'SESSION_REVOKED' && 
            !isRefreshing && 
            !originalRequest._retry && 
            !refreshFailed) {
            // Éviter la boucle infinie pour les requêtes de refresh
            if (originalRequest.url?.includes('/auth/refresh')) {
                console.log('❌ Refresh token échoué, arrêt de la boucle');
                refreshFailed = true;
                return Promise.reject(error);
            }

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
                    accessToken = response.data.access_token;
                    processQueue(null, response.data.access_token);
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ Erreur lors du refresh:', refreshError);
                processQueue(refreshError, null);
                refreshFailed = true;
                
                // Arrêter la boucle infinie
                console.log('🛑 Arrêt de la boucle de refresh');
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
            const response = await axios.post(`${API_URL}/auth/login`, credentials, {
                withCredentials: true
            });
            
            // Stocker le token en mémoire
            accessToken = response.data.access_token;
            
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
        // Nettoyer le token en mémoire
        accessToken = null;
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

    async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
        await axios.put(`${API_URL}/auth/password`, { currentPassword, newPassword }, { withCredentials: true });
    },

    async resetPassword(email: string): Promise<void> {
        await axios.post(`${API_URL}/auth/reset-password`, { email }, { withCredentials: true });
    },

    async refreshToken(): Promise<boolean> {
        try {
            const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            if (response.data.success) {
                accessToken = response.data.access_token;
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    },

    async getSessionInfo(): Promise<any> {
        try {
            const response = await axios.get(`${API_URL}/auth/session-info`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error('❌ Erreur récupération info session:', error);
            return null;
        }
    },

    // Méthode pour récupérer le token d'accès actuel
    async getAccessToken(): Promise<string | null> {
        return accessToken;
    }
}; 