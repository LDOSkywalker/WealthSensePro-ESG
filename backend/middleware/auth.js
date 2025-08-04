const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

const authMiddleware = async (req, res, next) => {
    try {
        // Récupération du token depuis le cookie ou le header Authorization
        let token = req.cookies.auth_token;
        
        // Si pas de token dans les cookies, essayer le header Authorization
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            console.error('❌ Pas de token dans les cookies ou headers');
            return res.status(401).json({
                success: false,
                error: 'Non authentifié'
            });
        }

        // Vérification du JWT
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            console.error('❌ Erreur de vérification du token:', error);
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
            const user = await admin.auth().getUser(decoded.uid);
            req.user = {
                uid: user.uid,
                email: user.email
            };
            next();
        } catch (error) {
            console.error('❌ Utilisateur Firebase non trouvé ou erreur Firebase:', error);
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }
    } catch (error) {
        console.error('❌ Erreur inattendue dans authMiddleware:', error);
        return res.status(401).json({
            success: false,
            error: 'Erreur inattendue dans authMiddleware'
        });
    }
};

module.exports = authMiddleware; 