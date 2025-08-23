import React from 'react';

interface Choice {
  label: string;
  value: string;
}

interface MultipleChoiceProps {
  question: string;
  choices: Choice[];
  onSelect: (value: string) => void;
  darkMode?: boolean;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  question,
  choices,
  onSelect,
  darkMode = true
}) => {
  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {question}
      </h3>
      <div className="space-y-2">
        {choices.map((choice) => (
          <button
            key={choice.value}
            onClick={() => onSelect(choice.value)}
            className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
              darkMode
                ? 'bg-dark-lighter hover:bg-gray-800 text-white'
                : 'bg-white hover:bg-gray-50 text-gray-900'
            } border ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            } hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              } mr-3`}>
                <span className="text-sm font-medium">{choice.value}</span>
              </div>
              <span className="text-sm">{choice.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MultipleChoice;