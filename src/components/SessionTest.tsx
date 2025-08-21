import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

export const SessionTest: React.FC = () => {
  const { currentUser, sessionRevokedError } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testSessionInfo = async () => {
    try {
      setTestResult('🔍 Test de récupération des infos de session...');
      const sessionInfo = await authService.getSessionInfo();
      setTestResult(`✅ Infos session récupérées: ${JSON.stringify(sessionInfo, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Erreur: ${error}`);
    }
  };

  const simulateSessionRevoked = () => {
    try {
      setTestResult('🚨 Simulation d\'une session révoquée...');
      
      // Simuler l'événement exact que le backend enverrait
      const mockSessionRevokedData = {
        success: false,
        code: 'SESSION_REVOKED',
        reason: 'replaced',
        replacedBy: 'test-jti-123',
        revokedAt: Date.now(),
        error: 'Session révoquée'
      };
      
      console.log('🧪 Émission de l\'événement sessionRevoked simulé:', mockSessionRevokedData);
      
      const sessionRevokedEvent = new CustomEvent('sessionRevoked', {
        detail: mockSessionRevokedData
      });
      
      window.dispatchEvent(sessionRevokedEvent);
      
      setTestResult('📡 Événement sessionRevoked émis ! Vérifiez la console et la modale...');
    } catch (error) {
      setTestResult(`❌ Erreur lors de la simulation: ${error}`);
    }
  };

  const testEventListening = () => {
    try {
      setTestResult('👂 Test de l\'écoute d\'événements...');
      
      // Vérifier que l'événement est bien écouté
      const testEvent = new CustomEvent('testEvent', { detail: 'test' });
      let eventReceived = false;
      
      const testListener = () => {
        eventReceived = true;
        console.log('✅ Événement de test reçu !');
      };
      
      window.addEventListener('testEvent', testListener);
      window.dispatchEvent(testEvent);
      
      setTimeout(() => {
        window.removeEventListener('testEvent', testListener);
        if (eventReceived) {
          setTestResult('✅ Écoute d\'événements fonctionne !');
        } else {
          setTestResult('❌ Écoute d\'événements ne fonctionne pas');
        }
      }, 100);
      
    } catch (error) {
      setTestResult(`❌ Erreur lors du test d'écoute: ${error}`);
    }
  };

  const clearTestResult = () => {
    setTestResult('');
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">
          🔒 Connectez-vous d'abord pour tester la gestion des sessions
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🧪 Tests de Gestion des Sessions
      </h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={testSessionInfo}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            📱 Infos Session
          </button>
          
          <button
            onClick={simulateSessionRevoked}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            🚨 Simuler Session Révoquée
          </button>
          
          <button
            onClick={testEventListening}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            👂 Test Écoute Événements
          </button>
          
          <button
            onClick={clearTestResult}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            🗑️ Effacer
          </button>
        </div>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded border">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        {sessionRevokedError && (
          <div className="p-4 bg-red-100 border border-red-400 rounded">
            <h4 className="font-semibold text-red-800 mb-2">
              🚨 Erreur de Session Révoquée Détectée
            </h4>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {JSON.stringify(sessionRevokedError, null, 2)}
            </pre>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">📊 État Actuel</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Utilisateur connecté: {currentUser.email}</li>
            <li>• Session révoquée: {sessionRevokedError ? 'OUI' : 'NON'}</li>
            <li>• Timestamp: {new Date().toLocaleTimeString()}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
