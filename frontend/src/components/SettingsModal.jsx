import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import AvatarEditor from 'react-avatar-editor';
import { X, Upload } from 'lucide-react';
import axios from 'axios';

export default function SettingsModal({ onClose }) {
  const { user, checkAuth } = useAuthStore();
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (editorRef.current && image) {
      setLoading(true);
      try {
        const canvas = editorRef.current.getImageScaledToCanvas();
        canvas.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append('image', blob, 'avatar.png');

          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          await axios.post(`${API_URL}/upload/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          });

          await checkAuth(); // Refresh user data
          setLoading(false);
          onClose();
        });
      } catch (error) {
        console.error('Error saving avatar:', error);
        alert('Failed to save avatar');
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#313338] rounded-lg w-[500px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1F22] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">User Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">My Account</h3>
          
          <div className="bg-[#1E1F22] rounded-lg p-4 flex flex-col items-center">
            <div className="w-full flex justify-between items-start mb-6">
              <div>
                <div className="text-xl font-bold text-white">{user.username}</div>
                <div className="text-sm text-gray-400">{user.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase font-bold">UID</div>
                <div className="text-sm text-gray-300 font-mono">{user.uid}</div>
              </div>
            </div>

            <div className="w-full border-t border-[#2B2D31] pt-6 flex flex-col items-center">
              <h4 className="text-sm font-bold text-gray-200 mb-4 self-start">Avatar Settings</h4>
              
              {!image ? (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mb-4 border-4 border-[#2B2D31] shadow-lg">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <label className="cursor-pointer bg-sagar-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition-colors flex items-center">
                    <Upload size={18} className="mr-2" />
                    Change Avatar
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-black/20 p-2 rounded-lg mb-4 flex justify-center w-full">
                    <AvatarEditor
                      ref={editorRef}
                      image={image}
                      width={200}
                      height={200}
                      border={50}
                      borderRadius={100}
                      color={[30, 31, 34, 0.8]} // RGBA
                      scale={scale}
                      rotate={0}
                    />
                  </div>
                  <div className="w-full max-w-[250px] mb-6">
                    <label className="block text-xs text-gray-400 mb-2 text-center">Zoom Level</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="w-full accent-sagar-blue"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setImage(null)} className="px-4 py-2 text-white hover:underline">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-500 disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save Avatar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
