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
     * Génère un label d'appareil non-PII basé sur le User-Agent
     */
    generateDeviceLabel(req) {
        const userAgent = req.get('User-Agent') || 'unknown';
        
        // Extraction simple du navigateur et OS sans PII
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'Mac';
        if (userAgent.includes('iPhone')) return 'iPhone';
        if (userAgent.includes('Android')) return 'Android';
        
        return 'Appareil';
    }

    /**
     * Détermine si une session doit être révoquée selon la policy
     * MODIFICATION : Tous les rôles ont maintenant la policy 'single' par défaut
     */
    mustRevokeAccordingToPolicy(sessionData, userRole) {
        // Policy par défaut : single session pour TOUS les utilisateurs
        const policy = this.getSessionPolicy(userRole);
        
        if (policy === 'unlimited') return false;
        if (policy === 'two') {
            // Pour 2 sessions, révoquer seulement si on dépasse
            return true; // Sera géré dans la logique de création
        }
        
        // Policy 'single' : toujours révoquer les autres (comportement par défaut)
        return true;
    }

    /**
     * Récupère la policy de session selon le rôle et la configuration personnalisée
     */
    async getSessionPolicy(uid, userRole = 'user') {
        try {
            // Vérifier d'abord s'il y a une policy personnalisée en base
            const userDoc = await this.db.collection('users').doc(uid).get();
            if (userDoc.exists && userDoc.data().sessionPolicy) {
                return userDoc.data().sessionPolicy;
            }
            
            // Fallback sur les policies par défaut selon le rôle
            // MODIFICATION : Tous les rôles ont maintenant la policy 'single' par défaut
            const defaultPolicies = {
                'admin': 'single',        // ← CHANGÉ : était 'unlimited'
                'support': 'single',      // ← CHANGÉ : était 'unlimited'
                'advisor': 'single',      // ← CHANGÉ : était 'two'
                'user': 'single'
            };
            
            return defaultPolicies[userRole] || 'single';
        } catch (error) {
            secureLogger.error('Erreur récupération policy session', error);
            // En cas d'erreur, retourner la policy la plus restrictive
            return 'single';
        }
    }

    /**
     * Crée une nouvelle session avec refresh token rotatif et révocation atomique
     */
    async createSession(uid, email, req, userRole = 'user') {
        try {
            const jti = this.generateJTI();
            const deviceId = this.generateDeviceId(req);
            const deviceLabel = this.generateDeviceLabel(req);
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

            // RÉVOCATION ATOMIQUE : Créer la nouvelle session ET révoquer les autres en transaction
            await this.db.runTransaction(async (tx) => {
                // 1. Récupérer d'abord toutes les sessions actives du même utilisateur
                const activeSessionsQuery = this.db.collection('sessions')
                    .where('uid', '==', uid)
                    .where('status', '==', 'active');
                
                const activeSessions = await tx.get(activeSessionsQuery);
                
                // 2. Créer la nouvelle session
                const newSessionRef = this.db.collection('sessions').doc(jti);
                const newSession = {
                    uid,
                    deviceId,
                    deviceLabel,
                    email,
                    status: 'active',
                    reason: null,
                    replacedBy: null,
                    createdAt: now,
                    revokedAt: null,
                    lastUsed: now,
                    tokenFamily: deviceId
                };
                
                tx.set(newSessionRef, newSession);

                // 3. Révoquer les sessions selon la policy
                let revokedCount = 0;
                const policy = await this.getSessionPolicy(uid, userRole);
                console.log('🔍 [DEBUG SESSION] Policy de session:', policy);
                
                // MODIFICATION : Tous les rôles ont maintenant la policy 'single' par défaut
                if (policy === 'single') {
                    // Policy single : révoquer toutes les autres sessions (comportement par défaut)
                    activeSessions.docs.forEach(doc => {
                        if (doc.id !== jti) {
                            tx.update(doc.ref, {
                                status: 'revoked',
                                reason: 'replaced',
                                replacedBy: jti,
                                revokedAt: now
                            });
                            revokedCount++;
                        }
                    });
                } else if (policy === 'two') {
                    // Policy two : révoquer seulement si on dépasse 2 sessions
                    if (activeSessions.docs.length >= 2) {
                        // Révoquer la plus ancienne
                        const sortedSessions = activeSessions.docs
                            .filter(doc => doc.id !== jti)
                            .sort((a, b) => a.data().createdAt - b.data().createdAt);
                        
                        if (sortedSessions.length > 0) {
                            tx.update(sortedSessions[0].ref, {
                                status: 'revoked',
                                reason: 'replaced',
                                replacedBy: jti,
                                revokedAt: now
                            });
                            revokedCount++;
                        }
                    }
                }
                // Policy unlimited : aucune révocation (maintenant optionnelle uniquement)

                secureLogger.info('Révocation atomique effectuée', null, {
                    uidHash: uid,
                    newJtiHash: jti,
                    revokedCount,
                    policy
                });
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

            secureLogger.info('Nouvelle session créée avec révocation atomique', null, {
                uidHash: uid,
                deviceIdHash: deviceId,
                jtiHash: jti,
                deviceLabel
            });

            return {
                accessToken,
                refreshToken,
                deviceId,
                jti,
                deviceLabel
            };
        } catch (error) {
            secureLogger.error('Erreur création session avec révocation atomique', error);
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
     * Vérifie le statut d'une session avec codes d'erreur normalisés
     */
    async validateSession(jti) {
        try {
            const sessionDoc = await this.db.collection('sessions').doc(jti).get();
            
            if (!sessionDoc.exists) {
                return { 
                    valid: false, 
                    code: 'SESSION_NOT_FOUND',
                    reason: 'session_not_found' 
                };
            }

            const sessionData = sessionDoc.data();
            
            if (sessionData.status === 'revoked') {
                return { 
                    valid: false, 
                    code: 'SESSION_REVOKED',
                    reason: sessionData.reason || 'revoked',
                    replacedBy: sessionData.replacedBy,
                    revokedAt: sessionData.revokedAt
                };
            }
            
            if (sessionData.status === 'rotated') {
                return { 
                    valid: false, 
                    code: 'SESSION_ROTATED',
                    reason: 'session_rotated' 
                };
            }
            
            if (sessionData.status !== 'active') {
                return { 
                    valid: false, 
                    code: 'SESSION_INVALID',
                    reason: `session_${sessionData.status}` 
                };
            }

            return { 
                valid: true, 
                session: sessionData 
            };
        } catch (error) {
            secureLogger.error('Erreur validation session', error);
            return { 
                valid: false, 
                code: 'VALIDATION_ERROR',
                reason: 'validation_error' 
            };
        }
    }
}

module.exports = new SessionManager();
