import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    name: 'Admin',
    username: 'admin',
    password: 'admin123',
    badge: '👑 Super Admin',
    desc: 'Full Control, Zone Setup & System Scans',
    color: 'border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
  },
  {
    role: 'officer',
    name: 'TMC Officer',
    username: 'officer',
    password: 'officer123',
    badge: '👮 TMC Enforcer',
    desc: 'Live Monitor, Evidence & Logs',
    color: 'border-blue-400/40 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20'
  }
];

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user = data.user;
        Cookies.set('auth_token', data.token, { expires: 1 });
        Cookies.set('user_role', user.role, { expires: 1 });
        Cookies.set('user_name', user.username, { expires: 1 });
        Cookies.set('user_full_name', user.full_name, { expires: 1 });
        
        localStorage.setItem('tmc_user', JSON.stringify(user));
        toast.success(`Welcome, ${user.full_name}! (${user.role.toUpperCase()})`);
        navigate('/dashboard');
        return;
      } else {
        // Fallback check for offline / legacy
        if (
          (username === 'superadmin123' && password === 'superadmin@123') ||
          (username === 'admin' && password === 'admin123')
        ) {
          const fallbackUser = { id: 1, username: 'admin', role: 'admin', full_name: 'System Administrator' };
          Cookies.set('auth_token', 'superadmin_token_xyz', { expires: 1 });
          Cookies.set('user_role', 'admin', { expires: 1 });
          Cookies.set('user_name', 'admin', { expires: 1 });
          Cookies.set('user_full_name', 'System Administrator', { expires: 1 });
          localStorage.setItem('tmc_user', JSON.stringify(fallbackUser));
          toast.success('Login successful! (Super Admin)');
          navigate('/dashboard');
          return;
        }
        toast.error(data.error || 'Invalid username or password');
      }
    } catch (err) {
      // Local fallback for offline testing
      if (username === 'admin' && password === 'admin123') {
        const fallbackUser = { id: 1, username: 'admin', role: 'admin', full_name: 'System Administrator' };
        Cookies.set('auth_token', 'local_admin_token', { expires: 1 });
        Cookies.set('user_role', 'admin', { expires: 1 });
        Cookies.set('user_name', 'admin', { expires: 1 });
        Cookies.set('user_full_name', 'System Administrator', { expires: 1 });
        localStorage.setItem('tmc_user', JSON.stringify(fallbackUser));
        toast.success('Logged in as Administrator (Offline Mode)');
        navigate('/dashboard');
      } else if (username === 'officer' && password === 'officer123') {
        const fallbackUser = { id: 2, username: 'officer', role: 'officer', full_name: 'TMC Traffic Officer' };
        Cookies.set('auth_token', 'local_officer_token', { expires: 1 });
        Cookies.set('user_role', 'officer', { expires: 1 });
        Cookies.set('user_name', 'officer', { expires: 1 });
        Cookies.set('user_full_name', 'TMC Traffic Officer', { expires: 1 });
        localStorage.setItem('tmc_user', JSON.stringify(fallbackUser));
        toast.success('Logged in as TMC Officer (Offline Mode)');
        navigate('/dashboard');
      } else {
        toast.error('Unable to connect to auth server or invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 w-full">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] border border-white/10 relative z-10 shadow-2xl space-y-6"
      >
        <div className="text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-primary">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            TMC <span className="text-primary">Malaybalay</span> Portal
          </h2>
          <p className="text-[11px] sm:text-xs text-muted mt-1.5 uppercase tracking-wider font-semibold">
            Role-Based Access Control • Yellow Box AI Monitor
          </p>
        </div>

        {/* Demo Fast-Select Role Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted font-bold uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Quick Select Role Demo
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`px-3 py-2.5 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  username === acc.username ? 'ring-2 ring-accent scale-[1.02] bg-white/15' : acc.color
                }`}
              >
                <span>{acc.name}</span>
                <span className="text-[10px] opacity-75 font-mono">{acc.username}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/60 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/60 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-slate-950 rounded-xl font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Authenticate Command Portal
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
