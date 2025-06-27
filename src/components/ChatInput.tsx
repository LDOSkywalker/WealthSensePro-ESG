import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { IAModel, IA_MODELS } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  darkMode?: boolean;
  selectedModel: IAModel;
  onModelChange: (model: IAModel) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  darkMode = true,
  selectedModel,
  onModelChange
}) => {
  const [message, setMessage] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }

    // Handle clicks outside of model selector
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const currentMessage = message;
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onSendMessage(currentMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleModelSelector = () => {
    setIsModelSelectorOpen(!isModelSelectorOpen);
  };

  const handleModelSelect = (model: IAModel) => {
    onModelChange(model);
    setIsModelSelectorOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-end p-3 rounded-lg ${darkMode ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
      <div className="relative" ref={modelSelectorRef}>
        <button
          type="button"
          onClick={toggleModelSelector}
          className={`p-2 rounded-lg transition-colors mr-2 ${
            darkMode 
              ? 'hover:bg-gray-700 text-primary' 
              : 'hover:bg-gray-100 text-primary'
          }`}
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {isModelSelectorOpen && (
          <div className={`absolute bottom-full left-0 mb-2 w-64 rounded-lg shadow-lg ${
            darkMode ? 'bg-dark-card border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {IA_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => handleModelSelect(model)}
                className={`w-full text-left px-4 py-3 flex flex-col ${
                  model.id === selectedModel.id
                    ? 'bg-primary/10 text-primary'
                    : darkMode
                    ? 'hover:bg-gray-800 text-white'
                    : 'hover:bg-gray-50 text-gray-900'
                } transition-colors`}
              >
                <span className="font-medium text-sm">{model.name}</span>
                <span className={`text-xs mt-0.5 ${
                  model.id === selectedModel.id
                    ? 'text-primary/70'
                    : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}>
                  {model.description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleMessageChange}
        onKeyDown={handleKeyDown}
        placeholder="Posez votre question à WealthSense..."
        className={`flex-1 bg-transparent border-none outline-none text-sm resize-none min-h-[40px] max-h-[200px] ${
          darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'
        }`}
        disabled={isLoading}
        rows={1}
      />
      <button
        type="submit"
        className={`p-2 rounded-full flex-shrink-0 ml-2 ${
          message.trim() && !isLoading
            ? 'bg-primary hover:bg-primary-dark text-white'
            : `${darkMode ? 'bg-gray-700' : 'bg-gray-300'} cursor-not-allowed`
        } transition-colors`}
        disabled={!message.trim() || isLoading}
      >
        <Send className="h-4 w-4 text-white" />
      </button>
    </form>
  );
};

export default ChatInput