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
      <div className="h-14 bg-[#232428] flex items-center px-2 shrink-0 justify-between">
        <div className="flex items-center hover:bg-[#3F4147] rounded p-1 cursor-pointer transition-colors flex-1 overflow-hidden">
          <div className="relative shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#232428]
              ${user.status === 'online' ? 'bg-green-500' : user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}
            `} />
          </div>
          <div className="ml-2 flex-1 overflow-hidden text-left">
            <div className="text-sm font-bold text-white truncate">{user.username}</div>
            <div className="text-xs text-gray-400 truncate text-[10px]">{user.uid}</div>
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
