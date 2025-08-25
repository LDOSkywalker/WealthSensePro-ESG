const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { passwordResetLimiter, loginLimiter, signupLimiter } = require('../middleware/rateLimit');
const { secureLogger } = require('../utils/secureLogger');
const sessionManager = require('../utils/sessionManager');

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

        secureLogger.operation('login', { email });

        // 🔐 ÉTAPE 1 : Vérification des credentials avec Firebase Auth REST API
        secureLogger.info('Vérification des credentials avec Firebase Auth REST API...');
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
            secureLogger.error('Erreur Firebase Auth');
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
                code: 'auth/invalid-credential'
            });
        }

        secureLogger.info('Credentials vérifiés avec succès');

        // 🔐 ÉTAPE 2 : Récupération des infos utilisateur avec Firebase Admin
        secureLogger.info('Récupération des infos utilisateur...');
        const userCredential = await admin.auth().getUserByEmail(email);
        
        secureLogger.info('Utilisateur trouvé', { uid: userCredential.uid });

        // 🔐 ÉTAPE 3 : Récupération du rôle utilisateur
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userCredential.uid).get();
        const userRole = userDoc.exists ? userDoc.data().role || 'user' : 'user';
        
        // 🔐 ÉTAPE 4 : Génération des tokens JWT avec gestion de session sécurisée et révocation atomique
        secureLogger.info('Génération des tokens JWT avec session sécurisée et révocation atomique...');
        const session = await sessionManager.createSession(
            userCredential.uid, 
            userCredential.email, 
            req,
            userRole
        );
        
        const { accessToken, refreshToken } = session;

        secureLogger.info('Login réussi', { uid: userCredential.uid, email: userCredential.email });
        
        // 🔐 ÉTAPE 4 : Stockage sécurisé (flux hybride préservé)
        // Nettoyer les anciens cookies
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        secureLogger.info('Anciens cookies nettoyés');
        
        // Cookie refresh_token uniquement (HttpOnly + Secure + SameSite=None)
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });
        secureLogger.info('Cookie refresh_token défini (HttpOnly + Secure + SameSite=None)');

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
        secureLogger.error('Erreur de login', error);
        
        // Gestion des erreurs Firebase
        if (error.code === 'auth/user-not-found') {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé',
                code: 'auth/user-not-found'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Endpoint de rafraîchissement du token avec rotation sécurisée
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies['refresh_token'];
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token manquant',
                code: 'REFRESH_TOKEN_MISSING'
            });
        }

        // Rafraîchir la session avec rotation du refresh token
        const session = await sessionManager.refreshSession(refreshToken, req);
        
        // Mettre à jour le cookie avec le nouveau refresh token
        res.cookie('refresh_token', session.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });

        res.json({
            success: true,
            access_token: session.accessToken,
            exp: Date.now() + (15 * 60 * 1000)
        });

    } catch (error) {
        secureLogger.error('Erreur refresh token', error);
        
        // En cas d'erreur de sécurité, révoquer le cookie
        res.clearCookie('refresh_token');
        
        res.status(401).json({
            success: false,
            error: 'Token invalide ou expiré',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
});

// Endpoint de déconnexion avec révocation de session
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies['refresh_token'];
        
        if (refreshToken) {
            try {
                // Décoder le token pour récupérer l'uid et deviceId
                const decoded = jwt.verify(refreshToken, JWT_SECRET);
                if (decoded.typ === 'refresh' && decoded.sub && decoded.dev) {
                    // Révoquer la session de l'utilisateur
                    await sessionManager.logoutUser(decoded.sub, decoded.dev);
                }
            } catch (error) {
                // Si le token est invalide, on continue avec le logout
                secureLogger.warn('Token invalide lors du logout', error);
            }
        }
        
        res.clearCookie('refresh_token');
        secureLogger.info('Utilisateur déconnecté avec révocation de session');
        res.json({ success: true });
    } catch (error) {
        secureLogger.error('Erreur logout', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la déconnexion' });
    }
});

