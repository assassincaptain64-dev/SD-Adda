const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/:messageId', authMiddleware, messageController.updateMessage);
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);
router.post('/read/:targetId', authMiddleware, messageController.markAsRead);

module.exports = router;
