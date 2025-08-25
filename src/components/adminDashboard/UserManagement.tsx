import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Shield, User, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'advisor' | 'support' | 'admin';
  isActive?: boolean;
  createdAt?: number;
  lastLogin?: number;
}

interface UserManagementProps {
  darkMode?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ darkMode = false }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel à l'API backend pour récupérer les utilisateurs
      // Utiliser le service d'auth qui gère automatiquement les tokens JWT
      console.log('🔍 [DEBUG] Vérification de l\'authentification...');
      
      // Vérifier d'abord que l'utilisateur est authentifié
      const authCheck = await authService.checkAuth();
      console.log('🔍 [DEBUG] Résultat checkAuth:', authCheck);
      
      if (!authCheck) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Utiliser l'URL complète de l'API comme dans le service d'auth
      const API_URL = import.meta.env.PROD 
        ? 'https://wealthsensepro-esg.onrender.com/api'
        : import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
      
      console.log('🔍 [DEBUG] URL de l\'API:', API_URL);
      console.log('🔍 [DEBUG] URL complète:', `${API_URL}/admin/users`);
      console.log('🔍 [DEBUG] Environnement PROD:', import.meta.env.PROD);
      
      // Récupérer le token depuis le service d'auth
      const token = await authService.getAccessToken();
      console.log('🔍 [DEBUG] Token récupéré (longueur):', token ? token.length : 'null');
      
      if (!token) {
        throw new Error('Token d\'accès non disponible');
      }
      
      const adminResponse = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 [DEBUG] Status de la réponse:', adminResponse.status);
      console.log('🔍 [DEBUG] Headers de la réponse:', Object.fromEntries(adminResponse.headers.entries()));
      console.log('🔍 [DEBUG] URL de la réponse:', adminResponse.url);

      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.log('🔍 [DEBUG] Contenu de l\'erreur:', errorText);
        throw new Error(`Erreur ${adminResponse.status}: ${errorText}`);
      }

      const data = await adminResponse.json();
      console.log('🔍 [DEBUG] Données reçues:', data);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Erreur fetchUsers:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Fallback : données de test pour le développement
      setUsers([
        {
          uid: '1',
          email: 'ludovic.skywalker@gmail.com',
          firstName: 'Ludovic',
          lastName: 'Farnault',
          role: 'admin',
          isActive: true,
          createdAt: Date.now() - 86400000,
          lastLogin: Date.now()
        },
        {
          uid: '2',
          email: 'ff@ff.com',
          firstName: 'fff',
          lastName: 'ff',
          role: 'user',
          isActive: true,
          createdAt: Date.now() - 172800000,
          lastLogin: Date.now() - 3600000
        },
        {
          uid: '3',
          email: 'll@ll.com',
          firstName: 'Raphaelo',
          lastName: 'ggg',
          role: 'user',
          isActive: true,
          createdAt: Date.now() - 259200000,
          lastLogin: Date.now() - 7200000
        },
        {
          uid: '4',
          email: 'ludovic.farnault@meyon.fr',
          firstName: 'o',
          lastName: 'o',
          role: 'user',
          isActive: true,
          createdAt: Date.now() - 345600000,
          lastLogin: Date.now() - 10800000
        },
        {
          uid: '5',
          email: 'ophelierouet25@gmail.com',
          firstName: 'o',
          lastName: 'o',
          role: 'user',
          isActive: true,
          createdAt: Date.now() - 432000000,
          lastLogin: Date.now() - 14400000
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Obtenir l'icône du rôle
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'support':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'advisor':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  // Obtenir la couleur du badge de rôle
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'support':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advisor':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Formater la date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Chargement des utilisateurs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <UserX className="w-16 h-16 mx-auto mb-2" />
          <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Erreur de chargement</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gestion des Utilisateurs</h2>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode 
                ? 'bg-dark border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              darkMode 
                ? 'bg-dark border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="support">Support</option>
            <option value="advisor">Conseillers</option>
            <option value="user">Utilisateurs</option>
          </select>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={darkMode ? 'bg-dark-lighter' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Utilisateur
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Rôle
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Statut
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Créé le
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Dernière connexion
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-dark-card' : 'divide-gray-200 bg-white'}`}>
              {filteredUsers.map((user) => (
                <tr key={user.uid} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : 'Nom non renseigné'
                          }
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role || 'user')}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role || 'user')}`}>
                        {user.role || 'user'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                  </td>
                  
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message si aucun utilisateur trouvé */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aucun utilisateur trouvé</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Aucun utilisateur ne correspond à vos critères de recherche.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
