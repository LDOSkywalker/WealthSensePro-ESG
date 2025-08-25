const sessionManager = require('./sessionManager');
const { secureLogger } = require('./secureLogger');

class SessionCleanup {
    constructor() {
        this.cleanupInterval = null;
        this.cleanupIntervalMs = 60 * 60 * 1000; // 1 heure par défaut
    }

    /**
     * Démarre le nettoyage automatique des sessions
     */
    start(intervalMs = null) {
        if (this.cleanupInterval) {
            this.stop();
        }

        this.cleanupIntervalMs = intervalMs || this.cleanupIntervalMs;
        
        // Premier nettoyage immédiat
        this.performCleanup();
        
        // Puis nettoyage périodique
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.cleanupIntervalMs);

        secureLogger.info('Nettoyage automatique des sessions démarré', null, {
            intervalMs: this.cleanupIntervalMs
        });
    }

    /**
     * Arrête le nettoyage automatique
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            secureLogger.info('Nettoyage automatique des sessions arrêté');
        }
    }

    /**
     * Effectue le nettoyage des sessions expirées
     */
    async performCleanup() {
        try {
            const startTime = Date.now();
            const cleanedCount = await sessionManager.cleanupExpiredSessions();
            const duration = Date.now() - startTime;

            if (cleanedCount > 0) {
                secureLogger.info('Nettoyage des sessions terminé', null, {
                    cleanedCount,
                    durationMs: duration
                });
            }
        } catch (error) {
            secureLogger.error('Erreur lors du nettoyage des sessions', error);
        }
    }

    /**
     * Force un nettoyage immédiat
     */
    async forceCleanup() {
        try {
            secureLogger.info('Nettoyage forcé des sessions démarré');
            const cleanedCount = await sessionManager.cleanupExpiredSessions();
            secureLogger.info('Nettoyage forcé terminé', null, { cleanedCount });
            return cleanedCount;
        } catch (error) {
            secureLogger.error('Erreur lors du nettoyage forcé', error);
            throw error;
        }
    }

    /**
     * Obtient les statistiques des sessions
     */
    async getSessionStats() {
        try {
            const db = require('../firebase-config').admin.firestore();
            const sessionsRef = db.collection('sessions');
            
            const stats = {
                total: 0,
                active: 0,
                rotated: 0,
                revoked: 0,
                logged_out: 0
            };

            const snapshot = await sessionsRef.get();
            snapshot.forEach(doc => {
                const data = doc.data();
                stats.total++;
                if (data.status && stats.hasOwnProperty(data.status)) {
                    stats[data.status]++;
                }
            });

            return stats;
        } catch (error) {
            secureLogger.error('Erreur lors de la récupération des stats des sessions', error);
            throw error;
        }
    }
}

module.exports = new SessionCleanup();
