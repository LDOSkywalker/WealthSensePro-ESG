import React, { useState } from 'react';
import { LogOut, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import Logo from './Logo';

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
              className={`p-1.5 rounded-full transition-colors mr-4 lg:hidden ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Menu className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
            </button>
          )}
          <div 
            className="flex items-center cursor-pointer ml-[80px] lg:ml-[80px]" 
            onClick={onLogoClick}
            title="Retour à l'accueil"
          >
            <Logo />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={darkMode ? "Mode clair" : "Mode sombre"}
          >
            {darkMode ? <Sun className="h-6 w-6 text-white" /> : <Moon className="h-6 w-6 text-gray-700" />}
          </button>
          
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full transition-colors bg-red-600 hover:bg-red-700"
              title="Déconnexion"
            >
              <LogOut className="h-6 w-6 text-white" />
            </button>
          )}
          
          {currentUser && (
            <button 
              onClick={openProfileModal}
              className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors font-medium text-white"
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
    </>
  );
};

export default Header;