const Channel = require('../models/Channel');
const Server = require('../models/Server');
const Message = require('../models/Message');

exports.createChannel = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, type } = req.body; // type: 'TEXT' | 'VOICE'

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: 'Server not found' });

    // Verify owner (only owner can create channels for now)
    if (server.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only server owner can create channels' });
    }

    const channel = new Channel({
      name,
      type,
      server: serverId
    });

    await channel.save();
    server.channels.push(channel._id);
    await server.save();

    const io = req.app.get('io');
    // Important: Emit to everyone so all online members of the server see the new channel instantly
    io.emit('channel_created', { serverId, channel });

    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const limit = parseInt(req.query.limit) || 25;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'username avatar uid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Update lastSeen for user
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      [`lastSeen.${channelId}`]: new Date()
    });

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
