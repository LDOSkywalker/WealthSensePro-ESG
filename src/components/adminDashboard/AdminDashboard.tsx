import React, { useState, useEffect } from 'react';
import { Shield, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'users' | 'sessions' | 'analytics' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isAdmin, setIsAdmin] = useState(false);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      onClose();
    }
  }, [currentUser, onClose]);

  // Si pas admin, ne pas afficher
  if (!isAdmin) {
    return null;
  }

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users, description: 'Gérer les utilisateurs et rôles' },
    { id: 'sessions', label: 'Sessions', icon: BarChart3, description: 'Monitorer les sessions actives' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Statistiques et métriques' },
    { id: 'settings', label: 'Configuration', icon: Settings, description: 'Paramètres système' }
  ];

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    // Logique de déconnexion
    onClose();
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
              <p className="text-sm text-gray-600">
                Connecté en tant que {currentUser?.email} (Admin)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as AdminTab)}
                className={`flex items-center space-x-3 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 bg-white border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'sessions' && (
            <div className="p-6 text-center text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Gestion des Sessions</h3>
              <p>Fonctionnalité en cours de développement</p>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="p-6 text-center text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Analytics</h3>
              <p>Fonctionnalité en cours de développement</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="p-6 text-center text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium">Configuration</h3>
              <p>Fonctionnalité en cours de développement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