// Endpoint d'inscription
router.post('/signup', signupLimiter, async (req, res) => {
    try {
        const { email, password, firstName, lastName, referralSource, otherReferralSource, disclaimerAccepted, disclaimerAcceptedAt } = req.body;

        secureLogger.operation('signup', { email });

        // Créer l'utilisateur dans Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`
        });

        // Enregistrer les informations dans Firestore
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            email,
            firstName,
            lastName,
            referralSource,
            otherReferralSource,
            disclaimerAccepted,
            disclaimerAcceptedAt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            role: 'user',
            isActive: true
        });

        secureLogger.info('Utilisateur créé avec succès', { uid: userRecord.uid });

        // 🔐 ÉTAPE : Génération des tokens avec gestion de session sécurisée et révocation atomique
        secureLogger.info('Début génération des tokens JWT...', null, { 
            uidHash: userRecord.uid,
            emailHash: userRecord.email 
        });
        
        try {
            const session = await sessionManager.createSession(
                userRecord.uid, 
                userRecord.email, 
                req,
                'user' // Nouveaux utilisateurs ont le rôle 'user' par défaut
            );
            
            secureLogger.info('Session créée avec succès', null, { 
                uidHash: userRecord.uid,
                sessionIdHash: session.jti 
            });
            
            const { accessToken, refreshToken } = session;

            // Définir le cookie refresh_token
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000
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
            // 🔍 LOGGING DÉTAILLÉ DE L'ERREUR
            secureLogger.error('Erreur détaillée signup', error, {
                uidHash: userRecord?.uid || 'N/A',
                emailHash: userRecord?.email || 'N/A',
                errorName: error.name,
                errorCode: error.code,
                errorMessage: error.message,
                errorStack: error.stack?.substring(0, 500), // Limiter la taille
                step: 'session_creation'
            });
            
            // 🔍 VÉRIFICATION DES VARIABLES CRITIQUES
            secureLogger.error('Vérification des variables critiques', null, {
                JWT_SECRET_PRESENT: !!process.env.JWT_SECRET,
                JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length || 0,
                FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
                NODE_ENV: process.env.NODE_ENV
            });
            
            // 🔍 RÉPONSE D'ERREUR SÉCURISÉE
            let errorMessage = 'Erreur lors de l\'inscription';
            let errorCode = 'SIGNUP_ERROR';
            
            if (error.code === 'auth/email-already-exists') {
                errorMessage = 'Un compte avec cet email existe déjà';
                errorCode = 'EMAIL_ALREADY_EXISTS';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Le mot de passe est trop faible';
                errorCode = 'WEAK_PASSWORD';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Format d\'email invalide';
                errorCode = 'INVALID_EMAIL';
            }
            
                                    res.status(400).json({ 
                success: false, 
                error: errorMessage,
                code: errorCode
            });
         }
     } catch (error) {
         // 🔍 LOGGING DÉTAILLÉ DE L'ERREUR GÉNÉRALE
         secureLogger.error('Erreur générale signup', error, {
             errorName: error.name,
             errorCode: error.code,
             errorMessage: error.message,
             errorStack: error.stack?.substring(0, 500),
             step: 'general_signup'
         });
         
         res.status(500).json({ 
             success: false, 
             error: 'Erreur interne du serveur',
             code: 'INTERNAL_ERROR'
         });
     }
});

