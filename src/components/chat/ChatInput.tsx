import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  darkMode?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  darkMode = true,
}) => {
  const [message, setMessage] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
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

  return (
    <form onSubmit={handleSubmit} className={`flex items-end p-3 rounded-lg ${darkMode ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
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