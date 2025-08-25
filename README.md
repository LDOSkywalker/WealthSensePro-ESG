# 🚀 WealthSensePro-ESG - Plateforme d'Investissement ESG

## 📋 Vue d'ensemble

**WealthSensePro-ESG** est une plateforme complète de gestion de patrimoine dédiée aux utilisateurs finaux (particuliers), axée sur la thématique **ESG (Environnement, Social, Gouvernance)**. Cette solution utilise l'intelligence artificielle pour fournir des conseils financiers personnalisés et des outils adaptés à la prise en compte des critères ESG dans la gestion de patrimoine.

## 🏗️ Architecture globale de l'application

```
WealthSensePro-ESG/
├── frontend/                    # Application React.js + TypeScript
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   ├── contexts/          # Contextes React (Auth, Conversations)
│   │   ├── pages/             # Pages principales
│   │   ├── services/          # Services d'API et authentification
│   │   ├── types/             # Définitions TypeScript
│   │   └── App.tsx            # Composant racine avec routage
│   ├── public/                # Assets statiques
│   └── package.json           # Dépendances et scripts
├── backend/                    # API REST Node.js + Express
│   ├── routes/                # Endpoints de l'API
│   ├── middleware/            # Middleware d'authentification
│   ├── utils/                 # Utilitaires (sessions, logging)
│   └── firebase-config.js     # Configuration Firebase Admin
├── firestore.rules            # Règles de sécurité Firestore
└── README.md                  # Ce fichier (vue d'ensemble)
```

### Flux de données et communication

```
Frontend (React) ←→ Backend (Node.js) ←→ Firebase (Auth + Firestore)
     ↓                    ↓                    ↓
  Interface          API REST            Base de données
  utilisateur      Authentification      et authentification
```

## 🚀 Technologies utilisées

### Frontend
- **React.js 18.2.0** - Bibliothèque UI moderne avec hooks
- **TypeScript 5.2.2** - Typage statique et sécurité du code
- **Vite 5.0.8** - Bundler ultra-rapide et HMR
- **Tailwind CSS 3.4.0** - Framework CSS utilitaire
- **Framer Motion 12.10.5** - Animations et transitions

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Firebase Admin SDK** - Authentification et base de données
- **JWT** - Gestion des tokens d'authentification
- **Express Rate Limit** - Protection contre les abus

### Infrastructure
- **Firebase** - Authentification et base de données Firestore
- **Netlify** - Déploiement frontend
- **Render** - Déploiement backend

## 🛡️ Dashboard Administrateur

### Vue d'ensemble

Le **Dashboard Administrateur** est une interface sécurisée réservée aux utilisateurs ayant le rôle `admin`. Il fournit des outils de gestion complète pour l'administration de la plateforme WealthSensePro-ESG.

### Fonctionnalités principales

#### **Gestion des utilisateurs** ✅
- **Liste complète** : Affichage de tous les utilisateurs (5 utilisateurs accessibles)
- **Filtrage avancé** : Par rôle (admin, support, advisor, user) et statut
- **Recherche** : Par email, nom ou prénom
- **Informations détaillées** : UID, email, nom, rôle, statut, dates de création et connexion

#### **Sécurité renforcée**
- **Authentification JWT** : Token Bearer requis pour toutes les actions
- **Middleware admin** : Vérification du rôle admin côté backend
- **Logs sécurisés** : Toutes les actions sont tracées et pseudonymisées
- **Règles Firestore** : Accès restreint aux collections sensibles

#### **Interface intuitive**
- **Navigation par onglets** : Gestion des utilisateurs, sessions, analytics, configuration
- **Design responsive** : Adaptation automatique selon l'écran
- **Gestion des états** : Loading, erreurs, et données dynamiques

### Architecture technique

#### **Frontend**
```typescript
// Composant principal : AdminDashboard.tsx
// Gestion des utilisateurs : UserManagement.tsx
// Service d'authentification : authService avec JWT Bearer
```

#### **Backend**
```javascript
// Route protégée : GET /api/admin/users
// Middleware : adminAuthMiddleware
// Logs : secureLogger avec pseudonymisation
```

### Fonctionnalités à venir

- **Onglet Sessions** : Gestion des sessions actives et révocation
- **Onglet Analytics** : Statistiques d'utilisation et métriques
- **Onglet Configuration** : Paramètres système et permissions

## 🔐 Système d'authentification hybride sécurisé

### Architecture de sécurité

L'application implémente un système d'authentification hybride combinant **Firebase Auth** et **JWT** avec des mesures de sécurité avancées :

#### **1. Authentification côté backend**
- **Vérification email + mot de passe** avec Firebase Auth REST API
- **Génération de deux tokens JWT** :
  - **Access Token** (15 minutes) : envoyé en JSON response
  - **Refresh Token** (7 jours) : stocké en cookie HttpOnly

#### **2. Stockage sécurisé**
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

