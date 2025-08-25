# 🛡️ WealthSensePro-ESG - Guide de Sécurité

## 📋 Vue d'ensemble

Ce document détaille l'architecture de sécurité complète du backend WealthSensePro-ESG, incluant le système de gestion des sessions, la protection contre les attaques, et les bonnes pratiques implémentées.

## 🔧 **Corrections récentes de sécurité (Août 2025)**

### **✅ Correction du système d'inscription**
- **Problème résolu** : Erreur Firestore avec valeurs undefined
- **Solution** : Validation côté serveur et nettoyage des données
- **Sécurité** : Aucune exposition de données sensibles
- **Logs** : Diagnostic détaillé avec pseudonymisation

### **✅ Mise à jour express-rate-limit**
- **Version** : Mise à jour vers v7.5.1 pour compatibilité IPv6
- **Correction** : Gestion des adresses IPv6 dans les rate limiters
- **Sécurité** : Suppression des options dépréciées (onLimitReached)
- **Performance** : Rate limiting optimisé et stable

### **✅ Nettoyage des logs de production**
- **Suppression** : Logs de débogage inutiles
- **Conservation** : Logs de sécurité essentiels
- **Pseudonymisation** : Maintien de la traçabilité sécurisée
- **Performance** : Réduction du bruit dans les logs de production

## 🔐 **Système de Gestion des Sessions Sécurisées**

### 🚀 **Single-Active-Session avec Handoff Explicite - Phase 1 ✅**

#### **Fonctionnalité implémentée**
La **Phase 1** garantit qu'un seul utilisateur peut être connecté simultanément par défaut, avec une **révocation atomique** des sessions existantes lors de nouvelles connexions.

#### **Policies de session configurables**
- **`single`** (défaut pour TOUS les rôles) : Une seule session active par compte
- **`two`** : Deux sessions simultanées autorisées (configurable manuellement)
- **`unlimited`** : Sessions illimitées (configurable manuellement uniquement)

**⚠️ IMPORTANT :** Depuis la version actuelle, **TOUS les utilisateurs** (y compris les admins et support) ont la policy `single` par défaut pour garantir la sécurité maximale. Les policies `two` et `unlimited` ne peuvent être activées que par configuration manuelle en base de données.

#### **Révocation atomique**
- **Transaction Firestore** : Création de la nouvelle session ET révocation des autres en une seule opération
- **Aucune fenêtre d'accès résiduel** : Sécurité maximale garantie
- **Gestion des courses** : Évite les conflits entre connexions simultanées

### 📱 **Device Labeling intelligent**

#### **Labels non-PII générés automatiquement**
- **Navigateurs** : Chrome, Firefox, Safari, Edge
- **Systèmes d'exploitation** : Windows, Mac, iPhone, Android
- **Fallback** : "Appareil" pour les cas non reconnus

#### **Exemple de détection**
```javascript
// User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
// → Device Label: "Windows"

// User-Agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
// → Device Label: "iPhone"
```

### 🛡️ **Codes d'erreur normalisés**

#### **Réponses API standardisées**
```javascript
// Session révoquée
{
  "success": false,
  "code": "SESSION_REVOKED",
  "reason": "replaced",
  "replacedBy": "new_jti_hash",
  "revokedAt": 1755785828553
}

// Session invalide
{
  "success": false,
  "code": "SESSION_INVALID",
  "error": "Session invalide"
}

// Session non trouvée
{
  "success": false,
  "code": "SESSION_NOT_FOUND",
  "error": "Session invalide"
}
```

## 🔄 **Système de Refresh Tokens Rotatifs**

### **Architecture sécurisée**
- **Rotation automatique** : Chaque refresh génère un nouveau token
- **JTI unique** : Chaque token a un identifiant unique
- **Device binding** : Tokens liés à un appareil spécifique
- **Détection de réutilisation** : Alerte si ancien token utilisé

### **Flux de fonctionnement**

#### **1. Connexion (Login)**
```javascript
// Création d'une nouvelle session
const session = await sessionManager.createSession(uid, email, req);
// - Génère un JTI unique
// - Crée un deviceId basé sur IP + User-Agent
// - Stocke la session en base
// - Retourne access + refresh tokens
```

#### **2. Rafraîchissement (Refresh)**
```javascript
// Rotation du refresh token
const session = await sessionManager.refreshSession(prevRefreshToken, req);
// - Vérifie la validité de l'ancien token
// - Marque l'ancien comme "rotated"
// - Crée un nouveau refresh token
// - Met à jour la base de données
```

