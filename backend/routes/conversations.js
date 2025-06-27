const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

// GET /api/conversations?userId=...
router.get('/', authMiddleware, async (req, res) => {
    console.log('📥 GET /api/conversations - Début');
    try {
        const userId = req.query.userId;
        console.log('👤 UserID recherché:', userId);
        if (!userId) return res.status(400).json({ error: 'userId requis' });
        const db = admin.firestore();
        const snapshot = await db.collection('conversations').where('userId', '==', userId).orderBy('updatedAt', 'desc').get();
        const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ ${conversations.length} conversations trouvées`);
        res.json(conversations);
    } catch (error) {
        console.error('❌ Erreur GET /api/conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/conversations
router.post('/', authMiddleware, async (req, res) => {
    console.log('📥 POST /api/conversations - Début');
    console.log('📦 Body reçu:', req.body);
    console.log('🔑 User dans la requête:', req.user);
    
    try {
        const { userId, title, topic, createdAt, updatedAt } = req.body;
        const db = admin.firestore();
        
        const conversationData = {
            userId: userId || req.user.uid,
            title,
            topic,
            createdAt: createdAt || new Date().toISOString(),
            updatedAt: updatedAt || new Date().toISOString()
        };
        
        console.log('📝 Données de la conversation à créer:', conversationData);
        
        const docRef = await db.collection('conversations').add(conversationData);
        console.log('✅ Conversation créée avec ID:', docRef.id);
        
        const newConv = await docRef.get();
        const response = { id: newConv.id, ...newConv.data() };
        console.log('📤 Réponse envoyée:', response);
        
        res.json(response);
    } catch (error) {
        console.error('❌ Erreur POST /api/conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/conversations/:id
router.put('/:id', authMiddleware, async (req, res) => {
    console.log('📥 PUT /api/conversations/:id - Début');
    try {
        const { title } = req.body;
        const db = admin.firestore();
        await db.collection('conversations').doc(req.params.id).update({
            title,
            updatedAt: new Date().toISOString()
        });
        console.log('✅ Conversation mise à jour:', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erreur PUT /api/conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/conversations/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    console.log('📥 DELETE /api/conversations/:id - Début');
    try {
        const db = admin.firestore();
        await db.collection('conversations').doc(req.params.id).delete();
        console.log('✅ Conversation supprimée:', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erreur DELETE /api/conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 