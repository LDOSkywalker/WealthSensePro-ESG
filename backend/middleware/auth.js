const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

const authMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 === DÉBUT AUTHENTIFICATION ===');
        console.log('🔍 URL:', req.url);
        console.log('🔍 Méthode:', req.method);
        console.log('🔍 Origin:', req.headers.origin);
        console.log('🔍 User-Agent:', req.headers['user-agent']);
        console.log('🔍 Cookies reçus:', Object.keys(req.cookies));
        console.log('🔍 Headers reçus:', Object.keys(req.headers));
        console.log('🔍 Authorization header présent:', !!req.headers.authorization);
        
        // Récupération du token depuis le header Authorization
        const authHeader = req.headers.authorization;
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('🔍 Token récupéré depuis Authorization header');
        }

        if (!token) {
            console.error('❌ Pas de token dans Authorization header');
            console.log('🔍 === FIN AUTHENTIFICATION - ÉCHEC ===');
            return res.status(401).json({
                success: false,
                error: 'Non authentifié'
            });
        }

        // Vérification du JWT
        let decoded;
        try {
            console.log('🔍 Vérification du JWT...');
            decoded = jwt.verify(token, JWT_SECRET);
            
            // Vérifier que c'est un access token
            if (decoded.type !== 'access') {
                console.error('❌ Token invalide - type incorrect:', decoded.type);
                return res.status(401).json({
                    success: false,
                    error: 'Token invalide'
                });
            }
            
            console.log('🔍 JWT décodé avec succès:', {
                uid: decoded.uid,
                email: decoded.email,
                type: decoded.type,
                loginTime: decoded.loginTime
            });
        } catch (error) {
            console.error('❌ Erreur de vérification du token:', error);
            console.log('🔍 === FIN AUTHENTIFICATION - ÉCHEC ===');
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
            console.log('🔍 Vérification Firebase pour uid:', decoded.uid);
            const user = await admin.auth().getUser(decoded.uid);
            req.user = {
                uid: user.uid,
                email: user.email
            };
            console.log('🔍 Utilisateur Firebase trouvé:', {
                uid: user.uid,
                email: user.email
            });
            console.log('🔍 === FIN AUTHENTIFICATION - SUCCÈS ===');
            next();
        } catch (error) {
            console.error('❌ Utilisateur Firebase non trouvé ou erreur Firebase:', error);
            console.log('🔍 === FIN AUTHENTIFICATION - ÉCHEC ===');
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