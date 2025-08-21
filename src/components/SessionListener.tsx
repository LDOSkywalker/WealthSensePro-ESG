import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SessionInfo } from '../types';

interface SessionListenerProps {
  onSessionRevoked: (sessionInfo: SessionInfo) => void;
  onSessionUpdated: (sessionInfo: SessionInfo) => void;
}

export const SessionListener: React.FC<SessionListenerProps> = ({
  onSessionRevoked,
  onSessionUpdated
}) => {
  const { currentUser } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    // Fonction pour configurer l'écoute Firestore
    const setupFirestoreListener = async () => {
      try {
        // Import dynamique de Firebase pour éviter les erreurs de build
        const { initializeApp } = await import('firebase/app');
        const { getFirestore, collection, query, where, onSnapshot } = await import('firebase/firestore');
        
        // Configuration Firebase centralisée
        const { firebaseConfig, validateFirebaseConfig } = await import('../config/firebase');
        
        // Vérifier la configuration
        if (!validateFirebaseConfig()) {
          console.error('❌ Configuration Firebase invalide');
          return;
        }

        // Initialiser Firebase si pas déjà fait
        let app;
        try {
          app = initializeApp(firebaseConfig);
        } catch (error) {
          // Firebase déjà initialisé
          app = initializeApp(firebaseConfig, 'session-listener');
        }

        const db = getFirestore(app);

        // Écouter les changements sur la collection sessions pour l'utilisateur courant
        const sessionsRef = collection(db, 'sessions');
        const sessionsQuery = query(
          sessionsRef,
          where('uid', '==', currentUser.uid)
        );

        console.log('🔍 Configuration de l\'écoute Firestore pour les sessions...');

        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const sessionData = change.doc.data() as SessionInfo;
            const sessionId = change.doc.id;

            console.log('📱 Changement de session détecté:', {
              type: change.type,
              sessionId,
              status: sessionData.status,
              reason: sessionData.reason
            });

            if (change.type === 'modified') {
              // Session mise à jour
              onSessionUpdated({
                ...sessionData,
                jti: sessionId
              });

              // Vérifier si la session a été révoquée
              if (sessionData.status === 'revoked') {
                console.log('🚨 Session révoquée détectée:', sessionData);
                onSessionRevoked({
                  ...sessionData,
                  jti: sessionId
                });
              }
            } else if (change.type === 'removed') {
              // Session supprimée (peut arriver lors du nettoyage)
              console.log('🗑️ Session supprimée:', sessionId);
            }
          });
        }, (error) => {
          console.error('❌ Erreur lors de l\'écoute Firestore:', error);
        });

        // Stocker la fonction de désabonnement
        unsubscribeRef.current = unsubscribe;

        console.log('✅ Écoute Firestore configurée avec succès');

      } catch (error) {
        console.error('❌ Erreur lors de la configuration Firestore:', error);
      }
    };

    // Configurer l'écoute
    setupFirestoreListener();

    // Cleanup lors du démontage
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔇 Désabonnement de l\'écoute Firestore');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [currentUser?.uid, onSessionRevoked, onSessionUpdated]);

  // Ce composant ne rend rien visuellement
  return null;
};
