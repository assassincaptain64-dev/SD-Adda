import { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import AvatarEditor from 'react-avatar-editor';
import { X, Upload, Trash2, Save } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../api';

export default function ServerSettingsModal({ server, onClose }) {
  const { fetchServers, showToast } = useAppStore();
  const [name, setName] = useState(server.name);
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
    setLoading(true);
    try {
      let iconUrl = server.icon;

      if (image && editorRef.current) {
        const canvas = editorRef.current.getImageScaledToCanvas();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const formData = new FormData();
        formData.append('image', blob, 'server_icon.png');

        const uploadRes = await axios.post(`${API_URL}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        iconUrl = uploadRes.data.url;
      }

      await axios.put(`${API_URL}/servers/${server._id}`, {
        name,
        icon: iconUrl
      }, { withCredentials: true });

      showToast('Server updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating server:', error);
      alert('Failed to update server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${server.name}"? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/servers/${server._id}`, { withCredentials: true });
      showToast('Server deleted');
      onClose();
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-[#313338] rounded-xl w-[500px] shadow-2xl overflow-hidden flex flex-col border border-white/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E1F22] flex justify-between items-center bg-[#2B2D31]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Server Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          {/* Basic Info */}
          <section>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Server Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1E1F22] text-white px-4 py-2 rounded border border-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </section>

          {/* Icon Section */}
          <section className="flex flex-col items-center py-4 bg-black/10 rounded-xl border border-white/5">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-4 self-start px-4">Server Icon</label>
            
            {!image ? (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-indigo-500 flex items-center justify-center mb-4 shadow-2xl group relative border-2 border-white/10">
                  {server.icon ? (
                    <img src={server.icon} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-white font-bold">{server.name.charAt(0).toUpperCase()}</span>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={20} className="text-white mb-1" />
                    <span className="text-[10px] text-white font-bold uppercase">Change</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full px-4">
                <div className="bg-black/40 p-2 rounded-xl mb-4">
                  <AvatarEditor
                    ref={editorRef}
                    image={image}
                    width={150}
                    height={150}
                    border={20}
                    borderRadius={40}
                    color={[49, 51, 56, 0.8]}
                    scale={scale}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full max-w-[200px] mb-4 accent-indigo-500"
                />
                <button onClick={() => setImage(null)} className="text-xs text-red-400 hover:underline">Cancel Upload</button>
              </div>
            )}
          </section>

          {/* Danger Zone */}
          <section className="pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold text-red-500 uppercase mb-3">Danger Zone</h3>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Delete Server</div>
                <div className="text-xs text-gray-400">Once deleted, it cannot be recovered.</div>
              </div>
              <button 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#2B2D31] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-white text-sm font-medium hover:underline">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-green-500/20"
          >
            {loading ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
