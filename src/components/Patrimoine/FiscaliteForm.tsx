import React from 'react';
import { FormProps, Fiscalite } from './types';

const FiscaliteForm: React.FC<FormProps<Fiscalite>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const updateField = (field: keyof Fiscalite, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTrancheName = (taux: number) => {
    if (taux === 0) return '0% (non imposable)';
    if (taux === 11) return '11% (1ère tranche)';
    if (taux === 30) return '30% (2ème tranche)';
    if (taux === 41) return '41% (3ème tranche)';
    if (taux === 45) return '45% (4ème tranche)';
    return `${taux}%`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Tranche marginale d'imposition (%)
          </label>
          <select
            value={data.trancheMarginalImposition}
            onChange={(e) => updateField('trancheMarginalImposition', parseInt(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            <option value={0}>0% - Non imposable</option>
            <option value={11}>11% - 1ère tranche</option>
            <option value={30}>30% - 2ème tranche</option>
            <option value={41}>41% - 3ème tranche</option>
            <option value={45}>45% - 4ème tranche</option>
          </select>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {getTrancheName(data.trancheMarginalImposition)}
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Défiscalisations en cours
          </label>
          <textarea
            value={data.defiscalisationsEnCours}
            onChange={(e) => updateField('defiscalisationsEnCours', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            rows={2}
            placeholder="Ex: SCPI Pinel, PER, investissement Malraux..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Êtes-vous soumis à l'IFI ?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="soumisIFI"
                checked={data.soumisIFI === true}
                onChange={() => updateField('soumisIFI', true)}
                className="mr-2"
              />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Oui</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="soumisIFI"
                checked={data.soumisIFI === false}
                onChange={() => updateField('soumisIFI', false)}
                className="mr-2"
              />
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Non</span>
            </label>
          </div>
        </div>

        {data.soumisIFI && (
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Montant estimé de l'IFI (€)
            </label>
            <input
              type="number"
              value={data.montantEstimeIFI !== undefined ? data.montantEstimeIFI.toString() : ''}
              onChange={(e) => updateField('montantEstimeIFI', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-primary`}
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Montage fiscal en place
          </label>
          <textarea
            value={data.montageFiscal}
            onChange={(e) => updateField('montageFiscal', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            rows={2}
            placeholder="Ex: SCI IS, démembrement de propriété, holding..."
          />
        </div>
      </div>

      {/* Résumé fiscal */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-lighter' : 'bg-gray-50'}`}>
        <h5 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Résumé fiscal
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tranche marginale :</span>
            <div className="font-medium">
              {getTrancheName(data.trancheMarginalImposition)}
            </div>
          </div>
          <div>
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>IFI :</span>
            <div className="font-medium">
              {data.soumisIFI ? formatCurrency(data.montantEstimeIFI) : 'Non soumis'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscaliteForm;