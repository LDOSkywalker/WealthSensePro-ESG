import React from 'react';
import { FormProps, SituationFamiliale, REGIMES_MATRIMONIAUX } from './types';

const SituationFamilialeForm: React.FC<FormProps<SituationFamiliale>> = ({
  data,
  onChange,
  darkMode = true
}) => {
  const updateField = (field: keyof SituationFamiliale, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleSimpleNumberChange = (field: keyof SituationFamiliale, value: string) => {
    if (value === '') {
      updateField(field, 0);
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    const finalValue = Math.min(Math.max(0, numValue), 10);
    updateField(field, finalValue);
  };

  const handleNombreEnfantsChange = (value: string) => {
    // Valeur vide → 0
    const nb = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(nb) || nb < 0) {
      return;
    }

    const finalNb = Math.min(Math.max(0, nb), 10);
    const newAges =
      finalNb === 0
        ? []
        : Array.from({ length: finalNb }).map((_, i) => data.agesEnfants?.[i] ?? 0);

    // Mise à jour atomique des deux champs
    onChange({
      ...data,
      nombreEnfants: finalNb,
      agesEnfants: newAges
    });
  };

  const handleAgeEnfantChange = (index: number, value: string) => {
    if (value === '') {
      const newAges = [...(data.agesEnfants || [])];
      newAges[index] = 0;
      updateField('agesEnfants', newAges);
      return;
    }

    const age = parseInt(value, 10);
    if (isNaN(age) || age < 0) {
      return;
    }

    const finalAge = Math.min(Math.max(0, age), 50);
    const newAges = [...(data.agesEnfants || [])];
    newAges[index] = finalAge;
    updateField('agesEnfants', newAges);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Âge */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Âge
          </label>
          <input
            type="number"
            min="0"
            max="120"
            value={data.age !== undefined ? data.age.toString() : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                updateField('age', 0);
              } else {
                const age = Math.max(0, Math.min(120, parseInt(value, 10) || 0));
                updateField('age', age);
              }
            }}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder="Ex: 35"
          />
        </div>

        {/* Profession */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Profession
          </label>
          <input
            type="text"
            value={data.profession || ''}
            onChange={(e) => updateField('profession', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder="Ex: Ingénieur, Médecin, Entrepreneur..."
          />
        </div>

        {/* Régime matrimonial */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Régime matrimonial
          </label>
          <select
            value={data.regimeMatrimonial || ''}
            onChange={(e) => updateField('regimeMatrimonial', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
          >
            <option value="">Sélectionnez</option>
            {REGIMES_MATRIMONIAUX.map((regime) => (
              <option key={regime} value={regime}>
                {regime}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre d'enfants */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Nombre d'enfants
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={data.nombreEnfants !== undefined ? data.nombreEnfants.toString() : ''}
            onChange={(e) => handleNombreEnfantsChange(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder="0"
          />
        </div>

        {/* Personnes à charge autres */}
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Autre(s) personne(s) à charge
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={data.personnesACharge !== undefined ? data.personnesACharge.toString() : ''}
            onChange={(e) => handleSimpleNumberChange('personnesACharge', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder="0"
          />
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Personnes à charge autres que vos enfants (parents, famille...)
          </p>
        </div>

        {/* Pays de résidence fiscale */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Pays de résidence fiscale
          </label>
          <input
            type="text"
            value={data.paysResidenceFiscale || ''}
            onChange={(e) => updateField('paysResidenceFiscale', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-primary`}
            placeholder="Ex: France, Suisse, Belgique..."
          />
        </div>
      </div>

      {/* Âges des enfants */}
      {data.nombreEnfants! > 0 && (
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Âges des enfants
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: data.nombreEnfants! }).map((_, index) => (
              <div key={index}>
                <input
                  type="number"
                  min="0"
                  max="50"
                  placeholder={`Enfant ${index + 1}`}
                  value={data.agesEnfants?.[index] !== undefined ? data.agesEnfants[index].toString() : ''}
                  onChange={(e) => handleAgeEnfantChange(index, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode ? 'bg-dark border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <label className={`block text-xs mt-1 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enfant {index + 1}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SituationFamilialeForm;