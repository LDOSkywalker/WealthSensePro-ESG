export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: number;
  isError?: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firstName?: string;
  lastName?: string;
  disclaimerAccepted?: boolean;
  disclaimerAcceptedAt?: number;
  role?: 'user' | 'advisor' | 'admin' | 'support';
  sessionPolicy?: 'single' | 'two' | 'unlimited';
}

// Types pour la gestion des sessions Single-Active-Session
export interface SessionInfo {
  jti: string;
  uid: string;
  deviceId: string;
  deviceLabel: string;
  email: string;
  status: 'active' | 'revoked' | 'rotated' | 'logged_out';
  reason?: 'replaced' | 'reuse' | 'logout' | 'expired' | 'admin_revocation';
  replacedBy?: string;
  createdAt: number;
  revokedAt?: number;
  lastUsed: number;
  tokenFamily: string;
}

export interface SessionRevokedError {
  code: 'SESSION_REVOKED';
  reason: 'replaced' | 'reuse' | 'logout' | 'expired' | 'admin_revocation';
  replacedBy?: string;
  revokedAt: number;
}

export interface SessionPolicy {
  policy: 'single' | 'two' | 'unlimited';
  description: string;
  maxSessions: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  referralSource: string;
  otherReferralSource?: string;
  disclaimerAccepted?: boolean;
  disclaimerAcceptedAt?: number;
  professionalActivity: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  topic: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ResponseBlock {
  responseType: 'text' | 'table' | 'chart-bar' | 'chart-donut' | 'video' | 'multiple-choice';
  content?: string | TableData | BarChartData | DonutChartData | MultipleChoiceData;
  videoUrl?: string;
}

export interface TableData {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface BarChartData {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface DonutChartData {
  title: string;
  labels: string[];
  values: number[];
}

export interface MultipleChoiceData {
  question: string;
  choices: {
    label: string;
    value: string;
  }[];
}

export interface StarterTopic {
  title: string;
  message: string;
  topic: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

export const PROFESSIONAL_ACTIVITIES = [
  'Conseiller en Gestion de Patrimoine (CGP)',
  'Notaire',
  'Expert-Comptable',
  'Avocat',
  'Gestionnaire de Fortune / Family Office',
  'Banquier Privé',
  'Courtier en assurance',
  'Société de gestion'
] as const;

export interface IAModel {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export const IA_MODELS: IAModel[] = [
  {
    id: 'WS-One',
    name: 'WS-One',
    description: 'Assistant IA généraliste pour la gestion de patrimoine',
    isDefault: true
  },
  {
    id: 'WS-Expert',
    name: 'WS-Expert',
    description: 'Assistant IA avancé avec expertise approfondie'
  }
];