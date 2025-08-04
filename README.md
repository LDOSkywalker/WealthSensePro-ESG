# WealthSense ESG:

WealthSense ESG est une solution de gestion de patrimoine dédiée aux utilisateurs finaux (particuliers), axée sur la thématique ESG (Environnement, Social, Gouvernance). Cette plateforme utilise l'intelligence artificielle pour fournir des conseils financiers personnalisés et des outils adaptés à la prise en compte des critères ESG dans la gestion de patrimoine.

## Fonctionnalités 

- Interface intuitive et personnalisable pour particuliers
- Prise en compte des critères ESG dans l'analyse patrimoniale
- Authentification sécurisée avec Firebase
- Gestion des profils utilisateurs
- Tableau de bord analytique pour le suivi ESG
- Système de reporting ESG intégré
- Conversations IA pour des conseils financiers personnalisés
- API REST pour l'intégration avec d'autres systèmes

## Technologies utilisées

- React.js
- TypeScript
- Firebase (Authentication & Firestore)
- Tailwind CSS
- Node.js
- Express.js

## Architecture d'authentification hybride

### Problème initial
L'application rencontrait des problèmes d'authentification sur iOS Safari et en navigation privée, avec des erreurs 401 Unauthorized malgré une connexion réussie. Le problème venait des restrictions strictes de Safari sur les cookies cross-origin.

### Solution : Flux hybride sécurisé

#### 1. **Authentification côté backend**
- **Vérification email + mot de passe** avec Firebase Auth REST API
- **Génération de deux tokens JWT** :
  - **Access Token** (15 minutes) : envoyé en JSON response
  - **Refresh Token** (7 jours) : stocké en cookie HttpOnly

#### 2. **Stockage sécurisé**
```javascript
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
```javascript
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
```javascript
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

### Endpoints d'authentification

- `POST /api/auth/login` : Connexion avec vérification email + mot de passe
- `POST /api/auth/refresh` : Renouvellement automatique du access token
- `POST /api/auth/logout` : Déconnexion et suppression du refresh token
- `GET /api/auth/profile` : Récupération du profil utilisateur

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet et ajoutez vos variables d'environnement :

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

**Backend (variables d'environnement Render) :**
```env
JWT_SECRET=votre_jwt_secret_super_securise
FIREBASE_WEB_API_KEY=votre_firebase_web_api_key
FIREBASE_PROJECT_ID=votre_project_id
FRONTEND_URL=https://votre-domaine.com
```

4. Démarrez le serveur de développement :
```bash
npm run dev
```

## Déploiement

### Frontend (Netlify)
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Variables d'environnement** : Configurées dans l'interface Netlify

### Backend (Render)
- **Build command** : `cd backend && npm install`
- **Start command** : `cd backend && npm start`
- **Variables d'environnement** : Configurées dans l'interface Render
- **Health check** : `GET /api/health`

## Structure du projet

```
/
├── src/
│   ├── components/     # Composants React
│   ├── contexts/      # Contextes React (Auth, etc.)
│   ├── firebase/      # Configuration Firebase
│   └── styles/        # Styles CSS
├── backend/           # Serveur Express.js
└── public/           # Fichiers statiques
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

[MIT](https://choosealicense.com/licenses/mit/) Test Netlify preview
