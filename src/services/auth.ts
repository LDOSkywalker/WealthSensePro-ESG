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
        
        // Ajouter le token depuis la mémoire si disponible
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log('🔐 Token ajouté depuis la mémoire');
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

        // Gestion spéciale des erreurs SESSION_REVOKED - PRIORITÉ MAXIMALE
        if (error.response?.data?.code === 'SESSION_REVOKED') {
            console.log('🚨 Session révoquée détectée:', error.response.data);
            console.log('🔍 Détails de l\'erreur:', {
                status: error.response.status,
                code: error.response.data.code,
                reason: error.response.data.reason,
                replacedBy: error.response.data.replacedBy
            });
            
            // Émettre un événement personnalisé pour la gestion côté composant
            const sessionRevokedEvent = new CustomEvent('sessionRevoked', {
                detail: error.response.data
            });
            window.dispatchEvent(sessionRevokedEvent);
            console.log('📡 Événement sessionRevoked émis avec succès');
            
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
            console.log('🔐 Access token stocké en mémoire');
            
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
        console.log('🔐 Access token supprimé de la mémoire');
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
                console.log('🔐 Nouveau access token stocké en mémoire');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erreur refresh token:', error);
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
    }
}; 