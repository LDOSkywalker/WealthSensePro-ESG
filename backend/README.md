# WealthSensePro-ESG - Backend API

## 📋 Vue d'ensemble

Le backend de WealthSensePro-ESG est une API REST construite avec **Node.js** et **Express.js**, utilisant **Firebase** comme base de données et service d'authentification. L'API gère l'authentification des utilisateurs, les conversations, les messages et l'intégration avec des webhooks N8N.

## 🏗️ Architecture

```
backend/
├── index.js              # Point d'entrée principal de l'application
├── firebase-config.js    # Configuration Firebase Admin
├── middleware/
│   └── auth.js          # Middleware d'authentification JWT
├── routes/
│   ├── auth.js          # Routes d'authentification
│   ├── conversations.js # Routes de gestion des conversations
│   └── messages.js      # Routes de gestion des messages
└── package.json         # Dépendances et scripts
```

## 🚀 Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Firebase Admin SDK** - Authentification et base de données
- **JWT** - Gestion des tokens d'authentification
- **CORS** - Gestion des requêtes cross-origin
- **Axios** - Client HTTP pour les webhooks
- **Cookie Parser** - Gestion des cookies

## ⚙️ Configuration

### Variables d'environnement requises

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=votre_projet_id
FIREBASE_PRIVATE_KEY_ID=votre_private_key_id
FIREBASE_PRIVATE_KEY=votre_private_key
FIREBASE_CLIENT_EMAIL=votre_client_email
FIREBASE_CLIENT_ID=votre_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=votre_cert_url
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
FIREBASE_WEB_API_KEY=votre_web_api_key

# JWT Configuration
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRATION=24h

# N8N Webhooks
N8N_WEBHOOK_URL=url_webhook_n8n
FEEDBACK_N8N_URL=url_feedback_n8n
REGISTRATION_WEBHOOK_URL=url_registration_n8n

# Frontend URL (optionnel)
FRONTEND_URL=url_frontend
```

### Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage du serveur
npm start

# Le serveur démarre sur le port 3006 par défaut
```

## 🔐 Système d'authentification

### Architecture d'authentification

L'API utilise un système d'authentification hybride combinant **Firebase Auth** et **JWT** :

1. **Firebase Auth** : Vérification des credentials (email/mot de passe)
2. **JWT Access Token** : Token court (15 minutes) pour l'authentification des requêtes
3. **JWT Refresh Token** : Token long (7 jours) stocké en cookie sécurisé

### Flux d'authentification

#### 1. Connexion (`POST /api/auth/login`)

```javascript
// Requête
{
  "email": "user@example.com",
  "password": "password123"
}

// Réponse
{
  "success": true,
  "access_token": "jwt_access_token",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com"
  }
}
```

**Processus :**
- Vérification des credentials via Firebase Auth REST API
- Récupération des informations utilisateur via Firebase Admin
- Génération des tokens JWT (access + refresh)
- Stockage du refresh token en cookie sécurisé (`__Host-refresh_token`)
- Retour de l'access token dans la réponse

#### 2. Rafraîchissement du token (`POST /api/auth/refresh`)

```javascript
// Requête (avec cookie refresh_token automatique)
// Headers requis : X-Requested-With: XMLHttpRequest

// Réponse
{
  "success": true,
  "access_token": "nouveau_jwt_access_token",
  "exp": 1234567890
}
```

**Sécurité :**
- Vérification CSRF via l'origine et le header `X-Requested-With`
- Validation du refresh token depuis le cookie
- Génération d'un nouvel access token

#### 3. Déconnexion (`POST /api/auth/logout`)

```javascript
// Réponse
{
  "success": true
}
```

**Actions :**
- Suppression du cookie refresh_token
- Invalidation de la session

### Inscription (`POST /api/auth/signup`)

```javascript
// Requête
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "referralSource": "google",
  "otherReferralSource": null,
  "disclaimerAccepted": true,
  "disclaimerAcceptedAt": "2024-01-01T00:00:00.000Z"
}

// Réponse
{
  "success": true,
  "access_token": "jwt_access_token",
  "user": {
    "uid": "firebase_uid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Processus :**
- Création de l'utilisateur dans Firebase Auth
- Enregistrement des informations dans Firestore
- Génération des tokens d'authentification
- Retour des informations utilisateur

### Gestion du profil

- **Récupération** : `GET /api/auth/profile`
- **Modification** : `PUT /api/auth/profile`
- **Changement de mot de passe** : `PUT /api/auth/password`
- **Réinitialisation** : `POST /api/auth/reset-password`

### Réinitialisation de mot de passe (`POST /api/auth/reset-password`)

La réinitialisation de mot de passe utilise un système de fallback intelligent pour garantir la délivrabilité des emails :

#### 🔄 Option 1 : Firebase Auth REST API (Recommandée)

```javascript
// Requête
{
  "email": "user@example.com"
}

// Réponse
{
  "success": true,
  "message": "Email de réinitialisation envoyé avec succès.",
  "firebaseResponse": {
    "kind": "identitytoolkit#GetOobConfirmationCodeResponse",
    "email": "user@example.com"
  },
  "method": "firebase_rest_api"
}
```

**Avantages :**
- ✅ **Envoi automatique** de l'email via Firebase
- ✅ **Gestion native** des templates et de la délivrabilité
- ✅ **Pas de service tiers** requis
- ✅ **Intégration complète** avec Firebase Auth

**Configuration requise :**
- Variable d'environnement `FIREBASE_WEB_API_KEY` configurée
- Templates d'email personnalisés dans Firebase Console

#### 🔄 Option 2 : Firebase Admin SDK (Fallback)

Si l'API REST échoue, le système bascule automatiquement vers Firebase Admin SDK :

```javascript
// Réponse de fallback
{
  "success": true,
  "message": "Lien de réinitialisation généré. Email à envoyer manuellement.",
  "resetLink": "https://...", // Uniquement en développement
  "note": "Email non envoyé automatiquement - implémentation requise",
  "method": "firebase_admin_sdk"
}
```

**Utilisation :**
- Génération du lien de réinitialisation sécurisé
- **L'email doit être envoyé manuellement** via un service tiers
- Prêt pour l'intégration future de services comme SendGrid, Nodemailer, etc.

#### 🎨 Personnalisation des templates d'email

Pour améliorer la délivrabilité, personnalisez les templates dans **Firebase Console > Authentication > Templates > Password reset** :

```html
<!-- Template HTML recommandé -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <h1 style="color: white;">WealthSense</h1>
  <p style="color: white;">Réinitialisation de mot de passe</p>
</div>
<div>
  <h2>Bonjour,</h2>
  <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
  <a href="%LINK%" style="background: #667eea; color: white; padding: 15px 30px;">
    Réinitialiser mon mot de passe
  </a>
</div>
```

**Variables disponibles :**
- `%LINK%` : Lien de réinitialisation sécurisé
- `%EMAIL%` : Adresse email de l'utilisateur
- `%APP_NAME%` : Nom de l'application

#### 🔧 Configuration Firebase pour la délivrabilité

1. **Templates personnalisés** : Remplacez le template par défaut
2. **Expéditeur personnalisé** : `noreply@wealthsense-impact.com`
3. **Nom d'affichage** : `WealthSense Support`
4. **Domaines autorisés** : Ajoutez votre domaine dans les paramètres
5. **Configuration SPF/DKIM** : Pour améliorer la réputation d'envoi

#### 📊 Logs et monitoring

```javascript
// Logs détaillés du processus
🔄 === DÉBUT RÉINITIALISATION MOT DE PASSE ===
🔄 Email: user@example.com
🔄 Utilisation de Firebase Auth REST API pour l'envoi automatique...
✅ Email de réinitialisation envoyé via Firebase Auth REST API
✅ Réponse Firebase: {...}

