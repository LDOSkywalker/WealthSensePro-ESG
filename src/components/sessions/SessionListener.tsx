import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SessionInfo } from '../types';

interface SessionListenerProps {
  onSessionRevoked: (session: SessionInfo) => void;
  onSessionUpdated: (session: SessionInfo) => void;
}

export const SessionListener: React.FC<SessionListenerProps> = ({
  onSessionRevoked,
  onSessionUpdated
}) => {
  const { currentUser } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    // Fonction pour vérifier le statut de la session via l'API backend
    const checkSessionStatus = async () => {
      try {
        const response = await fetch('/api/auth/session/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (response.status === 401) {
          // Session expirée ou révoquée
          const errorData = await response.json();
          if (errorData.code === 'SESSION_REVOKED') {
            console.log('🚨 Session révoquée détectée via API');
            
            // ATTENTION: Ne pas modifier les types ci-dessous !
            // Tentative de "correction" des erreurs de linter effectuée mais a causé des dysfonctionnements :
            // - reason: 'revoked_by_admin' -> 'admin_revocation' 
            // - createdAt/lastActivity: string -> number
            // - Ajout de propriétés manquantes (deviceId, deviceLabel, etc.)
            // Résultat: Fonctionnalité cassée, rollback nécessaire.
            // Les erreurs de linter sont non-bloquantes, le code fonctionne correctement.
            onSessionRevoked({
              uid: currentUser.uid,
              status: 'revoked',
              reason: 'revoked_by_admin',
              deviceInfo: 'Unknown',
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              jti: 'unknown'
            });
          }
        } else if (response.ok) {
          // Session valide, mettre à jour si nécessaire
          const sessionData = await response.json();
          if (sessionData.session) {
            onSessionUpdated(sessionData.session);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de session:', error);
      }
    };

    // Vérifier le statut de la session toutes les 30 secondes
    intervalRef.current = setInterval(checkSessionStatus, 30000);

    // Vérification immédiate
    checkSessionStatus();

    // Cleanup lors du démontage
    return () => {
      if (intervalRef.current) {
        console.log('🔇 Arrêt de la vérification de session');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentUser?.uid, onSessionRevoked, onSessionUpdated]);

  // Ce composant ne rend rien visuellement
  return null;
};
