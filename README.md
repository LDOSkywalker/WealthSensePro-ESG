# WealthSense Pro TheTurfu2

WealthSense Pro est une solution professionnelle de gestion de patrimoine destinée aux entreprises et aux professionnels de la finance. Cette plateforme B2B utilise l'intelligence artificielle pour fournir des conseils financiers avancés et des outils de gestion de patrimoine adaptés aux besoins des professionnels.

## Fonctionnalités

- Interface professionnelle et personnalisable
- Authentification multi-niveaux avec Firebase
- Gestion avancée des profils utilisateurs et des rôles
- Tableau de bord analytique pour les professionnels
- Système de reporting intégré
- Conversations IA pour des conseils financiers personnalisés
- API REST pour l'intégration avec d'autres systèmes

## Technologies utilisées

- React.js
- TypeScript
- Firebase (Authentication & Firestore)
- Tailwind CSS
- Node.js
- Express.js

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
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_BACKEND_URL=http://localhost:3006
```

4. Démarrez le serveur de développement :
```bash
npm run dev
```

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
