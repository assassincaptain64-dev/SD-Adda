const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'sd-adda/avatars',
      transformation: [
        { width: 256, height: 256, crop: 'fill' }
      ]
    });

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    const io = req.app.get('io');
    io.emit('user_update', { userId: updatedUser._id, avatar: updatedUser.avatar });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'sd-adda/chat_images',
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};
