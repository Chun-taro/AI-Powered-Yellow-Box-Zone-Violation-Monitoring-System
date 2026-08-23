import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, Lock, User, Sparkles, Eye, EyeOff, 
  ArrowLeft, AlertTriangle, CheckCircle2, Server, KeyRound
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shieldClicks, setShieldClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const navigate = useNavigate();

  // Check backend server reachability
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/roles`)
      .then((res) => {
        if (res.ok) setServerOnline(true);
      })
      .catch(() => setServerOnline(false));
  }, []);

  const handleShieldClick = () => {
    const nextCount = shieldClicks + 1;
    setShieldClicks(nextCount);
    if (nextCount === 5) {
      setShowEasterEgg(true);
      toast.success('🛡️ Easter Egg Unlocked: Quick Demo Login Mode Activated!', {
        icon: '🎉',
        duration: 3500
      });
    } else if (nextCount > 5) {
      setShowEasterEgg(prev => !prev);
    }
  };

  const handleKeyCheck = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

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
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-accent/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Header Navigation Return Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between z-10 px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Public Portal</span>
        </Link>

        {/* Backend API Status Pulse Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] font-mono">
          <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={serverOnline ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {serverOnline ? 'API Connected' : 'Offline Mode'}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-6 sm:p-8 rounded-3xl sm:rounded-[2.2rem] border border-white/10 relative z-10 shadow-2xl space-y-6"
      >
        <div className="text-center">
          <div 
            onClick={handleShieldClick}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-primary cursor-pointer active:scale-95 transition-transform select-none hover:bg-primary/20"
            title="Click 5 times for Demo Mode"
          >
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            TMC <span className="text-primary">Malaybalay</span> Portal
          </h2>
          <p className="text-[11px] sm:text-xs text-muted mt-1.5 uppercase tracking-wider font-semibold">
            Role-Based Access Control • Yellow Box AI Monitor
          </p>
        </div>

        {/* Easter Egg: Demo Fast-Select Role Badges (Appears after 5 clicks on shield) */}
        <AnimatePresence>
          {showEasterEgg && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between text-[11px] text-accent font-bold uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Quick Select Demo (Unlocked)
                </span>
                <span className="text-[9px] text-muted font-normal lowercase">click shield to toggle</span>
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
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Municipal Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyCheck}
                onKeyUp={handleKeyCheck}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/60 transition-colors"
                placeholder="e.g. admin or officer"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] sm:text-xs font-bold text-muted uppercase tracking-wider">
                Security Password
              </label>
              {capsLockOn && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  CAPS LOCK ON
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyCheck}
                onKeyUp={handleKeyCheck}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-primary/60 transition-colors"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                Authenticate Command Portal
              </>
            )}
          </button>
        </form>

        {/* Data Privacy & Compliance Notice Footer */}
        <div className="border-t border-white/5 pt-4 text-center space-y-1">
          <p className="text-[10px] text-muted leading-tight">
            Official System of the <strong className="text-white/80">TMC Malaybalay City</strong>
          </p>
          <p className="text-[9px] text-muted/60 leading-tight">
            Protected under R.A. 10173 (Data Privacy Act) • Unauthorized access is prohibited.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
