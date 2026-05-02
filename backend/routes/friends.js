const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/request', authMiddleware, friendsController.sendRequest);
router.get('/', authMiddleware, friendsController.getFriends);
router.get('/pending', authMiddleware, friendsController.getPendingRequests);
router.post('/accept', authMiddleware, friendsController.acceptRequest);
router.delete('/:friendId', authMiddleware, friendsController.removeFriend);

module.exports = router;
