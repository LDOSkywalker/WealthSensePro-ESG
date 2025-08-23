import React, { useState } from 'react';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import axios from 'axios';

interface FeedbackButtonProps {
  darkMode?: boolean;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006';

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ darkMode = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { currentUser } = useAuth();
  const { currentConversation } = useConversation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !currentUser?.email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        userEmail: currentUser.email,
        feedback: feedback.trim(),
        conversationId: currentConversation?.id || null,
        timestamp: new Date().toISOString()
      };

      const response = await axios({
        method: 'POST',
        url: `${BACKEND_URL}/api/feedback`,
        data: payload,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('Échec de l\'envoi du feedback');
      }

      setSuccess(true);
      setFeedback('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du feedback:', err);
      setError('Une erreur est survenue lors de l\'envoi du feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200 ${
          darkMode 
            ? 'bg-primary hover:bg-primary-dark text-white' 
            : 'bg-primary hover:bg-primary-dark text-white'
        } hover:scale-105 active:scale-95 flex items-center gap-2`}
        title="Envoyer un feedback"
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative w-full max-w-md mx-4 p-6 rounded-xl shadow-xl ${
            darkMode ? 'bg-dark-card' : 'bg-white'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>

            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Vos commentaires sont précieux
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
                Merci pour votre feedback !
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Partagez votre expérience avec nous..."
                className={`w-full h-32 p-3 rounded-lg resize-none mb-4 ${
                  darkMode 
                    ? 'bg-dark border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                } border focus:outline-none focus:ring-2 focus:ring-primary`}
                disabled={isSubmitting}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!feedback.trim() || isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;