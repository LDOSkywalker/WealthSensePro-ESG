const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { passwordResetLimiter, loginLimiter, signupLimiter } = require('../middleware/rateLimit');

// Vérification de la présence du JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('⚠️ JWT_SECRET n\'est pas défini dans les variables d\'environnement');
    process.exit(1);
}

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Configuration des origines autorisées
const allowedOrigins = [
    'http://localhost:5173', // Dev local
    'https://develop--wealthsense-esg.netlify.app', // 
    'https://wealthsense-esg.netlify.app', // Preprod
    'https://wealthsense-impact.com', // Prod
    process.env.FRONTEND_URL // URL configurée dans Render
].filter(Boolean); // Supprime les valeurs undefined

// Endpoint de login
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 === DÉBUT LOGIN ===');
        console.log('🔐 Email:', email);
        console.log('🔐 Password fourni:', password ? 'OUI' : 'NON');

        // 🔐 ÉTAPE 1 : Vérification des credentials avec Firebase Auth REST API
        console.log('🔐 Vérification des credentials avec Firebase Auth REST API...');
        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    returnSecureToken: false 
                })
            }
        );

        const authData = await authResponse.json();
        
        if (!authResponse.ok) {
            console.error('❌ Erreur Firebase Auth:', authData);
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
                code: 'auth/invalid-credential'
            });
        }

        console.log('✅ Credentials vérifiés avec succès');

        // 🔐 ÉTAPE 2 : Récupération des infos utilisateur avec Firebase Admin
        console.log('🔐 Récupération des infos utilisateur...');
        const userCredential = await admin.auth().getUserByEmail(email);
        
        console.log('✅ Utilisateur trouvé:', userCredential.uid);

        // 🔐 ÉTAPE 3 : Génération des tokens JWT (flux hybride préservé)
        console.log('🔐 Génération des tokens JWT...');
        const accessToken = jwt.sign(
            { 
                uid: userCredential.uid, 
                email: userCredential.email,
                type: 'access',
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '15m' } // Access token court
        );

        const refreshToken = jwt.sign(
            { 
                uid: userCredential.uid, 
                email: userCredential.email,
                type: 'refresh',
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Refresh token long
        );

        console.log('🔐 === LOGIN RÉUSSI ===');
        console.log('🔐 UID:', userCredential.uid);
        console.log('🔐 Email:', userCredential.email);
        console.log('🔐 Access Token généré:', accessToken.substring(0, 20) + '...');
        console.log('🔐 Refresh Token généré:', refreshToken.substring(0, 20) + '...');
        
        // 🔐 ÉTAPE 4 : Stockage sécurisé (flux hybride préservé)
        // Nettoyer les anciens cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        console.log('🔐 Anciens cookies nettoyés');
        
        // Cookie refresh_token uniquement (HttpOnly + Secure + SameSite=None)
        res.cookie('__Host-refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });
        console.log('🔐 Cookie refresh_token défini (HttpOnly + Secure + SameSite=None)');

        // 🔐 ÉTAPE 5 : Réponse (flux hybride préservé)
        res.json({
            success: true,
            access_token: accessToken,
            user: {
                uid: userCredential.uid,
                email: userCredential.email
            }
        });
    } catch (error) {
        console.error('❌ Erreur de login:', error);
        
        // Gestion des erreurs Firebase
        if (error.code === 'auth/user-not-found') {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
                code: 'auth/invalid-credential'
            });
        }
        
        if (error.code === 'auth/invalid-credential') {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
                code: 'auth/invalid-credential'
            });
        }

        // Erreur par défaut
        res.status(401).json({
            success: false,
            error: 'Identifiants invalides',
            code: 'auth/invalid-credential'
        });
    }
});

