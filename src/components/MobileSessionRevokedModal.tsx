import React from 'react';
import { SessionRevokedError } from '../types';

interface MobileSessionRevokedModalProps {
  isOpen: boolean;
  error: SessionRevokedError | null;
  onClose: () => void;
  onReconnect: () => void;
}

export const MobileSessionRevokedModal: React.FC<MobileSessionRevokedModalProps> = ({
  isOpen,
  error,
  onClose,
  onReconnect
}) => {
  if (!isOpen || !error) return null;

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
    <div className="fixed inset-0 z-50 bg-red-50 flex items-center justify-center p-4">
      {/* Overlay de fond */}
      <div className="absolute inset-0 bg-red-100 opacity-90"></div>
      
      {/* Contenu de la modale */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header avec icône d'alerte */}
        <div className="bg-red-600 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Session Révoquée</h2>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-center leading-relaxed">
            Vous avez été déconnecté car une nouvelle session a été créée depuis un autre appareil.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm text-center">
              Si ce n'était pas vous, votre compte pourrait être compromis.
            </p>
          </div>

          {/* Détails de la session */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Révocaté le :</span>
              <span className="font-medium">{formatDate(error.revokedAt)}</span>
            </div>
            {error.replacedBy && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remplacé par :</span>
                <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                  {getShortReplacedBy(error.replacedBy)}
                </span>
              </div>
            )}
          </div>

          {/* Message de sécurité */}
          <p className="text-xs text-gray-500 text-center">
            Pour votre sécurité, toutes les sessions précédentes ont été automatiquement révoquées.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={onReconnect}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          >
            Se reconnecter
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-300 active:bg-gray-400 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
