# 🔐 Système de Gestion des Sessions Sécurisées

## Vue d'ensemble

Ce document décrit l'implémentation du système de gestion des sessions sécurisées avec **refresh tokens rotatifs**, **détection de réutilisation**, et **Single-Active-Session avec Handoff Explicite**, conformément aux recommandations de sécurité du CTO.

## 🚀 **NOUVEAU : Single-Active-Session avec Handoff Explicite - Phase 1 ✅**

### 🎯 **Fonctionnalité implémentée**

La **Phase 1** de la fonctionnalité Single-Active-Session a été implémentée avec succès. Cette fonctionnalité garantit qu'un seul utilisateur peut être connecté simultanément par défaut, avec une révocation atomique des sessions existantes lors de nouvelles connexions.

#### **Policies de session configurables :**
- **`single`** (défaut) : Une seule session active par compte
- **`two`** : Deux sessions simultanées autorisées (pour les advisors)
- **`unlimited`** : Sessions illimitées (pour les admins/support)

#### **Révocation atomique :**
- **Transaction Firestore** : Création de la nouvelle session ET révocation des autres en une seule opération atomique
- **Aucune fenêtre d'accès résiduel** : Sécurité maximale garantie
- **Gestion des courses** : Évite les conflits entre connexions simultanées

### 📱 **Device Labeling intelligent**

#### **Labels non-PII générés automatiquement :**
- **Navigateurs** : Chrome, Firefox, Safari, Edge
- **Systèmes d'exploitation** : Windows, Mac, iPhone, Android
- **Fallback** : "Appareil" pour les cas non reconnus

#### **Exemple de détection :**
```javascript
// User-Agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
// → Device Label: "Windows"

// User-Agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
// → Device Label: "iPhone"
```

### 🛡️ **Codes d'erreur normalisés**

#### **Réponses API standardisées :**
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

### 🔧 **Implémentation technique**

#### **1. SessionManager étendu (`backend/utils/sessionManager.js`)**

**Nouvelles méthodes :**
- `generateDeviceLabel(req)` : Génération de labels d'appareil non-PII
- `getSessionPolicy(uid, userRole)` : Récupération des policies par utilisateur
- `createSession()` : Révocation atomique intégrée

**Schéma de session étendu :**
```javascript
{
  uid: "user_id",
  deviceId: "hash_device",
  deviceLabel: "Chrome",           // NOUVEAU
  email: "user@example.com",
  status: "active|revoked|rotated",
  reason: "replaced|reuse|logout|expired|null",  // NOUVEAU
  replacedBy: "jti_hash|null",    // NOUVEAU
  createdAt: 1755785828553,
  revokedAt: 1755785828553|null,  // NOUVEAU
  lastUsed: 1755785828553,
  tokenFamily: "device_hash"
}
```

#### **2. Middleware d'authentification sécurisé (`backend/middleware/auth.js`)**

**Gestion des codes d'erreur :**
- Détection automatique des sessions révoquées
- Réponses normalisées avec codes d'erreur
- Logs sécurisés et pseudonymisés

#### **3. Routes d'authentification étendues (`backend/routes/auth.js`)**

**Nouveaux endpoints :**
- `GET /api/auth/session-info` : Informations de session pour le frontend
- Intégration des policies par rôle dans le processus de login

#### **4. Routes d'administration (`backend/routes/admin.js`)**

**Gestion des policies :**
- `PUT /api/admin/users/:uid/policy` : Changer la policy d'un utilisateur
- `GET /api/admin/users/:uid/policy` : Récupérer la policy actuelle
- `POST /api/admin/sessions/revoke-user` : Révoquer toutes les sessions d'un utilisateur

### 🧪 **Tests et validation**

#### **Script de test complet (`backend/test-single-session.js`)**

**Scénarios testés :**
1. **Révocation atomique** : Création de session 2 → Révoque automatiquement session 1
2. **Policy "two"** : Advisor peut avoir 2 sessions simultanées
3. **Device labeling** : Détection automatique des navigateurs et OS
4. **Codes d'erreur** : Validation des réponses SESSION_REVOKED

#### **Exemple de test réussi :**
```bash
🧪 Test de la révocation atomique des sessions...

📱 Test 1: Création de la première session...
✅ Session 1 créée: { jti: '...', deviceId: '...', deviceLabel: 'Windows' }

📱 Test 2: Création de la deuxième session (devrait révoquer la première)...
✅ Session 2 créée: { jti: '...', deviceId: '...', deviceLabel: 'Mac' }

🔍 Test 3: Vérification de la révocation de la session 1...
Session 1 status: {
  valid: false,
  code: 'SESSION_REVOKED',
  reason: 'replaced',
  replacedBy: '...',
  revokedAt: 1755785828553
}

🎉 Tests terminés avec succès !
```

### 🔒 **Sécurité et conformité**

#### **Règles Firestore mises à jour :**
```javascript
// Règles pour la collection sessions
match /sessions/{sessionId} {
  // Lecture strictement limitée à l'utilisateur courant
  allow read: if request.auth != null
              && resource.data.uid == request.auth.uid;
  
  // Écriture réservée au backend uniquement
  allow write: if false;
}
```

#### **Avantages de sécurité :**
- ✅ **Aucune fenêtre d'accès résiduel** : Sessions révoquées immédiatement
- ✅ **Révocation atomique** : Pas de courses entre connexions
- ✅ **Device labeling non-PII** : Aucune information personnelle exposée
- ✅ **Policies configurables** : Flexibilité selon les rôles utilisateur
- ✅ **Codes d'erreur normalisés** : Gestion cohérente côté frontend

### 🚀 **Utilisation et configuration**

#### **1. Configuration des policies par défaut :**
```javascript
// Dans sessionManager.js
const defaultPolicies = {
  'admin': 'unlimited',
  'support': 'unlimited', 
  'advisor': 'two',
  'user': 'single'
};
```

#### **2. Configuration personnalisée par utilisateur :**
```bash
# Via l'API admin
PUT /api/admin/users/{uid}/policy
{
  "policy": "two"  // single, two, ou unlimited
}
```

#### **3. Monitoring et observabilité :**
```javascript
// Logs automatiques de révocation
secureLogger.info('Révocation atomique effectuée', null, {
  uidHash: 'a1b2c3d4',
  newJtiHash: 'e5f6g7h8',
  revokedCount: 1,
  policy: 'single'
});
```

### 📊 **Métriques et monitoring**

#### **Événements tracés :**
- **Sessions créées** : Avec device label et policy appliquée
- **Sessions révoquées** : Raison, timestamp, et session remplaçante
- **Policies appliquées** : Suivi des changements de configuration
- **Erreurs de sécurité** : Tentatives d'accès avec sessions révoquées

