import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Fund {
  id: string;
  name: string;
  percentage: number;
}

interface PortfolioInputProps {
  darkMode?: boolean;
  onSubmit: (funds: Fund[]) => void;
}

const PortfolioInput: React.FC<PortfolioInputProps> = ({ darkMode = true, onSubmit }) => {
  const [funds, setFunds] = useState<Fund[]>([{ id: '1', name: '', percentage: 0 }]);
  const [error, setError] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const newTotal = funds.reduce((sum, fund) => sum + fund.percentage, 0);
    setTotal(newTotal);
    
    if (newTotal > 100) {
      setError('La répartition totale ne peut pas dépasser 100%');
    } else if (newTotal < 100) {
      setError('La répartition totale doit être égale à 100%');
    } else {
      setError('');
    }
  }, [funds]);

  const handleAddFund = () => {
    setFunds(prev => [...prev, { 
      id: (prev.length + 1).toString(),
      name: '', 
      percentage: 0 
    }]);
  };

  const handleRemoveFund = (id: string) => {
    setFunds(prev => prev.filter(fund => fund.id !== id));
  };

  const handleChange = (id: string, field: 'name' | 'percentage', value: string) => {
    setFunds(prev => prev.map(fund => {
      if (fund.id === id) {
        return {
          ...fund,
          [field]: field === 'percentage' ? Math.min(Math.max(0, Number(value)), 100) : value
        };
      }
      return fund;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total === 100 && funds.every(fund => fund.name.trim())) {
      onSubmit(funds);
    }
  };

  return (
    <div className="space-y-4">
      {/* Message d'introduction */}
      <div className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
        style={{marginBottom: '0.5rem'}}>
        Très bien, veuillez renseigner la composition de votre portefeuille ci-dessous :
      </div>
      <div className={`rounded-lg border ${
        darkMode ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-white'
      } p-6`}>
        <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Composition de votre portefeuille
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            {funds.map((fund) => (
              <div key={fund.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={fund.name}
                    onChange={(e) => handleChange(fund.id, 'name', e.target.value)}
                    placeholder="Nom du fonds"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-dark border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                    required
                  />
                </div>
                
                <div className="w-32">
                  <div className="relative">
                    <input
                      type="number"
                      value={fund.percentage || ''}
                      onChange={(e) => handleChange(fund.id, 'percentage', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      className={`w-full px-3 py-2 pr-8 rounded-lg border ${
                        darkMode 
                          ? 'bg-dark border-gray-700 text-white' 
                          : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                      required
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      %
                    </span>
                  </div>
                </div>
                
                {funds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFund(fund.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddFund}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un fonds</span>
            </button>

            <div className="text-right">
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total
              </div>
              <div className={`text-lg font-medium ${
                total === 100 
                  ? 'text-green-500' 
                  : total > 100 
                    ? 'text-red-500' 
                    : darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {total}%
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={total !== 100 || !funds.every(fund => fund.name.trim())}
              className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Valider la composition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PortfolioInput; 