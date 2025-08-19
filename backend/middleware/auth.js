const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { secureLogger } = require('../utils/secureLogger');

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
            
            // Log de succès JWT (avec pseudonymisation)
            secureLogger.info('JWT vérifié avec succès', null, {
                uidHash: decoded.uid,
                emailHash: decoded.email,
                tokenType: decoded.type,
                loginTime: decoded.loginTime
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
            req.user = {
                uid: user.uid,
                email: user.email
            };
            
            // Log de succès Firebase (avec pseudonymisation)
            secureLogger.info('Utilisateur Firebase vérifié avec succès', null, {
                uidHash: user.uid,
                emailHash: user.email
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