#### **Logs structurés :**
```javascript
// Exemple de log de révocation
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

### 🔮 **Évolutions futures (Phase 2)**

#### **Frontend - Listener Temps Réel :**
- **Listener Firestore** sur la session active
- **Modale de déconnexion forcée** en temps réel
- **Gestion des erreurs 401 SESSION_REVOKED**
- **Hard logout automatique**

#### **UX et notifications :**
- **Modale explicative** : "Vous avez été déconnecté depuis un autre appareil"
- **Options utilisateur** : Se reconnecter ou signaler une activité suspecte
- **Device hints** : Affichage des informations d'appareil (non-PII)

### 📋 **Checklist de déploiement**

- [x] **Backend** : Révocation atomique implémentée et testée
- [x] **Règles Firestore** : Mises à jour et déployées
- [x] **Tests** : Script de validation complet et fonctionnel
- [x] **Documentation** : README mis à jour avec la nouvelle fonctionnalité
- [ ] **Frontend** : Listener temps réel et modale de déconnexion
- [ ] **Production** : Déploiement et activation de la fonctionnalité

---

## 🚨 Problème de sécurité résolu

## 🚨 Problème de sécurité résolu

### ❌ **Ancien système (VULNÉRABLE)**
- Refresh tokens statiques pendant 7 jours
- Pas de rotation des tokens
- Pas de détection de réutilisation
- Impossible de révoquer un token volé

### ✅ **Nouveau système (SÉCURISÉ)**
- Refresh tokens rotatifs à chaque utilisation
- Détection automatique de réutilisation
- Révocation de famille en cas de compromission
- Gestion des sessions en base de données

## 🏗️ Architecture

### Composants principaux

1. **`SessionManager`** (`utils/sessionManager.js`)
   - Gestion des sessions avec rotation
   - Détection de réutilisation
   - Révocation de famille

2. **`SessionCleanup`** (`utils/sessionCleanup.js`)
   - Nettoyage automatique des sessions expirées
   - Statistiques des sessions

3. **Routes d'administration** (`routes/admin.js`)
   - Surveillance des sessions
   - Gestion de la sécurité

### Structure de la base de données

#### Collection `sessions`
```javascript
{
  uid: "string",           // ID utilisateur Firebase
  deviceId: "string",      // Hash de l'appareil (IP + User-Agent)
  deviceLabel: "string",   // Label d'appareil non-PII (ex: "Chrome", "Windows")
  email: "string",         // Email de l'utilisateur
  status: "active" | "rotated" | "revoked" | "logged_out",
  reason: "replaced" | "reuse" | "logout" | "expired" | "admin_revocation" | null,
  replacedBy: "string",    // JTI de la session remplaçante (si reason = "replaced")
  createdAt: timestamp,    // Date de création
  lastUsed: timestamp,     // Dernière utilisation
  revokedAt: timestamp,    // Date de révocation (si révoqué)
  tokenFamily: "string",   // Famille de tokens (deviceId)
  rotatedFrom: "string"    // JTI du token précédent (si rotation)
}
```

**Nouveaux champs ajoutés dans la Phase 1 :**
- **`deviceLabel`** : Label d'appareil non-PII pour l'UX
- **`reason`** : Raison détaillée de la révocation
- **`replacedBy`** : Traçabilité de la session remplaçante

## 🔄 Flux de fonctionnement

### 1. **Connexion (Login)**
```javascript
// Création d'une nouvelle session
const session = await sessionManager.createSession(uid, email, req);
// - Génère un JTI unique
// - Crée un deviceId basé sur IP + User-Agent
// - Stocke la session en base
// - Retourne access + refresh tokens
```

### 2. **Rafraîchissement (Refresh)**
```javascript
// Rotation du refresh token
const session = await sessionManager.refreshSession(prevRefreshToken, req);
// - Vérifie la validité de l'ancien token
// - Marque l'ancien comme "rotated"
// - Crée un nouveau refresh token
// - Met à jour la base de données
```

### 3. **Détection de réutilisation**
```javascript
// Si un ancien token est réutilisé
if (sessionData.status !== 'active') {
  // Révocation de toute la famille
  await sessionManager.revokeFamily(deviceId);
  throw new Error('Session révoquée');
}
```

### 4. **Déconnexion (Logout)**
```javascript
// Révocation de la session
await sessionManager.logoutUser(uid, deviceId);
// - Marque la session comme "logged_out"
// - Nettoie les cookies
```

## 🛡️ Mesures de sécurité

### **Protection contre le vol de tokens**
- **Rotation automatique** : Chaque refresh génère un nouveau token
- **JTI unique** : Chaque token a un identifiant unique
- **Device binding** : Tokens liés à un appareil spécifique

### **Détection de compromission**
- **Vérification de statut** : Contrôle du statut en base
- **Détection de réutilisation** : Alerte si ancien token utilisé
- **Révocation automatique** : Suppression de toute la famille compromise

### **Gestion des sessions**
- **Statuts multiples** : active, rotated, revoked, logged_out
- **Traçabilité** : Historique complet des actions
- **Nettoyage automatique** : Suppression des sessions expirées

## 📊 Endpoints d'administration

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

### **Gestion des policies de session (NOUVEAU - Phase 1)**
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

# Récupérer les informations de session d'un utilisateur
GET /api/auth/session-info
Authorization: Bearer <user_token>
```

## 🔧 Configuration

### Variables d'environnement
```bash
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h
```

### Intervalles de nettoyage
```javascript
// Nettoyage automatique toutes les heures
sessionCleanup.start(60 * 60 * 1000);

// Sessions expirées après 7 jours
const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
```

## 📝 Logs et monitoring

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

## 🚀 Déploiement

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

## 🔍 Surveillance continue

### **Métriques à surveiller**
- Nombre de sessions actives
- Fréquence des rotations
- Tentatives de réutilisation
- Sessions révoquées

### **Alertes de sécurité**
- Réutilisation de tokens
- Révocation de familles
- Sessions compromises
- Anomalies de comportement

## 📚 Références

- [OWASP Session Management](https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Refresh Token Rotation](https://auth0.com/blog/refresh-token-rotation/)

---

**⚠️ IMPORTANT** : Ce système remplace complètement l'ancienne gestion des tokens et améliore significativement la sécurité de l'application. Tous les nouveaux logins utiliseront automatiquement ce système sécurisé.

---

**📅 Dernière mise à jour : 21/08/2025 - Phase 1 Single-Active-Session implémentée avec succès**

**✅ Fonctionnalités Phase 1 terminées :**
- Révocation atomique des sessions
- Device labeling intelligent
- Policies configurables par rôle
- Codes d'erreur normalisés
- Tests complets et validés
- Documentation mise à jour

**🔮 Prochaines étapes (Phase 2) :**
- Listener temps réel côté frontend
- Modale de déconnexion forcée
- Gestion des erreurs 401 SESSION_REVOKED
