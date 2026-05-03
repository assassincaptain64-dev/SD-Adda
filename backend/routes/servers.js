const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, serverController.createServer);
router.post('/join', authMiddleware, serverController.joinServer);
router.get('/', authMiddleware, serverController.getUserServers);
router.get('/:serverId', authMiddleware, serverController.getServerById);
router.post('/:serverId/kick/:userId', authMiddleware, serverController.kickFromServer);

module.exports = router;
