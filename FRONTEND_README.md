# 🎨 WealthSensePro-ESG - Architecture Frontend

## 📋 Vue d'ensemble

Le frontend de **WealthSensePro-ESG** est une application **React.js** moderne construite avec **TypeScript**, utilisant **Vite** comme bundler et **Tailwind CSS** pour le styling. L'application intègre un système d'authentification hybride sécurisé et une interface utilisateur intuitive pour la gestion patrimoniale ESG.

## 🏗️ Architecture des composants

### Structure des composants

```
src/components/
├── AuthForm.tsx              # Formulaire d'authentification unifié
├── Header.tsx                # En-tête avec navigation et profil
├── ChatContainer.tsx         # Conteneur principal des conversations
├── ChatMessage.tsx           # Affichage des messages utilisateur/bot
├── ChatInput.tsx             # Saisie des messages utilisateur
├── ConversationHistory.tsx   # Historique des conversations
├── ConversationStarters.tsx  # Sujets de démarrage de conversation
├── TopicGrid.tsx             # Grille des sujets de conversation
├── TopicButton.tsx           # Bouton de sujet individuel
├── ProfileModal.tsx          # Modal de gestion du profil
├── ResetPassword.tsx         # Réinitialisation de mot de passe
├── DisclaimerModal.tsx       # Modal d'acceptation des conditions
├── WelcomeModal.tsx          # Modal de bienvenue
├── DeleteModal.tsx           # Modal de confirmation de suppression
├── FeedbackButton.tsx        # Bouton de feedback
├── VideoPlayer.tsx           # Lecteur vidéo intégré
├── LoadingDots.tsx           # Animation de chargement
├── Logo.tsx                  # Composant logo de l'application
├── PortfolioInput.tsx        # Saisie des données de portefeuille
├── MultipleChoice.tsx        # Composant de choix multiples
├── ChartControls.tsx         # Contrôles des graphiques
├── ChartItemSelector.tsx     # Sélecteur d'éléments de graphique
└── Patrimoine/               # Module de gestion patrimoniale
    ├── PatrimoineInput.tsx   # Composant principal du patrimoine
    ├── types.ts              # Types TypeScript pour le patrimoine
    ├── SituationFamilialeForm.tsx
    ├── RevenusChargesForm.tsx
    ├── ImmobilierForm.tsx
    ├── FinancierForm.tsx
    ├── EndettementForm.tsx
    ├── ProfessionForm.tsx
    ├── ObjectifsForm.tsx
    ├── FiscaliteForm.tsx
    └── AutresInfosForm.tsx
```

### Composants clés détaillés

#### 🔐 `AuthForm.tsx` - Authentification unifiée
**Responsabilités :**
- Gestion des formulaires de connexion et d'inscription
- Validation des données utilisateur
- Intégration avec le service d'authentification
- Gestion des erreurs et feedback utilisateur

**Fonctionnalités :**
- Basculement entre connexion et inscription
- Validation en temps réel des champs
- Gestion des états de chargement
- Intégration avec les modals de disclaimer

#### 💬 `ChatContainer.tsx` - Interface de conversation IA
**Responsabilités :**
- Affichage des conversations en cours
- Gestion des messages utilisateur et bot
- Intégration avec l'API de conversations
- Gestion des états de chargement et d'erreur

**Fonctionnalités :**
- Affichage en temps réel des messages
- Gestion des types de réponses (texte, tableaux, graphiques)
- Intégration avec les composants de visualisation
- Gestion des erreurs de communication

#### 🏠 `PatrimoineInput.tsx` - Gestion patrimoniale complète
**Responsabilités :**
- Saisie et modification des données patrimoniales
- Navigation entre les différentes sections
- Validation des données saisies
- Sauvegarde et récupération des informations

