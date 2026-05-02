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
    const user = await User.findById(req.user.id).populate('servers');
    res.json(user.servers);
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

    res.json(server);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
