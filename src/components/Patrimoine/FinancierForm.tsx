import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormProps, PlacementFinancier, TYPES_SUPPORTS } from './types';

const FinancierForm: React.FC<FormProps<PlacementFinancier[]>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const addPlacement = () => {
    const newPlacement: PlacementFinancier = {
      id: Date.now().toString(),
      typeSupport: '',
      intitule: '',
      montantActuel: 0,
      repartitionActions: 0,
      repartitionObligations: 0,
      repartitionMonetaire: 0,
      repartitionAutres: 0,
      versementsMensuels: 0
    };
    onChange([...data, newPlacement]);
  };

  const removePlacement = (id: string) => {
    onChange(data.filter(placement => placement.id !== id));
  };

  const updatePlacement = (index: number, field: keyof PlacementFinancier, value: any) => {
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

  const totalPatrimoine = data.reduce((sum, placement) => sum + placement.montantActuel, 0);
  const totalVersements = data.reduce((sum, placement) => sum + placement.versementsMensuels, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Patrimoine financier
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Valeur totale : {formatCurrency(totalPatrimoine)} • Versements mensuels : {formatCurrency(totalVersements)}
          </p>
        </div>
        <button
          onClick={addPlacement}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un placement
        </button>
      </div>

      {data.length === 0 ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Aucun placement financier renseigné</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un placement" pour commencer</p>
        </div>
      ) : (
        data.map((placement, index) => (
          <div key={placement.id} className={`p-4 rounded-lg border ${
            darkMode ? 'border-gray-700 bg-dark-lighter' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Placement {index + 1} {placement.typeSupport && `- ${placement.typeSupport}`}
              </h5>
              <button
                onClick={() => removePlacement(placement.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Type de support
                </label>
                <select
                  value={placement.typeSupport}
                  onChange={(e) => updatePlacement(index, 'typeSupport', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="">Sélectionnez</option>
                  {TYPES_SUPPORTS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Intitulé / nom du contrat
                </label>
                <input
                  type="text"
                  value={placement.intitule}
                  onChange={(e) => updatePlacement(index, 'intitule', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Montant actuel (€)
                </label>
                <input
                  type="number"
                  value={placement.montantActuel !== undefined ? placement.montantActuel.toString() : ''}
                  onChange={(e) => updatePlacement(index, 'montantActuel', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Versements mensuels (€)
                </label>
                <input
                  type="number"
                  value={placement.versementsMensuels !== undefined ? placement.versementsMensuels.toString() : ''}
                  onChange={(e) => updatePlacement(index, 'versementsMensuels', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Répartition estimée (%)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Actions
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={placement.repartitionActions !== undefined ? placement.repartitionActions.toString() : ''}
                      onChange={(e) => updatePlacement(index, 'repartitionActions', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 rounded border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-1 focus:ring-primary`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Obligations
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={placement.repartitionObligations !== undefined ? placement.repartitionObligations.toString() : ''}
                      onChange={(e) => updatePlacement(index, 'repartitionObligations', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 rounded border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-1 focus:ring-primary`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Monétaire
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={placement.repartitionMonetaire !== undefined ? placement.repartitionMonetaire.toString() : ''}
                      onChange={(e) => updatePlacement(index, 'repartitionMonetaire', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 rounded border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-1 focus:ring-primary`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Autres
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={placement.repartitionAutres !== undefined ? placement.repartitionAutres.toString() : ''}
                      onChange={(e) => updatePlacement(index, 'repartitionAutres', parseInt(e.target.value) || 0)}
                      className={`w-full px-2 py-1 rounded border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-1 focus:ring-primary`}
                    />
                  </div>
                </div>
                <div className={`text-xs mt-1 ${
                  (placement.repartitionActions + placement.repartitionObligations + placement.repartitionMonetaire + placement.repartitionAutres) === 100
                    ? 'text-green-500'
                    : 'text-orange-500'
                }`}>
                  Total : {placement.repartitionActions + placement.repartitionObligations + placement.repartitionMonetaire + placement.repartitionAutres}%
                </div>
              </div>

              {placement.typeSupport === 'Assurance-vie' && (
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Clause bénéficiaire
                  </label>
                  <textarea
                    value={placement.clauseBeneficiaire || ''}
                    onChange={(e) => updatePlacement(index, 'clauseBeneficiaire', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                    rows={2}
                    placeholder="Ex: Mon conjoint à défaut mes enfants..."
                  />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FinancierForm;