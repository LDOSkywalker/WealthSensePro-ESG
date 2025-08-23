import React from 'react';
import { SessionRevokedError } from '../types';

interface SessionRevokedModalProps {
  isOpen: boolean;
  error: SessionRevokedError | null;
  onClose: () => void;
  onReconnect: () => void;
  onReportSuspicious: () => void;
}

export const SessionRevokedModal: React.FC<SessionRevokedModalProps> = ({
  isOpen,
  error,
  onClose,
  onReconnect,
  onReportSuspicious
}) => {
  if (!isOpen || !error) return null;

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'replaced':
        return 'Vous avez été déconnecté car une nouvelle session a été créée depuis un autre appareil.';
      case 'reuse':
        return 'Votre session a été révoquée pour des raisons de sécurité.';
      case 'logout':
        return 'Vous avez été déconnecté manuellement.';
      case 'expired':
        return 'Votre session a expiré.';
      case 'admin_revocation':
        return 'Votre session a été révoquée par un administrateur.';
      default:
        return 'Votre session a été révoquée.';
    }
  };

  const getDeviceHint = (reason: string) => {
    if (reason === 'replaced') {
      return 'Si ce n\'était pas vous, votre compte pourrait être compromis.';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Icône d'alerte */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
          Session Révoquée
        </h2>

        {/* Message explicatif */}
        <div className="text-gray-600 text-center mb-6">
          <p className="mb-3">
            {getReasonText(error.reason)}
          </p>
          {getDeviceHint(error.reason) && (
            <p className="text-sm text-red-600 font-medium">
              {getDeviceHint(error.reason)}
            </p>
          )}
        </div>

        {/* Informations techniques (optionnel) */}
        {error.revokedAt && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs text-gray-500">
            <p>Révocaté le : {new Date(error.revokedAt).toLocaleString('fr-FR')}</p>
            {error.replacedBy && (
              <p>Remplacé par : {error.replacedBy.substring(0, 8)}...</p>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={onReconnect}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Se reconnecter
          </button>
          
          <button
            onClick={onReportSuspicious}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Signaler une activité suspecte
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>

        {/* Note de sécurité */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            Pour votre sécurité, toutes les sessions précédentes ont été automatiquement révoquées.
          </p>
        </div>
      </div>
    </div>
  );
};
