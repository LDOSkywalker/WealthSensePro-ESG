const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { secureLogger } = require('../utils/secureLogger');
const sessionManager = require('../utils/sessionManager');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

const authMiddleware = async (req, res, next) => {
    try {
        // Log de début d'authentification (sécurisé)
        secureLogger.operation('auth_start', { 
            path: req.url, 
            method: req.method 
        });
        
        // Récupération du token depuis le header Authorization
        const authHeader = req.headers.authorization;
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            secureLogger.info('Token récupéré depuis Authorization header');
        }

        if (!token) {
            secureLogger.error('Pas de token dans Authorization header');
            return res.status(401).json({
                success: false,
                error: 'Non authentifié'
            });
        }

        // Vérification du JWT
        let decoded;
        try {
            secureLogger.info('Vérification du JWT...');
            decoded = jwt.verify(token, JWT_SECRET);
            
            // Vérifier que c'est un access token
            if (decoded.type !== 'access') {
                secureLogger.error('Token invalide - type incorrect', null, { 
                    tokenType: decoded.type 
                });
                return res.status(401).json({
                    success: false,
                    error: 'Token invalide'
                });
            }
            
            // Vérifier la session en base si un sessionId est présent
            if (decoded.sessionId) {
                const sessionValidation = await sessionManager.validateSession(decoded.sessionId);
                if (!sessionValidation.valid) {
                    secureLogger.security('Session invalide détectée', {
                        sessionIdHash: decoded.sessionId,
                        code: sessionValidation.code,
                        reason: sessionValidation.reason,
                        uidHash: decoded.uid
                    });
                    
                    // Codes d'erreur normalisés selon la spécification
                    if (sessionValidation.code === 'SESSION_REVOKED') {
                        return res.status(401).json({
                            success: false,
                            code: 'SESSION_REVOKED',
                            reason: sessionValidation.reason || 'replaced',
                            replacedBy: sessionValidation.replacedBy,
                            revokedAt: sessionValidation.revokedAt
                        });
                    }
                    
                    return res.status(401).json({
                        success: false,
                        code: sessionValidation.code || 'SESSION_INVALID',
                        error: 'Session invalide'
                    });
                }
            }
            
            // Log de succès JWT (avec pseudonymisation)
            secureLogger.info('JWT vérifié avec succès', null, {
                uidHash: decoded.uid,
                emailHash: decoded.email,
                tokenType: decoded.type,
                loginTime: decoded.loginTime,
                sessionIdHash: decoded.sessionId
            });
        } catch (error) {
            secureLogger.error('Erreur de vérification du token', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Session expirée'
                });
            }
            return res.status(401).json({
                success: false,
                error: 'Token invalide'
            });
        }

        // Vérification que l'utilisateur existe toujours dans Firebase
        try {
            secureLogger.info('Vérification Firebase pour uid', null, { 
                uidHash: decoded.uid 
            });
            const user = await admin.auth().getUser(decoded.uid);
            
            // Récupération des données Firestore (rôle, etc.)
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(decoded.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            req.user = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                // Données Firestore
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role || 'user',
                isActive: userData.isActive,
                disclaimerAccepted: userData.disclaimerAccepted,
                disclaimerAcceptedAt: userData.disclaimerAcceptedAt,
                sessionPolicy: userData.sessionPolicy
            };
            
            // Log de succès Firebase (avec pseudonymisation)
            secureLogger.info('Utilisateur Firebase vérifié avec succès', null, {
                uidHash: user.uid,
                emailHash: user.email,
                role: userData.role || 'user'
            });
            
            next();
        } catch (error) {
            secureLogger.error('Utilisateur Firebase non trouvé ou erreur Firebase', error, {
                uidHash: decoded.uid
            });
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
    } catch (error) {
        secureLogger.error('Erreur inattendue dans authMiddleware', error);
        return res.status(401).json({
            success: false,
            error: 'Erreur inattendue dans authMiddleware'
        });
    }
};

module.exports = authMiddleware; 