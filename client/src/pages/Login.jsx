import React, { useState } from 'react';
import api, { setAuthToken, setAuthUser } from '../utils/api';
import { Shield } from 'lucide-react';

const Login = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store token and user details in browser
      setAuthToken(data.token);
      setAuthUser({
        id: data._id,
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        parentId: data.parentId,
        path: data.path,
        region: data.region
      });

      // Reload window to update state
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 select-none relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 flex flex-col">
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-4 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer self-start"
          >
            ← Back to Home
          </button>
        )}
        
        {/* Centered Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center font-black text-white text-lg tracking-wider">
              T
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">TRAKR</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Field Management Ecosystem</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-200">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">Access your organizational node dashboard panel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="e.g. admin@trakr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Security Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
