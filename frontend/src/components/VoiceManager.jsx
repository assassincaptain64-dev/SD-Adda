import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

import axios from 'axios';
import { API_URL } from '../api';

export default function VoiceManager() {
  const { currentVoiceChannelId, leaveVoice, channels, activeChannelId } = useAppStore();
  const { user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(true);
  
  const isCurrentlyInChannelView = activeChannelId === currentVoiceChannelId;
  const showFullScreen = isCurrentlyInChannelView && !isMinimized;
  
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  const voiceChannel = channels.find(c => c._id === currentVoiceChannelId);

  useEffect(() => {
    if (!currentVoiceChannelId || !user) {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.error("Error destroying Zego instance:", e);
        }
        zpRef.current = null;
      }
      return;
    }

    const initZego = async () => {
      try {
        const configRes = await axios.get(`${API_URL}/config/zego`, { withCredentials: true });
        const { appID, serverSecret } = configRes.data;

        if (!appID || !serverSecret) {
          console.error('Zego Credentials missing on server');
          return;
        }

        const parsedAppID = parseInt(appID);
      
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parsedAppID,
          serverSecret,
          currentVoiceChannelId,
          user.id,
          user.username
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showScreenSharingButton: true,
          showPreJoinView: true,
          showQuitButton: true,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: false,
          showUserList: false, // Hide the built-in Zego member list
          layout: "Auto",
          onLeaveRoom: () => {
            leaveVoice();
          }
        });
      } catch (err) {
        console.error('Error initializing Zego:', err);
      }
    };

    initZego();

    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.error("Error during unmount cleanup:", e);
        }
        zpRef.current = null;
      }
    };
  }, [currentVoiceChannelId, user?.id]);

  if (!currentVoiceChannelId || !user) return null;

  return (
    <div className={`
      fixed z-[100] transition-all duration-300 flex flex-col overflow-hidden
      ${isCurrentlyInChannelView 
        ? 'top-12 bottom-0 left-[312px] right-0 bg-black' 
        : `bottom-4 right-4 rounded-lg border border-[#2B2D31] bg-[#1E1F22] shadow-2xl ${isMinimized ? 'w-64 h-16' : 'w-[400px] h-[300px]'}`
      }
    `}>
      {/* Header - ONLY show in mini-panel mode (NOT in full screen channel view) */}
      {!isCurrentlyInChannelView && (
        <div 
          className="h-10 bg-[#232428] flex items-center justify-between px-3 shrink-0 cursor-pointer" 
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-200 truncate">
              {voiceChannel?.name || 'Connecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="text-gray-400 hover:text-white text-[10px] uppercase font-bold"
            >
              {isMinimized ? 'Expand' : 'Hide'}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); leaveVoice(); }}
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Zego Container */}
      <div 
        ref={containerRef} 
        className={`flex-1 w-full bg-black ${!isCurrentlyInChannelView && isMinimized ? 'hidden' : 'block'}`}
        style={isCurrentlyInChannelView ? { height: 'calc(100vh - 48px)' } : {}}
      />
      
      {!isCurrentlyInChannelView && isMinimized && (
        <div className="flex-1 flex items-center px-4 justify-center text-[10px] text-gray-400 italic bg-[#1E1F22]">
          Connection active. Click to manage.
        </div>
      )}
    </div>
  );
}
