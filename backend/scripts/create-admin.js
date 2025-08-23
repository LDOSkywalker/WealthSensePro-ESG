#!/usr/bin/env node

/**
 * Script d'initialisation sécurisé pour créer le premier administrateur
 * 
 * Usage: node scripts/create-admin.js --email=admin@example.com --role=admin
 * 
 * SÉCURITÉ : Ce script ne peut être exécuté qu'une seule fois
 * Une fois qu'un admin existe, utilisez l'interface admin pour en créer d'autres
 * 
 * ⚠️  ATTENTION SÉCURITÉ CRITIQUE :
 * Ce script vérifie uniquement la présence d'admins dans Firestore.
 * En cas de suppression manuelle d'un admin, le script pourrait être réutilisé.
 * NE JAMAIS SUPPRIMER MANUELLEMENT UN ADMIN DEPUIS FIRESTORE.
 */

const { admin, db } = require('../firebase-config');
const { secureLogger } = require('../utils/secureLogger');

// Configuration des couleurs pour la console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

/**
 * Vérifie si des administrateurs existent déjà
 */
async function checkExistingAdmins() {
    try {
        log.info('Vérification des administrateurs existants...');
        
        const existingAdmins = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        if (existingAdmins.size > 0) {
            log.error('Des administrateurs existent déjà !');
            log.warning(`Nombre d'admins trouvés : ${existingAdmins.size}`);
            
            // Afficher les admins existants
            existingAdmins.forEach(doc => {
                const data = doc.data();
                log.info(`- ${data.email} (${data.firstName} ${data.lastName})`);
            });
            
            log.warning('Utilisez l\'interface admin pour créer d\'autres administrateurs.');
            log.warning('Ce script est réservé à l\'initialisation du premier admin.');
            
            return false;
        }
        
        log.success('Aucun administrateur trouvé. Le script peut continuer.');
        return true;
    } catch (error) {
        log.error(`Erreur lors de la vérification : ${error.message}`);
        return false;
    }
}

/**
 * Crée un nouvel administrateur
 */
async function createAdmin(email, role = 'admin') {
    try {
        log.info(`Création de l'administrateur : ${email} (${role})`);
        
        // Vérifier que l'utilisateur existe dans Firebase Auth
        log.info('Vérification de l\'existence de l\'utilisateur...');
        const userRecord = await admin.auth().getUserByEmail(email);
        
        if (!userRecord) {
            log.error(`L'utilisateur ${email} n'existe pas dans Firebase Auth`);
            log.warning('L\'utilisateur doit d\'abord s\'inscrire via l\'application');
            return false;
        }
        
        log.success(`Utilisateur trouvé : ${userRecord.uid}`);
        
        // Vérifier si l'utilisateur existe déjà dans Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        
        if (!userDoc.exists) {
            log.error(`L'utilisateur ${email} n'existe pas dans Firestore`);
            log.warning('L\'utilisateur doit d\'abord compléter son profil');
            return false;
        }
        
        const userData = userDoc.data();
        log.info(`Profil trouvé : ${userData.firstName} ${userData.lastName}`);
        
        // Mettre à jour le rôle
        log.info('Mise à jour du rôle...');
        await db.collection('users').doc(userRecord.uid).update({
            role: role,
            adminCreatedAt: Date.now(),
            adminCreatedBy: 'SYSTEM_INIT',
            updatedAt: Date.now()
        });
        
        log.success(`Rôle mis à jour avec succès : ${role}`);
        
        // Log de l'opération
        secureLogger.operation('admin_created_via_script', {
            email: email,
            role: role,
            uid: userRecord.uid,
            firstName: userData.firstName,
            lastName: userData.lastName
        });
        
        return true;
    } catch (error) {
        log.error(`Erreur lors de la création de l'admin : ${error.message}`);
        return false;
    }
}

/**
 * Fonction principale
 */
async function main() {
    try {
        log.header('🔐 SCRIPT DE CRÉATION D\'ADMINISTRATEUR - WEALTHSENSE PRO');
        log.info('Vérification de la sécurité...');
        
        // Récupération des paramètres
        const email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1];
        const role = process.argv.find(arg => arg.startsWith('--role='))?.split('=')[1] || 'admin';
        
        // Validation des paramètres
        if (!email) {
            log.error('Email requis !');
            log.info('Usage: node scripts/create-admin.js --email=admin@example.com --role=admin');
            process.exit(1);
        }
        
        if (!email.includes('@')) {
            log.error('Email invalide !');
            process.exit(1);
        }
        
        // Vérification des rôles autorisés
        const allowedRoles = ['admin', 'support', 'advisor'];
        if (!allowedRoles.includes(role)) {
            log.error(`Rôle invalide : ${role}`);
            log.info(`Rôles autorisés : ${allowedRoles.join(', ')}`);
            process.exit(1);
        }
        
        log.info(`Paramètres validés :`);
        log.info(`- Email : ${email}`);
        log.info(`- Rôle : ${role}`);
        
        // Vérification des administrateurs existants
        const canProceed = await checkExistingAdmins();
        if (!canProceed) {
            process.exit(1);
        }
        
        // Création de l'administrateur
        const success = await createAdmin(email, role);
        if (success) {
            log.header('🎉 ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !');
            log.success(`L'utilisateur ${email} est maintenant ${role}`);
            log.info('Vous pouvez maintenant vous connecter à l\'interface admin');
            log.warning('Ce script ne peut plus être utilisé. Supprimez-le du serveur.');
        } else {
            log.error('Échec de la création de l\'administrateur');
            process.exit(1);
        }
        
    } catch (error) {
        log.error(`Erreur fatale : ${error.message}`);
        process.exit(1);
    }
}

// Exécution du script
if (require.main === module) {
    main();
}

module.exports = { createAdmin, checkExistingAdmins };
