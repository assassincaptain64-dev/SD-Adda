import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Compass, LogOut, MessageSquare } from 'lucide-react';

export default function Sidebar() {
  const { servers, activeServerId, fetchServerDetails, createServer, joinServer, isHome, setIsHome } = useAppStore();
  const { user, logout } = useAuthStore();
  const [showAddServer, setShowAddServer] = useState(false);
  const [serverName, setServerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if(serverName) {
      await createServer(serverName, 'A new awesome server');
      setShowAddServer(false);
      setServerName('');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if(inviteCode) {
      try {
        await joinServer(inviteCode);
        setShowAddServer(false);
        setInviteCode('');
      } catch (error) {
        alert('Invalid invite code');
      }
    }
  };

  return (
    <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 space-y-4 shadow-xl z-20 shrink-0">
      <div 
        onClick={() => setIsHome(true)}
        className={`relative w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300
          ${isHome ? 'bg-sagar-blue text-white rounded-[16px]' : 'bg-[#313338] text-gray-100 rounded-[24px] hover:rounded-[16px] hover:bg-sagar-blue hover:text-white'}
        `}
      >
        <MessageSquare size={24} />
        {isHome && (
          <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
        )}
      </div>
      
      <div className="w-8 h-[2px] bg-[#313338] rounded-full" />

      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar">
        {servers.map(server => (
          <div 
            key={server._id} 
            onClick={() => {
              setIsHome(false);
              fetchServerDetails(server._id);
            }}
            className={`relative w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 font-bold text-lg
              ${activeServerId === server._id && !isHome ? 'bg-sagar-blue text-white rounded-[16px]' : 'bg-[#313338] text-gray-100 rounded-[24px] hover:rounded-[16px] hover:bg-sagar-blue hover:text-white'}
            `}
          >
            {server.name.charAt(0).toUpperCase()}
            {activeServerId === server._id && !isHome && (
              <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-2 h-10 bg-white rounded-r-full" />
            )}
          </div>
        ))}

        <div 
          onClick={() => setShowAddServer(true)}
          className="w-12 h-12 bg-[#313338] text-green-500 hover:bg-green-500 hover:text-white rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer mt-2"
        >
          <Plus size={24} />
        </div>
      </div>

      <div className="w-full px-2 mt-auto pt-4 flex flex-col items-center gap-4">
        <div 
          onClick={logout}
          className="w-10 h-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
          title="Logout"
        >
          <LogOut size={18} />
        </div>
        <p className="text-[10px] text-gray-500 text-center leading-tight">
          copyright Sagar Dey 2026.<br/>All Rights Reserved
        </p>
      </div>

      {showAddServer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glassmorphism p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4 text-white">Add a Server</h3>
            <form onSubmit={handleCreate} className="mb-4">
              <input type="text" placeholder="Server Name" value={serverName} onChange={e=>setServerName(e.target.value)}
                className="w-full bg-white/10 px-3 py-2 rounded text-white focus:outline-none mb-2 border border-white/10" />
              <button className="w-full bg-sagar-blue text-white py-2 rounded font-semibold">Create</button>
            </form>
            <div className="text-center text-gray-400 my-2">OR</div>
            <form onSubmit={handleJoin}>
              <input type="text" placeholder="Invite Code" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}
                className="w-full bg-white/10 px-3 py-2 rounded text-white focus:outline-none mb-2 border border-white/10" />
              <button className="w-full bg-green-600 text-white py-2 rounded font-semibold">Join</button>
            </form>
            <button onClick={() => setShowAddServer(false)} className="mt-4 w-full text-gray-400 hover:text-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
