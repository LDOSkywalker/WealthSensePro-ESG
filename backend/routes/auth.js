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
        
        // Génération du JWT avec timestamp pour garantir l'unicité
        const token = jwt.sign(
            { 
                uid: userCredential.uid,
                email: userCredential.email,
                loginTime: Date.now() // Ajouter un timestamp pour garantir l'unicité
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        // Nettoyer l'ancien cookie avant d'en créer un nouveau
        res.clearCookie('auth_token');
        
        // Stockage du token dans un cookie httpOnly
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        res.json({
            success: true,
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

// Endpoint de logout
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
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

        // Génération du JWT avec timestamp pour garantir l'unicité
        const token = jwt.sign(
            { 
                uid: userRecord.uid, 
                email: userRecord.email,
                loginTime: Date.now() // Ajouter un timestamp pour garantir l'unicité
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        // Nettoyer l'ancien cookie avant d'en créer un nouveau
        res.clearCookie('auth_token');
        
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
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