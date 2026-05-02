import { Volume2, PhoneIncoming } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function VoiceWorkspace({ channel }) {
  const { currentVoiceChannelId, joinVoice } = useAppStore();
  const isConnected = currentVoiceChannelId === channel._id;

  return (
    <div className="flex flex-col h-full w-full bg-[#1E1F22] overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-[#2B2D31] shadow-sm shrink-0">
        <h2 className="font-bold text-white flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          Voice Channel: {channel.name}
        </h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-[#2B2D31] text-indigo-400'}`}>
          <Volume2 size={40} />
        </div>
        
        {isConnected ? (
          <>
            <h3 className="text-xl font-bold text-white mb-2">You are connected</h3>
            <p className="max-w-md text-sm text-gray-400">
              The voice session is active. You can switch to any text channel and the connection will stay alive in the background.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-2">Voice Channel</h3>
            <p className="max-w-md text-sm text-gray-400 mb-6">
              Click the button below to join the voice session and start talking with others.
            </p>
            <button 
              onClick={() => joinVoice(channel._id)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded font-bold transition-colors shadow-lg"
            >
              <PhoneIncoming size={20} />
              Join Voice
            </button>
          </>
        )}
      </div>
    </div>
  );
}
