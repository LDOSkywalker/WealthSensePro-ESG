import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SessionRevokedError } from '../../types';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 p-6 rounded-xl shadow-lg bg-white">
        <div className="flex items-start">
          <div className="flex-shrink-0 p-1.5 rounded-full bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Session Fermée
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Votre session a été fermée sur cet appareil car une nouvelle connexion a été établie depuis un autre appareil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 rounded-full transition-colors hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex flex-col gap-3 mt-6">
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
        </div>
      </div>
    </div>
  );
};
