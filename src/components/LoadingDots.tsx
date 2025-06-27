import React, { useEffect, useState } from 'react';
import { Brain, Search, FileText, Lightbulb, CheckCircle } from 'lucide-react';

interface LoadingDotsProps {
  darkMode?: boolean;
}

interface ProcessingStep {
  id: string;
  icon: React.ReactNode;
  text: string;
  duration: number;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    id: 'analyzing',
    icon: <Brain className="w-4 h-4" />,
    text: 'Analyse de votre demande...',
    duration: 2000
  },
  {
    id: 'searching',
    icon: <Search className="w-4 h-4" />,
    text: 'Recherche d\'informations pertinentes...',
    duration: 2500
  },
  {
    id: 'processing',
    icon: <FileText className="w-4 h-4" />,
    text: 'Traitement des données...',
    duration: 2000
  },
  {
    id: 'generating',
    icon: <Lightbulb className="w-4 h-4" />,
    text: 'Génération de la réponse...',
    duration: 1500
  }
];

const LoadingDots: React.FC<LoadingDotsProps> = ({ darkMode = true }) => {
  const [showDetailedAnimation, setShowDetailedAnimation] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [dots, setDots] = useState(1);
  
  useEffect(() => {
    // Timer pour passer à l'animation détaillée après 2 secondes
    const detailedAnimationTimer = setTimeout(() => {
      setShowDetailedAnimation(true);
    }, 2000);
    
    // Animation des points (pour les deux modes)
    const dotsInterval = setInterval(() => {
      setDots(prev => prev >= 3 ? 1 : prev + 1);
    }, 400);
    
    // Progression des étapes (seulement pour l'animation détaillée)
    let stepInterval: NodeJS.Timeout;
    
    if (showDetailedAnimation) {
      stepInterval = setInterval(() => {
        setCurrentStepIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex < PROCESSING_STEPS.length) {
            // Marquer l'étape précédente comme complétée
            if (prev >= 0) {
              setCompletedSteps(completed => [...completed, PROCESSING_STEPS[prev].id]);
            }
            return nextIndex;
          } else {
            // Toutes les étapes sont terminées, on recommence le cycle
            setCompletedSteps([]);
            return 0;
          }
        });
      }, 2500);
    }
    
    return () => {
      clearTimeout(detailedAnimationTimer);
      clearInterval(dotsInterval);
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [showDetailedAnimation]);

  const formatTimestamp = () => {
    const date = new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Animation simple (3 points) pour les 2 premières secondes
  if (!showDetailedAnimation) {
    return (
      <div className="flex items-start mb-4">
        <div className="flex flex-col max-w-[80%]">
          <div className="flex items-center mb-1">
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              WealthSensePro
            </span>
            <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTimestamp()}
            </span>
          </div>
          
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#1f2937]' : 'bg-[#eef2ff]'}`}>
            <div className="flex space-x-1">
              {[1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i <= dots 
                      ? darkMode ? 'bg-gray-400' : 'bg-gray-500' 
                      : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Animation détaillée après 2 secondes
  const currentStep = PROCESSING_STEPS[currentStepIndex];
  
  return (
    <div className="flex items-start mb-4">
      <div className="flex flex-col max-w-[80%]">
        <div className="flex items-center mb-1">
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            WealthSensePro
          </span>
          <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatTimestamp()}
          </span>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#1f2937]' : 'bg-[#eef2ff]'} min-w-[280px] animate-fadeIn`}>
          {/* Étape actuelle */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              darkMode ? 'bg-primary/20' : 'bg-primary/10'
            }`}>
              <div className={`${darkMode ? 'text-primary' : 'text-primary'} animate-pulse`}>
                {currentStep.icon}
              </div>
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentStep.text}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i <= dots 
                        ? darkMode ? 'bg-primary' : 'bg-primary' 
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className={`w-full h-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-3`}>
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${((currentStepIndex + 1) / PROCESSING_STEPS.length) * 100}%` 
              }}
            />
          </div>

          {/* Liste des étapes */}
          <div className="space-y-2">
            {PROCESSING_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = index === currentStepIndex;

              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                    isCompleted 
                      ? darkMode ? 'text-green-400' : 'text-green-600'
                      : isCurrent 
                        ? darkMode ? 'text-primary' : 'text-primary'
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-3 h-3 flex items-center justify-center ${
                    isCompleted ? 'text-green-500' : isCurrent ? 'animate-spin' : ''
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : isCurrent ? (
                      <div className={`w-2 h-2 rounded-full ${
                        darkMode ? 'bg-primary' : 'bg-primary'
                      } animate-pulse`} />
                    ) : (
                      <div className={`w-2 h-2 rounded-full border ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`} />
                    )}
                  </div>
                  <span className={`${isCurrent ? 'font-medium' : ''}`}>
                    {step.text.replace('...', '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingDots;