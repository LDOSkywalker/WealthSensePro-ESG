# 🚀 WealthSensePro-ESG - Backend API

## 📋 Vue d'ensemble

Le backend de WealthSensePro-ESG est une **API REST sécurisée** construite avec **Node.js** et **Express.js**, utilisant **Firebase** comme base de données et service d'authentification. L'API implémente un système de gestion des sessions avancé avec **Single-Active-Session** et **refresh tokens rotatifs**.

## 🏗️ Architecture

```
backend/
├── index.js                    # Point d'entrée principal
├── firebase-config.js          # Configuration Firebase Admin
├── middleware/
│   ├── auth.js                # Middleware d'authentification JWT
│   └── rateLimit.js           # Protection contre les abus
├── routes/
│   ├── auth.js                # Routes d'authentification
│   ├── admin.js               # Routes d'administration
│   ├── conversations.js       # Gestion des conversations
│   └── messages.js            # Gestion des messages
├── scripts/
│   ├── create-admin.js        # Script de création du premier admin
│   ├── test-admin.js          # Script de test de l'admin
│   ├── cleanup-admin-script.js # Script de nettoyage
│   └── README.md              # Documentation des scripts
├── utils/
│   ├── sessionManager.js      # Gestion des sessions sécurisées
│   ├── sessionCleanup.js      # Nettoyage automatique
│   └── secureLogger.js        # Logging sécurisé
└── package.json               # Dépendances et scripts
```

## 🚀 Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Firebase Admin SDK** - Authentification et base de données
- **JWT** - Gestion des tokens d'authentification
- **CORS** - Gestion des requêtes cross-origin
- **Axios** - Client HTTP pour les webhooks
- **Cookie Parser** - Gestion des cookies
- **Express Rate Limit** - Protection contre les abus

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

## 🔐 Système d'authentification et Gestion des Rôles

### Gestion des Rôles Utilisateurs

L'application supporte un système de rôles hiérarchique :

- **`user`** : Utilisateur standard (rôle par défaut)
- **`advisor`** : Conseiller financier (accès étendu)
- **`support`** : Équipe de support (accès limité)
- **`admin`** : Administrateur système (accès complet)

### Création du Premier Administrateur

**⚠️ IMPORTANT :** Le premier administrateur doit être créé via un script sécurisé.

```bash
# Depuis le dossier backend/
node scripts/create-admin.js --email=admin@wealthsense.com --role=admin
```

**Sécurité :**
- Le script ne peut être exécuté qu'une seule fois
- Une fois qu'un admin existe, utilisez l'interface admin
- Toutes les opérations sont loggées et traçables

**⚠️ ATTENTION SÉCURITÉ :** Le script vérifie uniquement la présence d'admins dans Firestore. En cas de suppression manuelle d'un admin, le script pourrait être réutilisé. **Ne jamais supprimer manuellement un administrateur depuis Firestore.**

**Documentation complète :** Voir `scripts/README.md`

## 🔐 Système d'authentification

### Architecture d'authentification

L'API utilise un système d'authentification hybride combinant **Firebase Auth** et **JWT** :

1. **Firebase Auth** : Vérification des credentials (email/mot de passe)
2. **JWT Access Token** : Token court (15 minutes) pour l'authentification des requêtes
3. **JWT Refresh Token** : Token long (7 jours) stocké en cookie sécurisé avec rotation

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
- Création d'une session sécurisée avec device labeling
- Stockage du refresh token en cookie sécurisé (`__Host-refresh_token`)

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
- Rotation automatique du refresh token
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
- Révocation de la session en base de données
- Nettoyage des données de session

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

### Gestion du profil

- **Récupération** : `GET /api/auth/profile`
- **Modification** : `PUT /api/auth/profile`
- **Changement de mot de passe** : `PUT /api/auth/password`
- **Réinitialisation** : `POST /api/auth/reset-password`
- **Informations de session** : `GET /api/auth/session-info`

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
5. **Vérification de session** : Contrôle du statut de la session
6. **Enrichissement de la requête** : Ajout de `req.user` avec les informations utilisateur

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
| `GET` | `/session-info` | Informations de session | ✅ |

