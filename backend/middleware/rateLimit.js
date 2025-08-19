const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Fonction utilitaire pour hasher les emails (anonymisation)
const hashEmail = (email) => {
    if (!email) return 'anonymous';
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 8);
};

// Fonction de validation des données avant comptage
const validateRequestData = (req) => {
    const { email } = req.body || {};
    
    // Validation basique de l'email
    if (email && typeof email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return false; // Email invalide
        }
    }
    
    return true; // Données valides
};

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
        // Utilise l'IP + email hashé pour un rate limiting plus précis
        const email = req.body?.email;
        const emailHash = hashEmail(email);
        return `${req.ip}-${emailHash}`;
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
    // Callback après chaque requête
    onLimitReached: (req, res, options) => {
        const emailHash = hashEmail(req.body?.email);
        console.log(`🚫 Rate limit atteint pour ${req.ip} - Email hashé: ${emailHash}`);
        
        // Log de sécurité anonymisé
        const securityLog = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            emailHash: emailHash,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            environment: process.env.NODE_ENV || 'development'
        };
        
        console.log('🚫 Tentative de réinitialisation bloquée par rate limiting:', securityLog);
    }
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
        const email = req.body?.email;
        const emailHash = hashEmail(email);
        return `login-${req.ip}-${emailHash}`;
    },
    skip: (req) => {
        // Validation des données avant comptage
        return !validateRequestData(req);
    },
    onLimitReached: (req, res, options) => {
        const emailHash = hashEmail(req.body?.email);
        console.log(`🚫 Rate limit de connexion atteint pour ${req.ip} - Email hashé: ${emailHash}`);
    }
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
    keyGenerator: (req) => req.ip,
    onLimitReached: (req, res, options) => {
        console.log(`🚫 Rate limit global atteint pour ${req.ip}`);
    }
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
    keyGenerator: (req) => req.ip,
    skip: (req) => {
        // Validation des données avant comptage
        return !validateRequestData(req);
    },
    onLimitReached: (req, res, options) => {
        console.log(`🚫 Rate limit d'inscription atteint pour ${req.ip}`);
    }
});

module.exports = {
    passwordResetLimiter,
    loginLimiter,
    globalLimiter,
    signupLimiter,
    hashEmail, // Export pour utilisation dans d'autres middlewares
    validateRequestData
}; 