// En cas de fallback
❌ Erreur avec Firebase Auth REST API: {...}
🔄 Tentative avec Firebase Admin SDK...
✅ Lien généré: https://.../reset-password?oobCode=...
⚠️ ATTENTION: Lien généré mais email non envoyé automatiquement
```

#### 🚀 Évolution future

Le système est conçu pour une évolution facile vers des services d'email tiers :

```javascript
// Intégration future possible
if (process.env.SENDGRID_API_KEY) {
  // Envoi via SendGrid
} else if (process.env.NODEMAILER_CONFIG) {
  // Envoi via Nodemailer
} else {
  // Fallback Firebase Auth REST API
}
```

## 🛡️ Middleware d'authentification

### `auth.js` - Middleware de protection des routes

Le middleware `auth.js` protège les routes nécessitant une authentification :

```javascript
// Utilisation
app.use('/api/protected', authMiddleware, (req, res) => {
  // Route protégée
});
```

**Fonctionnement :**
1. **Extraction du token** : Récupération depuis le header `Authorization: Bearer <token>`
2. **Vérification JWT** : Validation du token avec la clé secrète
3. **Vérification du type** : Contrôle que c'est un access token
4. **Validation Firebase** : Vérification que l'utilisateur existe toujours
5. **Enrichissement de la requête** : Ajout de `req.user` avec les informations utilisateur

**Sécurité :**
- Vérification de l'expiration du token
- Validation du type de token (access vs refresh)
- Double vérification avec Firebase Auth
- Logs détaillés pour le debugging

## 🛣️ Routes de l'API

### Base URL
```
http://localhost:3006/api
```

### Routes d'authentification (`/api/auth`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `POST` | `/login` | Connexion utilisateur | ❌ |
| `POST` | `/signup` | Inscription utilisateur | ❌ |
| `POST` | `/refresh` | Rafraîchissement du token | ❌ (avec cookie) |
| `POST` | `/logout` | Déconnexion | ❌ (avec cookie) |
| `GET` | `/profile` | Récupération du profil | ✅ |
| `PUT` | `/profile` | Modification du profil | ✅ |
| `PUT` | `/password` | Changement de mot de passe | ✅ |
| `POST` | `/reset-password` | Réinitialisation du mot de passe | ❌ |

### Routes des conversations (`/api/conversations`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/` | Liste des conversations d'un utilisateur | ✅ |
| `POST` | `/` | Création d'une nouvelle conversation | ✅ |
| `PUT` | `/:id` | Modification d'une conversation | ✅ |
| `DELETE` | `/:id` | Suppression d'une conversation | ✅ |

**Structure des données :**
```javascript
{
  "userId": "firebase_uid",
  "title": "Titre de la conversation",
  "topic": "Sujet de la conversation",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Routes des messages (`/api/messages`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/:conversationId` | Messages d'une conversation | ✅ |
| `POST` | `/` | Création d'un nouveau message | ✅ |

**Structure des données :**
```javascript
{
  "conversationId": "conversation_id",
  "content": "Contenu du message",
  "sender": "user_id",
  "timestamp": 1234567890
}
```

### Routes des webhooks

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET/POST` | `/webhook` | Webhook principal N8N | ❌ |
| `GET/POST` | `/feedback` | Webhook de feedback | ❌ |
| `GET/POST` | `/registration` | Webhook d'enregistrement | ❌ |

**Fonctionnement :**
- Redirection des requêtes vers les URLs N8N configurées
- Support des méthodes GET et POST
- Gestion des erreurs et logging sécurisé

## 🔒 Sécurité

### Headers de sécurité

```javascript
// Headers automatiquement ajoutés
X-Powered-By: WealthSense API
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### Configuration CORS

```javascript
// Origines autorisées
const allowedOrigins = [
  'http://localhost:5173',                    // Dev local
  'https://develop--wealthsense-esg.netlify.app', // Branche develop
  'https://wealthsense-esg.netlify.app',     // Preprod
  'https://wealthsense-impact.com',          // Production
  process.env.FRONTEND_URL                   // URL configurée
];

// Options CORS
{
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}
```

### Protection CSRF

- Vérification de l'origine des requêtes
- Header `X-Requested-With: XMLHttpRequest` requis
- Validation des cookies de session

### Logging sécurisé

```javascript
// Masquage des données sensibles
const sensitiveKeys = ['userEmail', 'email', 'password', 'token', 'apiKey'];

// Logs en production vs développement
if (isProduction) {
  console.log('ℹ️ Message minimal');
} else {
  console.log('ℹ️ Message détaillé', maskedData);
}
```

## 🚫 Rate Limiting et Protection contre les abus

### Système de rate limiting intelligent

L'API implémente un système de rate limiting multi-niveaux pour protéger contre les abus et attaques par déni de service :

#### 🔒 Rate Limiting par route

| Route | Limite | Fenêtre | Description |
|-------|--------|---------|-------------|
| `/api/auth/reset-password` | 3 tentatives | 1 heure | Protection contre le bombardement d'emails |
| `/api/auth/login` | 5 tentatives | 15 minutes | Protection contre le brute force |
| `/api/auth/signup` | 3 tentatives | 1 heure | Protection contre le spam d'inscriptions |
| **Global** | 100 requêtes | 15 minutes | Protection générale de l'API |

