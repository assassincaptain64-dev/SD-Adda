import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';
import ChannelList from './ChannelList';
import ChatWorkspace from './ChatWorkspace';
import VoiceWorkspace from './VoiceWorkspace';
import Home from './Home';

export default function Dashboard() {
  const { fetchServers, activeServerId, channels, activeChannelId, isHome, initSocket, disconnectSocket } = useAppStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchServers();
    if (user?.id) {
      initSocket(user.id);
    }

    return () => {
      disconnectSocket();
    };
  }, [fetchServers, user?.id, initSocket, disconnectSocket]);

  const activeChannel = channels.find(c => c._id === activeChannelId);

  return (
    <div className="flex h-screen w-full bg-[#1E1F22] text-gray-100 overflow-hidden">
      <Sidebar />
      
      {isHome ? (
        <Home />
      ) : activeServerId ? (
        <>
          <ChannelList />
          <div className="flex-1 flex flex-col bg-[#313338]">
            {activeChannel ? (
              activeChannel.type === 'TEXT' ? <ChatWorkspace channel={activeChannel} /> : <VoiceWorkspace channel={activeChannel} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a channel to start
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#313338]">
          Select or Create a Server
        </div>
      )}
    </div>
  );
}
