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
        console.log('🔍 Cookie auth_token présent:', !!req.cookies.auth_token);
        
        // Récupération du token depuis le cookie
        const token = req.cookies.auth_token;

        if (!token) {
            console.error('❌ Pas de token dans les cookies');
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
            console.log('🔍 JWT décodé avec succès:', {
                uid: decoded.uid,
                email: decoded.email,
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