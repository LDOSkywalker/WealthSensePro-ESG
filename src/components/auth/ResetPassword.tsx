import React, { useState } from 'react';
import { authService } from '../../services/auth';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSuccess('Un email de réinitialisation a été envoyé si l\'adresse existe.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la demande de réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  // Si l'email a été envoyé avec succès, afficher le message de succès et le bouton de connexion
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Réinitialiser le mot de passe</h2>
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-center">
            {success}
          </div>
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Vérifiez votre boîte email et les spams puis suivez les instructions pour réinitialiser votre mot de passe.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Affichage normal du formulaire
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Réinitialiser le mot de passe</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border border-gray-300 text-gray-900 rounded-lg p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Votre adresse email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 