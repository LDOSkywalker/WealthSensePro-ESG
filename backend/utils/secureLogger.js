const crypto = require('crypto');

// Configuration de l'environnement
const isProduction = process.env.NODE_ENV === 'production';

// Allowlist stricte des champs autorisés à être loggés
const ALLOWED_LOG_FIELDS = [
    'path',           // Chemin de la requête
    'method',         // Méthode HTTP
    'status',         // Code de statut HTTP
    'durationMs',     // Durée de traitement en ms
    'requestId',      // ID unique de la requête
    'ip',             // IP client (anonymisée)
    'userAgent',      // User-Agent (version uniquement)
    'timestamp',      // Horodatage ISO
    'environment',    // Environnement (dev/prod)
    'operation',      // Opération métier (login, password_change, etc.)
    'success',        // Succès/échec de l'opération
    'errorCode',      // Code d'erreur (sans détails sensibles)
    'rateLimit',      // Informations de rate limiting
    'endpoint'        // Endpoint appelé
];

// Fonction pour générer un ID de requête unique
const generateRequestId = () => {
    return crypto.randomBytes(8).toString('hex');
};

// Fonction pour anonymiser l'IP
const anonymizeIP = (ip) => {
    if (!ip) return 'unknown';
    if (ip === '::1' || ip === '127.0.0.1') return 'localhost';
    
    // Anonymiser les 3 derniers octets pour IPv4
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    
    // Anonymiser IPv6
    if (ip.includes(':')) {
        const parts = ip.split(':');
        if (parts.length >= 4) {
            return `${parts[0]}:${parts[1]}:xxx:xxx`;
        }
    }
    
    return 'xxx.xxx.xxx.xxx';
};

// Fonction pour nettoyer le User-Agent
const sanitizeUserAgent = (userAgent) => {
    if (!userAgent) return 'unknown';
    
    // Extraire seulement le navigateur et la version
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    return match ? match[0] : 'unknown';
};

// Fonction pour filtrer les données selon l'allowlist
const filterAllowedFields = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    const filtered = {};
    Object.keys(data).forEach(key => {
        if (ALLOWED_LOG_FIELDS.includes(key)) {
            filtered[key] = data[key];
        }
    });
    
    return filtered;
};

// Fonction pour créer un log de requête sécurisé
const createRequestLog = (req, operation = 'unknown') => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    return {
        requestId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        operation,
        endpoint: req.path,
        method: req.method,
        ip: anonymizeIP(req.ip),
        userAgent: sanitizeUserAgent(req.get('User-Agent')),
        startTime
    };
};

// Fonction pour finaliser un log de requête
const finalizeRequestLog = (logData, response, error = null) => {
    const endTime = Date.now();
    const durationMs = endTime - logData.startTime;
    
    const finalLog = {
        ...logData,
        durationMs,
        status: response?.statusCode || (error ? 500 : 200),
        success: !error,
        timestamp: new Date().toISOString()
    };
    
    if (error) {
        finalLog.errorCode = error.code || 'UNKNOWN_ERROR';
        finalLog.errorMessage = error.message || 'Unknown error';
    }
    
    return filterAllowedFields(finalLog);
};

// Logger principal sécurisé
const secureLogger = {
    // Log d'une requête entrante
    request: (req, operation = 'unknown') => {
        const logData = createRequestLog(req, operation);
        console.log('📥 Requête entrante:', filterAllowedFields(logData));
        return logData;
    },
    
    // Log d'une réponse
    response: (logData, response, error = null) => {
        const finalLog = finalizeRequestLog(logData, response, error);
        if (error) {
            console.log('❌ Réponse avec erreur:', finalLog);
        } else {
            console.log('✅ Réponse réussie:', finalLog);
        }
    },
    
    // Log d'opération métier
    operation: (operation, data = {}) => {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            operation,
            ...filterAllowedFields(data)
        };
        console.log('🔄 Opération:', logData);
    },
    
    // Log de sécurité
    security: (event, data = {}) => {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            operation: 'security',
            event,
            ...filterAllowedFields(data)
        };
        console.log('🛡️ Sécurité:', logData);
    },
    
    // Log d'erreur sécurisé
    error: (message, error = null, context = {}) => {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            operation: 'error',
            message,
            errorCode: error?.code || 'UNKNOWN_ERROR',
            ...filterAllowedFields(context)
        };
        
        if (error && !isProduction) {
            logData.errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        
        console.error('❌ Erreur:', logData);
    },
    
    // Log d'information générale
    info: (message, data = {}) => {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            operation: 'info',
            message,
            ...filterAllowedFields(data)
        };
        console.log('ℹ️ Info:', logData);
    },
    
    // Log d'avertissement
    warn: (message, data = {}) => {
        const logData = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            operation: 'warning',
            message,
            ...filterAllowedFields(data)
        };
        console.warn('⚠️ Avertissement:', logData);
    }
};

module.exports = {
    secureLogger,
    filterAllowedFields,
    generateRequestId,
    anonymizeIP,
    sanitizeUserAgent,
    ALLOWED_LOG_FIELDS
}; 