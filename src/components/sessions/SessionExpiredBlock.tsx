import React from 'react';
import { SessionRevokedError } from '../../types';

interface SessionExpiredBlockProps {
  error: SessionRevokedError;
  onReconnect: () => void;
}

export const SessionExpiredBlock: React.FC<SessionExpiredBlockProps> = ({
  error,
  onReconnect
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getShortReplacedBy = (replacedBy: string) => {
    return replacedBy.length > 8 ? `${replacedBy.substring(0, 8)}...` : replacedBy;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      {/* Overlay de fond avec pattern */}
      <div className="absolute inset-0 bg-red-200 opacity-20"></div>
      
      {/* Contenu principal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border-2 border-red-200">
        {/* Header avec icône d'alerte */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Session Expirée</h1>
          <p className="text-red-100 text-lg">Accès bloqué pour votre sécurité</p>
        </div>

        {/* Corps de la modale */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Votre session a été révoquée car une nouvelle connexion a été établie depuis un autre appareil.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-sm font-medium">
                🔒 Pour votre sécurité, toutes les sessions précédentes ont été automatiquement révoquées.
              </p>
            </div>
          </div>

          {/* Détails de la session */}
          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Révocaté le :</span>
              <span className="font-semibold text-gray-800">{formatDate(error.revokedAt)}</span>
            </div>
            {error.replacedBy && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Remplacé par :</span>
                <span className="font-mono text-sm bg-gray-200 px-3 py-1 rounded-lg">
                  {getShortReplacedBy(error.replacedBy)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Raison :</span>
              <span className="text-red-600 font-medium capitalize">
                {error.reason === 'replaced' ? 'Remplacé' : error.reason}
              </span>
            </div>
          </div>

          {/* Message de sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm text-center">
              <strong>⚠️ Attention :</strong> Si cette connexion n'était pas de votre initiative, 
              votre compte pourrait être compromis. Changez immédiatement votre mot de passe.
            </p>
          </div>
        </div>

        {/* Bouton d'action */}
        <div className="p-8 pt-0">
          <button
            onClick={onReconnect}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 shadow-xl transform hover:scale-105 active:scale-95"
          >
            🔐 Se reconnecter maintenant
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">
            Cette action est obligatoire pour continuer à utiliser l'application
          </p>
        </div>
      </div>
    </div>
  );
};
