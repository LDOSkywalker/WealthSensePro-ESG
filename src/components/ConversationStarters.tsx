import React from 'react';
import { Leaf, TrendingUp, Building2, PiggyBank } from 'lucide-react';
import { StarterTopic } from '../types';

interface ConversationStarterProps {
  onStarterClick?: (message: string, topic: string) => void;
  darkMode?: boolean;
}

const ConversationStarters: React.FC<ConversationStarterProps> = ({ onStarterClick, darkMode = true }) => {
  const starters: StarterTopic[] = [
    {
      title: "L'investissement responsable",
      message: "Je souhaite en savoir plus sur l'investissement responsable",
      topic: "topicDurable",
      icon: Leaf,
      gradient: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Les produits financiers (OPCVM, ETF, produits structurés...)",
      message: "Je souhaite découvrir les produits financiers",
      topic: "topicFinance",
      icon: TrendingUp,
      gradient: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Les SCPI",
      message: "Je souhaite découvrir les SCPI",
      topic: "topicSCPI",
      icon: Building2,
      gradient: "from-blue-500/20 to-indigo-500/20"
    },
    {
      title: "Le Private Equity",
      message: "Je souhaite me renseigner sur le Private Equity",
      topic: "topicPrivateEquity",
      icon: PiggyBank,
      gradient: "from-blue-500/20 to-indigo-500/20"
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {starters.map((starter, index) => {
          const Icon = starter.icon;
          return (
            <button
              key={index}
              onClick={() => {
                if (onStarterClick) {
                  onStarterClick(starter.message, starter.topic);
                }
              }}
              className={`
                flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-all duration-200
                ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
                bg-gradient-to-br ${starter.gradient}
                transform hover:scale-[0.98] active:scale-[0.97]
                w-full cursor-pointer
              `}
            >
              <div className={`
                p-1.5 rounded-lg flex-shrink-0
                ${darkMode ? 'bg-dark-card' : 'bg-white'} 
                text-primary
              `}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className={`
                text-left text-sm font-medium
                ${darkMode ? 'text-white' : 'text-gray-900'}
              `}>
                {starter.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationStarters;