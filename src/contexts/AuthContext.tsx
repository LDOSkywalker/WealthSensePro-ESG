import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, SessionRevokedError, SessionInfo } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  sessionRevokedError: SessionRevokedError | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  handleSessionRevoked: (error: SessionRevokedError) => void;
  clearSessionRevokedError: () => void;
  handleSessionUpdated: (sessionInfo: SessionInfo) => void;
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

    // Écouter les événements de session révoquée
    const handleSessionRevokedEvent = (event: CustomEvent) => {
      console.log('🚨 Événement session révoquée reçu dans AuthContext:', event.detail);
      console.log('🔍 Type d\'événement:', event.type);
      console.log('📱 Définition de sessionRevokedError...');
      setSessionRevokedError(event.detail);
      console.log('✅ sessionRevokedError défini avec succès');
    };

    window.addEventListener('sessionRevoked', handleSessionRevokedEvent as EventListener);

    // Cleanup à la destruction du composant
    return () => {
      stopAutoRefresh();
      window.removeEventListener('sessionRevoked', handleSessionRevokedEvent as EventListener);
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
    
    // Arrêter l'auto-refresh
    stopAutoRefresh();
    
    // Déconnecter l'utilisateur
    setCurrentUser(null);
  };

  const clearSessionRevokedError = () => {
    setSessionRevokedError(null);
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
      login, 
      logout, 
      refreshToken,
      handleSessionRevoked,
      clearSessionRevokedError,
      handleSessionUpdated
    }}>
      {children}
    </AuthContext.Provider>
  );
};