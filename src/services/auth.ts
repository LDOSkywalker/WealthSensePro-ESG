import axios from 'axios';
import { User } from '../types';

// Configuration de l'URL de l'API selon l'environnement
const API_URL = import.meta.env.PROD 
    ? 'https://wealthsensepro2theturfu.onrender.com/api'  // URL de production AVEC /api
    : import.meta.env.VITE_API_URL || 'http://localhost:3006/api';  // URL de développement AVEC /api

// Configuration d'axios pour inclure les cookies
axios.defaults.withCredentials = true;

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
    professionalActivity: string;
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
        const response = await axios.post(`${API_URL}/auth/signup`, payload);
        return response.data.user;
    },

    async logout(): Promise<void> {
        await axios.post(`${API_URL}/auth/logout`);
    },

    async checkAuth(): Promise<User | null> {
        try {
            const response = await axios.get(`${API_URL}/protected`);
            return response.data.user;
        } catch (error) {
            return null;
        }
    },

    async updateProfile(firstName: string, lastName: string): Promise<void> {
        await axios.put(`${API_URL}/auth/profile`, { firstName, lastName });
    },

    async updatePassword(newPassword: string): Promise<void> {
        await axios.put(`${API_URL}/auth/password`, { newPassword });
    },

    async resetPassword(email: string): Promise<void> {
        await axios.post(`${API_URL}/auth/reset-password`, { email });
    }
}; 