import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormProps, Emprunt, TYPES_EMPRUNTS } from './types';

const EndettementForm: React.FC<FormProps<Emprunt[]>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const addEmprunt = () => {
    const newEmprunt: Emprunt = {
      id: Date.now().toString(),
      type: '',
      montantInitial: 0,
      capitalRestantDu: 0,
      tauxInteret: 0,
      dureeRestante: 0,
      mensualiteActuelle: 0
    };
    onChange([...data, newEmprunt]);
  };

  const removeEmprunt = (id: string) => {
    onChange(data.filter(emprunt => emprunt.id !== id));
  };

  const updateEmprunt = (index: number, field: keyof Emprunt, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalDette = data.reduce((sum, emprunt) => sum + emprunt.capitalRestantDu, 0);
  const totalMensualites = data.reduce((sum, emprunt) => sum + emprunt.mensualiteActuelle, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Endettement
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Dette totale : {formatCurrency(totalDette)} • Mensualités : {formatCurrency(totalMensualites)}
          </p>
        </div>
        <button
          onClick={addEmprunt}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un emprunt
        </button>
      </div>

      {data.length === 0 ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Aucun emprunt renseigné</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un emprunt" pour commencer</p>
        </div>
      ) : (
        data.map((emprunt, index) => (
          <div key={emprunt.id} className={`p-4 rounded-lg border ${
            darkMode ? 'border-gray-700 bg-dark-lighter' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Emprunt {index + 1} {emprunt.type && `- ${emprunt.type}`}
              </h5>
              <button
                onClick={() => removeEmprunt(emprunt.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Type d'emprunt
                </label>
                <select
                  value={emprunt.type}
                  onChange={(e) => updateEmprunt(index, 'type', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="">Sélectionnez</option>
                  {TYPES_EMPRUNTS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Montant initial (€)
                </label>
                <input
                  type="number"
                  value={emprunt.montantInitial !== undefined ? emprunt.montantInitial.toString() : ''}
                  onChange={(e) => updateEmprunt(index, 'montantInitial', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Capital restant dû (€)
                </label>
                <input
                  type="number"
                  value={emprunt.capitalRestantDu !== undefined ? emprunt.capitalRestantDu.toString() : ''}
                  onChange={(e) => updateEmprunt(index, 'capitalRestantDu', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Taux d'intérêt (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={emprunt.tauxInteret !== undefined ? emprunt.tauxInteret.toString() : ''}
                  onChange={(e) => updateEmprunt(index, 'tauxInteret', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Durée restante (mois)
                </label>
                <input
                  type="number"
                  value={emprunt.dureeRestante !== undefined ? emprunt.dureeRestante.toString() : ''}
                  onChange={(e) => updateEmprunt(index, 'dureeRestante', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Mensualité actuelle (€)
                </label>
                <input
                  type="number"
                  value={emprunt.mensualiteActuelle !== undefined ? emprunt.mensualiteActuelle.toString() : ''}
                  onChange={(e) => updateEmprunt(index, 'mensualiteActuelle', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>
            </div>

            {/* Calculs automatiques */}
            {emprunt.capitalRestantDu > 0 && emprunt.mensualiteActuelle > 0 && (
              <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-dark' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Coût total restant :</span>
                    <div className="font-medium">
                      {formatCurrency(emprunt.mensualiteActuelle * emprunt.dureeRestante)}
                    </div>
                  </div>
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Intérêts restants :</span>
                    <div className="font-medium">
                      {formatCurrency((emprunt.mensualiteActuelle * emprunt.dureeRestante) - emprunt.capitalRestantDu)}
                    </div>
                  </div>
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fin de remboursement :</span>
                    <div className="font-medium">
                      {new Date(Date.now() + emprunt.dureeRestante * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default EndettementForm;