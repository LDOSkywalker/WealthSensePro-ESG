import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Message, Topic, IAModel, IA_MODELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface ChatContainerProps {
  selectedTopic: Topic | null;
  darkMode?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006';

const ChatContainer: React.FC<ChatContainerProps> = ({ selectedTopic, darkMode = true }) => {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<IAModel>(IA_MODELS.find(model => model.isDefault) || IA_MODELS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { currentConversation, createNewConversation, addMessage } = useConversation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  useEffect(() => {
    if (selectedTopic) {
      setLocalMessages([
        {
          id: Date.now().toString(),
          content: `Vous avez sélectionné: ${selectedTopic.title}. Comment puis-je vous aider sur ce sujet?`,
          sender: 'bot',
          timestamp: Date.now()
        }
      ]);
    }
  }, [selectedTopic]);

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

      // Get the last 5 messages from the conversation
      const lastMessages = targetConversation.messages.slice(-5).map(msg => ({
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp
      }));
      
      const params = {
        message: content,
        userId: currentUser.uid,
        conversationId: targetConversation.id,
        topic: selectedTopic?.title || 'General',
        iaModel: selectedModel.id,
        lastMessages: lastMessages
      };
      
      const response = await axios({
        method: 'GET',
        url: `${API_URL}/api/webhook`,
        params,
        timeout: 60000,
        headers: {
          'Accept': 'application/json'
        }
      });

      let botResponse;
      
      if (response.data) {
        if (typeof response.data === 'string') {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: response.data
              }]
            }
          };
        } else if (response.data.output) {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: response.data.output
              }]
            }
          };
        } else if (response.data.response) {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: response.data.response
              }]
            }
          };
        } else if (response.data.message) {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: response.data.message
              }]
            }
          };
        } else if (response.data.result) {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: response.data.result
              }]
            }
          };
        } else {
          botResponse = {
            completeResponse: {
              data: [{
                responseType: 'text',
                content: JSON.stringify(response.data)
              }]
            }
          };
        }
      } else {
        botResponse = {
          completeResponse: {
            data: [{
              responseType: 'text',
              content: "Je suis désolé, je n'ai pas pu traiter votre demande."
            }]
          }
        };
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: JSON.stringify(botResponse),
        sender: 'bot',
        timestamp: Date.now()
      };

      setLocalMessages(prev => [...prev, botMessage]);
      
      await addMessage(content, 'user', JSON.stringify(botResponse));
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
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
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111827]">
        {localMessages.length === 0 && !selectedTopic ? (
          <div className={`flex flex-col items-center justify-center h-full text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Comment puis-je vous aider aujourd'hui ?</h2>
            <p className="mb-6 text-sm">Sur quel(s) sujet(s) souhaitez-vous des informations ?</p>
            <p className="text-xs">En période d'entraînement, vos interactions seront utilisées pour améliorer le modèle</p>
          </div>
        ) : (
          <>
            {localMessages.map(message => (
              <ChatMessage key={message.id} message={message} darkMode={darkMode} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="p-3 bg-[#1a1f2e]">
        <div className="flex items-center text-yellow-500 text-xs mb-2">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <p>WealthSense est en version Beta. Les réponses générées peuvent contenir des erreurs ou des imprécisions.</p>
        </div>
        <ChatInput 
          onSendMessage={sendMessage} 
          isLoading={isLoading} 
          darkMode={darkMode} 
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
};

export default ChatContainer;