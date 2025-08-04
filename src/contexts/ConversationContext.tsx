import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Conversation, Message } from '../types';
import axios from 'axios';

interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  createNewConversation: (topic?: string) => Promise<Conversation>;
  addMessage: (content: string, sender: 'user' | 'bot', botResponse?: string, conversationId?: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}

interface ConversationProviderProps {
  children: ReactNode;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006';

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Toutes les requêtes axios utilisent withCredentials: true (cookie JWT)
  axios.defaults.withCredentials = true;

  const loadConversations = async () => {
    if (!currentUser) {
      setConversations([]);
      setCurrentConversation(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Charger les conversations de l'utilisateur
      const conversationsResponse = await axios.get(`${API_URL}/api/conversations`, { 
        params: { userId: currentUser.uid },
        withCredentials: true 
      });
      const conversationsData = conversationsResponse.data;
      // Charger les messages pour chaque conversation
      const conversationsWithMessages = await Promise.all(
        conversationsData.map(async (conversation: Conversation) => {
          try {
            const messagesResponse = await axios.get(`${API_URL}/api/messages/` + conversation.id, { withCredentials: true });
            return {
              ...conversation,
              messages: messagesResponse.data
            };
          } catch (error) {
            return {
              ...conversation,
              messages: []
            };
          }
        })
      );
      setConversations(conversationsWithMessages);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des conversations.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line
  }, [currentUser]);

  const loadConversationMessages = async (conversationId: string) => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API_URL}/api/messages/` + conversationId, { withCredentials: true });
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: response.data
      } : null);
      setError(null);
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des messages.");
    }
  };

  const createNewConversation = async (topic: string = 'topicGeneral') => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    try {
      const now = new Date().toISOString();
      const response = await axios.post(`${API_URL}/api/conversations`, {
        userId: currentUser.uid,
        title: 'Nouvelle conversation',
        topic: topic,
        createdAt: now,
        updatedAt: now
      }, { withCredentials: true });
      const newConversation = response.data;
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      // Ajouter le message de bienvenue
      const welcomeMessage = `Bonjour, je suis ravi de vous retrouver.`;
      await addMessage(welcomeMessage, 'bot', undefined, newConversation.id);
      setError(null);
      return newConversation;
    } catch (err) {
      setError("Une erreur est survenue lors de la création de la conversation.");
      throw err;
    }
  };

  const addMessage = async (content: string, sender: 'user' | 'bot', botResponse?: string, conversationId?: string) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    try {
      const targetConversationId = conversationId || currentConversation?.id;
      if (!targetConversationId) {
        throw new Error('Aucune conversation active');
      }
      await axios.post(`${API_URL}/api/messages`, {
        conversationId: targetConversationId,
        content: content,
        sender
      }, { withCredentials: true });
      if (botResponse) {
        await axios.post(`${API_URL}/api/messages`, {
          conversationId: targetConversationId,
          content: botResponse,
          sender: 'bot'
        }, { withCredentials: true });
      }
      await loadConversationMessages(targetConversationId);
      setError(null);
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi du message.");
      throw err;
    }
  };

  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    try {
      await axios.put(`${API_URL}/api/conversations/` + conversationId, {
        title: newTitle
      }, { withCredentials: true });
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      ));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
      setError(null);
    } catch (err) {
      setError("Une erreur est survenue lors de la mise à jour du titre.");
      throw err;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!currentUser) throw new Error('Utilisateur non connecté');
    try {
      const response = await axios.delete(`${API_URL}/api/conversations/` + conversationId, { withCredentials: true });
      if (response.status === 200) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          const nextConversation = conversations.find(c => c.id !== conversationId);
          setCurrentConversation(nextConversation || null);
        }
        setError(null);
      } else {
        throw new Error(response.data.error || 'Erreur lors de la suppression');
      }
    } catch (err: any) {
      setError("Une erreur est survenue lors de la suppression de la conversation.");
      throw err;
    }
  };

  const handleSetCurrentConversation = async (conversation: Conversation | null) => {
    if (!conversation) {
      setCurrentConversation(null);
      return;
    }
    try {
      setLoading(true);
      const messagesResponse = await axios.get(`${API_URL}/api/messages/` + conversation.id, { withCredentials: true });
      setCurrentConversation({
        ...conversation,
        messages: messagesResponse.data
      });
      setError(null);
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des messages.");
      setCurrentConversation(conversation);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    conversations,
    currentConversation,
    setCurrentConversation: handleSetCurrentConversation,
    createNewConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    loading,
    error
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};