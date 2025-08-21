# 🧪 **Guide des Tests - Single-Active-Session**

## 📋 **Vue d'ensemble**

Ce dossier contient plusieurs scripts de test pour valider le fonctionnement de la fonctionnalité **Single-Active-Session avec Handoff Explicite** :

1. **`test-single-session.js`** - Test backend (révocation atomique)
2. **`test-frontend-sessions.js`** - Test frontend (simulation comportement)
3. **`test-api-sessions.js`** - Test API (validation endpoints)

## 🚀 **Tests Backend (Recommandé pour commencer)**

### **Script : `test-single-session.js`**

**Objectif :** Valider la logique de révocation atomique côté backend

**Prérequis :**
- Backend démarré
- Firebase configuré
- Variables d'environnement définies

**Exécution :**
```bash
cd backend
node test-single-session.js
```

**Ce qui est testé :**
- ✅ Création de sessions avec device labeling
- ✅ Révocation atomique des sessions existantes
- ✅ Application des policies de session
- ✅ Codes d'erreur normalisés

**Résultat attendu :**
```
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

## 🧪 **Tests Frontend (Simulation comportement)**

### **Script : `test-frontend-sessions.js`**

**Objectif :** Simuler le comportement frontend sans lancer l'application React

**Prérequis :**
- Firebase configuré
- Variables d'environnement définies

**Exécution :**
```bash
cd backend
node test-frontend-sessions.js
```

**Ce qui est testé :**
- ✅ Simulation de l'écoute Firestore temps réel
- ✅ Détection des sessions révoquées
- ✅ Gestion des événements frontend
- ✅ Validation des codes d'erreur

**Résultat attendu :**
```
🚀 Démarrage des tests Frontend Sessions...
📱 Test de la gestion Single-Active-Session côté frontend

🧪 Test 1: Création d'un utilisateur de test...
✅ Utilisateur de test créé: { uid: '...', email: '...', role: 'user' }

🧪 Test 2: Création de la première session...
✅ Première session créée: { jti: '...', deviceLabel: 'Chrome sur Windows', status: 'active' }

🧪 Test 3: Création de la deuxième session (devrait révoquer la première)...
✅ Deuxième session créée: { jti: '...', deviceLabel: 'Safari sur iPhone', status: 'active' }
✅ Première session révoquée automatiquement

🧪 Test 4: Simulation de la détection frontend...
🔍 Configuration de l'écoute Firestore simulée...
📱 État des sessions après révocation:
   Session 1: { status: 'revoked', reason: 'replaced', replacedBy: '...', revokedAt: ... }
   Session 2: { status: 'active', reason: null }
🚨 Session révoquée détectée en temps réel !
📡 Émission de l'événement sessionRevoked...
🔄 Gestion automatique de la déconnexion...
📱 Affichage de la modale Session Révoquée...

🎊 Tous les tests Frontend Sessions sont PASSÉS !
```

## 🔗 **Tests API (Validation endpoints)**

### **Script : `test-api-sessions.js`**

**Objectif :** Tester directement l'API backend via HTTP

**Prérequis :**
- Backend démarré sur `localhost:3006`
- Endpoint `/api/auth/signup` accessible
- Endpoint `/api/auth/login` accessible
- Endpoint `/api/auth/session-info` accessible

**Exécution :**
```bash
cd backend
node test-api-sessions.js
```

**Ce qui est testé :**
- ✅ Création d'utilisateur via API
- ✅ Connexion et création de sessions
- ✅ Révocation automatique des sessions
- ✅ Validation des codes d'erreur 401 SESSION_REVOKED
- ✅ Fonctionnement des endpoints

**Résultat attendu :**
```
🚀 Démarrage des tests API Sessions...
🔗 Test de l'API backend Single-Active-Session

🧪 Test 1: Création d'un utilisateur de test...
✅ Utilisateur de test créé: { uid: '...', email: '...' }

🧪 Test 2: Première connexion (première session)...
✅ Première session créée: { accessToken: '...', user: '...' }

🧪 Test 3: Deuxième connexion (devrait révoquer la première)...
✅ Deuxième session créée: { accessToken: '...', user: '...' }

🧪 Test 4: Vérification que la première session est révoquée...
✅ Première session correctement révoquée !
📋 Détails de la révocation: { code: 'SESSION_REVOKED', reason: 'replaced', ... }

🧪 Test 5: Vérification que la deuxième session fonctionne...
✅ Deuxième session active et fonctionnelle

🎊 Tous les tests API Sessions sont PASSÉS !
```

## 🔧 **Configuration requise**

### **Variables d'environnement :**
```bash
# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com

# API (pour test-api-sessions.js)
API_URL=http://localhost:3006/api
```

### **Dépendances :**
```bash
npm install firebase-admin axios
```

## 📊 **Ordre de test recommandé**

### **1. Tests Backend (Priorité haute)**
```bash
# Valider la logique métier
node test-single-session.js
```

### **2. Tests API (Priorité moyenne)**
```bash
# Valider les endpoints (nécessite backend démarré)
node test-api-sessions.js
```

### **3. Tests Frontend (Priorité basse)**
```bash
# Valider la simulation frontend
node test-frontend-sessions.js
```

## 🐛 **Dépannage**

### **Erreur Firebase :**
```bash
❌ Firebase App named '[DEFAULT]' already exists
# Solution: Vérifier firebase-config.js
```

### **Erreur connexion :**
```bash
❌ Erreur lors de la configuration Firestore
# Solution: Vérifier les variables d'environnement Firebase
```

### **Erreur API :**
```bash
❌ connect ECONNREFUSED 127.0.0.1:3006
# Solution: Démarrer le backend sur le port 3006
```

## 🎯 **Cas d'usage**

### **Développement :**
- Utiliser `test-single-session.js` pour valider les modifications backend
- Utiliser `test-api-sessions.js` pour tester les endpoints

### **CI/CD :**
- Intégrer `test-single-session.js` dans le pipeline de build
- Utiliser `test-api-sessions.js` pour les tests d'intégration

### **Production :**
- Utiliser `test-frontend-sessions.js` pour valider la logique métier
- Monitorer les résultats des tests pour détecter les régressions

## 📚 **Ressources**

- **README Backend** : Documentation complète de la Phase 1
- **SECURITY_SESSIONS.md** : Spécifications de sécurité
- **FRONTEND_PHASE2_README.md** : Documentation de la Phase 2

---

**📅 Dernière mise à jour : 21/08/2025**

**✅ Scripts de test disponibles :**
- Backend : Révocation atomique
- Frontend : Simulation comportement
- API : Validation endpoints

**🔮 Prochaines étapes :**
- Tests automatisés dans CI/CD
- Tests de performance
- Tests de sécurité avancés
