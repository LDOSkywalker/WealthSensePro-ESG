import React from 'react';
import { FormProps, RevenusCharges } from './types';

const RevenusChargesForm: React.FC<FormProps<RevenusCharges>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const updateField = (field: keyof RevenusCharges, value: number) => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Revenus professionnels nets annuels (€)
          </label>
          <input
            type="number"
            value={data.revenusProfessionnelsNets !== undefined ? data.revenusProfessionnelsNets.toString() : ''}
            onChange={(e) => updateField('revenusProfessionnelsNets', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Pensions, rentes, autres revenus (€)
          </label>
          <input
            type="number"
            value={data.pensionsRentesAutres !== undefined ? data.pensionsRentesAutres.toString() : ''}
            onChange={(e) => updateField('pensionsRentesAutres', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Charges fixes mensuelles (€)
          </label>
          <input
            type="number"
            value={data.chargesFixesMensuelles !== undefined ? data.chargesFixesMensuelles.toString() : ''}
            onChange={(e) => updateField('chargesFixesMensuelles', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Épargne mensuelle actuelle (€)
          </label>
          <input
            type="number"
            value={data.epargneMensuelle !== undefined ? data.epargneMensuelle.toString() : ''}
            onChange={(e) => updateField('epargneMensuelle', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Dépenses exceptionnelles à venir (€)
          </label>
          <input
            type="number"
            value={data.depensesExceptionnelles !== undefined ? data.depensesExceptionnelles.toString() : ''}
            onChange={(e) => updateField('depensesExceptionnelles', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          />
        </div>
      </div>

      {/* Résumé des revenus */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-lighter' : 'bg-gray-50'}`}>
        <h4 className={`text-lg font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Résumé financier
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Revenus totaux annuels
            </div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {formatCurrency(data.revenusProfessionnelsNets + data.pensionsRentesAutres)}
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Charges annuelles
            </div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              {formatCurrency(data.chargesFixesMensuelles * 12)}
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Épargne annuelle
            </div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {formatCurrency(data.epargneMensuelle * 12)}
            </div>
          </div>
          <div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Reste à vivre mensuel
            </div>
            <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency((data.revenusProfessionnelsNets + data.pensionsRentesAutres) / 12 - data.chargesFixesMensuelles - data.epargneMensuelle)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenusChargesForm;