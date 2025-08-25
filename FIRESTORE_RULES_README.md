# 🔐 Règles Firestore - WealthSense Pro ESG

## 📋 Vue d'ensemble

Ce document décrit les règles de sécurité Firestore implémentées pour WealthSense Pro ESG, incluant les permissions administrateur et la gestion des rôles utilisateur.

## 🏗️ Architecture des règles

### **Fonctions de sécurité principales**

#### `isAuthenticated()`
- ✅ Vérifie que l'utilisateur est connecté
- 🔒 Base de toutes les règles de sécurité

#### `isOwner(userId)`
- ✅ Vérifie que l'utilisateur est le propriétaire de la ressource
- 🔒 Accès limité aux propres données

#### `isAdmin()`
- ✅ Vérifie que l'utilisateur a le rôle `admin`
- 🔒 Accès complet à toutes les collections
- 📊 Permissions de lecture/écriture étendues

#### `hasRole(role)`
- ✅ Vérifie un rôle spécifique (admin, support, advisor, user)
- 🔒 Permissions granulaires selon le rôle

#### `isAdminOrSupport()`
- ✅ Vérifie les rôles admin ou support
- 🔒 Accès intermédiaire pour l'équipe support

## 📚 Collections et permissions

### **Collection `users`**

| Action | Propriétaire | Admin | Autres |
|--------|--------------|-------|---------|
| **Création** | ✅ (propre profil) | ✅ (tous) | ❌ |
| **Lecture** | ✅ (propre profil) | ✅ (tous) | ❌ |
| **Mise à jour** | ✅ (limité) | ✅ (étendu) | ❌ |
| **Suppression** | ❌ | ❌ | ❌ |

**Permissions propriétaire :**
- `firstName`, `lastName`, `updatedAt`

**Permissions admin :**
- `firstName`, `lastName`, `role`, `isActive`, `updatedAt`, `adminCreatedAt`, `adminCreatedBy`

### **Collection `conversations`**

| Action | Propriétaire | Admin | Autres |
|--------|--------------|-------|---------|
| **Création** | ✅ (propre conv) | ✅ (toutes) | ❌ |
| **Lecture** | ✅ (propre conv) | ✅ (toutes) | ❌ |
| **Mise à jour** | ✅ (propre conv) | ✅ (toutes) | ❌ |
| **Suppression** | ✅ (propre conv) | ✅ (toutes) | ❌ |

### **Collection `messages`**

| Action | Propriétaire | Admin | Autres |
|--------|--------------|-------|---------|
| **Création** | ✅ (propre conv) | ❌ | ❌ |
| **Lecture** | ✅ (propre conv) | ✅ (toutes) | ❌ |
| **Suppression** | ✅ (propre conv) | ✅ (toutes) | ❌ |

### **Collection `sessions`**

| Action | Propriétaire | Admin | Autres |
|--------|--------------|-------|---------|
| **Lecture** | ✅ (propre session) | ✅ (toutes) | ❌ |
| **Écriture** | ❌ | ❌ | ❌ |

**Note :** L'écriture est réservée au backend uniquement pour la sécurité.

### **Collection `admin_logs`**

| Action | Admin | Support | User |
|--------|-------|---------|------|
| **Lecture** | ✅ | ❌ | ❌ |
| **Écriture** | ✅ | ❌ | ❌ |

**Usage :** Traçabilité des actions administratives

### **Collection `system`**

| Action | Admin | Support | User |
|--------|-------|---------|------|
| **Lecture** | ✅ | ❌ | ❌ |
| **Écriture** | ✅ | ❌ | ❌ |

**Usage :** Configurations système et métadonnées

## 🛡️ Sécurité implémentée

### **Protection des données sensibles**
- ❌ **Suppression** : Interdite pour tous les utilisateurs
- 🔒 **Sessions** : Écriture réservée au backend
- 📊 **Logs admin** : Accès restreint aux administrateurs

### **Validation des données**
- ✅ **Structure** : Vérification des champs obligatoires
- ✅ **Types** : Validation des types de données
- ✅ **Modifications** : Contrôle des champs modifiables

### **Gestion des rôles**
- 🔐 **Hiérarchie** : Admin > Support > Advisor > User
- 📝 **Traçabilité** : Logs de toutes les actions admin
- 🔄 **Flexibilité** : Permissions granulaires par rôle

## 🚀 Utilisation des règles

### **Pour les développeurs**

```javascript
// Vérifier le rôle admin
const userDoc = await db.collection('users').doc(uid).get();
const isAdmin = userDoc.data().role === 'admin';

// Accès conditionnel selon le rôle
if (isAdmin) {
  // Accès complet aux données
  const allUsers = await db.collection('users').get();
} else {
  // Accès limité aux propres données
  const ownData = await db.collection('users').doc(uid).get();
}
```

### **Pour les administrateurs**

```javascript
// Gestion des utilisateurs
const users = await db.collection('users').get();

// Modification des rôles
await db.collection('users').doc(uid).update({
  role: 'support',
  updatedAt: Date.now(),
  adminModifiedBy: currentAdmin.uid
});

// Log de l'action
await db.collection('admin_logs').add({
  action: 'role_modified',
  adminUid: currentAdmin.uid,
  targetUid: uid,
  oldRole: 'user',
  newRole: 'support',
  timestamp: Date.now()
});
```

## ⚠️ Points d'attention

### **Sécurité critique**
1. **Ne jamais supprimer** un administrateur depuis Firestore
2. **Utiliser l'interface admin** pour la gestion des rôles
3. **Conserver les logs** pour audit et traçabilité
4. **Surveiller les accès** aux collections sensibles

### **Performance**
- Les règles `isAdmin()` effectuent une requête Firestore
- Optimiser les requêtes pour éviter les appels multiples
- Utiliser les index appropriés pour les requêtes

## 🔄 Mise à jour des règles

### **Déploiement**
```bash
# Déployer les nouvelles règles
firebase deploy --only firestore:rules

# Vérifier la syntaxe
firebase firestore:rules:check
```

### **Test des règles**
```bash
# Tester les règles localement
firebase emulators:start --only firestore

# Tests automatisés
npm run test:firestore-rules
```

## 📚 Ressources

- [Documentation Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Guide des règles de sécurité](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Bonnes pratiques](https://firebase.google.com/docs/firestore/security/rules-best-practices)

---

**📅 Dernière mise à jour : 23/08/2025 - Règles admin implémentées**