**Sections gérées :**
- **Situation familiale** : Âge, profession, régime matrimonial
- **Revenus et charges** : Revenus professionnels, locatifs, pensions
- **Patrimoine immobilier** : Biens, valeurs, crédits en cours
- **Patrimoine financier** : Placements, répartition d'actifs
- **Endettement** : Emprunts, crédits, dettes
- **Profession** : Activité professionnelle, sociétés détenues
- **Objectifs** : Objectifs patrimoniaux et priorités
- **Fiscalité** : Tranche d'imposition, IFI, défiscalisations
- **Autres informations** : Mandats, assurances, testament

## 🔄 Contextes React (State Management)

### `AuthContext.tsx` - Gestion de l'authentification

**Responsabilités :**
- Gestion de l'état d'authentification global
- Stockage des informations utilisateur
- Auto-refresh automatique des tokens JWT
- Gestion des sessions utilisateur

**Fonctionnalités clés :**
```typescript
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isSessionRevoked: boolean;           // État de blocage global
  sessionRevokedError: SessionRevokedError | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forceReconnect: () => void;          // Redirection forcée
}
```

**Auto-refresh intelligent :**
- Rafraîchissement automatique toutes les 10 minutes
- Gestion des échecs de refresh
- Redirection automatique en cas d'échec
- Nettoyage des intervalles à la déconnexion

### `ConversationContext.tsx` - Gestion des conversations IA

**Responsabilités :**
- Gestion de l'état des conversations
- Communication avec l'API backend
- Gestion des messages et réponses
- Synchronisation des données en temps réel

**Fonctionnalités avancées :**
```typescript
interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createNewConversation: (topic?: string) => Promise<Conversation>;
  addMessage: (content: string, sender: 'user' | 'bot') => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
}
```

**Gestion des erreurs :**
- Gestion des erreurs réseau
- Retry automatique des opérations
- Feedback utilisateur en temps réel
- État de chargement global

## 🌐 Services et communication API

### `auth.ts` - Service d'authentification

**Configuration intelligente :**
```typescript
const API_URL = import.meta.env.PROD 
    ? 'https://wealthsensepro-esg.onrender.com/api'  // Production
    : import.meta.env.VITE_API_URL || 'http://localhost:3006/api';  // Dev
```

**Intercepteurs Axios avancés :**

#### Intercepteur de requête
- Ajout automatique du token d'authentification
- Configuration des headers CSRF
- Logging des requêtes pour le debugging
- Gestion des credentials cross-origin

#### Intercepteur de réponse
- Gestion automatique des erreurs 401
- Auto-refresh transparent des tokens
- Queue des requêtes en échec
- Retry automatique après refresh
- **Détection et gestion des sessions révoquées**
- **Blocage automatique des requêtes API si session révoquée**

**Gestion des tokens :**
- Stockage sécurisé en mémoire (access token)
- Cookie HttpOnly pour le refresh token
- Rotation automatique des tokens
- Gestion des échecs de refresh

**Gestion des sessions révoquées :**
- **Détection automatique des sessions révoquées**
- **Blocage complet de l'interface utilisateur**
- **Gestion distincte PC/Mobile (modales vs écran de blocage)**
- **Nettoyage automatique des données sensibles**
- **Redirection forcée vers la page de connexion**
- **Impossibilité de contourner la sécurité**

### Communication avec le backend