#### 🎯 Stratégies de rate limiting

**1. Réinitialisation de mot de passe :**
```javascript
// Configuration
{
  windowMs: 60 * 60 * 1000,    // 1 heure
  max: 3,                       // 3 tentatives max
  keyGenerator: (req) => `${req.ip}-${req.body.email}` // IP + Email
}

// Réponse en cas de dépassement
{
  "success": false,
  "error": "Trop de tentatives de réinitialisation. Réessayez dans 1 heure.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

**2. Connexion :**
```javascript
// Configuration
{
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 5,                       // 5 tentatives max
  keyGenerator: (req) => `login-${req.ip}-${req.body.email}`
}
```

**3. Protection globale :**
```javascript
// Configuration
{
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,                     // 100 requêtes max par IP
  keyGenerator: (req) => req.ip
}
```

#### 📊 Headers de rate limiting

L'API retourne automatiquement des headers informatifs :

```http
RateLimit-Limit: 3
RateLimit-Remaining: 1
RateLimit-Reset: 1640995200
Retry-After: 3600
```

#### 🔍 Logs de sécurité

```javascript
// Logs automatiques lors du dépassement des limites
🚫 Rate limit atteint pour 192.168.1.1 - Email: user@example.com
🚫 Tentative de réinitialisation bloquée par rate limiting: {
  timestamp: "2025-08-19T12:00:00.000Z",
  ip: "192.168.1.1",
  email: "user@example.com",
  userAgent: "Mozilla/5.0...",
  path: "/api/auth/reset-password",
  method: "POST"
}
```

#### 🧪 Mode développement

En développement, vous pouvez contourner le rate limiting :

```bash
# Header pour désactiver le rate limiting en dev
X-Test-Mode: true
```

#### 🚀 Configuration avancée

```javascript
// Personnalisation des limites par environnement
const rateLimitConfig = {
  development: {
    passwordReset: { max: 10, windowMs: 60 * 60 * 1000 },
    login: { max: 20, windowMs: 15 * 60 * 1000 }
  },
  production: {
    passwordReset: { max: 3, windowMs: 60 * 60 * 1000 },
    login: { max: 5, windowMs: 15 * 60 * 1000 }
  }
};
```

#### 💡 Bonnes pratiques

1. **Limites raisonnables** : Éviter de bloquer les utilisateurs légitimes
2. **Messages clairs** : Informer l'utilisateur du délai d'attente
3. **Monitoring** : Surveiller les tentatives de contournement
4. **Évolution** : Ajuster les limites selon l'usage réel
5. **Whitelist** : Possibilité d'exclure certaines IPs (support, tests)

## 🛡️ Améliorations de sécurité Phase 1

### Configuration Trust Proxy

**CRITIQUE** pour le rate limiting en production derrière un load balancer :

```javascript
// Configuration automatique dans index.js
app.set('trust proxy', 1);

// Permet de récupérer la vraie IP client
// Nécessaire pour Render, Heroku, AWS, etc.
```

### Protection contre le bypass en production

Le header `X-Test-Mode` est automatiquement banni en production :

```javascript
// Middleware de sécurité automatique
if (isProduction && req.headers['x-test-mode']) {
    return res.status(403).json({
        success: false,
        error: 'Accès interdit',
        code: 'FORBIDDEN'
    });
}
```

**Variables d'environnement :**
```bash
# Bannir le bypass même en développement (optionnel)
BAN_BYPASS_IN_DEV=true

# Environnement de production (automatique)
NODE_ENV=production
```

### Anonymisation des données sensibles

#### Hashing des emails

```javascript
// Fonction de hachage automatique
const hashEmail = (email) => {
    if (!email) return 'anonymous';
    return crypto.createHash('sha256')
        .update(email.toLowerCase())
        .digest('hex')
        .substring(0, 8);
};

// Exemple : user@example.com → a1b2c3d4
```

#### Logs sécurisés

```javascript
// Avant (données exposées)
🚫 Rate limit atteint pour 192.168.1.1 - Email: user@example.com

