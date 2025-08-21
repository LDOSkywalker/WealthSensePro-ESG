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
    sessionRevokedError,
    handleSessionRevoked,
    clearSessionRevokedError,
    handleSessionUpdated
  } = useAuth();

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

      {/* Modal de session révoquée */}
      <SessionRevokedModal
        isOpen={!!sessionRevokedError}
        error={sessionRevokedError}
        onClose={clearSessionRevokedError}
        onReconnect={() => {
          clearSessionRevokedError();
          window.location.href = '/login';
        }}
        onReportSuspicious={() => {
          clearSessionRevokedError();
          // Ici on peut ajouter la logique pour signaler une activité suspecte
          console.log('🚨 Activité suspecte signalée');
          window.location.href = '/login';
        }}
      />

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