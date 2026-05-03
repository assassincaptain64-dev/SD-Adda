import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Hash, Send, PlusCircle, Image as ImageIcon, X, Smile, Edit2, Trash2, Users, UserMinus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api';
import EmojiPicker from 'emoji-picker-react';

export default function ChatWorkspace({ channel, isDM = false }) {
  const { messages, addMessage, fetchDMMessages, socket } = useAppStore();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [showMembers, setShowMembers] = useState(true);

  const { activeServerMembers, activeServerId, servers } = useAppStore();
  const activeServer = servers.find(s => s._id === activeServerId);
  const isOwner = activeServer?.owner === user.id;

  const handleKickMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to kick this member?')) return;
    try {
      await axios.post(`${API_URL}/servers/${activeServerId}/kick/${memberId}`, {}, { withCredentials: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to kick member');
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
  }, [channel.id, channel._id]);

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const newSkip = skip + 25;
    try {
      const targetId = isDM ? channel.id : channel._id;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = isDM 
        ? `${API_URL}/conversations/${targetId}/messages?skip=${newSkip}&limit=25`
        : `${API_URL}/channels/${targetId}/messages?skip=${newSkip}&limit=25`;
      
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.length < 25) setHasMore(false);
      
      // Prepend old messages using set from appStore
      useAppStore.setState(state => ({ messages: [...res.data, ...state.messages] }));
      setSkip(newSkip);
    } catch (error) {
      console.error('Failed to load more messages');
    }
    setIsLoadingMore(false);
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    const targetId = isDM ? channel.id : channel._id;
    socket.emit('join_channel', targetId);

    socket.on('user_typing_start', (data) => {
      const currentId = isDM ? channel.id : channel._id;
      if (data.channelId === currentId) {
        setTypingUser(data.senderName);
      }
    });

    socket.on('user_typing_stop', (data) => {
      const currentId = isDM ? channel.id : channel._id;
      if (data.channelId === currentId) {
        setTypingUser(null);
      }
    });

    return () => {
      socket.off('user_typing_start');
      socket.off('user_typing_stop');
    };
  }, [channel, isDM, socket]);

  const editFormRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editFormRef.current && !editFormRef.current.contains(event.target)) {
        setEditingMessageId(null);
      }
    };

    if (editingMessageId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingMessageId]);

  useEffect(() => {
    if (skip === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, skip]);

  const handleFileSelect = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    processFile(file);
  };

  const processFile = (file) => {
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        alert("File must be smaller than 30MB");
        return;
      }
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files ? e.dataTransfer.files[0] : null;
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' && !attachment) return;

    let attachmentUrl = null;

    if (attachment) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', attachment);
      try {
          const res = await axios.post(`${API_URL}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        attachmentUrl = res.data.url;
      } catch (error) {
        console.error('Failed to upload image', error);
        alert('Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const targetId = channel._id || channel.id;
    const messageData = {
      channelId: targetId,
      senderId: user.id,
      content: newMessage,
      isDM: isDM,
      attachments: attachmentUrl ? [attachmentUrl] : []
    };

    socket.emit('send_message', messageData);
    socket.emit('typing_stop', { channelId: targetId });
    setNewMessage('');
    removeAttachment();
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    if (!editingContent.trim()) return;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      await axios.put(`${API_URL}/messages/${editingMessageId}`, { content: editingContent }, { withCredentials: true });
      setEditingMessageId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error editing message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      await axios.delete(`${API_URL}/messages/${messageId}`, { withCredentials: true });
    } catch (error) {
      console.error('Error deleting message');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#313338] relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-[#1E1F22] shadow-sm shrink-0">
        <div className="flex items-center">
          <Hash size={24} className="text-gray-400 mr-2" />
          <h2 className="font-bold text-white">{channel.name}</h2>
        </div>
        {!isDM && (
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className={`p-1.5 rounded hover:bg-[#3F4147] transition-colors ${showMembers ? 'text-white' : 'text-gray-400'}`}
            title="Toggle Members"
          >
            <Users size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isSelf = msg.sender._id === user.id;
          const prevMsg = messages[idx - 1];
          const isSameSenderAsPrev = idx > 0 && prevMsg.sender._id === msg.sender._id;
          const timeDiff = prevMsg ? (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) / (1000 * 60) : 0;
          const showAvatar = !isSameSenderAsPrev || timeDiff > 2;

          return (
            <div 
              key={msg._id} 
              className={`flex w-full mb-1 ${showAvatar ? 'mt-4' : 'mt-0.5'} ${isSelf ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] sm:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                {/* Avatar/Spacer */}
                {!isSelf ? (
                  showAvatar ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-500 shadow-sm border border-white/10 flex-shrink-0 self-start mt-1">
                      {msg.sender.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" /> : <span className="text-[10px] flex items-center justify-center h-full text-white">{msg.sender.username.charAt(0)}</span>}
                    </div>
                  ) : (
                    <div className="w-9 flex-shrink-0" />
                  )
                ) : null}

                <div className={`flex flex-col ${isSelf ? 'items-end mr-3' : 'items-start ml-3'} max-w-full`}>
                  {!isSelf && showAvatar && (
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-1 ml-1">{msg.sender.username}</span>
                  )}
                  
                  <div className={`message-bubble ${isSelf ? 'message-self' : 'message-other'} ${showAvatar ? '' : 'no-tail'}`}>
                    {editingMessageId === msg._id ? (
                      <form ref={editFormRef} onSubmit={handleUpdateMessage} className="min-w-[200px]">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                          className="w-full bg-black/20 text-white p-2 rounded outline-none min-h-[40px] resize-none text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateMessage(e); }
                            if (e.key === 'Escape') setEditingMessageId(null);
                          }}
                        />
                        <div className="text-[9px] text-gray-300 mt-1 opacity-70 italic">Esc to cancel • Enter to save</div>
                      </form>
                    ) : (
                      <div className="flex flex-col">
                        {msg.content && <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {msg.attachments.map((url, i) => (
                              <img key={i} src={url} alt="Attachment" className="max-w-full max-h-60 rounded-md cursor-pointer hover:brightness-110 transition-all shadow-md" onClick={() => setLightboxImage(url)} />
                            ))}
                          </div>
                        )}
                        
                        <div className={`text-[9px] mt-1 flex items-center gap-1.5 ${isSelf ? 'text-green-200/60 justify-end' : 'text-gray-400 justify-start'}`}>
                          {formatTime(msg.createdAt)}
                          {msg.isEdited && <span className="italic">(edited)</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Overlay */}
                  {isSelf && !editingMessageId && (
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingMessageId(msg._id); setEditingContent(msg.content); }} className="p-1.5 bg-[#1E1F22] rounded-full text-gray-400 hover:text-white border border-white/5 shadow-xl"><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 bg-[#1E1F22] rounded-full text-gray-400 hover:text-red-500 border border-white/5 shadow-xl"><Trash2 size={12} /></button>
                    </div>
                  )}
                  {!isSelf && !editingMessageId && (
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Others actions could go here (e.g. report/reply) */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0">
        <form onSubmit={handleSend} className="bg-[#383A40] rounded-lg flex flex-col px-4 py-2">
          
          {attachmentPreview && (
            <div className="flex mb-2 pt-2 border-b border-[#2B2D31] pb-3">
              <div className="relative group">
                <img src={attachmentPreview} alt="Upload preview" className="h-32 w-auto object-cover rounded bg-black/20 border-2 border-[#1E1F22]" />
                <button type="button" onClick={removeAttachment} className="absolute -top-2 -right-2 bg-[#1E1F22] text-gray-300 hover:text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <label className="text-gray-400 hover:text-gray-200 transition-colors mr-3 cursor-pointer">
              <PlusCircle size={22} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={isUploading} />
            </label>
            
            <input
              type="text"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
                // Typing logic
                const currentId = isDM ? channel.id : channel._id;
                socket.emit('typing_start', { channelId: currentId, senderName: user.username });
                
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit('typing_stop', { channelId: currentId });
                }, 2000);
              }}
              placeholder={isUploading ? "Uploading..." : isDM ? `Message @${channel.name}` : `Message #${channel.name}`}
              disabled={isUploading}
              className="flex-1 bg-transparent text-gray-100 focus:outline-none"
            />
            
            <div className="relative flex items-center ml-2">
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 right-0 z-50">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <div className="relative">
                    <EmojiPicker 
                      onEmojiClick={handleEmojiClick} 
                      theme="dark"
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="text-gray-400 hover:text-white transition-colors ml-4" disabled={isUploading || (!newMessage.trim() && !attachment)}>
              <Send size={20} />
            </button>
          </div>
        </form>
        {typingUser && (
          <div className="text-xs text-gray-400 mt-1 ml-2 animate-pulse">
            <span className="font-bold">{typingUser}</span> is typing...
          </div>
        )}
      </div>
      </div>
      
      {/* Right Sidebar - Members Panel */}
      {!isDM && showMembers && (
        <div className="w-60 bg-[#2B2D31] flex flex-col shrink-0 border-l border-[#1E1F22] z-10 custom-scrollbar overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">
            Members — {activeServerMembers.length}
          </h3>
          <div className="space-y-1">
            {activeServerMembers.map(member => (
              <div key={member._id || member.id} className="flex items-center justify-between p-2 hover:bg-[#35373C] rounded group cursor-pointer transition-colors">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm mr-3">
                      {member.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-3 w-2.5 h-2.5 rounded-full border-2 border-[#2B2D31] shadow-[0_0_5px_rgba(0,0,0,0.5)] ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-semibold text-gray-300 group-hover:text-white truncate">{member.username}</span>
                    {activeServer?.owner === (member._id || member.id) && (
                      <span className="text-[9px] uppercase font-bold text-yellow-500">Owner</span>
                    )}
                  </div>
                </div>
                {isOwner && activeServer?.owner !== (member._id || member.id) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleKickMember(member._id || member.id); }}
                    className="p-1.5 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Kick Member"
                  >
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#313338]/90 z-40 flex items-center justify-center backdrop-blur-sm border-2 border-dashed border-indigo-500 m-2 rounded-xl pointer-events-none transition-all duration-200">
          <div className="flex flex-col items-center bg-black/40 p-8 rounded-2xl shadow-2xl">
            <PlusCircle size={64} className="text-indigo-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white mb-2">Drop it like it's hot</h2>
            <p className="text-gray-300">Add this image to your message</p>
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-slideIn"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-full"
            onClick={() => setLightboxImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Expanded Media" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
