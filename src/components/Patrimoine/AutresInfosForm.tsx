import React from 'react';
import { FormProps, AutresInformations } from './types';

const AutresInfosForm: React.FC<FormProps<AutresInformations>> = ({ 
  data, 
  onChange, 
  darkMode = true 
}) => {
  const updateField = (field: keyof AutresInformations, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Mandats de protection
        </label>
        <textarea
          value={data.mandatsProtection}
          onChange={(e) => updateField('mandatsProtection', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={3}
          placeholder="Ex: mandat de protection future, tutelle, curatelle..."
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Assurance dépendance / prévoyance
        </label>
        <textarea
          value={data.assuranceDependance}
          onChange={(e) => updateField('assuranceDependance', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={3}
          placeholder="Décrivez vos contrats d'assurance dépendance et prévoyance..."
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Testament ou donation en cours
        </label>
        <textarea
          value={data.testamentDonation}
          onChange={(e) => updateField('testamentDonation', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={3}
          placeholder="Décrivez les testaments, donations ou projets de transmission..."
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Situation successorale
        </label>
        <textarea
          value={data.situationSuccessorale}
          onChange={(e) => updateField('situationSuccessorale', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={3}
          placeholder="Décrivez votre situation successorale (héritages reçus ou à venir)..."
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Problématiques particulières
        </label>
        <textarea
          value={data.problematiquesParticulieres}
          onChange={(e) => updateField('problematiquesParticulieres', e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-primary`}
          rows={4}
          placeholder="Ex: handicap, expatriation, indivision, divorce, problématiques familiales..."
        />
      </div>

      <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
        <h5 className={`font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
          Information importante
        </h5>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
          Ces informations sont confidentielles et permettront à votre conseiller de mieux comprendre votre situation 
          pour vous proposer des solutions adaptées. N'hésitez pas à être précis sur les aspects qui vous préoccupent.
        </p>
      </div>
    </div>
  );
};

export default AutresInfosForm;