#### **3. Détection de réutilisation**
```javascript
// Si un ancien token est réutilisé
if (sessionData.status !== 'active') {
  // Révocation de toute la famille
  await sessionManager.revokeFamily(deviceId);
  throw new Error('Session révoquée');
}
```

## 🚫 **Rate Limiting et Protection contre les abus**

### **Système de rate limiting intelligent**

#### **Limites par route**
| Route | Limite | Fenêtre | Description |
|-------|--------|---------|-------------|
| `/api/auth/reset-password` | 3 tentatives | 1 heure | Protection contre le bombardement d'emails |
| `/api/auth/login` | 5 tentatives | 15 minutes | Protection contre le brute force |
| `/api/auth/signup` | 3 tentatives | 1 heure | Protection contre le spam d'inscriptions |
| **Global** | 100 requêtes | 15 minutes | Protection générale de l'API |

#### **Stratégies de rate limiting**
```javascript
// Configuration pour la réinitialisation de mot de passe
{
  windowMs: 60 * 60 * 1000,    // 1 heure
  max: 3,                       // 3 tentatives max
  keyGenerator: (req) => `${req.ip}-${req.body.email}` // IP + Email
}

// Configuration pour la connexion
{
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 5,                       // 5 tentatives max
  keyGenerator: (req) => `login-${req.ip}-${req.body.email}`
}
```

#### **Headers de rate limiting**
```http
RateLimit-Limit: 3
RateLimit-Remaining: 1
RateLimit-Reset: 1640995200
Retry-After: 3600
```

### **Protection contre le bypass en production**
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

## 🔒 **Système de logging sécurisé avec Allowlist**

### **Principe de sécurité par défaut**
**AVANT (approche fragile) :** Masquage des clés sensibles avec risque d'oubli  
**MAINTENANT (approche sécurisée) :** Allowlist stricte - seuls les champs explicitement autorisés sont loggés

### **Champs autorisés à être loggés**
```javascript
const ALLOWED_LOG_FIELDS = [
    'path',           // Chemin de la requête (/api/auth/login)
    'method',         // Méthode HTTP (GET, POST, PUT, DELETE)
    'status',         // Code de statut HTTP (200, 400, 500)
    'durationMs',     // Durée de traitement en millisecondes
    'requestId',      // ID unique de la requête pour le tracing
    'ip',             // IP client (anonymisée automatiquement)
    'userAgent',      // Navigateur et version uniquement
    'timestamp',      // Horodatage ISO
    'environment',    // Environnement (development/production)
    'operation',      // Opération métier (login, password_change, etc.)
    'success',        // Succès/échec de l'opération
    'errorCode',      // Code d'erreur (sans détails sensibles)
    'rateLimit',      // Informations de rate limiting
    'endpoint',       // Endpoint appelé
    'emailHash',      // Email pseudonymisé (a1b2c3d4)
    'uidHash'         // UID pseudonymisé (e5f6g7h8)
];
```

### **Pseudonymisation intelligente des données sensibles**

#### **Principe de la pseudonymisation**
**AVANT (anonymisation simple) :**
```javascript
// ❌ Perte totale de traçabilité
user@example.com → 192.168.xxx.xxx
abc123-uid → xxx.xxx.xxx.xxx
```

**MAINTENANT (pseudonymisation intelligente) :**
```javascript
// ✅ Traçabilité préservée, sécurité renforcée
user@example.com → a1b2c3d4 (hash unique)
abc123-uid → e5f6g7h8 (hash unique)
```

#### **Avantages de la pseudonymisation**
✅ **🔍 Traçabilité** : Possibilité de suivre un utilisateur spécifique dans les logs  
✅ **🛡️ Sécurité** : Impossible de retrouver l'email/UID original  
✅ **📊 Analytics** : Analyse des patterns d'utilisation par utilisateur  
✅ **🔧 Debugging** : Suivi des sessions et requêtes d'un utilisateur  
✅ **📋 Conformité RGPD** : Meilleure protection des données personnelles  

### **Fonctionnalités du logger sécurisé**

#### **1. Anonymisation automatique des IPs**
```javascript
// IPv4: 192.168.1.100 → 192.168.xxx.xxx
// IPv6: 2001:db8::1 → 2001:db8:xxx:xxx
// Localhost: 127.0.0.1 → localhost
```

#### **2. Nettoyage du User-Agent**
```javascript
// Avant: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
// Après: "Chrome/120.0.0.0"
```

#### **3. Génération d'ID de requête unique**
```javascript
// Chaque requête reçoit un ID unique pour le tracing
requestId: "a1b2c3d4"
```

### **Utilisation du logger sécurisé**
```javascript
// Log de requête entrante
const logData = secureLogger.request(req, 'login');

// Log de réponse
secureLogger.response(logData, res, error);

// Log d'opération métier
secureLogger.operation('password_change', { userId: 'abc123' });

// Log de sécurité
secureLogger.security('rate_limit_exceeded', { ip: req.ip });
```

## 🚨 **Correction CRITIQUE de Sécurité - Middleware d'Authentification**

### **🚨 Problème identifié (19/08/2024)**
**AVANT (DANGEREUX) :** Le middleware d'authentification exposait **TOUTES** les données sensibles en clair dans les logs :

```javascript
// ❌ EXPOSITION DIRECTE DES DONNÉES SENSIBLES !
console.log('🔍 JWT décodé avec succès:', {
    uid: 'gmY8D1YnupYYp4NJDTiFj5K0vu02',        // UID en clair
    email: 'ludovic.skywalker@gmail.com',         // EMAIL en clair
    type: 'access',
    loginTime: 1755611618323
});
```

**Risques de sécurité :**
- 🚨 **Violation RGPD** - Données personnelles exposées
- 🚨 **Fuites d'informations** - Emails et UIDs visibles
- 🚨 **Attaques ciblées** - Possibilité d'identifier les utilisateurs
- 🚨 **Non-conformité** - Standards de sécurité non respectés

### **✅ Solution implémentée (19/08/2024)**
**MAINTENANT (SÉCURISÉ) :** Remplacement complet par le `secureLogger` avec pseudonymisation automatique :

```javascript
// ✅ PSEUDONYMIZATION AUTOMATIQUE !
secureLogger.info('JWT vérifié avec succès', null, {
    uidHash: 'a1b2c3d4',                          // UID pseudonymisé
    emailHash: 'e5f6g7h8',                        // Email pseudonymisé
    tokenType: 'access',
    loginTime: 1755611618323
});
```

### **🔧 Modifications techniques**
**Fichier modifié :** `backend/middleware/auth.js`  
**Ajouts :** 31 insertions  
**Suppressions :** 27 suppressions  

**Changements effectués :**
1. **Import du secureLogger** : `const { secureLogger } = require('../utils/secureLogger');`
2. **Remplacement de tous les `console.log`** par des appels sécurisés
3. **Pseudonymisation automatique** des emails et UIDs
4. **Logs structurés** avec `requestId` pour le tracing
5. **Suppression des logs dangereux** exposant des données sensibles

## 🛡️ **Mesures de sécurité générales**

### **Headers de sécurité**
```javascript
// Headers automatiquement ajoutés
X-Powered-By: WealthSense API
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### **Configuration CORS**
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

### **Protection CSRF**
- Vérification de l'origine des requêtes
- Header `X-Requested-With: XMLHttpRequest` requis
- Validation des cookies de session

## 📊 **Endpoints d'administration de sécurité**

### **Statistiques des sessions**
```http
GET /api/admin/sessions/stats
Authorization: Bearer <admin_token>
```

### **Nettoyage forcé**
```http
POST /api/admin/sessions/cleanup
Authorization: Bearer <admin_token>
```

### **Révocation de famille**
```http
POST /api/admin/sessions/revoke-family
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "deviceId": "hash_device_id"
}
```

### **Sessions d'un appareil**
```http
GET /api/admin/sessions/device/:deviceId
Authorization: Bearer <admin_token>
```

### **Sessions d'un utilisateur**
```http
GET /api/admin/sessions/user/:uid
Authorization: Bearer <admin_token>
```

### **Révocation de toutes les sessions d'un utilisateur**
```http
POST /api/admin/sessions/revoke-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "uid": "user_firebase_uid"
}
```

### **Gestion des policies de session**
```http
# Récupérer la policy d'un utilisateur
GET /api/admin/users/:uid/policy
Authorization: Bearer <admin_token>

