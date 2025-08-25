const rateLimit = require('express-rate-limit');
const { secureLogger } = require('../utils/secureLogger');

// Rate limiter pour la réinitialisation de mot de passe
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // Maximum 3 tentatives par heure
    message: {
        success: false,
        error: 'Trop de tentatives de réinitialisation. Réessayez dans 1 heure.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 3600 // 1 heure en secondes
    },
    standardHeaders: true, // Retourne `RateLimit-*` headers
    legacyHeaders: false, // Désactive `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Trop de tentatives de réinitialisation. Réessayez dans 1 heure.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 3600,
            message: 'Pour des raisons de sécurité, vous avez atteint la limite de tentatives de réinitialisation de mot de passe. Veuillez attendre 1 heure avant de réessayer.'
        });
    },
    // Personnalisation des clés de rate limiting
    keyGenerator: (req) => {
        // 🔧 CORRECTION : Gestion IPv6 compatible avec express-rate-limit v7
        const ip = req.ip || req.connection.remoteAddress;
        const cleanIp = ip.includes(':') ? ip.split(':')[0] : ip;
        
        // Utilise l'IP + email hashé pour un rate limiting plus précis
        const email = req.body?.email;
        const emailHash = email ? email.substring(0, 8) + '***' : 'anonymous';
        return `${cleanIp}-${emailHash}`;
    },
    // Skip certaines conditions (uniquement en développement)
    skip: (req) => {
        // Skip si c'est une requête de test en développement ET si le bypass n'est pas banni
        return process.env.NODE_ENV === 'development' && 
               req.headers['x-test-mode'] && 
               !process.env.BAN_BYPASS_IN_DEV;
    },
    // Validation des données avant comptage
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    // 🔧 CORRECTION : Suppression de onLimitReached déprécié dans v7
    // Le logging est maintenant géré automatiquement par express-rate-limit
});

// Rate limiter pour les tentatives de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 tentatives par 15 minutes
    message: {
        success: false,
        error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        retryAfter: 900 // 15 minutes en secondes
    },
    keyGenerator: (req) => {
        // 🔧 CORRECTION : Gestion IPv6 compatible avec express-rate-limit v7
        const ip = req.ip || req.connection.remoteAddress;
        const cleanIp = ip.includes(':') ? ip.split(':')[0] : ip;
        
        const email = req.body?.email;
        const emailHash = email ? email.substring(0, 8) + '***' : 'anonymous';
        return `login-${cleanIp}-${emailHash}`;
    },
    skip: (req) => {
        // Validation des données avant comptage
        const { email } = req.body || {};
        if (email && typeof email === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return false; // Email invalide
            }
        }
        return true;
    },
    // 🔧 CORRECTION : Suppression de onLimitReached déprécié dans v7
    // Le logging est maintenant géré automatiquement par express-rate-limit
});

// Rate limiter global pour l'API
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum 100 requêtes par 15 minutes par IP
    message: {
        success: false,
        error: 'Trop de requêtes. Réessayez plus tard.',
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        // 🔧 CORRECTION : Gestion IPv6 compatible avec express-rate-limit v7
        const ip = req.ip || req.connection.remoteAddress;
        return ip.includes(':') ? ip.split(':')[0] : ip;
    },
    // 🔧 CORRECTION : Suppression de onLimitReached déprécié dans v7
    // Le logging est maintenant géré automatiquement par express-rate-limit
});

// Rate limiter spécifique pour l'inscription
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // Maximum 3 inscriptions par heure par IP
    message: {
        success: false,
        error: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.',
        code: 'SIGNUP_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        // 🔧 CORRECTION : Gestion IPv6 compatible avec express-rate-limit v7
        const ip = req.ip || req.connection.remoteAddress;
        return ip.includes(':') ? ip.split(':')[0] : ip;
    },
    skip: (req) => {
        // Validation des données avant comptage
        const { email } = req.body || {};
        if (email && typeof email === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return false; // Email invalide
            }
        }
        return true;
    },
    // 🔧 CORRECTION : Suppression de onLimitReached déprécié dans v7
    // Le logging est maintenant géré automatiquement par express-rate-limit
});

module.exports = {
    passwordResetLimiter,
    loginLimiter,
    globalLimiter,
    signupLimiter
}; 