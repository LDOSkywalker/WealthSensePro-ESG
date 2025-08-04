const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// Vérification de la présence du JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('⚠️ JWT_SECRET n\'est pas défini dans les variables d\'environnement');
    process.exit(1);
}

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Endpoint de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des identifiants avec Firebase Admin
        const userCredential = await admin.auth().getUserByEmail(email);
        
                // Génération des tokens
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

        res.json({
            success: true,
            access_token: accessToken,
            user: {
                uid: userCredential.uid,
                email: userCredential.email
            }
        });
    } catch (error) {
        console.error('Erreur de login:', error);
        
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
router.post('/signup', async (req, res) => {
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
        const { newPassword } = req.body;
        const uid = req.user.uid;
        await admin.auth().updateUser(uid, { password: newPassword });
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur update password:', error);
        res.status(400).json({ success: false, error: error.message });
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
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email requis.' });
        }
        // Génère un lien de réinitialisation de mot de passe avec Firebase Admin
        const resetLink = await admin.auth().generatePasswordResetLink(email);
        res.json({ success: true, message: 'Email de réinitialisation envoyé.', resetLink });
    } catch (error) {
        console.error('Erreur reset password:', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(400).json({ success: false, error: "Aucun utilisateur trouvé avec cet email.", code: error.code });
        }
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
});

module.exports = router; 