// Après (anonymisé)
🚫 Rate limit atteint pour 192.168.1.1 - Email hashé: a1b2c3d4
```

### Validation des données avant comptage

Les requêtes malformées ne sont pas comptées dans le rate limiting :

```javascript
// Validation automatique des emails
const validateRequestData = (req) => {
    const { email } = req.body || {};
    
    if (email && typeof email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    return true;
};

// Application automatique
skip: (req) => !validateRequestData(req)
```

### Headers de sécurité renforcés

```http
# Headers automatiquement ajoutés
X-Powered-By: WealthSense API
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';

# Headers de rate limiting
RateLimit-Limit: 3
RateLimit-Remaining: 1
RateLimit-Reset: 1640995200
Retry-After: 3600
```

### Monitoring et alertes de sécurité

```javascript
// Logs de sécurité automatiques
🚫 Tentative de bypass détectée en production: {
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: "2025-08-19T12:00:00.000Z"
}

// Logs de rate limiting anonymisés
🚫 Tentative de réinitialisation bloquée par rate limiting: {
  timestamp: "2025-08-19T12:00:00.000Z",
  ip: "192.168.1.1",
  emailHash: "a1b2c3d4",
  userAgent: "Mozilla/5.0...",
  path: "/api/auth/reset-password",
  method: "POST",
  environment: "production"
}
```

### Configuration par environnement

```bash
# Développement
NODE_ENV=development
BAN_BYPASS_IN_DEV=false  # Optionnel

# Production
NODE_ENV=production
# BAN_BYPASS_IN_DEV ignoré (toujours banni)
```

### Tests de sécurité

```bash
# Test du bypass en développement
curl -H "X-Test-Mode: true" http://localhost:3006/api/auth/reset-password

# Test du bypass en production (doit échouer)
curl -H "X-Test-Mode: true" https://wealthsense-impact.com/api/auth/reset-password
# Réponse : 403 Forbidden
```

## 🗄️ Base de données

### Collections Firestore

#### `users`
```javascript
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "referralSource": "google",
  "otherReferralSource": null,
  "disclaimerAccepted": true,
  "disclaimerAcceptedAt": 1234567890,
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "role": "user",
  "isActive": true
}
```

#### `conversations`
```javascript
{
  "userId": "firebase_uid",
  "title": "Titre de la conversation",
  "topic": "Sujet",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### `messages`
```javascript
{
  "conversationId": "conversation_id",
  "content": "Contenu du message",
  "sender": "user_id",
  "timestamp": 1234567890
}
```

## 🚀 Déploiement

### Environnements

- **Développement** : `http://localhost:3006`
- **Préproduction** : `https://wealthsense-esg.netlify.app`
- **Production** : `https://wealthsense-impact.com`

### Variables d'environnement par environnement

```bash
# Développement
NODE_ENV=development
PORT=3006

# Production
NODE_ENV=production
PORT=3006
```

### Déploiement sur Render

1. Connecter le repository Git
2. Configurer les variables d'environnement
3. Définir la commande de démarrage : `npm start`
4. Configurer l'auto-déploiement

## 📊 Monitoring et logs

### Logs structurés

```javascript
// Logs d'information
secureLogger.info('Message', { data: maskedData });

// Logs d'erreur
secureLogger.error('Erreur', { error: errorDetails });
```

### Health check

```bash
GET /
# Réponse
{
  "status": "ok",
  "message": "WealthSense API is running",
  "version": "1.0.0",
  "endpoints": {
    "webhook": "/api/webhook",
    "feedback": "/api/feedback",
    "registration": "/api/registration"
  }
}
```

## 🧪 Tests

```bash
# Exécution des tests
npm test

# Note : Les tests ne sont pas encore implémentés
```

## 🔧 Maintenance

### Gestion des erreurs

- Logs détaillés en développement
- Logs sécurisés en production
- Gestion des erreurs Firebase
- Validation des données d'entrée

### Performance

- Middleware de logging minimal
- Gestion des timeouts pour les webhooks
- Optimisation des requêtes Firestore

## 📚 Ressources

- [Documentation Express.js](https://expressjs.com/)
- [Documentation Firebase Admin](https://firebase.google.com/docs/admin)
- [Documentation JWT](https://jwt.io/)
- [Documentation CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 👥 Équipe

Backend développé pour WealthSensePro-ESG - Plateforme d'investissement ESG.

---

*Dernière mise à jour : 19/08/2025 - Phase 1 : Améliorations de sécurité critiques (trust proxy, bypass banni, logs anonymisés)* 