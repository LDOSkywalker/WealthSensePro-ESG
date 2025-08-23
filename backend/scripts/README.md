# 🔐 Scripts d'Administration - WealthSense Pro

## 📋 Script de Création d'Administrateur

### 🚨 **IMPORTANT : SÉCURITÉ**

Ce script est **réservé à l'initialisation du premier administrateur** de l'application. Une fois qu'un admin existe, **ce script ne peut plus être utilisé**.

### 📖 **Utilisation**

```bash
# Depuis le dossier backend/
node scripts/create-admin.js --email=admin@wealthsense.com --role=admin
```

### 🔧 **Paramètres**

- `--email` : **OBLIGATOIRE** - L'adresse email de l'utilisateur à promouvoir admin
- `--role` : **OPTIONNEL** - Le rôle à attribuer (défaut: `admin`)

### 🎯 **Rôles disponibles**

- `admin` : Accès complet à toutes les fonctionnalités
- `support` : Accès limité aux fonctions de support
- `advisor` : Accès aux fonctions de conseil

### ✅ **Prérequis**

L'utilisateur doit **OBLIGATOIREMENT** :
1. ✅ Exister dans Firebase Auth (s'être inscrit via l'application)
2. ✅ Avoir un profil complet dans Firestore
3. ✅ Ne pas avoir déjà le rôle demandé

### 🚀 **Exemples d'utilisation**

```bash
# Créer un administrateur principal
node scripts/create-admin.js --email=admin@wealthsense.com

# Créer un utilisateur support
node scripts/create-admin.js --email=support@wealthsense.com --role=support

# Créer un conseiller
node scripts/create-admin.js --email=conseiller@wealthsense.com --role=advisor
```

### 🛡️ **Sécurité**

- **Vérification automatique** : Le script vérifie qu'aucun admin n'existe déjà
- **Validation des paramètres** : Email et rôle sont validés
- **Logs complets** : Toutes les opérations sont tracées
- **Usage unique** : Impossible de créer plusieurs admins avec ce script

### ⚠️ **ATTENTION : Point de sécurité critique**

**🚨 IMPORTANT :** Le script vérifie uniquement la présence d'administrateurs dans la collection `users` de Firestore. 

**Risque identifié :** Si l'administrateur est supprimé manuellement depuis Firestore, le script pourrait théoriquement être réutilisé.

**Recommandations de sécurité :**
1. **Ne jamais supprimer manuellement** un administrateur depuis Firestore
2. **Utiliser uniquement l'interface admin** pour gérer les rôles après la première création
3. **Conserver les logs** de création pour audit
4. **Surveiller les accès** à la base de données Firestore
5. **En cas de suppression accidentelle**, contacter immédiatement l'équipe technique

**Note technique :** Ce script est conçu pour l'initialisation unique et ne doit pas être considéré comme un outil de maintenance.

### 📝 **Logs et Traçabilité**

Le script utilise le système de logging sécurisé de l'application :
- Toutes les opérations sont loggées avec `secureLogger`
- Les actions sont tracées avec des métadonnées
- Les erreurs sont capturées et loggées

### 🔄 **Après l'utilisation**

1. **Supprimer le script** du serveur de production
2. **Utiliser l'interface admin** pour créer d'autres administrateurs
3. **Conserver les logs** pour audit

### ❌ **Erreurs courantes**

```bash
# Email manquant
❌ Usage: node scripts/create-admin.js --email=admin@example.com --role=admin

# Email invalide
❌ Email invalide !

# Rôle invalide
❌ Rôle invalide : superadmin
❌ Rôles autorisés : admin, support, advisor

# Admin déjà existant
❌ Des administrateurs existent déjà !
⚠️ Nombre d'admins trouvés : 1
- admin@wealthsense.com (Admin User)
⚠️ Utilisez l'interface admin pour créer d'autres administrateurs.
⚠️ Ce script est réservé à l'initialisation du premier admin.

# Utilisateur inexistant
❌ L'utilisateur admin@wealthsense.com n'existe pas dans Firebase Auth
⚠️ L'utilisateur doit d'abord s'inscrire via l'application
```

### 🎯 **Workflow recommandé**

1. **Développement** : Tester le script en local
2. **Production** : Exécuter une seule fois pour créer le premier admin
3. **Maintenance** : Supprimer le script et utiliser l'interface admin
4. **Audit** : Conserver les logs pour traçabilité