#### **3. Protection CSRF**
- **Headers requis** : `X-Requested-With: XMLHttpRequest`
- **Vérification d'origine** : whitelist des domaines autorisés
- **Protection sur endpoints sensibles** : `/refresh`, `/logout`

### Avantages de cette approche

✅ **Sécurité maximale** : Access token court + Refresh token HttpOnly  
✅ **Compatibilité iOS** : SameSite=None + Secure pour cross-origin  
✅ **Protection CSRF** : Headers personnalisés requis  
✅ **Auto-refresh** : Transparent pour l'utilisateur  
✅ **Multi-device** : Fonctionne sur tous les navigateurs et devices  

## 🔒 Système de gestion des sessions avancé

### Single-Active-Session avec Handoff Explicite

L'application implémente un système de gestion des sessions avancé garantissant qu'un seul utilisateur peut être connecté simultanément par défaut :

#### **Fonctionnalités de sécurité**
- **Révocation atomique** : Création de la nouvelle session ET révocation des autres en une seule opération
- **Device labeling intelligent** : Labels non-PII générés automatiquement (navigateur, OS)
- **Policies configurables** : `single` (défaut), `two` (advisors), `unlimited` (admins)
- **Refresh tokens rotatifs** : Rotation automatique à chaque utilisation
- **Détection de réutilisation** : Alerte et révocation en cas de compromission

#### **Codes d'erreur normalisés**
```javascript
// Session révoquée
{
  "success": false,
  "code": "SESSION_REVOKED",
  "reason": "replaced",
  "replacedBy": "new_jti_hash",
  "revokedAt": 1755785828553
}
```

## 🏦 Module de gestion patrimoniale ESG

### Fonctionnalités clés

Le module Patrimoine permet aux utilisateurs de saisir et gérer l'ensemble de leur situation financière et patrimoniale avec une approche ESG :

#### **Sections gérées**
- **Situation familiale** : Âge, profession, régime matrimonial
- **Revenus et charges** : Revenus professionnels, locatifs, pensions
- **Patrimoine immobilier** : Biens, valeurs, crédits en cours
- **Patrimoine financier** : Placements, répartition d'actifs
- **Endettement** : Emprunts, crédits, dettes
- **Profession** : Activité professionnelle, sociétés détenues
- **Objectifs** : Objectifs patrimoniaux et priorités ESG
- **Fiscalité** : Tranche d'imposition, IFI, défiscalisations
- **Autres informations** : Mandats, assurances, testament

#### **Intégration IA**
- Analyse automatique de la situation
- Recommandations personnalisées ESG
- Détection des optimisations possibles
- Conseils adaptés aux critères environnementaux, sociaux et de gouvernance

## 💬 Système de conversations IA

### Architecture des conversations

Le système de conversations IA est le cœur de l'expérience utilisateur, permettant des interactions naturelles et intelligentes pour la gestion patrimoniale ESG :

#### **Types de réponses supportées**
```typescript
interface ResponseBlock {
  responseType: 'text' | 'table' | 'chart-bar' | 'chart-donut' | 'video' | 'multiple-choice';
  content?: string | TableData | BarChartData | DonutChartData | MultipleChoiceData;
  videoUrl?: string;
}
```

#### **Composants de visualisation**
- **Graphiques en barres** : Affichage des données patrimoniales
- **Graphiques en donut** : Répartition des investissements ESG
- **Tableaux de données** : Données structurées et exportables
- **Vidéos intégrées** : Contenus éducatifs ESG
- **Choix multiples** : Questionnaires interactifs

#### **Sujets de conversation prédéfinis**
- **Gestion de patrimoine** : Optimisation, diversification
- **Investissement ESG** : Critères environnementaux, sociaux, gouvernance
- **Planification financière** : Retraite, transmission, objectifs
- **Fiscalité** : Optimisation, défiscalisation, IFI
- **Protection** : Assurance, mandats, succession

## 🛡️ Mesures de sécurité implémentées

### Backend
- ✅ **Rate limiting intelligent** par route et global
- ✅ **Logging sécurisé** avec pseudonymisation automatique
- ✅ **Headers de sécurité** automatiques
- ✅ **Configuration CORS** sécurisée
- ✅ **Protection CSRF** avec validation d'origine
- ✅ **Protection contre le bypass** en production

### Frontend
- ✅ **Détection temps réel** des sessions révoquées
- ✅ **Blocage complet de l'interface** sans possibilité de contournement
- ✅ **Blocage automatique de toutes les requêtes API** si session révoquée
- ✅ **Hard logout automatique** sans intervention utilisateur
- ✅ **Nettoyage complet des données sensibles**

## 🚀 Déploiement et environnements

### Environnements
- **Développement** : `http://localhost:5173` (frontend) + `http://localhost:3006` (backend)
- **Préproduction** : `https://wealthsense-esg.netlify.app` (frontend) + `https://wealthsensepro-esg.onrender.com` (backend)
- **Production** : `https://wealthsense-impact.com` (frontend) + `https://wealthsensepro-esg.onrender.com` (backend)

