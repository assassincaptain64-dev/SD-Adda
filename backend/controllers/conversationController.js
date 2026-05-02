const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    }).populate('participants', 'username avatar uid status').sort({ updatedAt: -1 });

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
      const lastSeen = user.lastSeen.get(conv._id.toString()) || new Date(0);
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user.id },
        createdAt: { $gt: lastSeen }
      });
      return { ...conv.toObject(), unreadCount };
    }));

    res.json(conversationsWithUnread);
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
      
    // Update lastSeen for user
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      [`lastSeen.${conversationId}`]: new Date()
    });

    // Return in chronological order for frontend
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