# Modifier la policy d'un utilisateur
PUT /api/admin/users/:uid/policy
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "policy": "two"  // single, two, ou unlimited
}
```

## 🔧 **Configuration de sécurité**

### **Variables d'environnement**
```bash
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Environnement
NODE_ENV=production  # Active automatiquement les protections de sécurité
BAN_BYPASS_IN_DEV=false  # Optionnel en développement
```

### **Intervalles de nettoyage**
```javascript
// Nettoyage automatique toutes les heures
sessionCleanup.start(60 * 60 * 1000);

// Sessions expirées après 7 jours
const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
```

## 📝 **Logs et monitoring de sécurité**

### **Types de logs**
- `info` : Opérations normales
- `security` : Tentatives de compromission
- `error` : Erreurs système
- `operation` : Actions administratives

### **Données pseudonymisées**
- `uidHash` : Hash de l'ID utilisateur
- `deviceIdHash` : Hash de l'ID appareil
- `jtiHash` : Hash du JTI
- `emailHash` : Hash de l'email

### **Exemple de log de révocation**
```javascript
{
  "timestamp": "2025-08-21T14:17:08.496Z",
  "environment": "development",
  "operation": "session_revoked",
  "uidHash": "a1b2c3d4",
  "oldJtiHash": "e5f6g7h8",
  "newJtiHash": "i9j0k1l2",
  "reason": "replaced",
  "policy": "single"
}
```

## 🚀 **Déploiement sécurisé**

### **1. Mise à jour de la base de données**
- Les nouvelles sessions utiliseront automatiquement le nouveau système
- Les anciens tokens continueront de fonctionner jusqu'à expiration

### **2. Migration des utilisateurs existants**
- Pas de migration nécessaire
- Nouveaux logins utiliseront le système sécurisé
- Anciens tokens expireront naturellement

### **3. Tests de sécurité**
```bash
# Test de rotation des tokens
curl -X POST /api/auth/refresh

# Test de détection de réutilisation
# Utiliser un ancien refresh token

# Test de révocation
curl -X POST /api/admin/sessions/revoke-family
```

## 🔍 **Surveillance continue**

### **Métriques à surveiller**
- Nombre de sessions actives
- Fréquence des rotations
- Tentatives de réutilisation
- Sessions révoquées
- Tentatives de bypass détectées

### **Alertes de sécurité**
- Réutilisation de tokens
- Révocation de familles
- Sessions compromises
- Anomalies de comportement
- Tentatives de bypass en production

## 📋 **Checklist de sécurité**

### **✅ Implémenté et testé**
- [x] **Single-Active-Session** avec révocation atomique
- [x] **Refresh tokens rotatifs** avec détection de réutilisation
- [x] **Rate limiting intelligent** avec express-rate-limit v7.5.1
- [x] **Logging sécurisé** avec pseudonymisation
- [x] **Device labeling** non-PII
- [x] **Policies de session** configurables par rôle
- [x] **Codes d'erreur** normalisés
- [x] **Protection contre le bypass** en production
- [x] **Headers de sécurité** automatiques
- [x] **Configuration CORS** sécurisée
- [x] **Protection CSRF** avec validation d'origine
- [x] **Validation côté serveur** des données d'inscription
- [x] **Prévention Firestore** des valeurs undefined

### **🔮 Prochaines étapes (Phase 2)**
- [ ] **Listener temps réel** côté frontend
- [ ] **Modale de déconnexion forcée** en temps réel
- [ ] **Gestion des erreurs 401 SESSION_REVOKED**
- [ ] **Hard logout automatique**

## 📚 **Références de sécurité**

- [OWASP Session Management](https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Refresh Token Rotation](https://auth0.com/blog/refresh-token-rotation/)
- [OWASP Rate Limiting](https://owasp.org/www-community/controls/Rate_Limiting)

---

**⚠️ IMPORTANT** : Ce système remplace complètement l'ancienne gestion des tokens et améliore significativement la sécurité de l'application. Tous les nouveaux logins utiliseront automatiquement ce système sécurisé.

---

**📅 Dernière mise à jour : 25/08/2025 - Système de sécurité complet et validé avec corrections d'inscription et optimisations**

**✅ Niveau de sécurité actuel :** 🛡️ **CRITIQUE** (Maximum)
**✅ Conformité RGPD :** 100%
**✅ Exposition des données sensibles :** 0%
**✅ Traçabilité :** Maintenue via pseudonymisation