**Endpoints utilisés :**
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/signup` - Inscription utilisateur
- `POST /api/auth/refresh` - Rafraîchissement du token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Récupération du profil
- `PUT /api/auth/profile` - Modification du profil
- `PUT /api/auth/password` - Changement de mot de passe
- `POST /api/auth/reset-password` - Réinitialisation
- `GET /api/conversations` - Liste des conversations
- `POST /api/conversations` - Création de conversation
- `PUT /api/conversations/:id` - Modification de conversation
- `DELETE /api/conversations/:id` - Suppression de conversation
- `GET /api/messages/:conversationId` - Messages d'une conversation
- `POST /api/messages` - Création d'un message

## 🎨 Système de design et UI/UX

### Configuration Tailwind CSS

**Palette de couleurs personnalisée :**
```javascript
colors: {
  primary: {
    DEFAULT: '#5046E5',    // Bleu principal
    dark: '#4338CA',       // Bleu foncé
    light: '#818CF8'       // Bleu clair
  },
  dark: {
    DEFAULT: '#0B0F19',    // Noir principal
    lighter: '#1f2937',    // Noir plus clair
    card: '#1A1F2E'        // Noir pour les cartes
  }
}
```

**Animations personnalisées :**
```javascript
animation: {
  'float': 'float 6s ease-in-out infinite',
  'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
},
keyframes: {
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-20px)' }
  }
}
```

**Ombres et effets :**
```javascript
boxShadow: {
  'input': '0 2px 4px rgba(0, 0, 0, 0.1)',
  'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'message': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'glow': '0 0 50px -12px rgba(80, 70, 229, 0.3)',
  'glow-lg': '0 0 100px -12px rgba(80, 70, 229, 0.4)'
}
```

### Composants UI réutilisables

#### `LoadingDots.tsx` - Animation de chargement
- Animation de points animés
- Configurable (nombre de points, vitesse)
- Support du mode sombre/clair
- Transitions fluides

#### `VideoPlayer.tsx` - Lecteur vidéo intégré
- Support des formats vidéo courants
- Contrôles personnalisés
- Responsive design
- Intégration avec les conversations IA

#### `MultipleChoice.tsx` - Choix multiples interactifs
- Gestion des réponses multiples
- Validation des sélections
- Interface utilisateur intuitive
- Intégration avec les conversations

## 📱 Pages et navigation

### Structure des pages

```
src/pages/
├── Landing.tsx               # Page d'accueil publique
├── Login.tsx                 # Page de connexion
└── Dashboard.tsx             # Tableau de bord principal
```

#### `Landing.tsx` - Page d'accueil
**Fonctionnalités :**
- Présentation de la plateforme ESG
- Formulaire de connexion/inscription intégré
- Navigation vers les fonctionnalités
- Design responsive et moderne

#### `Dashboard.tsx` - Interface principale
**Composants intégrés :**
- Header avec navigation et profil
- Grille des sujets de conversation
- Historique des conversations
- Interface de chat IA
- Gestion du patrimoine

#### `Login.tsx` - Authentification
**Intégration :**
- Redirection vers `AuthForm.tsx`
- Gestion des états de chargement
- Intégration avec le contexte d'authentification

## 🔐 Système d'authentification hybride

### Architecture de sécurité

**Problème initial résolu :**
L'application rencontrait des problèmes d'authentification sur iOS Safari et en navigation privée, avec des erreurs 401 Unauthorized malgré une connexion réussie. Le problème venait des restrictions strictes de Safari sur les cookies cross-origin.

### Solution : Flux hybride sécurisé

#### 1. **Authentification côté backend**
- **Vérification email + mot de passe** avec Firebase Auth REST API
- **Génération de deux tokens JWT** :
  - **Access Token** (15 minutes) : envoyé en JSON response
  - **Refresh Token** (7 jours) : stocké en cookie HttpOnly

#### 2. **Stockage sécurisé**
```typescript
// Access Token : stocké en mémoire (côté frontend)
accessToken = response.data.access_token;

// Refresh Token : cookie HttpOnly + Secure + SameSite=None
res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

#### 3. **Protection CSRF**
- **Headers requis** : `X-Requested-With: XMLHttpRequest`
- **Vérification d'origine** : whitelist des domaines autorisés
- **Protection sur endpoints sensibles** : `/refresh`, `/logout`

#### 4. **Auto-refresh automatique**
```typescript
// Intercepteur Axios pour auto-refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && !isRefreshing) {
            // Tentative de refresh automatique
            const success = await authService.refreshToken();
            if (success) {
                return axios(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);
```

#### 5. **Configuration CORS**
```typescript
// Backend : autorisation des credentials
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Frontend : envoi des cookies
axios.defaults.withCredentials = true;
```

### Avantages de cette approche

✅ **Sécurité maximale** : Access token court + Refresh token HttpOnly  
✅ **Compatibilité iOS** : SameSite=None + Secure pour cross-origin  
✅ **Protection CSRF** : Headers personnalisés requis  
✅ **Auto-refresh** : Transparent pour l'utilisateur  
✅ **Multi-device** : Fonctionne sur tous les navigateurs et devices  
✅ **Refresh tokens rotatifs** : Rotation automatique à chaque utilisation  
✅ **Détection de réutilisation** : Alerte et révocation en cas de compromission  
✅ **Gestion des sessions en base** : Traçabilité complète des connexions  
✅ **Révocation de famille** : Suppression de tous les tokens d'un appareil compromis

## 🔐 Système de sessions sécurisées (Nouveau)

### Vue d'ensemble

Le système de gestion des sessions a été entièrement refactorisé pour répondre aux exigences de sécurité critiques identifiées par le CTO. Il implémente les **refresh tokens rotatifs** avec **détection de réutilisation** et **gestion des sessions en base de données**.

### 🚨 Problème de sécurité résolu

**Ancien système (VULNÉRABLE) :**
- Refresh tokens statiques pendant 7 jours
- Pas de rotation des tokens
- Pas de détection de réutilisation
- Impossible de révoquer un token volé

**Nouveau système (SÉCURISÉ) :**
- Refresh tokens rotatifs à chaque utilisation
- Détection automatique de réutilisation
- Révocation de famille en cas de compromission
- Gestion des sessions en base de données

### 🏗️ Architecture technique

#### Composants principaux

1. **`SessionManager`** - Gestion des sessions avec rotation
   - Création de sessions sécurisées
   - Rotation automatique des refresh tokens
   - Détection de réutilisation
   - Révocation de famille

2. **`SessionCleanup`** - Nettoyage automatique
   - Suppression des sessions expirées
   - Statistiques des sessions
   - Nettoyage périodique

3. **Routes d'administration** - Surveillance et gestion
   - Statistiques des sessions
   - Révocation manuelle
   - Monitoring de la sécurité

#### Structure de la base de données

```javascript
// Collection 'sessions'
{
  uid: "string",           // ID utilisateur Firebase
  deviceId: "string",      // Hash de l'appareil (IP + User-Agent)
  email: "string",         // Email de l'utilisateur
  status: "active" | "rotated" | "revoked" | "logged_out",
  createdAt: timestamp,    // Date de création
  lastUsed: timestamp,     // Dernière utilisation
  tokenFamily: "string",   // Famille de tokens (deviceId)
  rotatedFrom: "string",  // JTI du token précédent
  revokedAt: timestamp,   // Date de révocation
  reason: "string"        // Raison de la révocation
}
```

### 🔄 Flux de fonctionnement

#### 1. **Connexion (Login)**
```javascript
// Création d'une nouvelle session
const session = await sessionManager.createSession(uid, email, req);
// - Génère un JTI unique
// - Crée un deviceId basé sur IP + User-Agent
// - Stocke la session en base
// - Retourne access + refresh tokens
```

#### 2. **Rafraîchissement (Refresh)**
```javascript
// Rotation du refresh token
const session = await sessionManager.refreshSession(prevRefreshToken, req);
// - Vérifie la validité de l'ancien token
// - Marque l'ancien comme "rotated"
// - Crée un nouveau refresh token
// - Met à jour la base de données
```

#### 3. **Détection de réutilisation**
```javascript
// Si un ancien token est réutilisé
if (sessionData.status !== 'active') {
  // Révocation de toute la famille
  await sessionManager.revokeFamily(deviceId);
  throw new Error('Session révoquée');
}
```

### 🛡️ Mesures de sécurité

- **Protection contre le vol** : Rotation automatique + JTI unique + Device binding
- **Détection de compromission** : Vérification de statut + Détection de réutilisation
- **Révocation automatique** : Suppression de toute la famille compromise
- **Gestion des sessions** : Statuts multiples + Traçabilité + Nettoyage automatique

### 📊 Endpoints d'administration

```http
GET  /api/admin/sessions/stats          # Statistiques des sessions
POST /api/admin/sessions/cleanup        # Nettoyage forcé
POST /api/admin/sessions/revoke-family  # Révocation de famille
GET  /api/admin/sessions/device/:id     # Sessions d'un appareil
GET  /api/admin/sessions/user/:uid      # Sessions d'un utilisateur
POST /api/admin/sessions/revoke-user    # Révocation de toutes les sessions
```

### 🚀 Déploiement

- **Migration transparente** : Les nouveaux logins utilisent automatiquement le système sécurisé
- **Compatibilité** : Les anciens tokens continuent de fonctionner jusqu'à expiration
- **Nettoyage automatique** : Suppression des sessions expirées toutes les heures

## 🏦 Module de gestion patrimoniale

### Architecture du module Patrimoine

Le module Patrimoine est une fonctionnalité clé de WealthSensePro-ESG, permettant aux utilisateurs de saisir et gérer l'ensemble de leur situation financière et patrimoniale.

#### **Structure des données patrimoniales**

```typescript
interface PatrimoineData {
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
```

#### **Composants spécialisés**

**1. Situation Familiale (`SituationFamilialeForm.tsx`)**
- Âge et situation personnelle
- Régime matrimonial et enfants
- Personnes à charge
- Résidence fiscale

**2. Revenus et Charges (`RevenusChargesForm.tsx`)**
- Revenus professionnels nets
- Revenus locatifs et pensions
- Charges fixes mensuelles
- Épargne et dépenses exceptionnelles

**3. Patrimoine Immobilier (`ImmobilierForm.tsx`)**
- Types de biens (résidence, locatif, SCPI)
- Valeurs et quotes-parts
- Crédits en cours et mensualités
- Revenus locatifs

**4. Patrimoine Financier (`FinancierForm.tsx`)**
- Types de supports (PEA, assurance-vie, PER)
- Répartition d'actifs (actions, obligations, monétaire)
- Versements mensuels
- Clauses bénéficiaires

**5. Endettement (`EndettementForm.tsx`)**
- Types d'emprunts (immobilier, consommation, in fine)
- Capital restant dû et taux d'intérêt
- Mensualités actuelles
- Durée restante

**6. Profession (`ProfessionForm.tsx`)**
- Activité professionnelle
- Sociétés détenues (SARL, SAS, SCI)
- Parts et valorisation
- Dividendes perçus

**7. Objectifs Patrimoniaux (`ObjectifsForm.tsx`)**
- Préparation retraite
- Transmission et succession
- Réduction d'impôt
- Protection du conjoint/enfants

**8. Fiscalité (`FiscaliteForm.tsx`)**
- Tranche marginale d'imposition
- Défiscalisations en cours
- IFI et montants estimés
- Montages fiscaux

**9. Autres Informations (`AutresInfosForm.tsx`)**
- Mandats de protection
- Assurance dépendance
- Testament et donations
- Situation successorale

### **Fonctionnalités avancées**

#### **Validation intelligente**
- Validation en temps réel des champs
- Gestion des dépendances entre sections
- Calculs automatiques (endettement, ratios)
- Vérification de cohérence des données

#### **Interface utilisateur**
- Navigation intuitive entre les sections
- Sauvegarde automatique des données
- Indicateurs de progression
- Mode sombre/clair

#### **Intégration IA**
- Analyse automatique de la situation
- Recommandations personnalisées
- Détection des optimisations possibles
- Conseils ESG adaptés

## 🎯 Système de conversations IA

### Architecture des conversations

Le système de conversations IA est le cœur de l'expérience utilisateur, permettant des interactions naturelles et intelligentes pour la gestion patrimoniale ESG.

#### **Types de réponses supportées**

```typescript
interface ResponseBlock {
  responseType: 'text' | 'table' | 'chart-bar' | 'chart-donut' | 'video' | 'multiple-choice';
  content?: string | TableData | BarChartData | DonutChartData | MultipleChoiceData;
  videoUrl?: string;
}
```

#### **Composants de visualisation**

**1. Graphiques en barres (`chart-bar`)**
- Affichage des données patrimoniales
- Comparaisons temporelles
- Analyse des répartitions d'actifs

**2. Graphiques en donut (`chart-donut`)**
- Répartition des investissements
- Allocation ESG
- Diversification du portefeuille

**3. Tableaux de données (`table`)**
- Données structurées
- Comparaisons multi-critères
- Export et partage

**4. Vidéos intégrées (`video`)**
- Contenus éducatifs ESG
- Explications techniques
- Témoignages d'experts

**5. Choix multiples (`multiple-choice`)**
- Questionnaires interactifs
- Évaluation des préférences
- Personnalisation des conseils

### **Sujets de conversation prédéfinis**

```typescript
interface StarterTopic {
  title: string;
  message: string;
  topic: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}
```

**Catégories de sujets :**
- **Gestion de patrimoine** : Optimisation, diversification
- **Investissement ESG** : Critères environnementaux, sociaux, gouvernance
- **Planification financière** : Retraite, transmission, objectifs
- **Fiscalité** : Optimisation, défiscalisation, IFI
- **Protection** : Assurance, mandats, succession

## 🚀 Configuration et déploiement

### Variables d'environnement

**Frontend (.env) :**
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_BACKEND_URL=http://localhost:3006
```

### Scripts de développement

```json
{
  "scripts": {
    "dev": "vite",                    // Serveur de développement
    "build": "tsc && vite build",     // Build de production
    "lint": "eslint . --ext ts,tsx",  // Linting TypeScript
    "preview": "vite preview"         // Prévisualisation du build
  }
}
```

### Configuration Vite

```typescript
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],        // Exclusion des icônes
  },
  base: '/',                          // Base URL de l'application
  build: {
    outDir: 'dist',                   // Dossier de sortie
    assetsDir: 'assets',              // Dossier des assets
    sourcemap: true                   // Génération des source maps
  }
});
```

### Configuration TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",               // Cible JavaScript
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",               // Modules ES6+
    "moduleResolution": "bundler",    // Résolution des modules
    "jsx": "react-jsx",              // Support JSX
    "strict": true,                   // Mode strict TypeScript
    "noUnusedLocals": true,          // Vérification des variables non utilisées
    "noUnusedParameters": true       // Vérification des paramètres non utilisés
  }
}
```

## 🧪 Tests et qualité du code

### Configuration ESLint

```json
{
  "extends": [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh"
  ]
}
```

**Règles appliquées :**
- Vérification des hooks React
- Support du refresh hot
- Linting TypeScript strict
- Qualité du code React

### Tests (à implémenter)

```bash
# Installation des dépendances de test
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Exécution des tests
npm test

# Tests en mode watch
npm run test:watch

# Couverture de code
npm run test:coverage
```

## 📱 Responsive Design et accessibilité

### Breakpoints Tailwind

```css
/* Mobile First */
sm: '640px'    /* Tablettes */
md: '768px'    /* Petits écrans */
lg: '1024px'   /* Écrans moyens */
xl: '1280px'   /* Grands écrans */
2xl: '1536px'  /* Très grands écrans */
```

### Composants responsifs

- **Grid adaptatif** : Adaptation automatique du nombre de colonnes
- **Navigation mobile** : Menu hamburger et navigation tactile
- **Formulaires adaptatifs** : Champs redimensionnés selon l'écran
- **Graphiques responsifs** : Adaptation des tailles et interactions

### Accessibilité

- **Navigation au clavier** : Support complet de la navigation Tab
- **Contraste** : Respect des standards WCAG AA
- **Lecteurs d'écran** : Labels et descriptions appropriés
- **Focus visible** : Indicateurs de focus clairs

## 🔒 Sécurité frontend

### Protection des données sensibles

- **Aucun stockage local** des tokens d'authentification
- **Validation côté client** des formulaires
- **Sanitisation** des entrées utilisateur
- **Headers de sécurité** automatiques

