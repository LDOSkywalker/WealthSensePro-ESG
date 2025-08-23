import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import { ConversationHistory, ChatMessage } from '../components/chat';
import axios from 'axios';
import LoadingDots from '../components/LoadingDots';
import { Message, IAModel, IA_MODELS, Conversation } from '../types';
import { Send, AlertTriangle, Plus, HelpCircle, Package, Scale, Menu, Sparkles } from 'lucide-react';
import DeleteModal from '../components/DeleteModal';

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

interface SuggestionButton {
  icon: React.ReactNode;
  text: string;
  prompt: string;
}

const Dashboard: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const { currentUser } = useAuth();
  const { currentConversation, createNewConversation, addMessage, error: conversationError, deleteConversation } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [firstName, setFirstName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  const suggestionButtons: SuggestionButton[] = [
    {
      icon: <Scale className="w-4 h-4" />,
      text: "Education financière",
      prompt: "Je souhaite me former à la finance responsable."
    },
    {
      icon: <Package className="w-4 h-4" />,
      text: "Question sur un fonds",
      prompt: "J'aimerais en savoir plus sur un fonds en particulier."
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      text: "Comprendre la réglementation ESG",
      prompt: "Je veux comprendre les règles, labels ou obligations en matière de finance responsable."
    }
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    setShowContent(true);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (currentConversation?.messages) {
      setLocalMessages(currentConversation.messages);
    } else {
      setLocalMessages([]);
    }
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  useEffect(() => {
    // Charger le prénom depuis l'API profil
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          withCredentials: true
        });
        if (response.data) {
          setFirstName(response.data.firstName || '');
        }
      } catch (err) {
        setFirstName('');
      }
    };
    fetchProfile();
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height of 200px
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentUser || isLoading) return;
    setIsLoading(true);
    let targetConversation = currentConversation;

    try {
      if (!targetConversation) {
        targetConversation = await createNewConversation();
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: Date.now()
      };
      setLocalMessages(prev => [...prev, userMessage]);

      const webhookUrl = `${import.meta.env.VITE_API_URL}/api/webhook`;
      
      const params = {
        message: content,
        userId: currentUser.uid,
        conversationId: targetConversation.id,
        topic: 'General',
        iaModel: 'WS-One'
      };
      
      const response = await axios({
        method: 'GET',
        url: webhookUrl,
        params,
        timeout: 60000,
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });

      let botResponse = "Je suis désolé, je n'ai pas pu traiter votre demande.";
      
      if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].content) {
        botResponse = response.data[0].content;
      } else if (typeof response.data === 'string') {
        botResponse = response.data;
      } else if (response.data.output) {
        botResponse = response.data.output;
      } else if (response.data.response) {
        botResponse = response.data.response;
      } else if (response.data.message) {
        botResponse = response.data.message;
      } else if (response.data.result) {
        botResponse = response.data.result;
      } else {
        try {
          botResponse = JSON.stringify(response.data);
        } catch (e) {
          console.error('Failed to stringify response data:', e);
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: Date.now()
      };

      setLocalMessages(prev => [...prev, botMessage]);
      
      await addMessage(content, 'user', botResponse, targetConversation.id);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Vérifier si c'est une erreur SESSION_REVOKED
      if (error.response?.data?.code === 'SESSION_REVOKED') {
        console.log('🚨 Session révoquée détectée dans Dashboard, pas d\'affichage du message d\'erreur');
        // Ne pas afficher de message d'erreur, la mini-modale mobile s'affichera
        return;
      }
      
      let errorMessage = "Désolé, une erreur s'est produite lors de la communication avec l'assistant.";
      
      if (error.response) {
        errorMessage = `Erreur ${error.response.status}: ${error.response.data?.message || 'Erreur de communication avec le serveur'}`;
      } else if (error.request) {
        errorMessage = "Aucune réponse reçue du serveur. Veuillez vérifier votre connexion internet.";
      } else {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: JSON.stringify({
          data: [{
            responseType: "text",
            content: errorMessage
          }]
        }),
        sender: 'bot',
        timestamp: Date.now()
      };
      
      setLocalMessages(prev => [...prev, errorBotMessage]);
      
      await addMessage(content, 'user', JSON.stringify({
        data: [{
          responseType: "text",
          content: errorMessage
        }]
      }));
      
    } finally {
      setIsLoading(false);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleDeleteConversationRequest = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setDeleteModalOpen(true);
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
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-dark text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        <div className={`
          fixed lg:static inset-y-0 left-0 z-30 w-80
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${darkMode ? 'bg-dark-lighter' : 'bg-gray-100'}
        `}>
          <ConversationHistory 
            darkMode={darkMode} 
            onClose={toggleSidebar}
            onDeleteConversationRequest={handleDeleteConversationRequest}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <Header 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode}
            onMenuClick={toggleSidebar}
            showMenuButton={true}
          />

          <main className="flex-1 overflow-hidden flex flex-col lg:pl-0">
            {localMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-4 py-12">
                <div className="text-center max-w-2xl mx-auto px-4">
                <h1 
                    className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 transition-opacity duration-1000 ease-in-out ${
                    showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    } ${darkMode ? 'text-white' : 'text-gray-900'}`}
>
                    Bonjour
                    {firstName && (
                    <span className="text-primary">{` ${capitalizeFirstLetter(firstName)}`}</span>
                   )}
                   , comment puis-je vous aider aujourd'hui ?
               </h1>
                  <p 
                    className={`text-xs sm:text-sm mb-8 sm:mb-12 transition-opacity duration-1000 ease-in-out delay-200 ${
                      showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    } ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    Je suis WealthSenseImpact, l'assistant IA dédiée à la finance responsable.<br />
                    En période d'entrainement, vos interactions seront utilisées pour améliorer le modèle.
                  </p>
                </div>
                
                <div className={`w-full max-w-2xl transition-opacity duration-1000 ease-in-out delay-300 ${
                  showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <form onSubmit={handleSubmit} className="relative mx-4">
                    <textarea
                      ref={textareaRef}
                      placeholder="Posez votre question à WealthSenseImpact..."
                      className={`w-full ${
                        darkMode 
                          ? 'bg-dark-card text-white placeholder-gray-400 border-gray-800' 
                          : 'bg-white text-gray-900 placeholder-gray-500 border-gray-200'
                      } border rounded-xl pl-4 pr-12 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-primary shadow-input transition-all duration-200 resize-none min-h-[48px] sm:min-h-[56px] max-h-[200px]`}
                      value={message}
                      onChange={handleMessageChange}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                    />
                    <button
                      type="submit"
                      className={`absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 ${
                        message.trim() && !isLoading
                          ? 'text-primary hover:text-primary-dark'
                          : darkMode ? 'text-gray-400' : 'text-gray-400'
                      } transition-colors duration-200`}
                      disabled={!message.trim() || isLoading}
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </form>

                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mt-4 mx-4">
                    {suggestionButtons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(button.prompt)}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                          darkMode
                            ? 'bg-dark-card hover:bg-gray-800 text-white'
                            : 'bg-white hover:bg-gray-50 text-gray-900 shadow-sm'
                        } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        {button.icon}
                        <span className="text-xs sm:text-sm whitespace-nowrap">{button.text}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center text-yellow-500 text-xs mt-4 sm:mt-6 mx-4 p-2 sm:p-3 rounded-lg bg-yellow-500/10">
                    <AlertTriangle className="h-3 w-3 mr-2 flex-shrink-0" />
                    <p className="text-xs">WealthSenseImpact est en version Beta. Les réponses générées peuvent contenir des erreurs.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
                    {localMessages.map((message: Message) => (
                      <ChatMessage 
                        key={message.id} 
                        message={message} 
                        darkMode={darkMode}
                        onSendMessage={sendMessage}
                      />
                    ))}
                    {isLoading && <LoadingDots darkMode={darkMode} />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div className={`border-t ${darkMode ? 'border-gray-800 bg-dark' : 'border-gray-200 bg-white'} shadow-lg`}>
                  <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto px-4 py-3 sm:py-4">
                    <textarea
                      ref={textareaRef}
                      placeholder="Posez votre question à WealthSenseImpact..."
                      className={`w-full ${
                        darkMode 
                          ? 'bg-dark-card text-white placeholder-gray-400 border-gray-800' 
                          : 'bg-white text-gray-900 placeholder-gray-500 border-gray-200'
                      } border rounded-xl pl-4 pr-12 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-primary shadow-input transition-all duration-200 resize-none min-h-[48px] sm:min-h-[56px] max-h-[200px]`}
                      value={message}
                      onChange={handleMessageChange}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                    />
                    <button
                      type="submit"
                      className={`absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 ${
                        message.trim() && !isLoading
                          ? 'text-primary hover:text-primary-dark'
                          : darkMode ? 'text-gray-400' : 'text-gray-400'
                      } transition-colors duration-200`}
                      disabled={!message.trim() || isLoading}
                    >
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setConversationToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        conversationTitle={conversationToDelete?.title || ''}
        darkMode={darkMode}
      />
    </div>
  );
};

export default Dashboard;