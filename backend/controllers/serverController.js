const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

exports.createServer = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    
    // Generate unique invite code
    const inviteCode = uuidv4().substring(0, 8);

    const server = new Server({
      name,
      description,
      icon,
      inviteCode,
      owner: req.user.id,
      members: [req.user.id]
    });

    await server.save();

    // Create default 'general' text channel
    const defaultChannel = new Channel({
      name: 'general',
      type: 'TEXT',
      server: server._id
    });
    await defaultChannel.save();

    server.channels.push(defaultChannel._id);
    await server.save();

    // Add server to user's servers list
    await User.findByIdAndUpdate(req.user.id, { $push: { servers: server._id } });

    res.status(201).json(server);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinServer = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const server = await Server.findOne({ inviteCode });

    if (!server) {
      return res.status(404).json({ message: 'Server not found or invalid invite code' });
    }

    if (server.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    server.members.push(req.user.id);
    await server.save();

    await User.findByIdAndUpdate(req.user.id, { $push: { servers: server._id } });

    res.json(server);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserServers = async (req, res) => {
  try {
    const Message = require('../models/Message');
    const user = await User.findById(req.user.id).populate({
      path: 'servers',
      populate: { path: 'channels' }
    });

    const serversWithUnread = await Promise.all(user.servers.map(async (server) => {
      let hasUnread = false;
      for (const ch of server.channels) {
        if (ch.type !== 'TEXT') continue;
        const lastSeen = user.lastSeen.get(ch._id.toString()) || new Date(0);
        const count = await Message.countDocuments({
          channel: ch._id,
          sender: { $ne: req.user.id },
          createdAt: { $gt: lastSeen }
        });
        if (count > 0) {
          hasUnread = true;
          break;
        }
      }
      return { ...server.toObject(), hasUnread };
    }));

    res.json(serversWithUnread);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getServerById = async (req, res) => {
  try {
    const server = await Server.findById(req.params.serverId).populate('channels').populate('members', 'username avatar status uid');
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    // Verify membership
    if (!server.members.some(m => m._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this server' });
    }

    const Message = require('../models/Message');
    const user = await User.findById(req.user.id);

    const channelsWithUnread = await Promise.all(server.channels.map(async (ch) => {
      if (ch.type !== 'TEXT') return ch.toObject();
      const lastSeen = user.lastSeen.get(ch._id.toString()) || new Date(0);
      const unreadCount = await Message.countDocuments({
        channel: ch._id,
        sender: { $ne: req.user.id },
        createdAt: { $gt: lastSeen }
      });
      return { ...ch.toObject(), unreadCount };
    }));

    res.json({ ...server.toObject(), channels: channelsWithUnread });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
