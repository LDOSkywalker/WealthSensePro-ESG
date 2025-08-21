import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, SessionRevokedError, SessionInfo } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  sessionRevokedError: SessionRevokedError | null;
  isSessionRevoked: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  handleSessionRevoked: (error: SessionRevokedError) => void;
  clearSessionRevokedError: () => void;
  handleSessionUpdated: (sessionInfo: SessionInfo) => void;
  forceReconnect: () => void;
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
  const [sessionRevokedError, setSessionRevokedError] = useState<SessionRevokedError | null>(null);
  const [isSessionRevoked, setIsSessionRevoked] = useState(false);
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
          window.location.href = '/';
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
      
      // Si on est sur /dashboard et pas connecté, rediriger vers la page d'accueil
      if (window.location.pathname === '/dashboard') {
        window.location.href = '/';
      }
    });

    // Écouter les événements de session révoquée (PC et Mobile)
    const handleSessionRevokedEvent = (event: CustomEvent) => {
      setSessionRevokedError(event.detail);
      setIsSessionRevoked(true);
    };

    // Écouter les deux types d'événements
    window.addEventListener('sessionRevoked', handleSessionRevokedEvent as EventListener);
    window.addEventListener('mobileSessionRevoked', handleSessionRevokedEvent as EventListener);

    // Vérification du localStorage pour mobile (mini-modale)
    const checkLocalStorageForMobileSessionRevoked = () => {
      try {
        const revokedSession = localStorage.getItem('mobileSessionRevoked');
        const revokedTimestamp = localStorage.getItem('mobileSessionRevokedTimestamp');
        
        if (revokedSession && revokedTimestamp) {
          const parsedSession = JSON.parse(revokedSession);
          const timestamp = parseInt(revokedTimestamp);
          const now = Date.now();
          
          // Vérifier que la révocation est récente (moins de 5 minutes)
          if (now - timestamp < 5 * 60 * 1000) {
            console.log('📱 Session révoquée mobile détectée via localStorage:', parsedSession);
            setSessionRevokedError(parsedSession);
            
            // Nettoyer le localStorage
            localStorage.removeItem('mobileSessionRevoked');
            localStorage.removeItem('mobileSessionRevokedTimestamp');
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification localStorage mobile:', error);
      }
    };

    // Vérifier immédiatement et toutes les 2 secondes sur mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('📱 Environnement mobile détecté, activation de la vérification localStorage');
      checkLocalStorageForMobileSessionRevoked();
      
      const localStorageInterval = setInterval(checkLocalStorageForMobileSessionRevoked, 2000);
      
      // Cleanup de l'intervalle
      return () => {
        stopAutoRefresh();
        window.removeEventListener('sessionRevoked', handleSessionRevokedEvent as EventListener);
        window.removeEventListener('mobileSessionRevoked', handleSessionRevokedEvent as EventListener);
        clearInterval(localStorageInterval);
      };
    }

    // Cleanup à la destruction du composant
    return () => {
      stopAutoRefresh();
      window.removeEventListener('sessionRevoked', handleSessionRevokedEvent as EventListener);
      window.removeEventListener('mobileSessionRevoked', handleSessionRevokedEvent as EventListener);
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

  // Gestion des sessions révoquées
  const handleSessionRevoked = (error: SessionRevokedError) => {
    console.log('🚨 Gestion de la session révoquée:', error);
    setSessionRevokedError(error);
    setIsSessionRevoked(true);
    
    // Arrêter l'auto-refresh
    stopAutoRefresh();
    
    // Déconnecter l'utilisateur
    setCurrentUser(null);
    
    // Nettoyer le localStorage et les cookies
    localStorage.clear();
    sessionStorage.clear();
    
    // Supprimer les cookies d'authentification
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  };

  const clearSessionRevokedError = () => {
    setSessionRevokedError(null);
  };

  const forceReconnect = () => {
    console.log('🔄 Forçage de la reconnexion...');
    setIsSessionRevoked(false);
    setSessionRevokedError(null);
    setCurrentUser(null);
    
    // Rediriger vers la page de login
    window.location.href = '/login';
  };

  const handleSessionUpdated = (sessionInfo: SessionInfo) => {
    console.log('📱 Session mise à jour:', sessionInfo);
    // Ici on peut ajouter de la logique pour gérer les mises à jour de session
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      sessionRevokedError,
      isSessionRevoked,
      login, 
      logout, 
      refreshToken,
      handleSessionRevoked,
      clearSessionRevokedError,
      handleSessionUpdated,
      forceReconnect
    }}>
      {children}
    </AuthContext.Provider>
  );
};