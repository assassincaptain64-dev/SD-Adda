import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import VoiceManager from './components/VoiceManager';

import { useAppStore } from './store/appStore';
import { AlertCircle } from 'lucide-react';

function App() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const { toastMessage } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
      <VoiceManager />
      
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] bg-red-500/90 backdrop-blur text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 animate-slideIn">
          <AlertCircle size={20} />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </Router>
  );
}

export default App;
