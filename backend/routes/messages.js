const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

// GET /api/messages/:conversationId
router.get('/:conversationId', authMiddleware, async (req, res) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('messages')
            .where('conversationId', '==', req.params.conversationId)
            .orderBy('timestamp', 'asc')
            .get();
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/messages
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { conversationId, content, sender } = req.body;
        const db = admin.firestore();
        const docRef = await db.collection('messages').add({
            conversationId,
            content,
            sender,
            timestamp: Date.now()
        });
        const newMsg = await docRef.get();
        res.json({ id: newMsg.id, ...newMsg.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 