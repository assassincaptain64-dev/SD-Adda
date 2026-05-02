const Friendship = require('../models/Friendship');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.sendRequest = async (req, res) => {
  try {
    const { receiverUid } = req.body;
    const receiver = await User.findOne({ uid: receiverUid });
    
    if (!receiver) return res.status(404).json({ message: 'User not found' });
    if (receiver._id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot friend yourself' });

    const existing = await Friendship.findOne({
      $or: [
        { sender: req.user.id, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user.id }
      ]
    });

    if (existing) return res.status(400).json({ message: 'Friendship already exists or pending' });

    const friendship = new Friendship({ sender: req.user.id, receiver: receiver._id });
    await friendship.save();
    res.json({ message: 'Friend request sent', receiver: { id: receiver._id, username: receiver.username } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friends = await Friendship.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
      status: 'accepted'
    }).populate('sender receiver', 'username avatar uid status');

    const formattedFriends = friends.map(f => {
      const friend = f.sender._id.toString() === req.user.id ? f.receiver : f.sender;
      return {
        id: friend._id,
        username: friend.username,
        avatar: friend.avatar,
        uid: friend.uid,
        status: friend.status
      };
    });

    res.json({ friends: formattedFriends });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const pending = await Friendship.find({
      receiver: req.user.id,
      status: 'pending'
    }).populate('sender', 'username avatar uid');
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { friendshipId } = req.body;
    await Friendship.findByIdAndUpdate(friendshipId, { status: 'accepted' });
    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // Delete friendship
    await Friendship.findOneAndDelete({
      $or: [
        { sender: req.user.id, receiver: friendId },
        { sender: friendId, receiver: req.user.id }
      ]
    });

    // Find and delete conversation
    const conversation = await Conversation.findOneAndDelete({
      participants: { $all: [req.user.id, friendId] }
    });

    if (conversation) {
      // Delete all messages in that conversation
      await Message.deleteMany({ conversation: conversation._id });
    }

    res.json({ message: 'Friend removed and conversation cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
