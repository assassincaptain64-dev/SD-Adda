import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="h-screen w-full flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center">
      <div className="glassmorphism p-10 rounded-2xl w-[400px] shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          <LogIn className="w-10 h-10 text-sagar-blue mr-2" />
          <h1 className="text-3xl font-bold text-white">SD-Adda</h1>
        </div>
        <h2 className="text-xl text-gray-300 text-center mb-8">Welcome Back</h2>
        
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sagar-blue transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sagar-blue transition-colors" />
          </div>
          <button type="submit" className="w-full bg-sagar-blue hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors mt-6">
            Log In
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          Need an account? <Link to="/register" className="text-sagar-blue hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
