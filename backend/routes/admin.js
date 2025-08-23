const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const sessionManager = require('../utils/sessionManager');
const sessionCleanup = require('../utils/sessionCleanup');
const { secureLogger } = require('../utils/secureLogger');

// Middleware d'authentification admin
const adminAuthMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 [DEBUG ADMIN] Headers reçus:', req.headers);
        console.log('🔍 [DEBUG ADMIN] URL demandée:', req.originalUrl);
        console.log('🔍 [DEBUG ADMIN] Méthode:', req.method);
        
        const authHeader = req.headers.authorization;
        console.log('🔍 [DEBUG ADMIN] Header Authorization:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('🔍 [DEBUG ADMIN] Pas de token Bearer trouvé');
            return res.status(401).json({ error: 'Token d\'authentification requis' });
        }

        const token = authHeader.substring(7);
        console.log('🔍 [DEBUG ADMIN] Token extrait (longueur):', token.length);
        
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        console.log('🔍 [DEBUG ADMIN] Token décodé:', { uid: decoded.uid, exp: decoded.exp });
        
        // Vérifier que l'utilisateur est admin
        const user = await admin.auth().getUser(decoded.uid);
        console.log('🔍 [DEBUG ADMIN] Utilisateur Firebase trouvé:', { uid: user.uid, email: user.email });
        
        const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
        console.log('🔍 [DEBUG ADMIN] Document Firestore trouvé:', userDoc.exists);
        
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            console.log('🔍 [DEBUG ADMIN] Rôle non admin:', userDoc.exists ? userDoc.data().role : 'document inexistant');
            return res.status(403).json({ error: 'Accès administrateur requis' });
        }

        console.log('🔍 [DEBUG ADMIN] Authentification admin réussie pour:', user.email);
        req.adminUser = user;
        next();
    } catch (error) {
        console.log('🔍 [DEBUG ADMIN] Erreur dans middleware:', error.message);
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

/**
 * PUT /api/admin/users/:uid/policy
 * Change la policy de session d'un utilisateur
 */
router.put('/users/:uid/policy', async (req, res) => {
    try {
        const { uid } = req.params;
        const { policy } = req.body;
        
        if (!policy || !['single', 'two', 'unlimited'].includes(policy)) {
            return res.status(400).json({ 
                error: 'Policy invalide. Doit être: single, two, ou unlimited' 
            });
        }

        secureLogger.operation('admin_change_user_policy', {
            adminUid: req.adminUser.uid,
            targetUidHash: uid,
            newPolicy: policy
        });

        const db = admin.firestore();
        await db.collection('users').doc(uid).update({
            sessionPolicy: policy,
            updatedAt: Date.now()
        });

        res.json({
            success: true,
            uid,
            newPolicy: policy,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur changement policy utilisateur', error);
        res.status(500).json({ error: 'Erreur lors du changement de policy' });
    }
});

/**
 * GET /api/admin/users
 * Récupère la liste de tous les utilisateurs (admin uniquement)
 */
router.get('/users', async (req, res) => {
    try {
        console.log('🔍 [DEBUG ADMIN] Route /users appelée');
        console.log('🔍 [DEBUG ADMIN] Utilisateur admin:', req.adminUser.email);
        
        secureLogger.operation('admin_get_all_users', {
            adminUid: req.adminUser.uid
        });

        const db = admin.firestore();
        console.log('🔍 [DEBUG ADMIN] Connexion Firestore établie');
        
        const usersSnapshot = await db.collection('users').get();
        console.log('🔍 [DEBUG ADMIN] Nombre d\'utilisateurs trouvés:', usersSnapshot.size);
        
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                uid: doc.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role || 'user',
                isActive: userData.isActive,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin || null,
                sessionPolicy: userData.sessionPolicy || 'single'
            });
        });

        console.log('🔍 [DEBUG ADMIN] Utilisateurs formatés:', users.length);
        console.log('🔍 [DEBUG ADMIN] Envoi de la réponse JSON');

        res.json({
            success: true,
            users,
            count: users.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.log('🔍 [DEBUG ADMIN] Erreur dans la route /users:', error.message);
        secureLogger.error('Erreur récupération liste utilisateurs', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

/**
 * GET /api/admin/users/:uid/policy
 * Récupère la policy de session d'un utilisateur
 */
router.get('/users/:uid/policy', async (req, res) => {
    try {
        const { uid } = req.params;
        
        secureLogger.operation('admin_get_user_policy', {
            adminUid: req.adminUser.uid,
            targetUidHash: uid
        });

        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const userData = userDoc.data();
        const currentPolicy = userData.sessionPolicy || 'single';

        res.json({
            success: true,
            uid,
            currentPolicy,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        secureLogger.error('Erreur récupération policy utilisateur', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la policy' });
    }
});

module.exports = router;
