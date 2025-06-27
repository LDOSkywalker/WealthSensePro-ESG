import React from 'react';
import { Check } from 'lucide-react';

interface ChartControlsProps {
  availableMetrics: string[];
  selectedMetrics: string[];
  onMetricToggle: (metric: string) => void;
  darkMode?: boolean;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  availableMetrics,
  selectedMetrics,
  onMetricToggle,
  darkMode = true
}) => {
  return (
    <div className="mb-4">
      <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Critères à afficher :
      </h4>
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map((metric) => {
          const isSelected = selectedMetrics.includes(metric);
          return (
            <button
              key={metric}
              onClick={() => onMetricToggle(metric)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium 
                transition-all duration-200
                ${isSelected 
                  ? 'bg-primary text-white' 
                  : darkMode
                    ? 'bg-dark-lighter text-gray-300 hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isSelected 
                  ? 'border-white' 
                  : darkMode 
                    ? 'border-gray-500' 
                    : 'border-gray-400'
                }
              `}>
                {isSelected && <Check className="w-3 h-3" />}
              </div>
              {metric}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChartControls;