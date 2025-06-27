export interface SituationFamiliale {
    age: number;
    profession: string;
    regimeMatrimonial: string;
    nombreEnfants: number;
    agesEnfants: number[];
    personnesACharge: number;
    paysResidenceFiscale: string;
  }
  
  export interface RevenusCharges {
    revenusProfessionnelsNets: number;
    revenusLocatifsBruts: number;
    pensionsRentesAutres: number;
    chargesFixesMensuelles: number;
    epargneMensuelle: number;
    depensesExceptionnelles: number;
  }
  
  export interface BienImmobilier {
    id: string;
    typeBien: string;
    adresse: string;
    valeurEstimee: number;
    quotePart: number;
    revenusLocatifsAnnuels: number;
    dateAcquisition: string;
    creditEnCours: boolean;
    montantInitial?: number;
    capitalRestantDu?: number;
    tauxInteret?: number;
    dureeRestante?: number;
    mensualiteActuelle?: number;
    detentionDirecte: boolean;
  }
  
  export interface PlacementFinancier {
    id: string;
    typeSupport: string;
    intitule: string;
    montantActuel: number;
    repartitionActions: number;
    repartitionObligations: number;
    repartitionMonetaire: number;
    repartitionAutres: number;
    versementsMensuels: number;
    clauseBeneficiaire?: string;
  }
  
  export interface Emprunt {
    id: string;
    type: string;
    montantInitial: number;
    capitalRestantDu: number;
    tauxInteret: number;
    dureeRestante: number;
    mensualiteActuelle: number;
  }
  
  export interface Societe {
    id: string;
    nom: string;
    typeSociete: string;
    parts: number;
    valorisation: number;
    dividendes: number;
  }
  
  export interface Profession {
    detientSociete: boolean;
    societes: Societe[];
  }
  
  export interface ObjectifPatrimonial {
    id: string;
    objectif: string;
    priorite: number;
    horizonTemporel: string;
  }
  
  export interface Fiscalite {
    trancheMarginalImposition: number;
    defiscalisationsEnCours: string;
    ifuRecu: boolean;
    soumisIFI: boolean;
    montantEstimeIFI: number;
    montageFiscal: string;
  }
  
  export interface AutresInformations {
    mandatsProtection: string;
    assuranceDependance: string;
    testamentDonation: string;
    situationSuccessorale: string;
    problematiquesParticulieres: string;
  }
  
  export interface PatrimoineData {
    situationFamiliale: SituationFamiliale;
    revenusCharges: RevenusCharges;
    patrimoineImmobilier: BienImmobilier[];
    patrimoineFinancier: PlacementFinancier[];
    endettement: Emprunt[];
    profession: Profession;
    objectifsPatrimoniaux: ObjectifPatrimonial[];
    fiscalite: Fiscalite;
    autresInformations: AutresInformations;
  }
  
  export interface FormProps<T> {
    data: T;
    onChange: (data: T) => void;
    darkMode?: boolean;
  }
  
  // Constantes pour les options de sélection
  export const REGIMES_MATRIMONIAUX = [
    'Célibataire',
    'Marié - Communauté réduite aux acquêts',
    'Marié - Séparation de biens',
    'Marié - Communauté universelle',
    'PACS',
    'Concubinage'
  ];
  
  export const TYPES_BIENS = [
    'Résidence principale',
    'Résidence secondaire',
    'Bien locatif',
    'SCPI',
    'Terrain',
    'Local commercial',
    'Autre'
  ];
  
  export const TYPES_SUPPORTS = [
    'Compte-titres',
    'PEA',
    'Assurance-vie',
    'PER',
    'Livret A',
    'LDDS',
    'PEL',
    'CEL',
    'Autre'
  ];
  
  export const OBJECTIFS_PATRIMONIAUX = [
    'Préparation retraite',
    'Transmission',
    'Réduction d\'impôt',
    'Constitution de capital',
    'Recherche de revenus complémentaires',
    'Acquisition d\'un bien',
    'Protection du conjoint/enfants',
    'Investissement dans l\'innovation/immobilier/PE'
  ];
  
  export const TYPES_EMPRUNTS = [
    'Prêt immobilier',
    'Prêt consommation',
    'Prêt in fine',
    'Prêt familial',
    'Crédit revolving',
    'Autre'
  ];
  
  export const TYPES_SOCIETES = [
    'SARL',
    'SAS',
    'SASU',
    'EURL',
    'SCI',
    'SA',
    'SNC',
    'Société civile professionnelle',
    'Autre'
  ];