import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Hash, Volume2, Plus, UserMinus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api';
import UserPanel from './UserPanel';

export default function ChannelList() {
  const { servers, activeServerId, channels, activeChannelId, setActiveChannel, fetchServerDetails, unreadChannels, voiceUsers, joinVoice, socket } = useAppStore();
  const { user } = useAuthStore();
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('TEXT');

  const handleVoiceClick = (id) => {
    setActiveChannel(id, 'VOICE');
    joinVoice(id);
  };

  const activeServer = servers.find(s => s._id === activeServerId);

  const textChannels = channels.filter(c => c.type === 'TEXT');
  const voiceChannels = channels.filter(c => c.type === 'VOICE');

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (channelName && activeServerId) {
      try {
            await axios.post(`${API_URL}/channels/server/${activeServerId}`, {
          name: channelName,
          type: channelType
        });
        await fetchServerDetails(activeServerId);
        setShowAddChannel(false);
        setChannelName('');
      } catch (error) {
        alert(error.response?.data?.message || 'Error creating channel');
      }
    }
  };

  return (
    <div className="w-60 bg-[#1E1F22]/80 backdrop-blur-xl border-r border-white/5 flex flex-col h-full shrink-0 relative z-10">
      <div className="h-16 flex flex-col justify-center px-4 border-b border-[#1E1F22] shadow-sm">
        <h2 className="font-bold text-white truncate">{activeServer?.name || 'Server'}</h2>
        {activeServer?.inviteCode && (
          <div className="flex items-center text-xs text-gray-400 mt-1 cursor-pointer hover:text-gray-200" 
               onClick={() => {
                 navigator.clipboard.writeText(activeServer.inviteCode);
                 alert(`Invite code copied: ${activeServer.inviteCode}`);
               }}>
            <span className="font-mono bg-black/20 px-1 rounded">Code: {activeServer.inviteCode}</span>
            <span className="ml-2 text-[10px] opacity-0 hover:opacity-100">(Click to copy)</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 custom-scrollbar">
        {/* Text Channels */}
        <div>
          <div className="flex items-center justify-between text-gray-400 hover:text-gray-200 px-1 mb-1 group cursor-pointer">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Text Channels</h3>
            {activeServer?.owner === user.id && (
              <Plus size={16} onClick={() => { setChannelType('TEXT'); setShowAddChannel(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="space-y-[2px]">
            {textChannels.map(channel => (
              <div 
                key={channel._id}
                onClick={() => setActiveChannel(channel._id, 'TEXT')}
                className={`flex items-center px-2 py-2 rounded-md cursor-pointer group relative transition-all duration-300
                  ${activeChannelId === channel._id ? 'bg-gradient-to-r from-sagar-blue/20 to-transparent text-white border-l-2 border-sagar-blue' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'}
                `}
              >
                {unreadChannels[channel._id] > 0 && activeChannelId !== channel._id && (
                  <div className="absolute right-2 bg-indigo-500 text-white text-[10px] px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold border-2 border-[#2B2D31]">
                    {unreadChannels[channel._id]}
                  </div>
                )}
                {unreadChannels[channel._id] > 0 && activeChannelId !== channel._id && (
                  <div className="absolute left-[-4px] w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white]" />
                )}
                <Hash size={18} className="mr-1.5 text-gray-400 group-hover:text-gray-300" />
                <span className={`truncate ${unreadChannels[channel._id] > 0 && activeChannelId !== channel._id ? 'font-bold text-gray-100' : ''}`}>
                  {channel.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Channels */}
        <div>
          <div className="flex items-center justify-between text-gray-400 hover:text-gray-200 px-1 mb-1 group cursor-pointer mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider">Voice Channels</h3>
            {activeServer?.owner === user.id && (
              <Plus size={16} onClick={() => { setChannelType('VOICE'); setShowAddChannel(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <div className="space-y-[2px]">
            {voiceChannels.map(channel => (
              <div key={channel._id}>
                <div 
                  onClick={() => handleVoiceClick(channel._id)}
                  className={`flex items-center px-2 py-2 rounded-md cursor-pointer group transition-all duration-300 relative
                    ${activeChannelId === channel._id ? 'bg-gradient-to-r from-green-500/20 to-transparent text-white border-l-2 border-green-500' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'}
                  `}
                >
                  <Volume2 size={18} className="mr-1.5 text-gray-400 group-hover:text-gray-300" />
                  <span className="truncate">{channel.name}</span>
                </div>
                {/* Voice Users List */}
                <div className="ml-8 mt-1 space-y-1 mb-2">
                  {voiceUsers[channel._id]?.map(vUser => (
                    <div key={vUser.id} className="flex items-center justify-between text-xs text-gray-300 py-1.5 px-2 rounded hover:bg-white/5 transition-colors group/user">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md border border-white/10 group-hover/user:border-white/30 transition-colors">
                          {vUser.avatar ? <img src={vUser.avatar} className="w-full h-full object-cover" /> : vUser.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate group-hover/user:text-white transition-colors drop-shadow-md">{vUser.username}</span>
                      </div>
                      {activeServer?.owner === user.id && vUser.id !== user.id && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(window.confirm('Kick from voice?')) {
                              socket.emit('kick_from_voice', { channelId: channel._id, targetUserId: vUser.id });
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover/user:opacity-100 transition-opacity shrink-0"
                          title="Kick from Voice"
                        >
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UserPanel />

      {/* Add Channel Modal */}

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glassmorphism p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-white">Create {channelType === 'TEXT' ? 'Text' : 'Voice'} Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Channel Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400">
                    {channelType === 'TEXT' ? <Hash size={18} /> : <Volume2 size={18} />}
                  </span>
                  <input type="text" placeholder="new-channel" value={channelName} onChange={e=>setChannelName(e.target.value)} required
                    className="w-full bg-[#1E1F22] px-10 py-2 rounded text-white focus:outline-none focus:ring-1 focus:ring-sagar-blue" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddChannel(false)} className="px-4 py-2 text-white hover:underline">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sagar-blue text-white rounded font-semibold hover:bg-blue-600">Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
