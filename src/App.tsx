import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Landing from './pages/landing';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConversationProvider } from './contexts/ConversationContext';
import ResetPassword from './components/ResetPassword';
import { SessionListener } from './components/SessionListener';
import { SessionRevokedModal } from './components/SessionRevokedModal';
import { MobileSessionRevokedModal } from './components/MobileSessionRevokedModal';
import { SessionExpiredBlock } from './components/SessionExpiredBlock';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { 
    currentUser, 
    loading, 
    sessionRevokedError, isSessionRevoked,
    handleSessionRevoked,
    clearSessionRevokedError,
    handleSessionUpdated, forceReconnect
  } = useAuth();

  // Fonction pour détecter si on est sur mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Si la session est révoquée, afficher le blocage complet
  console.log('🔍 App.tsx - État de la session:', { isSessionRevoked, sessionRevokedError });
  
  if (isSessionRevoked && sessionRevokedError) {
    console.log('🚨 Affichage du blocage complet de session');
    return (
      <SessionExpiredBlock
        error={sessionRevokedError}
        onReconnect={forceReconnect}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Listener temps réel pour les sessions */}
      {currentUser && (
        <SessionListener
          onSessionRevoked={handleSessionRevoked}
          onSessionUpdated={handleSessionUpdated}
        />
      )}

      {/* Les modales ne sont plus nécessaires - remplacées par le blocage complet */}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ConversationProvider>
                <Dashboard />
              </ConversationProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            currentUser ? <Navigate to="/dashboard" /> : <Landing />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;