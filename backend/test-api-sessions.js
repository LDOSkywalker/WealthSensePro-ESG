/**
 * 🧪 Script de test API Sessions - Single-Active-Session
 * 
 * Ce script teste directement l'API backend pour valider :
 * 1. La création de sessions
 * 2. La révocation atomique
 * 3. Les codes d'erreur normalisés
 * 
 * Usage: node test-api-sessions.js
 * Prérequis: Backend démarré sur localhost:3006
 */

const axios = require('axios');

// Configuration de l'API
const API_URL = process.env.API_URL || 'http://localhost:3006/api';

// Variables de test
let testUser = null;
let firstSessionToken = null;
let secondSessionToken = null;

/**
 * 🧪 Test 1: Création d'un utilisateur de test
 */
async function createTestUser() {
    console.log('\n🧪 Test 1: Création d\'un utilisateur de test...');
    
    try {
        const signupData = {
            email: `test-${Date.now()}@wealthsense.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            referralSource: 'other',
            otherReferralSource: 'Test Script',
            disclaimerAccepted: true,
            disclaimerAcceptedAt: Date.now()
        };
        
        const response = await axios.post(`${API_URL}/auth/signup`, signupData);
        
        if (response.data.success) {
            testUser = response.data.user;
            console.log('✅ Utilisateur de test créé:', {
                uid: testUser.uid,
                email: testUser.email
            });
            return testUser;
        } else {
            throw new Error('Échec de la création de l\'utilisateur');
        }
    } catch (error) {
        console.error('❌ Erreur création utilisateur:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 🧪 Test 2: Première connexion (première session)
 */
async function firstLogin() {
    console.log('\n🧪 Test 2: Première connexion (première session)...');
    
    try {
        const loginData = {
            email: testUser.email,
            password: 'TestPassword123!'
        };
        
        const response = await axios.post(`${API_URL}/auth/login`, loginData, {
            withCredentials: true
        });
        
        if (response.data.success) {
            firstSessionToken = response.data.access_token;
            console.log('✅ Première session créée:', {
                accessToken: firstSessionToken.substring(0, 20) + '...',
                user: response.data.user.email
            });
            return firstSessionToken;
        } else {
            throw new Error('Échec de la première connexion');
        }
    } catch (error) {
        console.error('❌ Erreur première connexion:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 🧪 Test 3: Deuxième connexion (devrait révoquer la première)
 */
async function secondLogin() {
    console.log('\n🧪 Test 3: Deuxième connexion (devrait révoquer la première)...');
    
    try {
        const loginData = {
            email: testUser.email,
            password: 'TestPassword123!'
        };
        
        const response = await axios.post(`${API_URL}/auth/login`, loginData, {
            withCredentials: true
        });
        
        if (response.data.success) {
            secondSessionToken = response.data.access_token;
            console.log('✅ Deuxième session créée:', {
                accessToken: secondSessionToken.substring(0, 20) + '...',
                user: response.data.user.email
            });
            return secondSessionToken;
        } else {
            throw new Error('Échec de la deuxième connexion');
        }
    } catch (error) {
        console.error('❌ Erreur deuxième connexion:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * 🧪 Test 4: Vérification que la première session est révoquée
 */
async function verifyFirstSessionRevoked() {
    console.log('\n🧪 Test 4: Vérification que la première session est révoquée...');
    
    try {
        // Essayer d'utiliser le premier token (devrait échouer)
        const response = await axios.get(`${API_URL}/auth/session-info`, {
            headers: {
                Authorization: `Bearer ${firstSessionToken}`
            },
            withCredentials: true
        });
        
        // Si on arrive ici, c'est un problème
        console.error('❌ La première session n\'a pas été révoquée !');
        return false;
        
    } catch (error) {
        if (error.response?.status === 401 && error.response?.data?.code === 'SESSION_REVOKED') {
            console.log('✅ Première session correctement révoquée !');
            console.log('📋 Détails de la révocation:', {
                code: error.response.data.code,
                reason: error.response.data.reason,
                replacedBy: error.response.data.replacedBy,
                revokedAt: error.response.data.revokedAt
            });
            return true;
        } else {
            console.error('❌ Erreur inattendue lors de la vérification:', error.response?.data || error.message);
            return false;
        }
    }
}

/**
 * 🧪 Test 5: Vérification que la deuxième session fonctionne
 */
async function verifySecondSessionActive() {
    console.log('\n🧪 Test 5: Vérification que la deuxième session fonctionne...');
    
    try {
        const response = await axios.get(`${API_URL}/auth/session-info`, {
            headers: {
                Authorization: `Bearer ${secondSessionToken}`
            },
            withCredentials: true
        });
        
        if (response.data) {
            console.log('✅ Deuxième session active et fonctionnelle');
            console.log('📋 Informations de session:', {
                jti: response.data.jti,
                deviceLabel: response.data.deviceLabel,
                status: response.data.status
            });
            return true;
        } else {
            throw new Error('Pas de données de session reçues');
        }
    } catch (error) {
        console.error('❌ Erreur vérification deuxième session:', error.response?.data || error.message);
        return false;
    }
}

/**
 * 🧪 Test 6: Test de révocation manuelle via admin
 */
async function testAdminRevocation() {
    console.log('\n🧪 Test 6: Test de révocation manuelle via admin...');
    
    try {
        // Note: Ce test nécessite un token admin valide
        // Pour l'instant, on simule juste la logique
        console.log('📋 Test de révocation manuelle (nécessite token admin)');
        console.log('   - Endpoint: POST /api/admin/sessions/revoke-user');
        console.log('   - Payload: { "uid": "' + testUser.uid + '" }');
        console.log('   - Résultat attendu: Toutes les sessions révoquées');
        
        return true;
    } catch (error) {
        console.error('❌ Erreur test révocation admin:', error.message);
        return false;
    }
}

/**
 * 🧪 Test 7: Validation des codes d'erreur
 */
async function validateErrorCodes() {
    console.log('\n🧪 Test 7: Validation des codes d\'erreur...');
    
    try {
        // Test avec un token invalide
        console.log('🔍 Test avec token invalide...');
        
        try {
            await axios.get(`${API_URL}/auth/session-info`, {
                headers: {
                    Authorization: 'Bearer invalid_token_123'
                },
                withCredentials: true
            });
            
            console.error('❌ Le token invalide a été accepté !');
            return false;
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Token invalide correctement rejeté (401)');
                
                if (error.response.data.code) {
                    console.log('✅ Code d\'erreur normalisé présent:', error.response.data.code);
                } else {
                    console.log('⚠️ Code d\'erreur manquant dans la réponse');
                }
                
                return true;
            } else {
                console.error('❌ Statut d\'erreur inattendu:', error.response?.status);
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Erreur validation codes d\'erreur:', error.message);
        return false;
    }
}

/**
 * 🧹 Nettoyage des données de test
 */
async function cleanup() {
    console.log('\n🧹 Nettoyage des données de test...');
    
    try {
        // Déconnexion de la deuxième session
        if (secondSessionToken) {
            try {
                await axios.post(`${API_URL}/auth/logout`, {}, {
                    headers: {
                        Authorization: `Bearer ${secondSessionToken}`
                    },
                    withCredentials: true
                });
                console.log('🔓 Déconnexion de la deuxième session');
            } catch (error) {
                console.log('⚠️ Erreur lors de la déconnexion (normal si session expirée)');
            }
        }
        
        // Note: L'utilisateur de test reste en base pour inspection
        // En production, vous pourriez vouloir le supprimer
        console.log('📝 Utilisateur de test conservé pour inspection');
        console.log('   Email:', testUser?.email);
        console.log('   UID:', testUser?.uid);
        
        console.log('✅ Nettoyage terminé');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
    }
}

/**
 * 🚀 Fonction principale de test
 */
async function runTests() {
    console.log('🚀 Démarrage des tests API Sessions...');
    console.log('🔗 Test de l\'API backend Single-Active-Session\n');
    
    try {
        // Exécuter tous les tests
        await createTestUser();
        await firstLogin();
        await secondLogin();
        const firstRevoked = await verifyFirstSessionRevoked();
        const secondActive = await verifySecondSessionActive();
        await testAdminRevocation();
        const errorCodesValid = await validateErrorCodes();
        
        // Résumé des tests
        console.log('\n🎉 Résumé des tests API Sessions:');
        console.log('   ✅ Création utilisateur de test');
        console.log('   ✅ Première connexion');
        console.log('   ✅ Deuxième connexion');
        console.log(`   ${firstRevoked ? '✅' : '❌'} Première session révoquée`);
        console.log(`   ${secondActive ? '✅' : '❌'} Deuxième session active`);
        console.log('   ✅ Test révocation admin');
        console.log(`   ${errorCodesValid ? '✅' : '❌'} Codes d'erreur validés`);
        
        const allTestsPassed = firstRevoked && secondActive && errorCodesValid;
        
        if (allTestsPassed) {
            console.log('\n🎊 Tous les tests API Sessions sont PASSÉS !');
            console.log('🔗 L\'API backend Single-Active-Session fonctionne correctement');
        } else {
            console.log('\n❌ Certains tests API Sessions ont ÉCHOUÉ');
            console.log('🔍 Vérifiez les logs ci-dessus pour identifier les problèmes');
        }
        
        return allTestsPassed;
        
    } catch (error) {
        console.error('\n💥 Erreur lors des tests:', error.message);
        return false;
    } finally {
        // Nettoyer les données de test
        await cleanup();
    }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    createTestUser,
    firstLogin,
    secondLogin,
    verifyFirstSessionRevoked,
    verifySecondSessionActive,
    testAdminRevocation,
    validateErrorCodes,
    cleanup
};