### Routes d'administration (`/api/admin`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/sessions/stats` | Statistiques des sessions | ✅ (Admin) |
| `POST` | `/sessions/cleanup` | Nettoyage forcé des sessions | ✅ (Admin) |
| `POST` | `/sessions/revoke-family` | Révocation de famille | ✅ (Admin) |
| `GET` | `/sessions/device/:deviceId` | Sessions d'un appareil | ✅ (Admin) |
| `GET` | `/sessions/user/:uid` | Sessions d'un utilisateur | ✅ (Admin) |
| `POST` | `/sessions/revoke-user` | Révocation de toutes les sessions | ✅ (Admin) |
| `GET` | `/users/:uid/policy` | Policy de session d'un utilisateur | ✅ (Admin) |
| `PUT` | `/users/:uid/policy` | Modification de la policy | ✅ (Admin) |

### Routes des conversations (`/api/conversations`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/` | Liste des conversations d'un utilisateur | ✅ |
| `POST` | `/` | Création d'une nouvelle conversation | ✅ |
| `PUT` | `/:id` | Modification d'une conversation | ✅ |
| `DELETE` | `/:id` | Suppression d'une conversation | ✅ |

### Routes des messages (`/api/messages`)

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/:conversationId` | Messages d'une conversation | ✅ |
| `POST` | `/` | Création d'un nouveau message | ✅ |

### Routes des webhooks

| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET/POST` | `/webhook` | Webhook principal N8N | ❌ |
| `GET/POST` | `/feedback` | Webhook de feedback | ❌ |
| `GET/POST` | `/registration` | Webhook d'enregistrement | ❌ |

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

#### `sessions`
```javascript
{
  "uid": "user_id",
  "deviceId": "hash_device",
  "deviceLabel": "Chrome",
  "email": "user@example.com",
  "status": "active|rotated|revoked|logged_out",
  "reason": "replaced|reuse|logout|expired|admin_revocation|null",
  "replacedBy": "jti_hash|null",
  "createdAt": 1755785828553,
  "lastUsed": 1755785828553,
  "revokedAt": 1755785828553|null,
  "tokenFamily": "device_hash",
  "rotatedFrom": "jti_hash|null"
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

### Logs structurés avec secureLogger

```javascript
// Logs d'information
secureLogger.info('Message', null, { data: maskedData });

// Logs d'erreur
secureLogger.error('Erreur', error, { endpoint: '/api/auth/login' });

// Logs d'opération
secureLogger.operation('login', { userId: user.uid });
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

# Tests de sécurité des sessions
node test-single-session.js

# Tests des webhooks
node test-api-sessions.js
```

## 🔧 Maintenance

### Gestion des erreurs

- Logs détaillés en développement
- Logs sécurisés et pseudonymisés en production
- Gestion des erreurs Firebase
- Validation des données d'entrée

### Performance

- Middleware de logging minimal
- Gestion des timeouts pour les webhooks
- Optimisation des requêtes Firestore
- Nettoyage automatique des sessions expirées

## 📚 Ressources

- [Documentation Express.js](https://expressjs.com/)
- [Documentation Firebase Admin](https://firebase.google.com/docs/admin)
- [Documentation JWT](https://jwt.io/)
- [Documentation CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 👥 Équipe

Backend développé pour WealthSensePro-ESG - Plateforme d'investissement ESG.

---

## 🚀 **Fonctionnalités avancées implémentées**

### ✅ **Single-Active-Session avec Handoff Explicite**
- Révocation atomique des sessions lors de nouvelles connexions
- Device labeling intelligent (navigateur, OS)
- Policies configurables par rôle utilisateur
- Codes d'erreur normalisés pour le frontend

### ✅ **Système de sessions sécurisées**
- Refresh tokens rotatifs
- Détection de réutilisation
- Révocation de famille en cas de compromission
- Gestion des sessions en base de données

### ✅ **Sécurité renforcée**
- Rate limiting intelligent
- Logging sécurisé avec pseudonymisation
- Protection CSRF
- Headers de sécurité automatiques

---

**📅 Dernière mise à jour : 21/08/2025 - Architecture complète et sécurisée** 