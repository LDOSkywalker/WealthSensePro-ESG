# 🔐 Système de Gestion des Sessions Sécurisées

## Vue d'ensemble

Ce document décrit l'implémentation du système de gestion des sessions sécurisées avec **refresh tokens rotatifs** et **détection de réutilisation**, conformément aux recommandations de sécurité du CTO.

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
  email: "string",         // Email de l'utilisateur
  status: "active" | "rotated" | "revoked" | "logged_out",
  createdAt: timestamp,    // Date de création
  lastUsed: timestamp,     // Dernière utilisation
  tokenFamily: "string",   // Famille de tokens (deviceId)
  rotatedFrom: "string",  // JTI du token précédent (si rotation)
  revokedAt: timestamp,   // Date de révocation (si révoqué)
  reason: "string"        // Raison de la révocation
}
```

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
