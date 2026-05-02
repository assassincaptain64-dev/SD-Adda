const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, conversationController.getConversations);
router.post('/', authMiddleware, conversationController.getOrCreateConversation);
router.get('/:conversationId/messages', authMiddleware, conversationController.getDMMessages);

module.exports = router;
