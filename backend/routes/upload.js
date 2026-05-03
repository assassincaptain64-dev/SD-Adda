const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 30 * 1024 * 1024 } }); // 30MB limit

router.post('/avatar', authMiddleware, upload.single('image'), uploadController.uploadAvatar);
router.post('/image', authMiddleware, upload.single('image'), uploadController.uploadImage);

module.exports = router;
