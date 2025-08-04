import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour démarrer l'auto-refresh
  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Rafraîchir le token toutes les 10 minutes (avant l'expiration de 15min)
    refreshIntervalRef.current = setInterval(async () => {
      if (currentUser) {
        console.log('🔄 Auto-refresh du token...');
        const success = await authService.refreshToken();
        if (!success) {
          console.log('❌ Échec auto-refresh, déconnexion...');
          setCurrentUser(null);
          window.location.href = '/login';
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  };

  // Fonction pour arrêter l'auto-refresh
  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Vérifie l'authentification au chargement de l'app
    authService.checkAuth().then(user => {
      setCurrentUser(user);
      setLoading(false);
      
      // Démarrer l'auto-refresh si l'utilisateur est connecté
      if (user) {
        startAutoRefresh();
      }
    }).catch(error => {
      console.log('Erreur lors de la vérification de l\'authentification:', error);
      setCurrentUser(null);
      setLoading(false);
      
      // Si on est sur /dashboard et pas connecté, rediriger vers /login
      if (window.location.pathname === '/dashboard') {
        window.location.href = '/login';
      }
    });

    // Cleanup à la destruction du composant
    return () => {
      stopAutoRefresh();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authService.login({ email, password });
    setCurrentUser(user);
    startAutoRefresh(); // Démarrer l'auto-refresh après login
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
    stopAutoRefresh(); // Arrêter l'auto-refresh après logout
  };

  const refreshToken = async () => {
    return await authService.refreshToken();
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};