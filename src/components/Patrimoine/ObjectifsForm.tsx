import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormProps, ObjectifPatrimonial, OBJECTIFS_PATRIMONIAUX } from './types';

const ObjectifsForm: React.FC<FormProps<ObjectifPatrimonial[]>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const addObjectif = () => {
    const newObjectif: ObjectifPatrimonial = {
      id: Date.now().toString(),
      objectif: '',
      priorite: 1,
      horizonTemporel: ''
    };
    onChange([...data, newObjectif]);
  };

  const removeObjectif = (id: string) => {
    onChange(data.filter(objectif => objectif.id !== id));
  };

  const updateObjectif = (index: number, field: keyof ObjectifPatrimonial, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const getPriorityColor = (priorite: number) => {
    switch (priorite) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-blue-500';
      case 5: return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityLabel = (priorite: number) => {
    switch (priorite) {
      case 1: return 'Très haute';
      case 2: return 'Haute';
      case 3: return 'Moyenne';
      case 4: return 'Faible';
      case 5: return 'Très faible';
      default: return 'Non définie';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Objectifs patrimoniaux
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Définissez vos objectifs par ordre de priorité
          </p>
        </div>
        <button
          onClick={addObjectif}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un objectif
        </button>
      </div>

      {data.length === 0 ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Aucun objectif patrimonial défini</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un objectif" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data
            .sort((a, b) => a.priorite - b.priorite)
            .map((objectif, index) => (
              <div key={objectif.id} className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700 bg-dark-lighter' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      darkMode ? 'bg-primary text-white' : 'bg-primary text-white'
                    }`}>
                      {objectif.priorite}
                    </div>
                    <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Objectif {index + 1}
                    </h5>
                    <span className={`text-sm font-medium ${getPriorityColor(objectif.priorite)}`}>
                      {getPriorityLabel(objectif.priorite)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeObjectif(objectif.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Objectif
                    </label>
                    <select
                      value={objectif.objectif}
                      onChange={(e) => updateObjectif(data.indexOf(objectif), 'objectif', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    >
                      <option value="">Sélectionnez</option>
                      {OBJECTIFS_PATRIMONIAUX.map(obj => (
                        <option key={obj} value={obj}>{obj}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Priorité (1-5)
                    </label>
                    <select
                      value={objectif.priorite}
                      onChange={(e) => updateObjectif(data.indexOf(objectif), 'priorite', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    >
                      {[1, 2, 3, 4, 5].map(p => (
                        <option key={p} value={p}>{p} - {getPriorityLabel(p)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Horizon temporel
                    </label>
                    <select
                      value={objectif.horizonTemporel}
                      onChange={(e) => updateObjectif(data.indexOf(objectif), 'horizonTemporel', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    >
                      <option value="">Sélectionnez</option>
                      <option value="Court terme (< 2 ans)">Court terme (&lt; 2 ans)</option>
                      <option value="Moyen terme (2-8 ans)">Moyen terme (2-8 ans)</option>
                      <option value="Long terme (> 8 ans)">Long terme (&gt; 8 ans)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {data.length > 0 && (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-lighter' : 'bg-gray-50'}`}>
          <h5 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Résumé des objectifs par priorité
          </h5>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(priorite => {
              const objectifsPriorite = data.filter(obj => obj.priorite === priorite);
              if (objectifsPriorite.length === 0) return null;
              
              return (
                <div key={priorite} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    darkMode ? 'bg-primary text-white' : 'bg-primary text-white'
                  }`}>
                    {priorite}
                  </div>
                  <span className={`text-sm ${getPriorityColor(priorite)}`}>
                    {getPriorityLabel(priorite)} :
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {objectifsPriorite.map(obj => obj.objectif).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectifsForm;