const { admin } = require('../firebase-config');
const { secureLogger } = require('./secureLogger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.db = admin.firestore();
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.REFRESH_EXPIRATION = '7d';
        this.ACCESS_EXPIRATION = '15m';
    }

    /**
     * Génère un JTI (JWT ID) unique pour identifier le token
     */
    generateJTI() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Génère un deviceId basé sur l'IP et le User-Agent
     */
    generateDeviceId(req) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        const deviceString = `${ip}-${userAgent}`;
        return crypto.createHash('sha256').update(deviceString).digest('hex');
    }

    /**
     * Crée une nouvelle session avec refresh token rotatif
     */
    async createSession(uid, email, req) {
        try {
            const jti = this.generateJTI();
            const deviceId = this.generateDeviceId(req);
            const now = Date.now();

            // Créer le refresh token avec JTI et deviceId
            const refreshToken = jwt.sign(
                { 
                    sub: uid, 
                    jti, 
                    typ: 'refresh', 
                    dev: deviceId,
                    email,
                    loginTime: now
                }, 
                this.JWT_SECRET, 
                { 
                    algorithm: 'HS256', 
                    expiresIn: this.REFRESH_EXPIRATION 
                }
            );

            // Stocker la session en base
            await this.db.collection('sessions').doc(jti).set({
                uid,
                deviceId,
                email,
                status: 'active',
                createdAt: now,
                lastUsed: now,
                tokenFamily: deviceId
            });

            // Créer l'access token
            const accessToken = jwt.sign(
                { 
                    uid, 
                    email,
                    type: 'access',
                    loginTime: now,
                    sessionId: jti
                },
                this.JWT_SECRET,
                { expiresIn: this.ACCESS_EXPIRATION }
            );

            secureLogger.info('Nouvelle session créée', null, {
                uidHash: uid,
                deviceIdHash: deviceId,
                jtiHash: jti
            });

            return {
                accessToken,
                refreshToken,
                deviceId,
                jti
            };
        } catch (error) {
            secureLogger.error('Erreur création session', error);
            throw error;
        }
    }

    /**
     * Rafraîchit un access token avec rotation du refresh token
     */
    async refreshSession(prevRefreshToken, req) {
        try {
            // Vérifier le refresh token précédent
            const decoded = jwt.verify(prevRefreshToken, this.JWT_SECRET);
            
            if (decoded.typ !== 'refresh') {
                throw new Error('Token invalide - type incorrect');
            }

            const { jti: prevJti, dev: deviceId, sub: uid } = decoded;

            // Vérifier la session en base
            const sessionDoc = await this.db.collection('sessions').doc(prevJti).get();
            
            if (!sessionDoc.exists) {
                secureLogger.security('Tentative de réutilisation de refresh token inexistant', {
                    jtiHash: prevJti,
                    deviceIdHash: deviceId,
                    uidHash: uid
                });
                await this.revokeFamily(deviceId);
                throw new Error('Session invalide');
            }

            const sessionData = sessionDoc.data();
            
            if (sessionData.status !== 'active') {
                secureLogger.security('Tentative de réutilisation de refresh token révoqué', {
                    jtiHash: prevJti,
                    deviceIdHash: deviceId,
                    uidHash: uid,
                    status: sessionData.status
                });
                await this.revokeFamily(deviceId);
                throw new Error('Session révoquée');
            }

            // Marquer l'ancien token comme "rotated"
            await this.db.collection('sessions').doc(prevJti).update({ 
                status: 'rotated',
                rotatedAt: Date.now()
            });

            // Créer un nouveau refresh token
            const newJti = this.generateJTI();
            const now = Date.now();

            const newRefreshToken = jwt.sign(
                { 
                    sub: uid, 
                    jti: newJti, 
                    typ: 'refresh', 
                    dev: deviceId,
                    email: sessionData.email,
                    loginTime: now
                }, 
                this.JWT_SECRET, 
                { 
                    algorithm: 'HS256', 
                    expiresIn: this.REFRESH_EXPIRATION 
                }
            );

            // Créer la nouvelle session
            await this.db.collection('sessions').doc(newJti).set({
                uid,
                deviceId,
                email: sessionData.email,
                status: 'active',
                createdAt: now,
                lastUsed: now,
                tokenFamily: deviceId,
                rotatedFrom: prevJti
            });

            // Créer le nouvel access token
            const newAccessToken = jwt.sign(
                { 
                    uid, 
                    email: sessionData.email,
                    type: 'access',
                    loginTime: now,
                    sessionId: newJti
                },
                this.JWT_SECRET,
                { expiresIn: this.ACCESS_EXPIRATION }
            );

            secureLogger.info('Session rafraîchie avec succès', null, {
                uidHash: uid,
                deviceIdHash: deviceId,
                oldJtiHash: prevJti,
                newJtiHash: newJti
            });

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                deviceId
            };
        } catch (error) {
            secureLogger.error('Erreur refresh session', error);
            throw error;
        }
    }

    /**
     * Révoque toute la famille de tokens pour un deviceId
     */
    async revokeFamily(deviceId) {
        try {
            const sessionsRef = this.db.collection('sessions');
            const query = sessionsRef.where('deviceId', '==', deviceId);
            const snapshot = await query.get();

            const batch = this.db.batch();
            let revokedCount = 0;

            snapshot.forEach(doc => {
                batch.update(doc.ref, { 
                    status: 'revoked',
                    revokedAt: Date.now(),
                    reason: 'family_revocation'
                });
                revokedCount++;
            });

            await batch.commit();

            secureLogger.security('Famille de tokens révoquée', {
                deviceIdHash: deviceId,
                revokedCount
            });

            return revokedCount;
        } catch (error) {
            secureLogger.error('Erreur révocation famille', error);
            throw error;
        }
    }

    /**
     * Déconnecte un utilisateur en révoquant sa session actuelle
     */
    async logoutUser(uid, deviceId) {
        try {
            const sessionsRef = this.db.collection('sessions');
            const query = sessionsRef.where('uid', '==', uid).where('deviceId', '==', deviceId);
            const snapshot = await query.get();

            const batch = this.db.batch();
            let loggedOutCount = 0;

            snapshot.forEach(doc => {
                batch.update(doc.ref, { 
                    status: 'logged_out',
                    loggedOutAt: Date.now()
                });
                loggedOutCount++;
            });

            await batch.commit();

            secureLogger.info('Utilisateur déconnecté', null, {
                uidHash: uid,
                deviceIdHash: deviceId,
                loggedOutCount
            });

            return loggedOutCount;
        } catch (error) {
            secureLogger.error('Erreur logout utilisateur', error);
            throw error;
        }
    }

    /**
     * Nettoie les anciennes sessions expirées
     */
    async cleanupExpiredSessions() {
        try {
            const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 jours
            const sessionsRef = this.db.collection('sessions');
            const query = sessionsRef.where('createdAt', '<', cutoff);
            const snapshot = await query.get();

            const batch = this.db.batch();
            let cleanedCount = 0;

            snapshot.forEach(doc => {
                batch.delete(doc.ref);
                cleanedCount++;
            });

            if (cleanedCount > 0) {
                await batch.commit();
                secureLogger.info('Nettoyage des sessions expirées', null, { cleanedCount });
            }

            return cleanedCount;
        } catch (error) {
            secureLogger.error('Erreur nettoyage sessions', error);
            throw error;
        }
    }

    /**
     * Vérifie le statut d'une session
     */
    async validateSession(jti) {
        try {
            const sessionDoc = await this.db.collection('sessions').doc(jti).get();
            
            if (!sessionDoc.exists) {
                return { valid: false, reason: 'session_not_found' };
            }

            const sessionData = sessionDoc.data();
            
            if (sessionData.status !== 'active') {
                return { valid: false, reason: `session_${sessionData.status}` };
            }

            return { 
                valid: true, 
                session: sessionData 
            };
        } catch (error) {
            secureLogger.error('Erreur validation session', error);
            return { valid: false, reason: 'validation_error' };
        }
    }
}

module.exports = new SessionManager();
