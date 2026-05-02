const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const User = require('./models/User');
const Message = require('./models/Message');
const ServerModel = require('./models/Server');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  }
});
app.set('io', io);

// Middleware
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const channelRoutes = require('./routes/channels');
const uploadRoutes = require('./routes/upload');
const friendsRoutes = require('./routes/friends');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('SD-Adda API is running');
});

// Socket.io connection


const onlineUsers = new Map(); // userId -> socketId
const voiceChannels = new Map(); // channelId -> Map of { userId, username, avatar }

io.on('connection', (socket) => {
  socket.on('user_connected', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { status: 'online' });
    io.emit('user_status_change', { userId, status: 'online' });

    // Auto-join all rooms for indicators
    try {
      const user = await User.findById(userId).populate('servers');
      if (user) {
        // Join server channel rooms
        const servers = await ServerModel.find({ _id: { $in: user.servers } }).populate('channels');
        servers.forEach(server => {
          server.channels.forEach(ch => {
            socket.join(ch._id.toString());
          });
        });

        // Join conversation rooms
        const conversations = await Conversation.find({ participants: userId });
        conversations.forEach(conv => {
          socket.join(conv._id.toString());
        });
      }
    } catch (err) {
      console.error('Error auto-joining rooms:', err);
    }
  });

  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        content: data.content,
        sender: data.senderId,
        channel: data.isDM ? null : data.channelId,
        conversation: data.isDM ? data.channelId : null,
        attachments: data.attachments || []
      });
      await newMessage.save();
      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username avatar uid');
      
      if (!data.isDM) {
        // Server channel: Emit to room
        io.to(data.channelId).emit('receive_message', populatedMessage);
      } else {
        // DM: Emit to BOTH participants directly if online
        const conv = await Conversation.findById(data.channelId);
        if (conv) {
          conv.participants.forEach(p => {
            const socketId = onlineUsers.get(p.toString());
            if (socketId) {
              io.to(socketId).emit('receive_message', populatedMessage);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // Friend Request Events
  socket.on('send_friend_request', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend_request_received', data.sender);
    }
  });

  socket.on('accept_friend_request', (data) => {
    const senderSocketId = onlineUsers.get(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('friend_request_accepted', { userId: data.receiverId });
    }
  });

  socket.on('remove_friend', (data) => {
    const friendSocketId = onlineUsers.get(data.friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit('friend_removed', { friendId: data.userId });
    }
  });

  // Typing Events
  socket.on('typing_start', (data) => {
    // data = { targetId, senderName, channelId }
    socket.to(data.channelId).emit('user_typing_start', { 
      senderName: data.senderName, 
      channelId: data.channelId 
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.channelId).emit('user_typing_stop', { 
      channelId: data.channelId 
    });
  });

  // Voice Channel Events
  socket.on('request_voice_state', () => {
    voiceChannels.forEach((usersMap, channelId) => {
      socket.emit('voice_users_update', { 
        channelId, 
        users: Array.from(usersMap.values()) 
      });
    });
  });

  socket.on('join_voice', (data) => {
    const { channelId, user } = data;
    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }
    voiceChannels.get(channelId).set(user.id, { id: user.id, username: user.username, avatar: user.avatar });
    
    // Broadcast updated list to EVERYONE
    io.emit('voice_users_update', { 
      channelId, 
      users: Array.from(voiceChannels.get(channelId).values()) 
    });
  });

  socket.on('leave_voice', (data) => {
    const { channelId, userId } = data;
    if (voiceChannels.has(channelId)) {
      voiceChannels.get(channelId).delete(userId);
      io.emit('voice_users_update', { 
        channelId, 
        users: Array.from(voiceChannels.get(channelId).values()) 
      });
    }
  });

  socket.on('disconnect', async () => {
    let disconnectedUserId = null;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      await User.findByIdAndUpdate(disconnectedUserId, { status: 'offline' });
      io.emit('user_status_change', { userId: disconnectedUserId, status: 'offline' });

      // Clean up voice channels
      voiceChannels.forEach((usersMap, channelId) => {
        if (usersMap.has(disconnectedUserId)) {
          usersMap.delete(disconnectedUserId);
          io.emit('voice_users_update', { 
            channelId, 
            users: Array.from(usersMap.values()) 
          });
        }
      });
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
