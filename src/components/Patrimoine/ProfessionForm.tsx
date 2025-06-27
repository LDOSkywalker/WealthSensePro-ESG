import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormProps, Profession, Societe, TYPES_SOCIETES } from './types';

const ProfessionForm: React.FC<FormProps<Profession>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const updateField = (field: keyof Profession, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const addSociete = () => {
    const newSociete: Societe = {
      id: Date.now().toString(),
      nom: '',
      typeSociete: '',
      parts: 0,
      valorisation: 0,
      dividendes: 0
    };
    updateField('societes', [...data.societes, newSociete]);
  };

  const removeSociete = (id: string) => {
    updateField('societes', data.societes.filter(societe => societe.id !== id));
  };

  const updateSociete = (index: number, field: keyof Societe, value: any) => {
    const newSocietes = [...data.societes];
    newSocietes[index] = { ...newSocietes[index], [field]: value };
    updateField('societes', newSocietes);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalValorisation = data.societes.reduce((sum, societe) => sum + (societe.valorisation * societe.parts / 100), 0);
  const totalDividendes = data.societes.reduce((sum, societe) => sum + societe.dividendes, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sociétés détenues
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Valeur totale des parts : {formatCurrency(totalValorisation)} • Dividendes annuels : {formatCurrency(totalDividendes)}
          </p>
        </div>
        
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Détenez-vous des parts dans une société ?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="detientSociete"
                checked={data.detientSociete === true}
                onChange={() => updateField('detientSociete', true)}
                className="mr-2"
              />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Oui</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="detientSociete"
                checked={data.detientSociete === false}
                onChange={() => {
                  updateField('detientSociete', false);
                  updateField('societes', []);
                }}
                className="mr-2"
              />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Non</span>
            </label>
          </div>
        </div>
      </div>

      {data.detientSociete && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Liste des sociétés
            </h5>
            <button
              onClick={addSociete}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une société
            </button>
          </div>

          {data.societes.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Aucune société renseignée</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter une société" pour commencer</p>
            </div>
          ) : (
            data.societes.map((societe, index) => (
              <div key={societe.id} className={`p-4 rounded-lg border ${
                darkMode ? 'border-gray-700 bg-dark-lighter' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h6 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Société {index + 1} {societe.nom && `- ${societe.nom}`}
                  </h6>
                  <button
                    onClick={() => removeSociete(societe.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Nom de la société
                    </label>
                    <input
                      type="text"
                      value={societe.nom}
                      onChange={(e) => updateSociete(index, 'nom', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                      placeholder="Ex: Ma Société SARL"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Type de société
                    </label>
                    <select
                      value={societe.typeSociete}
                      onChange={(e) => updateSociete(index, 'typeSociete', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    >
                      <option value="">Sélectionnez</option>
                      {TYPES_SOCIETES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Parts détenues (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={societe.parts !== undefined ? societe.parts.toString() : ''}
                      onChange={(e) => updateSociete(index, 'parts', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Valorisation totale de la société (€)
                    </label>
                    <input
                      type="number"
                      value={societe.valorisation !== undefined ? societe.valorisation.toString() : ''}
                      onChange={(e) => updateSociete(index, 'valorisation', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Dividendes annuels reçus (€)
                    </label>
                    <input
                      type="number"
                      value={societe.dividendes !== undefined ? societe.dividendes.toString() : ''}
                      onChange={(e) => updateSociete(index, 'dividendes', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                  </div>
                </div>

                {/* Calculs automatiques pour cette société */}
                {societe.valorisation > 0 && societe.parts > 0 && (
                  <div className={`mt-4 p-3 rounded ${darkMode ? 'bg-dark' : 'bg-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Valeur de vos parts :</span>
                        <div className="font-medium">
                          {formatCurrency(societe.valorisation * societe.parts / 100)}
                        </div>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rendement annuel :</span>
                        <div className="font-medium">
                          {societe.valorisation > 0 ? ((societe.dividendes / (societe.valorisation * societe.parts / 100)) * 100).toFixed(2) : 0}%
                        </div>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dividendes mensuels :</span>
                        <div className="font-medium">
                          {formatCurrency(societe.dividendes / 12)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Résumé global */}
          {data.societes.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-lighter' : 'bg-gray-50'}`}>
              <h5 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Résumé global des participations
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nombre de sociétés :</span>
                  <div className="font-medium">
                    {data.societes.length}
                  </div>
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Valeur totale des parts :</span>
                  <div className="font-medium">
                    {formatCurrency(totalValorisation)}
                  </div>
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dividendes annuels totaux :</span>
                  <div className="font-medium">
                    {formatCurrency(totalDividendes)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionForm;