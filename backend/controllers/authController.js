const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate unique 8-character ID
const generateUID = () => {
  return 'AD-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 3).toUpperCase();
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = generateUID();

    const user = new User({
      uid,
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ user: { id: user._id, uid: user.uid, username: user.username, email: user.email, avatar: user.avatar, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.status = 'online';
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user._id, uid: user.uid, username: user.username, email: user.email, avatar: user.avatar, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await User.findByIdAndUpdate(decoded.id, { status: 'offline' });
    }
  } catch (err) {
    console.error('Error during logout status update', err);
  }

  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, uid: user.uid, username: user.username, email: user.email, avatar: user.avatar, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getUnreadSummary = async (req, res) => {
  try {
    const Message = require('../models/Message');
    const Channel = require('../models/Channel');
    const Conversation = require('../models/Conversation');
    
    const user = await User.findById(req.user.id).populate({
      path: 'servers',
      populate: { path: 'channels' }
    });

    const unreadChannels = {};
    const unreadConversations = {};

    // Check all channels in all servers
    for (const server of user.servers) {
      for (const ch of server.channels) {
        if (ch.type !== 'TEXT') continue;
        const lastSeen = user.lastSeen.get(ch._id.toString()) || new Date(0);
        const count = await Message.countDocuments({
          channel: ch._id,
          sender: { $ne: req.user.id },
          createdAt: { $gt: lastSeen }
        });
        if (count > 0) unreadChannels[ch._id] = count;
      }
    }

    // Check all conversations
    const conversations = await Conversation.find({ participants: req.user.id });
    for (const conv of conversations) {
      const lastSeen = user.lastSeen.get(conv._id.toString()) || new Date(0);
      const count = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user.id },
        createdAt: { $gt: lastSeen }
      });
      if (count > 0) unreadConversations[conv._id] = count;
    }

    res.json({ unreadChannels, unreadConversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
