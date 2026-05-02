import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { Users, UserPlus, MessageSquare, Search, MoreVertical, Check, X, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api';
import ChatWorkspace from './ChatWorkspace';
import UserPanel from './UserPanel';

export default function Home() {
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversationId, setActiveConversation, fetchConversations, fetchDMMessages, socket, unreadConversations } = useAppStore();
  const [activeTab, setActiveTab] = useState('online');
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchUid, setSearchUid] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_URL}/friends`, { withCredentials: true });
      setFriends(res.data.friends);
    } catch (error) {
      console.error('Error fetching friends');
    }
  };

  const fetchPending = async () => {
    try {
        const res = await axios.get(`${API_URL}/friends/pending`, { withCredentials: true });
      setPending(res.data.pending);
    } catch (error) {
      console.error('Error fetching pending');
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchPending();
    fetchConversations();

    if (!socket) return;

    socket.on('user_status_change', ({ userId, status }) => {
      setFriends(prev => prev.map(f => f.id === userId ? { ...f, status } : f));
      // Sync status in conversations sidebar
      setConversations(conversations.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => p._id === userId ? { ...p, status } : p)
      })));
    });

    socket.on('friend_request_received', (sender) => {
      setPending(prev => [...prev, { _id: Date.now(), sender }]);
    });

    socket.on('friend_request_accepted', () => {
      fetchFriends();
      fetchPending();
    });

    socket.on('friend_removed', ({ friendId }) => {
      setFriends(prev => prev.filter(f => f.id !== friendId));
      fetchConversations();
      // If we are currently chatting with this person, kick us out to the friends tab
      const currentConv = conversations.find(c => c._id === activeConversationId);
      const isWithRemovedFriend = currentConv?.participants.some(p => p._id === friendId);
      if (isWithRemovedFriend) {
        setActiveConversation(null);
        setActiveTab('online');
      }
    });

    socket.on('user_update', ({ userId, avatar, username }) => {
      setFriends(prev => prev.map(f =>
        f.id === userId
          ? { ...f, avatar: avatar || f.avatar, username: username || f.username }
          : f
      ));
    });

    return () => {
      socket.off('user_status_change');
      socket.off('friend_request_received');
      socket.off('friend_request_accepted');
      socket.off('friend_removed');
    };
  }, [user.id, socket, conversations, setConversations]);

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await axios.delete(`${API_URL}/friends/${friendId}`, { withCredentials: true });
      socket.emit('remove_friend', { friendId, userId: user.id });
      setFriends(prev => prev.filter(f => f.id !== friendId));

      // Clear DM if active
      const currentConv = conversations.find(c => c._id === activeConversationId);
      if (currentConv?.participants.some(p => p._id === friendId)) {
        setActiveConversation(null);
        setActiveTab('online');
      }
      fetchConversations();
    } catch (error) {
      alert('Failed to remove friend');
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!searchUid) return;
    setLoading(true);
    try {
        const res = await axios.post(`${API_URL}/friends/request`, { receiverUid: searchUid }, { withCredentials: true });
      socket.emit('send_friend_request', { sender: user, receiverId: res.data.receiver.id });
      alert('Friend request sent!');
      setSearchUid('');
      setActiveTab('online');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send request');
    }
    setLoading(false);
  };

  const handleStartDM = async (friendId) => {
    try {
        const res = await axios.post(`${API_URL}/conversations`, { participantId: friendId }, { withCredentials: true });
      fetchConversations();
      setActiveConversation(res.data._id);
    } catch (error) {
      alert('Failed to start conversation');
    }
  };

  const handleAccept = async (id, senderId) => {
    try {
        await axios.post(`${API_URL}/friends/accept`, { friendshipId: id }, { withCredentials: true });
      socket.emit('accept_friend_request', { senderId, receiverId: user.id });
      fetchFriends();
      fetchPending();
    } catch (error) {
      alert('Failed to accept');
    }
  };

  return (
    <div className="flex flex-1 bg-[#313338] h-full overflow-hidden">
      {/* DM Sidebar (Left part of Home) */}
      <div className="w-60 bg-[#2B2D31] flex flex-col shrink-0">
        <div className="h-12 border-b border-[#1E1F22] flex items-center px-4 shadow-sm">
          <div className="w-full h-7 bg-[#1E1F22] rounded flex items-center px-2 text-xs text-gray-400">
            Find or start a conversation
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div
            onClick={() => {
              setActiveTab('online');
              setActiveConversation(null);
            }}
            className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${activeTab !== 'add' && !activeConversationId ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:bg-[#35373C] hover:text-gray-200'}`}
          >
            <Users size={20} className="mr-3" />
            <span className="font-medium">Friends</span>
          </div>

          <div className="pt-4 pb-2 px-3 text-xs font-bold text-gray-400 uppercase flex justify-between items-center group">
            Direct Messages
          </div>

          <div className="space-y-0.5">
            {conversations.map(conv => {
              const otherParticipant = conv.participants.find(p => p._id !== user.id);
              if (!otherParticipant) return null;
              const unreadCount = unreadConversations[conv._id] || 0;
              const isUnread = unreadCount > 0 && activeConversationId !== conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConversation(conv._id)}
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer group transition-colors relative ${activeConversationId === conv._id ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:bg-[#35373C] hover:text-gray-200'}`}
                >
                  {isUnread && (
                    <div className="absolute left-[-4px] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]" />
                  )}
                  {isUnread && (
                    <div className="absolute right-2 bg-indigo-500 text-white text-[10px] px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold border-2 border-[#2B2D31]">
                      {unreadCount}
                    </div>
                  )}
                  <div className="relative mr-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {otherParticipant.avatar ? <img src={otherParticipant.avatar} className="w-full h-full object-cover" /> : otherParticipant.username.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2B2D31] ${otherParticipant.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${isUnread ? 'font-bold text-gray-100' : 'font-medium'}`}>{otherParticipant.username}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <UserPanel />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversationId ? (
          <div className="flex-1 flex flex-col min-h-0">
            {(() => {
              const conv = conversations.find(c => c._id === activeConversationId);
              const other = conv?.participants.find(p => p._id !== user.id);
              if (!other) return null;
              return <ChatWorkspace isDM={true} channel={{ id: conv._id, name: other.username }} />;
            })()}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-12 border-b border-[#1E1F22] flex items-center px-4 justify-between shadow-sm shrink-0">
              <div className="flex items-center">
                <Users size={24} className="text-gray-400 mr-2" />
                <span className="font-bold text-white mr-4">Friends</span>

                <div className="h-6 w-[1px] bg-gray-600 mx-2" />

                <div className="flex space-x-4 ml-4">
                  <button
                    onClick={() => setActiveTab('online')}
                    className={`px-2 py-0.5 rounded text-sm font-medium ${activeTab === 'online' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:bg-[#3F4147] hover:text-gray-200'}`}
                  >
                    Online
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-2 py-0.5 rounded text-sm font-medium ${activeTab === 'all' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:bg-[#3F4147] hover:text-gray-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-2 py-0.5 rounded text-sm font-medium relative ${activeTab === 'pending' ? 'bg-[#3F4147] text-white' : 'text-gray-400 hover:bg-[#3F4147] hover:text-gray-200'}`}
                  >
                    Pending
                    {pending.length > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#313338]">
                        {pending.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('add')}
                    className={`px-2 py-0.5 rounded text-sm font-medium ${activeTab === 'add' ? 'bg-green-600 text-white' : 'text-green-500 hover:text-green-400'}`}
                  >
                    Add Friend
                  </button>
                </div>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'add' ? (
                <div className="max-w-xl">
                  <h2 className="text-white font-bold mb-2 uppercase text-sm">Add Friend</h2>
                  <p className="text-gray-400 text-sm mb-4">You can add friends with their SD-Adda UID. It's case sensitive!</p>

                  <form onSubmit={handleSendRequest} className="relative">
                    <input
                      type="text"
                      value={searchUid}
                      onChange={(e) => setSearchUid(e.target.value)}
                      placeholder="Enter a UID (e.g. AD-XXXX)"
                      className="w-full bg-[#1E1F22] text-white px-4 py-3 rounded-lg border border-black/20 focus:outline-none focus:border-sagar-blue"
                    />
                    <button
                      disabled={loading || !searchUid}
                      className="absolute right-2 top-2 bg-sagar-blue text-white px-4 py-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send Friend Request'}
                    </button>
                  </form>
                </div>
              ) : activeTab === 'pending' ? (
                <div>
                  <h2 className="text-gray-400 font-bold mb-4 uppercase text-xs">Pending — {pending.length}</h2>
                  <div className="space-y-2">
                    {pending.map(p => (
                      <div key={p._id} className="flex items-center justify-between p-3 hover:bg-[#3F4147] rounded-lg group border-t border-gray-700/50">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3 overflow-hidden">
                            {p.sender.avatar ? <img src={p.sender.avatar} className="w-full h-full object-cover" /> : p.sender.username.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white font-bold">{p.sender.username}</div>
                            <div className="text-gray-400 text-xs">Incoming Friend Request</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(p._id, p.sender._id)} className="w-9 h-9 rounded-full bg-[#2B2D31] text-green-500 hover:text-white hover:bg-green-600 flex items-center justify-center transition-colors">
                            <Check size={20} />
                          </button>
                          <button className="w-9 h-9 rounded-full bg-[#2B2D31] text-red-500 hover:text-white hover:bg-red-600 flex items-center justify-center transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-gray-400 font-bold mb-4 uppercase text-xs">
                    {activeTab === 'online' ? `Online — ${friends.filter(f => f.status === 'online').length}` : `All Friends — ${friends.length}`}
                  </h2>
                  <div className="space-y-1">
                    {friends.filter(f => activeTab === 'all' || f.status === 'online').map(friend => (
                      <div key={friend.id}
                        onClick={() => handleStartDM(friend.id)}
                        className="flex items-center justify-between p-3 hover:bg-[#3F4147] rounded-lg group cursor-pointer border-t border-gray-700/50"
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-3 overflow-hidden">
                              {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : friend.username.charAt(0)}
                            </div>
                            <div className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-[#313338] ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                          </div>
                          <div>
                            <div className="text-white font-bold">{friend.username}</div>
                            <div className="text-gray-400 text-xs uppercase">{friend.status}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartDM(friend.id); }}
                            className="w-9 h-9 rounded-full bg-[#2B2D31] text-gray-300 hover:text-white flex items-center justify-center"
                            title="Message"
                          >
                            <MessageSquare size={20} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFriend(friend.id); }}
                            className="w-9 h-9 rounded-full bg-[#2B2D31] text-red-500 hover:text-white hover:bg-red-600 flex items-center justify-center"
                            title="Remove Friend"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

