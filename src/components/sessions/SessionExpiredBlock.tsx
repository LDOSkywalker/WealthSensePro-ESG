import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { SessionRevokedError } from '../../types';

interface SessionExpiredBlockProps {
  error: SessionRevokedError;
  onReconnect: () => void;
}

export const SessionExpiredBlock: React.FC<SessionExpiredBlockProps> = ({
  error,
  onReconnect
}) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md mx-4 p-6 rounded-xl shadow-lg bg-white">
        {/* Icône d'alerte */}
        <div className="flex justify-center mb-4">
          <div className="flex-shrink-0 p-2 rounded-full bg-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
          Session Fermée
        </h2>

        {/* Message simplifié */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Votre session a été fermée sur cet appareil car une nouvelle connexion a été établie depuis un autre appareil.
          </p>
        </div>

        {/* Bouton de reconnexion */}
        <div className="flex justify-center">
          <button
            onClick={onReconnect}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Se reconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
