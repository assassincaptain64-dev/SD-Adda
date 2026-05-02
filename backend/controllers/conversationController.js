const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).populate('participants', 'username avatar uid status').sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] }
    }).populate('participants', 'username avatar uid status');

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, participantId]
      });
      await conversation.save();
      conversation = await Conversation.findById(conversation._id).populate('participants', 'username avatar uid status');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDMMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 25;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username avatar uid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Return in chronological order for frontend
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
