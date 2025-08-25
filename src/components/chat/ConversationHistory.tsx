import React, { useState } from 'react';
import { MessageSquare, Plus, AlertTriangle, Edit2, Trash2, X, Check, ChevronDown } from 'lucide-react';
import { useConversation } from '../../contexts/ConversationContext';
import { Conversation } from '../../types';

interface ConversationHistoryProps {
  darkMode?: boolean;
  onClose?: () => void;
  onNewConversation?: () => void;
  onDeleteConversationRequest?: (conversation: Conversation) => void;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conversationTitle: string;
  darkMode: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conversationTitle,
  darkMode 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full max-w-md mx-4 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 p-1.5 rounded-full bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Confirmer la suppression
            </h3>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.
            </p>
            <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Conversation "{conversationTitle}"
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 p-1 rounded-full transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  darkMode: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  darkMode,
  onSelect,
  onDelete
}) => {
  const { updateConversationTitle } = useConversation();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newTitle.trim() && newTitle !== conversation.title) {
      try {
        await updateConversationTitle(conversation.id, newTitle.trim());
      } catch (error) {
        console.error('Erreur lors de la mise à jour du titre:', error);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTitle(conversation.title);
    setIsEditing(false);
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col w-full text-left cursor-pointer transition-all duration-200 px-3 py-2.5 ${
        isActive
          ? `${darkMode ? 'bg-primary/10 text-primary shadow-sm' : 'bg-primary/5 text-primary'}`
          : darkMode
          ? 'hover:bg-gray-800/50 text-gray-300 hover:shadow-sm'
          : 'hover:bg-gray-100 text-gray-700'
      } ${isHovered ? 'scale-[0.995] transform' : ''}`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center min-w-0 flex-1 gap-3">
          <MessageSquare className={`w-4 h-4 flex-shrink-0 transition-colors ${
            isActive ? 'text-primary' : isHovered ? 'text-primary/70' : ''
          }`} />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`flex-1 px-2 py-1 rounded text-sm ${
                    darkMode 
                      ? 'bg-dark-card text-white' 
                      : 'bg-white text-gray-900'
                  }`}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="p-1 hover:bg-primary/20 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-primary/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className={`truncate text-sm font-medium transition-colors ${
                  isHovered && !isActive ? 'text-primary' : ''
                }`}>
                  {conversation.title || 'Nouvelle conversation'}
                </div>
                <div className={`text-xs ${
                  isActive 
                    ? 'text-primary/70' 
                    : isHovered 
                      ? 'text-primary/60' 
                      : 'text-gray-500'
                }`}>
                  {formatDate(conversation.updatedAt)}
                </div>
              </>
            )}
          </div>
        </div>
        
        {!isEditing && (isHovered || isActive) && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleEdit}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'hover:bg-primary/20 text-primary'
                  : darkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Modifier le titre"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'hover:bg-red-500/10 text-red-400'
                  : 'hover:bg-red-500/10 text-red-400'
              }`}
              title="Supprimer la conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  darkMode = true, 
  onClose,
  onNewConversation,
  onDeleteConversationRequest
}) => {
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation,
    deleteConversation,
    loading,
    error,
    createNewConversation
  } = useConversation();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDeleteClick = (conversation: Conversation) => {
    if (onDeleteConversationRequest) {
      onDeleteConversationRequest(conversation);
    } else {
      setConversationToDelete(conversation);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete.id);
        setDeleteModalOpen(false);
        setConversationToDelete(null);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  return (
    <>
      <div className={`w-80 h-full flex flex-col ${darkMode ? 'bg-dark-lighter' : 'bg-gray-100'}`}>
        <div className={`flex items-center justify-between p-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'} border-b`}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 ${darkMode ? 'text-white hover:text-gray-300' : 'text-gray-900 hover:text-gray-700'}`}
          >
            <h2 className="text-sm font-medium">Conversations</h2>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors lg:hidden ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={async () => {
              try {
                setCurrentConversation(null);
              } catch (err) {
                // Gérer l'erreur si besoin
              }
            }}
            className={`flex items-center justify-center gap-2 w-full p-2.5 rounded-lg transition-all duration-200 ${
              darkMode 
                ? 'bg-primary text-white hover:bg-primary-dark hover:shadow-md active:scale-[0.98]' 
                : 'bg-primary text-white hover:bg-primary-dark hover:shadow-md active:scale-[0.98]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Nouvelle conversation</span>
          </button>
        </div>

        {isExpanded && (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="p-4 mx-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Erreur</span>
                </div>
                <p>{error}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              <div className="space-y-px">
                {conversations.map((conversation: Conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={currentConversation?.id === conversation.id}
                    darkMode={darkMode}
                    onSelect={() => setCurrentConversation(conversation)}
                    onDelete={() => handleDeleteClick(conversation)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setConversationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        conversationTitle={conversationToDelete?.title || ''}
        darkMode={darkMode}
      />
    </>
  );
};

export default ConversationHistory;