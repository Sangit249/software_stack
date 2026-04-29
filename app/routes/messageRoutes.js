const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/messages', messageController.getConversations);
router.get('/messages/:sessionId', messageController.getConversation);
router.post('/messages/:sessionId', messageController.postMessage);

module.exports = router;