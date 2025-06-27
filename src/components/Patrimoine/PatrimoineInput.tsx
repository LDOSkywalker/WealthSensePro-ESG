import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import SituationFamilialeForm from './SituationFamilialeForm';
import RevenusChargesForm from './RevenusChargesForm';
import ImmobilierForm from './ImmobilierForm';
import FinancierForm from './FinancierForm';
import EndettementForm from './EndettementForm';
import ProfessionForm from './ProfessionForm';
import ObjectifsForm from './ObjectifsForm';
import FiscaliteForm from './FiscaliteForm';
import AutresInfosForm from './AutresInfosForm';
import { PatrimoineData, FormProps } from './types';

interface PatrimoineInputProps {
  darkMode?: boolean;
  onSubmit?: (message: string) => void;
}

interface TabConfig {
  id: keyof PatrimoineData;
  label: string;
  component: React.ComponentType<FormProps<any>>;
}

const TABS: TabConfig[] = [
  { id: 'situationFamiliale', label: 'Situation familiale', component: SituationFamilialeForm },
  { id: 'revenusCharges', label: 'Revenus & charges', component: RevenusChargesForm },
  { id: 'patrimoineImmobilier', label: 'Patrimoine immobilier', component: ImmobilierForm },
  { id: 'patrimoineFinancier', label: 'Patrimoine financier', component: FinancierForm },
  { id: 'endettement', label: 'Endettement', component: EndettementForm },
  { id: 'profession', label: 'Société détenue', component: ProfessionForm },
  { id: 'objectifsPatrimoniaux', label: 'Objectifs patrimoniaux', component: ObjectifsForm },
  { id: 'fiscalite', label: 'Fiscalité', component: FiscaliteForm },
  { id: 'autresInformations', label: 'Autres informations', component: AutresInfosForm }
];

// Fonction pour formater un bien immobilier avec tous ses détails
const formatBienImmobilier = (bien: any) => {
  let description = `- ${bien.typeBien} : ${bien.valeurEstimee}€ (${bien.quotePart}%)`;
  
  // Ajout conditionnel des revenus locatifs
  if (bien.revenusLocatifsAnnuels > 0) {
    description += ` - Revenus locatifs: ${bien.revenusLocatifsAnnuels}€/an`;
  }
  
  // Ajout conditionnel de l'adresse
  if (bien.adresse) {
    description += ` - Adresse: ${bien.adresse}`;
  }
  
  // Ajout conditionnel de la date d'acquisition
  if (bien.dateAcquisition) {
    description += ` - Acquis le: ${bien.dateAcquisition}`;
  }
  
  // Ajout des informations de crédit
  if (bien.creditEnCours) {
    description += `\n  • Crédit en cours: Capital restant ${bien.capitalRestantDu || 0}€`;
    if (bien.tauxInteret) {
      description += ` - Taux: ${bien.tauxInteret}%`;
    }
    if (bien.dureeRestante) {
      description += ` - Durée restante: ${bien.dureeRestante} mois`;
    }
    if (bien.mensualiteActuelle) {
      description += ` - Mensualité: ${bien.mensualiteActuelle}€`;
    }
  }
  
  return description;
};

