const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const { admin } = require('./firebase-config');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const conversationsRoutes = require('./routes/conversations');
const messagesRoutes = require('./routes/messages');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3006;

// Configuration de l'environnement
const isProduction = process.env.NODE_ENV === 'production';

// Fonction utilitaire pour masquer les informations sensibles
const maskSensitiveData = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const masked = { ...obj };
    
    // Liste des clés sensibles à masquer
    const sensitiveKeys = ['userEmail', 'email', 'password', 'token', 'apiKey'];
    
    Object.keys(masked).forEach(key => {
        if (sensitiveKeys.includes(key.toLowerCase())) {
            masked[key] = '***masked***';
        } else if (typeof masked[key] === 'object') {
            masked[key] = maskSensitiveData(masked[key]);
        }
    });
    return masked;
};

// Logger sécurisé
const secureLogger = {
    info: (message, data = {}) => {
        if (isProduction) {
            // En production, on log uniquement les informations non sensibles
            console.log(`ℹ️ ${message}`);
        } else {
            // En développement, on log plus de détails mais toujours de manière sécurisée
            console.log(`ℹ️ ${message}`, maskSensitiveData(data));
        }
    },
    error: (message, error = {}) => {
        const errorData = {
            message: error.message,
            code: error.code,
            status: error.response?.status
        };
        console.error(`❌ ${message}`, maskSensitiveData(errorData));
    }
};

// Middleware de logging minimal pour toutes les requêtes
app.use((req, res, next) => {
    secureLogger.info(`${req.method} ${req.path}`);
    next();
});

// Configuration CORS pour la préproduction
const allowedOrigins = [
    'http://localhost:5173', // Dev local
    'https://develop--wealthsense-esg.netlify.app' , // 
    'https://wealthsense-esg.netlify.app', // Preprod
    'https://wealthsense-impact.com', // Prod
    // Branche temporaire Netlify à configurer
    process.env.FRONTEND_URL // URL configurée dans Render
].filter(Boolean); // Supprime les valeurs undefined

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS bloqué pour:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Headers de sécurité
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'WealthSense API');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    next();
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/protected', authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: 'Route protégée accessible',
        user: req.user
    });
});

// Route racine pour health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'WealthSense API is running',
        version: '1.0.0',
        endpoints: {
            webhook: '/api/webhook',
            feedback: '/api/feedback',
            registration: '/api/registration'
        }
    });
});

// Routes conversations
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);

// Configuration des URLs N8N
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const FEEDBACK_N8N_URL = process.env.FEEDBACK_N8N_URL;
const REGISTRATION_WEBHOOK_URL = process.env.REGISTRATION_WEBHOOK_URL;

// Middleware pour gérer les requêtes webhook
const handleWebhook = async (req, res) => {
    try {
        const payload = req.method === 'GET' ? req.query : req.body;
        secureLogger.info('📤 Début du traitement webhook', {
            method: req.method,
            payload: payload
        });
        
        // Construire l'URL avec les paramètres de requête
        const params = new URLSearchParams(payload);
        const urlWithParams = `${N8N_WEBHOOK_URL}?${params.toString()}`;
        
        secureLogger.info('🔗 URL webhook construite', {
            url: urlWithParams
        });
        
        // LOG DEBUG : Affichage des paramètres envoyés à N8N
        console.log('DEBUG - Appel N8N :', {
            url: urlWithParams,
            params: payload
        });
        
        secureLogger.info('🚀 Envoi de la requête à N8N');
        const response = await axios({
            method: 'GET',
            url: urlWithParams,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // LOG DEBUG : Affichage de la réponse brute de N8N
        console.log('DEBUG - Réponse N8N :', {
            status: response.status,
            data: response.data
        });
        
        secureLogger.info('✅ Réponse reçue de N8N', {
            status: response.status,
            data: response.data
        });
        
        res.json(response.data);
    } catch (error) {
        secureLogger.error('❌ Erreur webhook', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            url: N8N_WEBHOOK_URL
        });
        
        // LOG DEBUG : Affichage de l'erreur complète
        console.error('DEBUG - Erreur complète lors de l\'appel à N8N :', error);
        
        res.status(500).json({ 
            error: 'Erreur lors de l\'envoi des données',
            details: error.response?.data || error.message
        });
    }
};

// Middleware pour gérer les requêtes feedback
const handleFeedback = async (req, res) => {
    try {
        const payload = req.method === 'GET' ? req.query : req.body;
        
        // Log minimal en production
        secureLogger.info('Traitement d\'une requête feedback', { method: req.method });

        // Vérification des données requises
        if (!payload.userEmail || !payload.feedback) {
            throw new Error('Email utilisateur et feedback sont requis');
        }

        const response = await axios({
            method: 'POST',
            url: FEEDBACK_N8N_URL,
            data: payload,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        secureLogger.info('Feedback traité avec succès');
        res.json(response.data);
    } catch (error) {
        secureLogger.error('Erreur lors du traitement du feedback', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'envoi du feedback',
            timestamp: new Date().toISOString()
        });
    }
};

// Middleware pour gérer les requêtes d'enregistrement
const handleRegistration = async (req, res) => {
    try {
        const payload = req.method === 'GET' ? req.query : req.body;
        const params = new URLSearchParams(payload);
        const urlWithParams = `${REGISTRATION_WEBHOOK_URL}?${params.toString()}`;
        
        const response = await axios({
            method: 'GET',
            url: urlWithParams,
            headers: {
                'Accept': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Erreur registration:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'enregistrement',
            details: error.response?.data || error.message
        });
    }
};

// Routes
app.get('/api/webhook', handleWebhook);
app.post('/api/webhook', handleWebhook);

app.get('/api/feedback', handleFeedback);
app.post('/api/feedback', handleFeedback);

app.get('/api/registration', handleRegistration);
app.post('/api/registration', handleRegistration);

app.listen(port, () => {
    secureLogger.info(`Serveur démarré sur le port ${port}`);
});

module.exports = app; 