// Endpoint de refresh token
router.post('/refresh', async (req, res) => {
    try {
        // Vérification CSRF
        const origin = req.headers.origin;
        const referer = req.headers.referer;
        const requestedWith = req.headers['x-requested-with'];
        
        // Vérifier l'origine
        if (!origin || !allowedOrigins.includes(origin)) {
            return res.status(403).json({
                success: false,
                error: 'Origin non autorisé'
            });
        }
        
        // Vérifier le header personnalisé
        if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
            return res.status(403).json({
                success: false,
                error: 'Header X-Requested-With requis'
            });
        }

        const refreshToken = req.cookies['__Host-refresh_token'];
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token manquant'
            });
        }

        // Vérifier le refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: 'Refresh token invalide'
            });
        }

        // Vérifier que l'utilisateur existe toujours
        const user = await admin.auth().getUser(decoded.uid);

        // Générer un nouveau access token
        const newAccessToken = jwt.sign(
            { 
                uid: user.uid, 
                email: user.email,
                type: 'access',
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        console.log('🔄 Access token rafraîchi pour:', user.email);

        res.json({
            success: true,
            access_token: newAccessToken,
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // Expiration en timestamp
        });
    } catch (error) {
        console.error('❌ Erreur refresh token:', error);
        res.status(401).json({
            success: false,
            error: 'Refresh token invalide'
        });
    }
});

// Endpoint de logout
router.post('/logout', (req, res) => {
    // Vérification CSRF
    const origin = req.headers.origin;
    const requestedWith = req.headers['x-requested-with'];
    
    // Vérifier l'origine
    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            success: false,
            error: 'Origin non autorisé'
        });
    }
    
    // Vérifier le header personnalisé
    if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
        return res.status(403).json({
            success: false,
            error: 'Header X-Requested-With requis'
        });
    }

    // Invalider le refresh token en supprimant le cookie
    res.clearCookie('__Host-refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 0
    });
    
    res.json({ success: true });
});

