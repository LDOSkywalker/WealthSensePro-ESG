import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FormProps, BienImmobilier, TYPES_BIENS } from './types';

const ImmobilierForm: React.FC<FormProps<BienImmobilier[]>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const addBien = () => {
    const newBien: BienImmobilier = {
      id: Date.now().toString(),
      typeBien: '',
      adresse: '',
      valeurEstimee: 0,
      quotePart: 100,
      revenusLocatifsAnnuels: 0,
      dateAcquisition: '',
      creditEnCours: false,
      detentionDirecte: true
    };
    onChange([...data, newBien]);
  };

  const removeBien = (id: string) => {
    onChange(data.filter(bien => bien.id !== id));
  };

  const updateBien = (index: number, field: keyof BienImmobilier, value: any) => {
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

  const totalPatrimoine = data.reduce((sum, bien) => sum + (bien.valeurEstimee * bien.quotePart / 100), 0);
  const totalRevenus = data.reduce((sum, bien) => sum + bien.revenusLocatifsAnnuels, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Patrimoine immobilier
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Valeur totale : {formatCurrency(totalPatrimoine)} • Revenus annuels : {formatCurrency(totalRevenus)}
          </p>
        </div>
        <button
          onClick={addBien}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un bien
        </button>
      </div>

      {data.length === 0 ? (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Aucun bien immobilier renseigné</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter un bien" pour commencer</p>
        </div>
      ) : (
        data.map((bien, index) => (
          <div key={bien.id} className={`p-4 rounded-lg border ${
            darkMode ? 'border-gray-700 bg-dark-lighter' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Bien {index + 1} {bien.typeBien && `- ${bien.typeBien}`}
              </h5>
              <button
                onClick={() => removeBien(bien.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Type de bien
                </label>
                <select
                  value={bien.typeBien}
                  onChange={(e) => updateBien(index, 'typeBien', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="">Sélectionnez</option>
                  {TYPES_BIENS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Valeur estimée (€)
                </label>
                <input
                  type="number"
                  value={bien.valeurEstimee !== undefined ? bien.valeurEstimee.toString() : ''}
                  onChange={(e) => updateBien(index, 'valeurEstimee', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Adresse
                </label>
                <input
                  type="text"
                  value={bien.adresse}
                  onChange={(e) => updateBien(index, 'adresse', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Quote-part détenue (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bien.quotePart !== undefined ? bien.quotePart.toString() : ''}
                  onChange={(e) => updateBien(index, 'quotePart', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Revenus locatifs annuels (€)
                </label>
                <input
                  type="number"
                  value={bien.revenusLocatifsAnnuels !== undefined ? bien.revenusLocatifsAnnuels.toString() : ''}
                  onChange={(e) => updateBien(index, 'revenusLocatifsAnnuels', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Date d'acquisition
                </label>
                <input
                  type="date"
                  value={bien.dateAcquisition}
                  onChange={(e) => updateBien(index, 'dateAcquisition', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Crédit en cours
                </label>
                <select
                  value={bien.creditEnCours ? 'true' : 'false'}
                  onChange={(e) => updateBien(index, 'creditEnCours', e.target.value === 'true')}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  <option value="false">Non</option>
                  <option value="true">Oui</option>
                </select>
              </div>

              {bien.creditEnCours && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Capital restant dû (€)
                    </label>
                    <input
                      type="number"
                      value={bien.capitalRestantDu !== undefined ? bien.capitalRestantDu.toString() : ''}
                      onChange={(e) => updateBien(index, 'capitalRestantDu', parseInt(e.target.value) || 0)}
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
                      value={bien.tauxInteret !== undefined ? bien.tauxInteret.toString() : ''}
                      onChange={(e) => updateBien(index, 'tauxInteret', parseFloat(e.target.value) || 0)}
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
                      value={bien.dureeRestante !== undefined ? bien.dureeRestante.toString() : ''}
                      onChange={(e) => updateBien(index, 'dureeRestante', parseInt(e.target.value) || 0)}
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
                      value={bien.mensualiteActuelle !== undefined ? bien.mensualiteActuelle.toString() : ''}
                      onChange={(e) => updateBien(index, 'mensualiteActuelle', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ImmobilierForm;