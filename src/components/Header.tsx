import React, { useState } from 'react';
import { LogOut, Moon, Sun, Menu, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './auth';
import { Logo } from './ui';
import AdminDashboard from './adminDashboard/AdminDashboard';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onLogoClick?: () => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  toggleDarkMode, 
  onLogoClick,
  onMenuClick,
  showMenuButton = false
}) => {
  const { currentUser, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const getUserInitials = () => {
    if (!currentUser) return "U";
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (currentUser.displayName) {
      const names = currentUser.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    
    if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  return (
    <>
      <header className={`flex items-center justify-between py-3 px-4 ${darkMode ? 'bg-dark-card' : 'bg-white shadow-sm'}`}>
        <div className="flex items-center">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className={`p-1.5 rounded-full transition-colors mr-2 sm:mr-4 lg:hidden ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Menu className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
            </button>
          )}
          <div 
            className="flex items-center cursor-pointer ml-0 sm:ml-2 lg:ml-0" 
            onClick={onLogoClick}
            title="Retour à l'accueil"
          >
            <Logo />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-1.5 sm:p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={darkMode ? "Mode clair" : "Mode sombre"}
          >
            {darkMode ? <Sun className="h-5 w-5 sm:h-6 sm:w-6 text-white" /> : <Moon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />}
          </button>
          
          {/* Bouton Admin Dashboard - visible uniquement pour les admins */}
          {currentUser && (
            <div className="text-xs text-gray-500 mr-2">
              Role: {currentUser.role || 'undefined'}
            </div>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <button 
              onClick={() => setIsAdminDashboardOpen(true)}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                darkMode 
                  ? 'text-purple-300 hover:bg-gray-700 hover:text-purple-200' 
                  : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
              title="Dashboard Administrateur"
            >
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
          
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-full transition-colors bg-red-600 hover:bg-red-700"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
          )}
          
          {currentUser && (
            <button 
              onClick={openProfileModal}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors font-medium text-white text-sm sm:text-base"
              title="Paramètres du profil"
            >
              {getUserInitials()}
            </button>
          )}
        </div>
      </header>
      
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={closeProfileModal} 
        darkMode={darkMode}
      />
      
      {/* Admin Dashboard Modal */}
      <AdminDashboard 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setIsAdminDashboardOpen(false)} 
      />
    </>
  );
};

export default Header;