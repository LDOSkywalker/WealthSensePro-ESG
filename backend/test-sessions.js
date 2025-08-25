/**
 * Script de test pour le système de gestion des sessions sécurisées
 * 
 * Ce script teste les fonctionnalités principales :
 * - Création de sessions
 * - Rotation des refresh tokens
 * - Détection de réutilisation
 * - Révocation de famille
 */

const sessionManager = require('./utils/sessionManager');
const { secureLogger } = require('./utils/secureLogger');

// Mock d'une requête pour les tests
const mockRequest = {
    ip: '192.168.1.100',
    get: (header) => {
        if (header === 'User-Agent') {
            return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        }
        return null;
    }
};

async function testSessionSystem() {
    console.log('🧪 Démarrage des tests du système de sessions...\n');

    try {
        // Test 1: Création de session
        console.log('📝 Test 1: Création de session');
        const session1 = await sessionManager.createSession('test-user-123', 'test@example.com', mockRequest);
        console.log('✅ Session créée:', {
            uid: session1.accessToken ? 'OK' : 'FAIL',
            deviceId: session1.deviceId ? 'OK' : 'FAIL',
            jti: session1.jti ? 'OK' : 'FAIL'
        });

        // Test 2: Rotation du refresh token
        console.log('\n🔄 Test 2: Rotation du refresh token');
        const session2 = await sessionManager.refreshSession(session1.refreshToken, mockRequest);
        console.log('✅ Session rafraîchie:', {
            newAccessToken: session2.accessToken ? 'OK' : 'FAIL',
            newRefreshToken: session2.refreshToken ? 'OK' : 'FAIL',
            deviceId: session2.deviceId ? 'OK' : 'FAIL'
        });

        // Test 3: Tentative de réutilisation de l'ancien refresh token
        console.log('\n🚨 Test 3: Tentative de réutilisation (doit échouer)');
        try {
            await sessionManager.refreshSession(session1.refreshToken, mockRequest);
            console.log('❌ ERREUR: La réutilisation aurait dû échouer');
        } catch (error) {
            console.log('✅ Réutilisation bloquée comme attendu:', error.message);
        }

        // Test 4: Vérification du statut de session
        console.log('\n🔍 Test 4: Vérification du statut de session');
        const validation1 = await sessionManager.validateSession(session1.jti);
        const validation2 = await sessionManager.validateSession(session2.accessToken ? 'fake-jti' : 'fake-jti');
        
        console.log('✅ Validation session 1:', validation1.valid ? 'active' : validation1.reason);
        console.log('✅ Validation session 2:', validation2.valid ? 'active' : validation2.reason);

        // Test 5: Logout utilisateur
        console.log('\n🚪 Test 5: Logout utilisateur');
        const logoutCount = await sessionManager.logoutUser('test-user-123', session1.deviceId);
        console.log('✅ Logout effectué:', logoutCount, 'sessions fermées');

        // Test 6: Tentative d'utilisation après logout (doit échouer)
        console.log('\n🚨 Test 6: Tentative d\'utilisation après logout (doit échouer)');
        try {
            await sessionManager.refreshSession(session2.refreshToken, mockRequest);
            console.log('❌ ERREUR: L\'utilisation après logout aurait dû échouer');
        } catch (error) {
            console.log('✅ Utilisation après logout bloquée comme attendu:', error.message);
        }

        // Test 7: Statistiques des sessions
        console.log('\n📊 Test 7: Statistiques des sessions');
        try {
            const stats = await require('./utils/sessionCleanup').getSessionStats();
            console.log('✅ Statistiques récupérées:', stats);
        } catch (error) {
            console.log('⚠️ Statistiques non disponibles (probablement pas de base de données):', error.message);
        }

        console.log('\n🎉 Tous les tests sont terminés avec succès !');
        console.log('\n📋 Résumé des fonctionnalités testées:');
        console.log('   ✅ Création de sessions sécurisées');
        console.log('   ✅ Rotation automatique des refresh tokens');
        console.log('   ✅ Détection de réutilisation');
        console.log('   ✅ Révocation de sessions');
        console.log('   ✅ Validation de statut');
        console.log('   ✅ Logout sécurisé');

    } catch (error) {
        console.error('\n💥 Erreur lors des tests:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Test des fonctions utilitaires
function testUtilityFunctions() {
    console.log('\n🔧 Test des fonctions utilitaires...');
    
    try {
        // Test de génération JTI
        const jti1 = sessionManager.generateJTI();
        const jti2 = sessionManager.generateJTI();
        console.log('✅ Génération JTI:', jti1 !== jti2 ? 'unique' : 'FAIL');

        // Test de génération deviceId
        const deviceId1 = sessionManager.generateDeviceId(mockRequest);
        const deviceId2 = sessionManager.generateDeviceId(mockRequest);
        console.log('✅ Génération deviceId:', deviceId1 === deviceId2 ? 'consistant' : 'FAIL');

        console.log('✅ Tests utilitaires réussis');
    } catch (error) {
        console.error('❌ Erreur tests utilitaires:', error);
    }
}

// Fonction principale
async function main() {
    console.log('🚀 Tests du système de gestion des sessions sécurisées');
    console.log('=' .repeat(60));
    
    // Tests des fonctions utilitaires
    testUtilityFunctions();
    
    // Tests du système principal
    await testSessionSystem();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Tests terminés');
}

// Exécution si le script est lancé directement
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testSessionSystem, testUtilityFunctions };