// Endpoint de modification du profil
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const uid = req.user.uid;

        const db = admin.firestore();
        await db.collection('users').doc(uid).update({
            firstName,
            lastName,
            updatedAt: Date.now()
        });

        secureLogger.info('Profil mis à jour avec succès', { uid });
        res.json({ success: true });
    } catch (error) {
        secureLogger.error('Erreur update profile', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Endpoint de modification du mot de passe
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const uid = req.user.uid;
        const email = req.user.email;

        // 🔐 ÉTAPE 1 : Vérification du mot de passe actuel
        if (!currentPassword) {
            secureLogger.error('Mot de passe actuel manquant dans req.body');
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
            secureLogger.error('Mot de passe actuel incorrect');
            return res.status(401).json({
                success: false,
                error: 'Le mot de passe actuel est incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        secureLogger.info('Mot de passe actuel vérifié avec succès');

        // 🔐 ÉTAPE 2 : Validation du nouveau mot de passe
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
                code: 'INVALID_NEW_PASSWORD'
            });
        }

        // 🔐 ÉTAPE 3 : Mise à jour du mot de passe
        secureLogger.info('Mise à jour du mot de passe...');
        await admin.auth().updateUser(uid, { password: newPassword });
        
        secureLogger.info('Mot de passe mis à jour avec succès');
        
        res.json({ 
            success: true, 
            message: 'Mot de passe modifié avec succès',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        secureLogger.error('Erreur lors du changement de mot de passe', error);
        
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
        // Utiliser les données déjà récupérées par le middleware auth
        // qui inclut maintenant le rôle et autres champs Firestore
        const userProfile = {
            uid: req.user.uid,
            email: req.user.email,
            displayName: req.user.displayName,
            photoURL: req.user.photoURL,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role,
            isActive: req.user.isActive,
            disclaimerAccepted: req.user.disclaimerAccepted,
            disclaimerAcceptedAt: req.user.disclaimerAcceptedAt,
            sessionPolicy: req.user.sessionPolicy
        };
        
        res.json(userProfile);
    } catch (error) {
        secureLogger.error('Erreur récupération profil', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Endpoint pour récupérer les informations de session (nécessaire pour le listener temps réel)
router.get('/session-info', authMiddleware, async (req, res) => {
    try {
        // Récupérer le sessionId depuis le token décodé
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.sessionId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Session ID manquant' 
            });
        }
        
        // Récupérer les informations de session
        const sessionValidation = await sessionManager.validateSession(decoded.sessionId);
        
        if (!sessionValidation.valid) {
            return res.status(401).json({
                success: false,
                code: sessionValidation.code,
                error: 'Session invalide'
            });
        }
        
        // Retourner les informations de session (sans données sensibles)
        res.json({
            success: true,
            session: {
                jti: decoded.sessionId,
                deviceId: sessionValidation.session.deviceId,
                deviceLabel: sessionValidation.session.deviceLabel,
                status: sessionValidation.session.status,
                createdAt: sessionValidation.session.createdAt,
                lastUsed: sessionValidation.session.lastUsed
            }
        });
        
    } catch (error) {
        secureLogger.error('Erreur récupération infos session', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur serveur' 
        });
    }
});

// Endpoint de réinitialisation du mot de passe (mot de passe oublié)
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email requis.' });
        }

        secureLogger.operation('password_reset', { email });

        // 🔄 Utiliser Firebase Auth REST API (envoi automatique)
        secureLogger.info('Utilisation de Firebase Auth REST API pour l\'envoi automatique...');
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
                secureLogger.error('Erreur Firebase Auth REST API');
                throw new Error(resetData.error?.message || 'Erreur lors de l\'envoi de l\'email');
            }

            secureLogger.info('Email de réinitialisation envoyé via Firebase Auth REST API');
            
            return res.json({ 
                success: true, 
                message: 'Email de réinitialisation envoyé avec succès.',
                firebaseResponse: resetData,
                method: 'firebase_rest_api'
            });

        } catch (restApiError) {
            secureLogger.error('Erreur avec Firebase Auth REST API', restApiError);
            secureLogger.info('Tentative avec Firebase Admin SDK...');
            
            // 🔄 Fallback avec Firebase Admin SDK
            try {
                // Vérifier que l'utilisateur existe
                const userRecord = await admin.auth().getUserByEmail(email);
                secureLogger.info('Utilisateur trouvé', { uid: userRecord.uid });

                // Générer le lien de réinitialisation
                const resetLink = await admin.auth().generatePasswordResetLink(email, {
                    url: process.env.FRONTEND_URL + '/reset-password',
                    handleCodeInApp: false
                });
                secureLogger.info('Lien de réinitialisation généré');

                // TODO: Intégrer votre service d'envoi d'email ici
                secureLogger.info('ATTENTION: Lien généré mais email non envoyé automatiquement');
                secureLogger.info('Vous devez implémenter l\'envoi d\'email manuellement');
                
                return res.json({ 
                    success: true, 
                    message: 'Lien de réinitialisation généré. Email à envoyer manuellement.',
                    resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
                    note: 'Email non envoyé automatiquement - implémentation requise',
                    method: 'firebase_admin_sdk'
                });

            } catch (adminError) {
                secureLogger.error('Erreur avec Firebase Admin SDK', adminError);
                throw adminError;
            }
        }

    } catch (error) {
        secureLogger.error('Erreur reset password', error);
        if (error.code === 'auth/user-not-found') {
            return res.status(400).json({ 
                success: false, 
                error: 'Aucun compte associé à cette adresse email.',
                code: 'USER_NOT_FOUND'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la réinitialisation du mot de passe',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router; 