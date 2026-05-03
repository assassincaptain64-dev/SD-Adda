import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
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

      {/* Login Card */}
      <div className="relative z-20 bg-black/40 backdrop-blur-[20px] p-10 rounded-2xl w-[400px] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] border border-white/10">
        <div className="flex flex-col items-center justify-center mb-8">
          {/* New Neon Logo */}
          <div className="group relative w-16 h-16 flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-sagar-blue rounded-[20px] blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-16 h-16 bg-[#0a0b10] rounded-[18px] border-2 border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-sagar-blue group-hover:scale-110 shadow-2xl">
              <div className="absolute inset-0 border border-sagar-blue/20 rounded-[18px]" />
              <div className="relative flex flex-col items-center justify-center leading-none select-none">
                <span className="text-white font-black text-[24px] tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">SD</span>
                <div className="flex items-center gap-1 mt-[-2px]">
                  <span className="text-sagar-blue font-black text-[12px] tracking-[0.2em] group-hover:text-blue-400 transition-colors">ΛDDΛ</span>
                </div>
              </div>
              <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-shine" />
            </div>
          </div>
          
          <h1 className="text-[32px] font-black text-white tracking-tighter text-center leading-tight mb-4">
            Connect.<br/>
            <span className="text-white">Talk.</span> <span className="text-sagar-blue">Belong.</span>
          </h1>
          <p className="text-gray-400 text-sm">Welcome <span className="text-white font-semibold">Back</span></p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-6 text-xs border border-red-500/20">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
                placeholder="email@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-sagar-blue transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-white text-sm focus:outline-none focus:border-sagar-blue transition-all" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-sagar-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all shadow-[0_4px_15px_rgba(67,97,238,0.3)] mt-2 text-sm">
            Log In
          </button>
        </form>
        
        <p className="text-center text-[10px] text-gray-500 mt-8">
          Need an account? <Link to="/register" className="text-sagar-blue hover:underline font-bold ml-1">Register</Link>
        </p>
      </div>
    </div>
  )
}
