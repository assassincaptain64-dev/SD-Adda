import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

export default function UserPanel() {
  const { user } = useAuthStore();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="h-16 bg-[#1E1F22]/90 backdrop-blur-md flex items-center px-3 shrink-0 justify-between border-t border-white/5 relative z-10">
        <div className="flex items-center hover:bg-white/5 rounded-md p-1.5 cursor-pointer transition-all duration-300 flex-1 overflow-hidden group">
          <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1E1F22] shadow-[0_0_8px_rgba(0,0,0,0.8)]
              ${user.status === 'online' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : user.status === 'busy' ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-gray-500'}
            `} />
          </div>
          <div className="ml-3 flex-1 overflow-hidden text-left">
            <div className="text-sm font-bold text-white truncate drop-shadow-md">{user.username}</div>
            <div className="text-[10px] text-gray-400 truncate opacity-80 group-hover:opacity-100 transition-opacity">{user.uid}</div>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded hover:bg-[#3F4147] flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 ml-1"
          title="User Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