### Gestion des erreurs

- **Messages d'erreur** non révélateurs
- **Logging sécurisé** sans données sensibles
- **Fallbacks** en cas d'échec de l'API
- **Retry automatique** des opérations critiques

## 🚀 Déploiement

### Frontend (Netlify)

**Configuration de build :**
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Variables d'environnement** : Configurées dans l'interface Netlify

**Déploiement automatique :**
- Intégration continue avec Git
- Déploiement automatique sur push
- Prévisualisation des branches
- Rollback en cas de problème

### Variables d'environnement par environnement

```bash
# Développement
VITE_BACKEND_URL=http://localhost:3006
VITE_FIREBASE_PROJECT_ID=wealthsense-dev

# Préproduction
VITE_BACKEND_URL=https://wealthsensepro-esg.onrender.com
VITE_FIREBASE_PROJECT_ID=wealthsense-staging

# Production
VITE_BACKEND_URL=https://wealthsensepro-esg.onrender.com
VITE_FIREBASE_PROJECT_ID=wealthsense-prod
```

## 📊 Monitoring et performance

### Métriques de performance

- **Core Web Vitals** : LCP, FID, CLS
- **Bundle size** : Optimisation des chunks
- **Lazy loading** : Chargement différé des composants
- **Code splitting** : Division intelligente du code

### Outils de monitoring

- **Vite Bundle Analyzer** : Analyse de la taille des bundles
- **React DevTools** : Profiling des composants
- **Lighthouse** : Audit de performance
- **WebPageTest** : Tests de performance

## 🔧 Maintenance et évolution

### Gestion des dépendances

```bash
# Mise à jour des dépendances
npm update

# Audit de sécurité
npm audit

# Correction automatique
npm audit fix

# Mise à jour majeure
npm-check-updates -u
```

### Migration et compatibilité

- **Support des navigateurs** : IE11+, Chrome 90+, Firefox 88+, Safari 14+
- **Polyfills automatiques** : Gestion des fonctionnalités non supportées
- **Versioning sémantique** : Suivi des changements breaking
- **Changelog** : Documentation des évolutions

## 📚 Ressources et documentation

### Documentation technique

- [Documentation React](https://react.dev/)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Vite](https://vitejs.dev/guide/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)

### Outils de développement

- **VS Code** : Configuration recommandée avec extensions
- **ESLint** : Règles de qualité du code
- **Prettier** : Formatage automatique
- **Husky** : Hooks Git pour la qualité

## 👥 Équipe et contribution

### Structure de l'équipe

- **Développeurs Frontend** : React, TypeScript, UI/UX
- **Développeurs Backend** : Node.js, Express, Firebase
- **Designers** : UI/UX, Design System, Composants
- **DevOps** : Déploiement, CI/CD, Monitoring

### Processus de contribution

1. **Fork** du repository
2. **Création** d'une branche feature
3. **Développement** avec tests
4. **Pull Request** avec description détaillée
5. **Code Review** par l'équipe
6. **Merge** après validation

### Standards de code

- **TypeScript strict** : Typage complet et strict
- **ESLint** : Respect des règles de qualité
- **Prettier** : Formatage automatique
- **Tests** : Couverture minimale de 80%
- **Documentation** : JSDoc pour les composants complexes

## 🎯 Roadmap et évolutions

### Phase 1 : MVP (Terminée)
- ✅ Authentification sécurisée
- ✅ Interface de base
- ✅ Gestion des conversations
- ✅ Module patrimonial

### Phase 2 : Fonctionnalités avancées
- 🔄 Intégration IA avancée
- 🔄 Analytics et reporting
- 🔄 Notifications push
- 🔄 Export de données

### Phase 3 : Écosystème
- 📋 API publique
- 📋 Intégrations tierces
- 📋 Mobile app native
- 📋 Marketplace de conseillers

---

*Dernière mise à jour : 21/08/2025 - Documentation complète du frontend WealthSensePro-ESG avec architecture détaillée, composants, sécurité et déploiement*
