import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(username, email, password);
    if (!res.success) {
      setError(res.message);
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0b10]">
      {/* Custom User Background */}
      <div 
        className="absolute inset-0 z-0 bg-[url('/frontpagebackimage.png')] bg-cover bg-center"
        style={{ filter: 'brightness(0.9) contrast(1.1) saturate(1.2)' }}
      />
      <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[0.5px]" />

      {/* Register Card */}
      <div className="relative z-20 bg-black/40 backdrop-blur-[20px] p-10 rounded-2xl w-[420px] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] border border-white/10">
        <div className="flex flex-col items-center justify-center mb-8">
          {/* Creative Logo */}
          <div className="group relative w-16 h-16 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-sagar-blue rounded-[20px] blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-16 h-16 bg-[#1E1F22] rounded-[18px] border-2 border-sagar-blue/40 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-sagar-blue group-hover:scale-110">
              <div className="absolute inset-0 bg-gradient-to-br from-sagar-blue/30 to-indigo-500/30" />
              <div className="relative flex flex-col items-center justify-center leading-none">
                <span className="text-white font-black text-[22px] tracking-widest -mb-1">SD</span>
                <div className="w-10 h-[2px] bg-gradient-to-r from-transparent via-sagar-blue to-transparent" />
                <span className="text-sagar-blue font-bold text-[12px] tracking-[0.3em] mt-1 group-hover:text-white transition-colors duration-500">ADDA</span>
              </div>
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
            </div>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent tracking-tighter text-center leading-tight">
            Your World.<br/>Your Circle.
          </h1>
          <p className="text-gray-400 mt-4 text-sm">Create an <span className="text-white">Account</span></p>
        </div>
        
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm border border-red-500/30">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sagar-blue transition-colors" />
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required placeholder="SagarDey"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-sagar-blue transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sagar-blue transition-colors" />
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="email@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-sagar-blue transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-sagar-blue transition-colors" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-white focus:outline-none focus:border-sagar-blue transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-sagar-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-[0_0_20px_rgba(67,97,238,0.3)] mt-4">
            Register
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-sagar-blue hover:underline font-semibold">Log In</Link>
        </p>
      </div>
    </div>
  )
}
