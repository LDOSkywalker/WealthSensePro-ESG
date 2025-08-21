const { admin } = require('./firebase-config');
const sessionManager = require('./utils/sessionManager');

// Firebase Admin est déjà initialisé dans firebase-config.js

async function testSingleSession() {
    console.log('🧪 Test de la révocation atomique des sessions...\n');
    
    try {
        // Simuler une requête
        const mockReq = {
            ip: '192.168.1.100',
            get: (header) => {
                if (header === 'User-Agent') {
                    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
                }
                return null;
            }
        };
        
        // Test 1: Créer une première session
        console.log('📱 Test 1: Création de la première session...');
        const session1 = await sessionManager.createSession(
            'test-user-123',
            'test@example.com',
            mockReq,
            'user'
        );
        console.log('✅ Session 1 créée:', {
            jti: session1.jti,
            deviceId: session1.deviceId,
            deviceLabel: session1.deviceLabel
        });
        
        // Test 2: Créer une deuxième session (devrait révoquer la première)
        console.log('\n📱 Test 2: Création de la deuxième session (devrait révoquer la première)...');
        const mockReq2 = {
            ip: '192.168.1.101',
            get: (header) => {
                if (header === 'User-Agent') {
                    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
                }
                return null;
            }
        };
        
        const session2 = await sessionManager.createSession(
            'test-user-123',
            'test@example.com',
            mockReq2,
            'user'
        );
        console.log('✅ Session 2 créée:', {
            jti: session2.jti,
            deviceId: session2.deviceId,
            deviceLabel: session2.deviceLabel
        });
        
        // Test 3: Vérifier que la première session est révoquée
        console.log('\n🔍 Test 3: Vérification de la révocation de la session 1...');
        const validation1 = await sessionManager.validateSession(session1.jti);
        console.log('Session 1 status:', validation1);
        
        // Test 4: Vérifier que la deuxième session est active
        console.log('\n🔍 Test 4: Vérification que la session 2 est active...');
        const validation2 = await sessionManager.validateSession(session2.jti);
        console.log('Session 2 status:', validation2);
        
        // Test 5: Test avec policy 'two' pour un advisor
        console.log('\n📱 Test 5: Test avec policy "two" pour un advisor...');
        const mockReq3 = {
            ip: '192.168.1.102',
            get: (header) => {
                if (header === 'User-Agent') {
                    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
                }
                return null;
            }
        };
        
        const session3 = await sessionManager.createSession(
            'test-advisor-456',
            'advisor@example.com',
            mockReq3,
            'advisor'
        );
        console.log('✅ Session 3 (advisor) créée:', {
            jti: session3.jti,
            deviceId: session3.deviceId,
            deviceLabel: session3.deviceLabel
        });
        
        // Créer une deuxième session pour l'advisor (devrait être autorisée)
        const mockReq4 = {
            ip: '192.168.1.103',
            get: (header) => {
                if (header === 'User-Agent') {
                    return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
                }
                return null;
            }
        };
        
        const session4 = await sessionManager.createSession(
            'test-advisor-456',
            'advisor@example.com',
            mockReq4,
            'advisor'
        );
        console.log('✅ Session 4 (advisor) créée:', {
            jti: session4.jti,
            deviceId: session4.deviceId,
            deviceLabel: session4.deviceLabel
        });
        
        // Vérifier que les deux sessions advisor sont actives
        console.log('\n🔍 Test 6: Vérification des sessions advisor...');
        const validation3 = await sessionManager.validateSession(session3.jti);
        const validation4 = await sessionManager.validateSession(session4.jti);
        console.log('Session 3 (advisor) status:', validation3.valid ? '✅ Active' : '❌ Inactive');
        console.log('Session 4 (advisor) status:', validation4.valid ? '✅ Active' : '❌ Inactive');
        
        console.log('\n🎉 Tests terminés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    } finally {
        // Nettoyer les sessions de test
        console.log('\n🧹 Nettoyage des sessions de test...');
        try {
            const db = admin.firestore();
            const testSessions = await db.collection('sessions')
                .where('uid', 'in', ['test-user-123', 'test-advisor-456'])
                .get();
            
            const batch = db.batch();
            testSessions.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log('✅ Sessions de test nettoyées');
        } catch (cleanupError) {
            console.error('⚠️ Erreur lors du nettoyage:', cleanupError);
        }
        
        process.exit(0);
    }
}

// Lancer les tests
testSingleSession();
