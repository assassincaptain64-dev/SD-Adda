const Message = require('../models/Message');

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Verify sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'username avatar uid');
    
    const io = req.app.get('io');
    const targetId = message.channel || message.conversation;
    io.emit('message_updated', populatedMessage);

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Verify sender (or could be server owner, but keeping it simple for now)
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get('io');
    const targetId = message.channel || message.conversation;
    io.emit('message_deleted', { messageId, targetId });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
