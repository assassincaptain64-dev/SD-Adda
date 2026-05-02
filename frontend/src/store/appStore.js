import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';

axios.defaults.withCredentials = true;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useAppStore = create((set, get) => ({
  socket: null,
  servers: [],
  activeServerId: null,
  activeChannelId: null,
  channels: [],
  messages: [],
  isHome: true, // Default to Home/DMs view
  activeConversationId: null,
  conversations: [],
  unreadChannels: {}, // channelId -> count
  unreadConversations: {}, // conversationId -> count
  voiceUsers: {}, // channelId -> [users]
  currentVoiceChannelId: null, // Track global voice session
  
  setIsHome: (val) => set({ isHome: val, activeServerId: val ? null : get().activeServerId, activeConversationId: null }),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => {
    set({ activeConversationId: id, activeChannelId: null });
    // Remove from unread when clicking
    const newUnread = { ...get().unreadConversations };
    delete newUnread[id];
    set({ unreadConversations: newUnread });
    if (id) get().fetchDMMessages(id);
  },

  initSocket: (userId) => {
    if (get().socket) return;
    const socket = io(SOCKET_URL, { withCredentials: true });
    socket.emit('user_connected', userId);
    
    socket.on('receive_message', (message) => {
      const state = get();
      const currentChannelId = state.activeChannelId;
      const currentConvId = state.activeConversationId;
      
      const targetId = message.channel || message.conversation;
      const isDM = !!message.conversation;

      // If message is for currently active view, add it to messages list
      if (targetId === currentChannelId || targetId === currentConvId) {
        set(state => ({ messages: [...state.messages, message] }));
      } else {
        // Otherwise, mark as unread
        if (isDM) {
          const newUnread = { ...state.unreadConversations };
          newUnread[targetId] = (newUnread[targetId] || 0) + 1;
          set({ unreadConversations: newUnread });
        } else {
          const newUnread = { ...state.unreadChannels };
          newUnread[targetId] = (newUnread[targetId] || 0) + 1;
          set({ unreadChannels: newUnread });
        }
      }

      // If it's a DM and we don't have this conversation in our list, refresh the list
      if (isDM && !state.conversations.some(c => c._id === message.conversation)) {
        get().fetchConversations();
      }
    });

    socket.on('user_update', ({ userId, avatar, username }) => {
      // Update messages
      set(state => ({
        messages: state.messages.map(msg => 
          msg.sender._id === userId 
            ? { ...msg, sender: { ...msg.sender, avatar: avatar || msg.sender.avatar, username: username || msg.sender.username } } 
            : msg
        )
      }));
      // Update conversations
      set(state => ({
        conversations: state.conversations.map(conv => ({
          ...conv,
          participants: conv.participants.map(p => 
            p._id === userId 
              ? { ...p, avatar: avatar || p.avatar, username: username || p.username } 
              : p
          )
        }))
      }));
      // Note: setFriends is in Home.jsx, we might need to handle it there too or move it here
    });

    socket.on('channel_created', ({ serverId, channel }) => {
      if (get().activeServerId === serverId) {
        set(state => ({ channels: [...state.channels, channel] }));
      }
    });

    socket.on('message_updated', (updatedMsg) => {
      set(state => ({
        messages: state.messages.map(m => m._id === updatedMsg._id ? updatedMsg : m)
      }));
    });

    socket.on('message_deleted', ({ messageId }) => {
      set(state => ({
        messages: state.messages.filter(m => m._id !== messageId)
      }));
    });

    socket.on('voice_users_update', ({ channelId, users }) => {
      set(state => ({
        voiceUsers: { ...state.voiceUsers, [channelId]: users }
      }));
    });

    // Request initial voice state
    socket.emit('request_voice_state');

    set({ socket });
  },

  joinVoice: (channelId) => {
    const { socket, currentVoiceChannelId } = get();
    const { user } = useAuthStore.getState();
    if (currentVoiceChannelId === channelId) return;
    
    if (currentVoiceChannelId) get().leaveVoice();
    
    set({ currentVoiceChannelId: channelId });
    if (socket) {
      socket.emit('join_voice', { channelId, user: { id: user.id, username: user.username, avatar: user.avatar } });
    }
  },

  leaveVoice: () => {
    const { socket, currentVoiceChannelId } = get();
    const { user } = useAuthStore.getState();
    if (!currentVoiceChannelId) return;
    
    if (socket) {
      socket.emit('leave_voice', { channelId: currentVoiceChannelId, userId: user.id });
    }
    set({ currentVoiceChannelId: null });
  },

  disconnectSocket: () => {
    if (get().socket) {
      get().socket.disconnect();
      set({ socket: null });
    }
  },
  
  fetchServers: async () => {
    try {
      const res = await axios.get(`${API_URL}/servers`);
      set({ servers: res.data });
      if (res.data.length > 0 && !get().activeServerId && !get().isHome) {
        set({ activeServerId: res.data[0]._id });
        get().fetchServerDetails(res.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  },

  createServer: async (name, description) => {
    try {
      const res = await axios.post(`${API_URL}/servers`, { name, description });
      set(state => ({ servers: [...state.servers, res.data], activeServerId: res.data._id }));
      get().fetchServerDetails(res.data._id);
      return res.data;
    } catch (error) {
      console.error('Error creating server:', error);
    }
  },

  joinServer: async (inviteCode) => {
    try {
      const res = await axios.post(`${API_URL}/servers/join`, { inviteCode });
      set(state => ({ servers: [...state.servers, res.data], activeServerId: res.data._id }));
      get().fetchServerDetails(res.data._id);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  fetchServerDetails: async (serverId) => {
    try {
      const res = await axios.get(`${API_URL}/servers/${serverId}`);
      set({ channels: res.data.channels, activeServerId: serverId });
      if (res.data.channels.length > 0) {
        set({ activeChannelId: res.data.channels[0]._id });
        if(res.data.channels[0].type === 'TEXT') {
          get().fetchMessages(res.data.channels[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching server details:', error);
    }
  },

  setActiveChannel: (id, type) => {
    set({ activeChannelId: id, activeConversationId: null, isHome: false });
    // Remove from unread when clicking
    const newUnread = { ...get().unreadChannels };
    delete newUnread[id];
    set({ unreadChannels: newUnread });
    if (type === 'TEXT') {
      get().fetchMessages(id);
    }
  },

  fetchMessages: async (channelId) => {
    try {
      const res = await axios.get(`${API_URL}/channels/${channelId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  },

  addMessage: (message) => {
    set(state => ({ messages: [...state.messages, message] }));
  },

  fetchConversations: async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations`);
      set({ conversations: res.data });
    } catch (error) {
      console.error('Error fetching conversations');
    }
  },

  fetchDMMessages: async (conversationId) => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      console.error('Error fetching DM messages');
    }
  }
}));