### Plateformes de déploiement
- **Frontend** : Netlify avec déploiement automatique
- **Backend** : Render avec auto-déploiement depuis Git
- **Base de données** : Firebase Firestore avec règles de sécurité

## 📊 Monitoring et observabilité

### Logs et métriques
- **Logs structurés** côté backend avec pseudonymisation
- **Métriques de performance** côté frontend (Core Web Vitals)
- **Surveillance des sessions** et révocations
- **Alertes de sécurité** automatiques

### Outils de monitoring
- **Vite Bundle Analyzer** : Analyse de la taille des bundles
- **React DevTools** : Profiling des composants
- **Lighthouse** : Audit de performance
- **Firebase Console** : Monitoring des sessions et authentification

## 🔧 Configuration et développement

### Variables d'environnement requises

#### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_BACKEND_URL=http://localhost:3006
```

#### Backend (.env)
```bash
FIREBASE_PROJECT_ID=votre_projet_id
JWT_SECRET=votre_secret_jwt_super_securise
N8N_WEBHOOK_URL=url_webhook_n8n
```

### Scripts de développement
```bash
# Frontend
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run lint         # Linting TypeScript

# Backend
npm start            # Démarrage du serveur
npm test             # Exécution des tests
```

## 🧪 Tests et qualité du code

### Tests implémentés
- **Tests de sécurité** : Validation des sessions et révocations
- **Tests d'authentification** : Flux de connexion et refresh
- **Tests de rate limiting** : Protection contre les abus

### Qualité du code
- **ESLint** : Règles de qualité strictes
- **TypeScript strict** : Typage complet et vérifications
- **Prettier** : Formatage automatique du code
- **Tests automatisés** : Couverture minimale de 80%

## 📱 Responsive Design et accessibilité

### Design responsive
- **Mobile First** : Approche mobile-first avec Tailwind CSS
- **Breakpoints adaptatifs** : Adaptation automatique selon l'écran
- **Navigation mobile** : Menu hamburger et navigation tactile
- **Formulaires adaptatifs** : Champs redimensionnés selon l'écran

### Accessibilité
- **Navigation au clavier** : Support complet de la navigation Tab
- **Contraste** : Respect des standards WCAG AA
- **Lecteurs d'écran** : Labels et descriptions appropriés
- **Focus visible** : Indicateurs de focus clairs

## 🎯 Roadmap et évolutions

### Phase 1 : MVP (Terminée) ✅
- ✅ Authentification sécurisée hybride
- ✅ Interface de base responsive
- ✅ Gestion des conversations IA
- ✅ Module patrimonial complet
- ✅ Système de sessions sécurisées

### Phase 2 : Fonctionnalités avancées (En cours) 🔄
- ✅ **Dashboard Administrateur** : Interface de gestion complète pour les administrateurs
  - Gestion des utilisateurs avec filtrage et recherche
  - Interface sécurisée avec authentification JWT Bearer
  - Logs de débogage et traçabilité des actions
  - Respect total de l'architecture de sécurité existante
- 🔄 Intégration IA avancée ESG
- 🔄 Analytics et reporting patrimonial
- 🔄 Notifications push
- 🔄 Export de données

### Phase 3 : Écosystème (Planifié) 📋
- 📋 API publique pour intégrations
- 📋 Intégrations tierces (banques, assureurs)
- 📋 Mobile app native
- 📋 Marketplace de conseillers ESG

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

## 📚 Documentation détaillée

### README spécialisés
- **[README.md](README.md)** : Vue d'ensemble globale (ce fichier)
- **[FRONTEND_README.md](FRONTEND_README.md)** : Architecture détaillée du frontend
- **[backend/README.md](backend/README.md)** : Architecture du backend
- **[backend/SECURITY_README.md](backend/SECURITY_README.md)** : Guide de sécurité du backend

### Ressources techniques
- [Documentation React](https://react.dev/)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Express.js](https://expressjs.com/)

## 🎉 Conclusion

**WealthSensePro-ESG** représente une plateforme moderne et sécurisée de gestion patrimoniale ESG, combinant les meilleures pratiques de développement web avec des fonctionnalités avancées d'intelligence artificielle et de sécurité.

L'architecture modulaire et sécurisée permet une évolution continue et l'ajout de nouvelles fonctionnalités tout en maintenant les plus hauts standards de sécurité et de qualité.

---

**📅 Dernière mise à jour : 21/08/2025 - Vue d'ensemble complète de l'application avec dashboard administrateur**

**✅ Statut actuel :** MVP terminé avec système de sécurité avancé  
**🔄 Phase en cours :** Fonctionnalités avancées et optimisations  
**🔮 Prochaines étapes :** Écosystème et intégrations tierces

