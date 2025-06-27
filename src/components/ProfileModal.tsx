import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, darkMode = true }) => {
  const { currentUser } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      const userData = await response.json();
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setEmail(userData.email || '');
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      setError('Impossible de charger les informations du profil');
    }
  };
  
  useEffect(() => {
    if (!currentUser) return;
    
    if (isOpen) {
      // Charger les données du profil depuis l'API
      fetchUserProfile();
      
      // Réinitialiser les champs du mot de passe
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      setPasswordError('');
    }
  }, [currentUser, isOpen]);
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authService.updateProfile(firstName, lastName);
      
      setSuccess("Vos informations ont été mises à jour avec succès.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Une erreur est survenue lors de la mise à jour de votre profil.");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    
    try {
      await authService.updatePassword(newPassword);
      
      setSuccess("Votre mot de passe a été mis à jour avec succès.");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Une erreur est survenue lors de la mise à jour du mot de passe.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Paramètres du profil
          </h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/20 text-green-400 p-3 rounded-md mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="firstName">
                  Prénom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${
                      darkMode 
                        ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                    } border rounded-md pl-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                    placeholder="Prénom"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="lastName">
                  Nom
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`${
                      darkMode 
                        ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                        : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                    } border rounded-md pl-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  className={`${
                    darkMode 
                      ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                  } border rounded-md pl-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                  placeholder="email@exemple.com"
                  disabled
                />
              </div>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                L'email ne peut pas être modifié pour le moment.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Enregistrer'}
            </button>
          </form>
          
          <div className={`my-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
          
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Changer le mot de passe
          </h3>
          
          {passwordError && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4">
              {passwordError}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="currentPassword">
                Mot de passe actuel
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${
                    darkMode 
                      ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                  } border rounded-md pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="newPassword">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${
                    darkMode 
                      ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                  } border rounded-md pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-700'}`} htmlFor="confirmPassword">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${
                    darkMode 
                      ? 'bg-dark border-gray-700 text-white focus:ring-primary' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-primary'
                  } border rounded-md pl-10 pr-10 p-2.5 w-full focus:outline-none focus:ring-2`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <Eye className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>
              </div>
              {newPassword !== confirmPassword && confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Changer le mot de passe'}
            </button>
          </form>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md mr-2 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;