#!/usr/bin/env node

/**
 * Script de nettoyage pour supprimer le script de création d'admin
 * Usage: node scripts/cleanup-admin-script.js
 * 
 * ATTENTION : Ce script supprime définitivement le script create-admin.js
 * Utilisez-le uniquement après avoir créé votre premier administrateur
 */

const fs = require('fs');
const path = require('path');

async function cleanupAdminScript() {
    try {
        console.log('🧹 Script de nettoyage du script de création d\'admin...\n');
        
        const scriptPath = path.join(__dirname, 'create-admin.js');
        const testPath = path.join(__dirname, 'test-admin.js');
        const cleanupPath = path.join(__dirname, 'cleanup-admin-script.js');
        
        // Vérifier que le script existe
        if (!fs.existsSync(scriptPath)) {
            console.log('❌ Le script create-admin.js n\'existe pas ou a déjà été supprimé');
            return;
        }
        
        console.log('⚠️  ATTENTION : Vous êtes sur le point de supprimer le script de création d\'admin');
        console.log('⚠️  Cette action est IRREVERSIBLE !');
        console.log('⚠️  Assurez-vous d\'avoir créé votre premier administrateur\n');
        
        // Demander confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('Êtes-vous sûr de vouloir supprimer le script ? (oui/non): ', (answer) => {
            if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o') {
                try {
                    // Supprimer le script principal
                    fs.unlinkSync(scriptPath);
                    console.log('✅ Script create-admin.js supprimé avec succès');
                    
                    // Supprimer le script de test
                    if (fs.existsSync(testPath)) {
                        fs.unlinkSync(testPath);
                        console.log('✅ Script test-admin.js supprimé avec succès');
                    }
                    
                    // Supprimer ce script de nettoyage
                    if (fs.existsSync(cleanupPath)) {
                        fs.unlinkSync(cleanupPath);
                        console.log('✅ Script de nettoyage supprimé avec succès');
                    }
                    
                    console.log('\n🎉 Nettoyage terminé !');
                    console.log('📝 Les scripts ont été supprimés du serveur');
                    console.log('🔐 Utilisez maintenant l\'interface admin pour gérer les utilisateurs');
                    
                } catch (error) {
                    console.error('❌ Erreur lors de la suppression:', error.message);
                }
            } else {
                console.log('🔄 Opération annulée. Les scripts sont conservés.');
            }
            
            rl.close();
        });
        
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error.message);
    }
}

// Exécution du script
if (require.main === module) {
    cleanupAdminScript();
}

module.exports = { cleanupAdminScript };