const PatrimoineInput: React.FC<PatrimoineInputProps> = ({ darkMode = true, onSubmit }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [data, setData] = useState<PatrimoineData>({
    situationFamiliale: {
      age: 0,
      profession: '',
      regimeMatrimonial: '',
      nombreEnfants: 0,
      agesEnfants: [],
      personnesACharge: 0,
      paysResidenceFiscale: 'France'
    },
    revenusCharges: {
      revenusProfessionnelsNets: 0,
      revenusLocatifsBruts: 0,
      pensionsRentesAutres: 0,
      chargesFixesMensuelles: 0,
      epargneMensuelle: 0,
      depensesExceptionnelles: 0
    },
    patrimoineImmobilier: [],
    patrimoineFinancier: [],
    endettement: [],
    profession: {
      detientSociete: false,
      societes: []
    },
    objectifsPatrimoniaux: [],
    fiscalite: {
      trancheMarginalImposition: 0,
      defiscalisationsEnCours: '',
      ifuRecu: false,
      soumisIFI: false,
      montantEstimeIFI: 0,
      montageFiscal: ''
    },
    autresInformations: {
      mandatsProtection: '',
      assuranceDependance: '',
      testamentDonation: '',
      situationSuccessorale: '',
      problematiquesParticulieres: ''
    }
  });

  const updateData = (section: keyof PatrimoineData, newData: any) => {
    setData(prev => ({
      ...prev,
      [section]: newData
    }));
  };

  const nextTab = () => {
    if (currentTab < TABS.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleSubmit = () => {
    if (!onSubmit) return;

    const totalEnfantsEtPersonnesACharge = data.situationFamiliale.nombreEnfants + data.situationFamiliale.personnesACharge;
    
    const message = `Voici mon patrimoine complet :\n\n` +
      `**Situation familiale :**\n` +
      `- Âge : ${data.situationFamiliale.age} ans\n` +
      `- Profession : ${data.situationFamiliale.profession}\n` +
      `- Régime matrimonial : ${data.situationFamiliale.regimeMatrimonial}\n` +
      `- Nombre d'enfants : ${data.situationFamiliale.nombreEnfants}${data.situationFamiliale.agesEnfants.length > 0 ? ` (âges: ${data.situationFamiliale.agesEnfants.join(', ')} ans)` : ''}\n` +
      `- Autres personnes à charge : ${data.situationFamiliale.personnesACharge}\n` +
      `- Total personnes à charge : ${totalEnfantsEtPersonnesACharge}\n` +
      `- Pays de résidence fiscale : ${data.situationFamiliale.paysResidenceFiscale}\n\n` +
      
      `**Revenus & charges :**\n` +
      `- Revenus professionnels nets : ${data.revenusCharges.revenusProfessionnelsNets}€\n` +
      `- Pensions, rentes, autres : ${data.revenusCharges.pensionsRentesAutres}€\n` +
      `- Charges fixes mensuelles : ${data.revenusCharges.chargesFixesMensuelles}€\n` +
      `- Épargne mensuelle : ${data.revenusCharges.epargneMensuelle}€\n` +
      `- Dépenses exceptionnelles : ${data.revenusCharges.depensesExceptionnelles}€\n\n` +
      
      `**Patrimoine immobilier :**\n` +
      (data.patrimoineImmobilier.length > 0 
        ? data.patrimoineImmobilier.map(formatBienImmobilier).join('\n')
        : '- Aucun bien immobilier'
      ) + '\n\n' +
      
      `**Patrimoine financier :**\n` +
      (data.patrimoineFinancier.length > 0
        ? data.patrimoineFinancier.map(placement => 
            `- ${placement.typeSupport} (${placement.intitule}) : ${placement.montantActuel}€ - Versements: ${placement.versementsMensuels}€/mois`
          ).join('\n')
        : '- Aucun placement financier'
      ) + '\n\n' +
      
      `**Endettement :**\n` +
      (data.endettement.length > 0
        ? data.endettement.map(emprunt => 
            `- ${emprunt.type} : Capital restant ${emprunt.capitalRestantDu}€ - Mensualité: ${emprunt.mensualiteActuelle}€`
          ).join('\n')
        : '- Aucun endettement'
      ) + '\n\n' +
      
      `**Sociétés détenues :**\n` +
      (data.profession.detientSociete && data.profession.societes.length > 0
        ? data.profession.societes.map(societe => 
            `- ${societe.nom} (${societe.typeSociete}) : ${societe.parts}% - Valorisation: ${societe.valorisation}€ - Dividendes: ${societe.dividendes}€/an`
          ).join('\n')
        : '- Aucune société détenue'
      ) + '\n\n' +
      
      `**Objectifs patrimoniaux :**\n` +
      (data.objectifsPatrimoniaux.length > 0
        ? data.objectifsPatrimoniaux.map(obj => 
            `- ${obj.objectif} (priorité ${obj.priorite}, ${obj.horizonTemporel})`
          ).join('\n')
        : '- Aucun objectif défini'
      ) + '\n\n' +
      
      `**Fiscalité :**\n` +
      `- Tranche marginale d'imposition : ${data.fiscalite.trancheMarginalImposition}%\n` +
      `- Soumis à l'IFI : ${data.fiscalite.soumisIFI ? `Oui (${data.fiscalite.montantEstimeIFI}€)` : 'Non'}\n` +
      (data.fiscalite.defiscalisationsEnCours ? `- Défiscalisations en cours : ${data.fiscalite.defiscalisationsEnCours}\n` : '') +
      (data.fiscalite.montageFiscal ? `- Montage fiscal : ${data.fiscalite.montageFiscal}\n` : '') + '\n' +
      
      `**Autres informations :**\n` +
      (data.autresInformations.mandatsProtection ? `- Mandats de protection : ${data.autresInformations.mandatsProtection}\n` : '') +
      (data.autresInformations.assuranceDependance ? `- Assurance dépendance : ${data.autresInformations.assuranceDependance}\n` : '') +
      (data.autresInformations.testamentDonation ? `- Testament/donation : ${data.autresInformations.testamentDonation}\n` : '') +
      (data.autresInformations.situationSuccessorale ? `- Situation successorale : ${data.autresInformations.situationSuccessorale}\n` : '') +
      (data.autresInformations.problematiquesParticulieres ? `- Problématiques particulières : ${data.autresInformations.problematiquesParticulieres}` : '');
    
    onSubmit(message);
  };

  const CurrentComponent = TABS[currentTab].component;

  return (
    <div className="space-y-4">
      {/* Message d'introduction */}
      <div className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Très bien, veuillez renseigner votre patrimoine ci-dessous. Vous pouvez naviguer entre les différentes sections :
      </div>

      {/* Composant de patrimoine */}
      <div className={`rounded-lg border ${
        darkMode ? 'border-gray-700 bg-dark-card' : 'border-gray-200 bg-white'
      } overflow-hidden`}>
        {/* Navigation par onglets */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Analyse patrimoniale - {TABS[currentTab].label}
            </h3>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentTab + 1} / {TABS.length}
            </div>
          </div>

          {/* Barre de progression */}
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-4`}>
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((currentTab + 1) / TABS.length) * 100}%` }}
            />
          </div>

          {/* Navigation rapide */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(index)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  index === currentTab
                    ? 'bg-primary text-white'
                    : index < currentTab
                    ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index < currentTab && <Check className="w-3 h-3 inline mr-1" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu de l'onglet */}
        <div className="p-6">
          <CurrentComponent
            data={data[TABS[currentTab].id as keyof PatrimoineData]}
            onChange={(newData) => updateData(TABS[currentTab].id as keyof PatrimoineData, newData)}
            darkMode={darkMode}
          />
        </div>

        {/* Navigation */}
        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex justify-between`}>
          <button
            onClick={prevTab}
            disabled={currentTab === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentTab === 0
                ? darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          {currentTab === TABS.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Valider l'analyse
            </button>
          ) : (
            <button
              onClick={nextTab}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatrimoineInput;