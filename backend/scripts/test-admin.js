#!/usr/bin/env node

/**
 * Script de test pour vérifier la création de l'administrateur
 * Usage: node scripts/test-admin.js
 */

const { admin, db } = require('../firebase-config');

async function testAdminCreation() {
    try {
        console.log('🔍 Test de vérification de l\'administrateur...\n');
        
        // Vérifier les administrateurs existants
        const admins = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        console.log(`📊 Nombre d'administrateurs trouvés : ${admins.size}\n`);
        
        if (admins.size > 0) {
            console.log('👥 Liste des administrateurs :');
            admins.forEach(doc => {
                const data = doc.data();
                console.log(`\n🔐 ID: ${doc.id}`);
                console.log(`📧 Email: ${data.email}`);
                console.log(`👤 Nom: ${data.firstName} ${data.lastName}`);
                console.log(`🎭 Rôle: ${data.role}`);
                console.log(`📅 Créé le: ${new Date(data.adminCreatedAt).toLocaleString()}`);
                console.log(`⚙️  Créé par: ${data.adminCreatedBy}`);
                console.log(`🔄 Mis à jour: ${new Date(data.updatedAt).toLocaleString()}`);
            });
        } else {
            console.log('❌ Aucun administrateur trouvé');
        }
        
        // Vérifier les utilisateurs avec d'autres rôles
        console.log('\n🔍 Vérification des autres rôles...\n');
        
        const roles = ['support', 'advisor', 'user'];
        for (const role of roles) {
            const users = await db.collection('users')
                .where('role', '==', role)
                .get();
            
            if (users.size > 0) {
                console.log(`👥 Utilisateurs avec le rôle '${role}': ${users.size}`);
                users.forEach(doc => {
                    const data = doc.data();
                    console.log(`  - ${data.email} (${data.firstName} ${data.lastName})`);
                });
            }
        }
        
        console.log('\n✅ Test terminé avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

// Exécution du test
if (require.main === module) {
    testAdminCreation();
}

module.exports = { testAdminCreation };