// Endpoint d'inscription
router.post('/signup', signupLimiter, async (req, res) => {
    try {
        const { email, password, firstName, lastName, referralSource, otherReferralSource, disclaimerAccepted, disclaimerAcceptedAt } = req.body;

        // Création de l'utilisateur dans Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
        });

        // Préparation des données utilisateur sans professionalActivity
        const userData = {
            uid: userRecord.uid,
            email,
            firstName,
            lastName,
            referralSource,
            otherReferralSource: referralSource === 'other' ? otherReferralSource : null,
            disclaimerAccepted: !!disclaimerAccepted,
            disclaimerAcceptedAt: disclaimerAcceptedAt || Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            role: 'user',
            isActive: true
        };

        // Enregistrement des infos dans Firestore
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set(userData);

        // Génération des tokens
        const accessToken = jwt.sign(
            { 
                uid: userRecord.uid, 
                email: userRecord.email,
                type: 'access',
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '15m' } // Access token court
        );

        const refreshToken = jwt.sign(
            { 
                uid: userRecord.uid, 
                email: userRecord.email,
                type: 'refresh',
                loginTime: Date.now()
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Refresh token long
        );

        // Nettoyer l'ancien cookie
        res.clearCookie('__Host-refresh_token');
        
        // Cookie refresh_token uniquement (HttpOnly + Secure + SameSite=None)
        res.cookie('__Host-refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });
        res.json({
            success: true,
            access_token: accessToken,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                firstName,
                lastName
            }
        });
    } catch (error) {
        console.error('Erreur signup:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Endpoint de modification du profil (nom, prénom)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const uid = req.user.uid;
        // Mise à jour dans Firebase Auth
        await admin.auth().updateUser(uid, {
            displayName: `${firstName} ${lastName}`
        });
        // Mise à jour dans Firestore
        const db = admin.firestore();
        await db.collection('users').doc(uid).update({
            firstName,
            lastName,
            updatedAt: Date.now()
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur update profile:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Endpoint de modification du mot de passe
router.put('/password', authMiddleware, async (req, res) => {
    try {
        console.log('🔐 === DÉBUT CHANGEMENT MOT DE PASSE ===');
        console.log('🔐 Headers:', req.headers);
        console.log('🔐 Content-Type:', req.get('Content-Type'));
        console.log('🔐 Body complet:', JSON.stringify(req.body, null, 2));
        console.log('🔐 currentPassword:', req.body?.currentPassword);
        console.log('🔐 newPassword:', req.body?.newPassword);
        
        const { currentPassword, newPassword } = req.body;
        const uid = req.user.uid;
        const email = req.user.email;

        console.log('🔐 UID:', uid);
        console.log('🔐 Email:', email);
        console.log('🔐 Vérification du mot de passe actuel...');

        // 🔐 ÉTAPE 1 : Vérification du mot de passe actuel
        if (!currentPassword) {
            console.error('❌ Mot de passe actuel manquant dans req.body');
            console.error('❌ req.body:', req.body);
            return res.status(400).json({ 
                success: false, 
                error: 'Le mot de passe actuel est requis',
                code: 'CURRENT_PASSWORD_REQUIRED'
            });
        }

        // Vérification avec Firebase Auth REST API
        const verifyResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password: currentPassword, 
                    returnSecureToken: false 
                })
            }
        );

        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
            console.error('❌ Mot de passe actuel incorrect:', verifyData.error?.message);
            return res.status(401).json({
                success: false,
                error: 'Le mot de passe actuel est incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        console.log('✅ Mot de passe actuel vérifié avec succès');

        // 🔐 ÉTAPE 2 : Validation du nouveau mot de passe
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
                code: 'INVALID_NEW_PASSWORD'
            });
        }

        // 🔐 ÉTAPE 3 : Mise à jour du mot de passe
        console.log('🔐 Mise à jour du mot de passe...');
        await admin.auth().updateUser(uid, { password: newPassword });
        
        console.log('✅ Mot de passe mis à jour avec succès');
        
        res.json({ 
            success: true, 
            message: 'Mot de passe modifié avec succès',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erreur lors du changement de mot de passe:', error);
        
        // Gestion des erreurs spécifiques Firebase
        if (error.code === 'auth/weak-password') {
            return res.status(400).json({
                success: false,
                error: 'Le nouveau mot de passe est trop faible',
                code: 'WEAK_PASSWORD'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la modification du mot de passe',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Endpoint pour récupérer le profil utilisateur
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(userDoc.data());
    } catch (error) {
        console.error('Erreur récupération profil:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Endpoint de réinitialisation du mot de passe (mot de passe oublié)
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email requis.' });
        }

        console.log('🔄 === DÉBUT RÉINITIALISATION MOT DE PASSE ===');
        console.log('🔄 Email:', email);

        // 🔄 Utiliser Firebase Auth REST API (envoi automatique)
        console.log('🔄 Utilisation de Firebase Auth REST API pour l\'envoi automatique...');
        try {
            const resetResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_WEB_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestType: 'PASSWORD_RESET',
                        email: email
                    })
                }
            );

            const resetData = await resetResponse.json();
            
            if (!resetResponse.ok) {
                console.error('❌ Erreur Firebase Auth REST API:', resetData);
                throw new Error(resetData.error?.message || 'Erreur lors de l\'envoi de l\'email');
            }

            console.log('✅ Email de réinitialisation envoyé via Firebase Auth REST API');
            console.log('✅ Réponse Firebase:', resetData);
            
            return res.json({ 
                success: true, 
                message: 'Email de réinitialisation envoyé avec succès.',
                firebaseResponse: resetData,
                method: 'firebase_rest_api'
            });

        } catch (restApiError) {
            console.error('❌ Erreur avec Firebase Auth REST API:', restApiError);
            console.log('🔄 Tentative avec Firebase Admin SDK...');
            
            // 🔄 Fallback avec Firebase Admin SDK
            try {
                // Vérifier que l'utilisateur existe
                const userRecord = await admin.auth().getUserByEmail(email);
                console.log('✅ Utilisateur trouvé:', userRecord.uid);

                // Générer le lien de réinitialisation
                const resetLink = await admin.auth().generatePasswordResetLink(email, {
                    url: process.env.FRONTEND_URL + '/reset-password',
                    handleCodeInApp: false
                });
                console.log('✅ Lien généré:', resetLink.substring(0, 100) + '...');

                // TODO: Intégrer votre service d'envoi d'email ici
                console.log('⚠️ ATTENTION: Lien généré mais email non envoyé automatiquement');
                console.log('⚠️ Vous devez implémenter l\'envoi d\'email manuellement');
                
                return res.json({ 
                    success: true, 
                    message: 'Lien de réinitialisation généré. Email à envoyer manuellement.',
                    resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
                    note: 'Email non envoyé automatiquement - implémentation requise',
                    method: 'firebase_admin_sdk'
                });

            } catch (adminError) {
                console.error('❌ Erreur avec Firebase Admin SDK:', adminError);
                throw adminError;
            }
        }

    } catch (error) {
        console.error('❌ Erreur reset password:', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(400).json({ 
                success: false, 
                error: "Aucun utilisateur trouvé avec cet email.", 
                code: error.code 
            });
        }
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur lors de la réinitialisation du mot de passe.', 
            code: error.code 
        });
    }
});

module.exports = router; 