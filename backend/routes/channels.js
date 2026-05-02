const express = require('express');
const router = express.Router({ mergeParams: true }); // to access serverId from parent router if needed
const channelController = require('../controllers/channelController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/server/:serverId', authMiddleware, channelController.createChannel);
router.get('/:channelId/messages', authMiddleware, channelController.getChannelMessages);

module.exports = router;
