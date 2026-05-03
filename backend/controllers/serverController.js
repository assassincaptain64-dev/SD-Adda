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

    const user = await User.findById(req.user.id).select('username avatar status uid');
    const io = req.app.get('io');
    io.emit('member_joined_server', { serverId: server._id, member: user });

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

exports.kickFromServer = async (req, res) => {
  try {
    const { serverId, userId } = req.params;
    
    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    // Check if requester is owner
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the server owner can kick members' });
    }
    
    // Check if target is owner
    if (userId === server.owner.toString()) {
      return res.status(400).json({ message: 'Cannot kick the server owner' });
    }
    
    // Remove from server
    server.members = server.members.filter(m => m.toString() !== userId);
    await server.save();
    
    // Remove from user
    await User.findByIdAndUpdate(userId, { $pull: { servers: serverId } });
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('kicked_from_server', { serverId, userId });
    
    res.json({ message: 'User kicked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, icon } = req.body;
    
    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can update server' });
    }
    
    if (name) server.name = name;
    if (icon !== undefined) server.icon = icon;
    
    await server.save();
    
    const io = req.app.get('io');
    io.emit('server_updated', server);
    
    res.json(server);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only owner can delete server' });
    }
    
    // Remove server from all users
    await User.updateMany(
      { servers: serverId },
      { $pull: { servers: serverId } }
    );
    
    // Get all channel IDs before deleting them to kick voice users
    const serverChannels = await Channel.find({ server: serverId });
    const channelIds = serverChannels.map(c => c._id.toString());

    // Delete all channels associated with this server
    await Channel.deleteMany({ server: serverId });
    
    // Delete the server
    await Server.findByIdAndDelete(serverId);
    
    const io = req.app.get('io');
    io.emit('server_deleted', { serverId, channelIds });
    
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
