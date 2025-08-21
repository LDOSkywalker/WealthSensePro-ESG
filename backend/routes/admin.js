const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const sessionManager = require('../utils/sessionManager');
const sessionCleanup = require('../utils/sessionCleanup');
const { secureLogger } = require('../utils/secureLogger');

// Middleware d'authentification admin
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token d\'authentification requis' });
        }

        const token = authHeader.substring(7);
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        
        // Vérifier que l'utilisateur est admin
        const user = await admin.auth().getUser(decoded.uid);
        const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            return res.status(403).json({ error: 'Accès administrateur requis' });
        }

        req.adminUser = user;
        next();
    } catch (error) {
        secureLogger.error('Erreur authentification admin', error);
        res.status(401).json({ error: 'Token invalide' });
    }
};

// Appliquer le middleware admin à toutes les routes
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/sessions/stats
 * Statistiques des sessions
 */
router.get('/sessions/stats', async (req, res) => {
    try {
        const stats = await sessionCleanup.getSessionStats();
        
        secureLogger.operation('admin_session_stats', {
            adminUid: req.adminUser.uid
        });

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur récupération stats sessions', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

/**
 * POST /api/admin/sessions/cleanup
 * Force le nettoyage des sessions expirées
 */
router.post('/sessions/cleanup', async (req, res) => {
    try {
        secureLogger.operation('admin_force_cleanup', {
            adminUid: req.adminUser.uid
        });

        const cleanedCount = await sessionCleanup.forceCleanup();
        
        res.json({
            success: true,
            cleanedCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur nettoyage forcé sessions', error);
        res.status(500).json({ error: 'Erreur lors du nettoyage forcé' });
    }
});

/**
 * POST /api/admin/sessions/revoke-family
 * Révoque toute la famille de tokens pour un deviceId
 */
router.post('/sessions/revoke-family', async (req, res) => {
    try {
        const { deviceId } = req.body;
        
        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId requis' });
        }

        secureLogger.operation('admin_revoke_family', {
            adminUid: req.adminUser.uid,
            deviceIdHash: deviceId
        });

        const revokedCount = await sessionManager.revokeFamily(deviceId);
        
        res.json({
            success: true,
            revokedCount,
            deviceId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur révocation famille admin', error);
        res.status(500).json({ error: 'Erreur lors de la révocation de la famille' });
    }
});

/**
 * GET /api/admin/sessions/device/:deviceId
 * Détails des sessions pour un deviceId
 */
router.get('/sessions/device/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        secureLogger.operation('admin_device_sessions', {
            adminUid: req.adminUser.uid,
            deviceIdHash: deviceId
        });

        const db = admin.firestore();
        const sessionsRef = db.collection('sessions');
        const query = sessionsRef.where('deviceId', '==', deviceId);
        const snapshot = await query.get();

        const sessions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                uid: data.uid,
                email: data.email,
                status: data.status,
                createdAt: data.createdAt,
                lastUsed: data.lastUsed,
                rotatedFrom: data.rotatedFrom,
                revokedAt: data.revokedAt,
                reason: data.reason
            });
        });

        res.json({
            success: true,
            deviceId,
            sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur récupération sessions device', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
    }
});

/**
 * GET /api/admin/sessions/user/:uid
 * Détails des sessions pour un utilisateur
 */
router.get('/sessions/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        
        secureLogger.operation('admin_user_sessions', {
            adminUid: req.adminUser.uid,
            targetUidHash: uid
        });

        const db = admin.firestore();
        const sessionsRef = db.collection('sessions');
        const query = sessionsRef.where('uid', '==', uid);
        const snapshot = await query.get();

        const sessions = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                deviceId: data.deviceId,
                email: data.email,
                status: data.status,
                createdAt: data.createdAt,
                lastUsed: data.lastUsed,
                rotatedFrom: data.rotatedFrom,
                revokedAt: data.revokedAt,
                reason: data.reason
            });
        });

        res.json({
            success: true,
            uid,
            sessions,
            count: sessions.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur récupération sessions utilisateur', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
    }
});

/**
 * POST /api/admin/sessions/revoke-user
 * Révoque toutes les sessions d'un utilisateur
 */
router.post('/sessions/revoke-user', async (req, res) => {
    try {
        const { uid } = req.body;
        
        if (!uid) {
            return res.status(400).json({ error: 'uid requis' });
        }

        secureLogger.operation('admin_revoke_user_sessions', {
            adminUid: req.adminUser.uid,
            targetUidHash: uid
        });

        const db = admin.firestore();
        const sessionsRef = db.collection('sessions');
        const query = sessionsRef.where('uid', '==', uid);
        const snapshot = await query.get();

        const batch = db.batch();
        let revokedCount = 0;

        snapshot.forEach(doc => {
            batch.update(doc.ref, { 
                status: 'revoked',
                revokedAt: Date.now(),
                reason: 'admin_revocation'
            });
            revokedCount++;
        });

        await batch.commit();

        res.json({
            success: true,
            uid,
            revokedCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur révocation sessions utilisateur', error);
        res.status(500).json({ error: 'Erreur lors de la révocation des sessions' });
    }
});

module.exports = router;
