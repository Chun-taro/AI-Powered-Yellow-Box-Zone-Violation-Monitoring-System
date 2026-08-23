import { LayoutDashboard, FileText, Settings, History, Camera, X, Home, LogOut, Cpu, ClipboardCheck, Shield, User, Sparkles } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const allNavItems = [
  { icon: Home, label: 'Home', path: '/', roles: ['admin', 'officer'] },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'officer'] },
  { icon: History, label: 'Violation Logs', path: '/logs', roles: ['admin', 'officer'] },
  { icon: FileText, label: 'Analytics & Reports', path: '/reports', roles: ['admin', 'officer'] },
  { icon: Settings, label: 'Zone Setup', path: '/setup', roles: ['admin'] },
  { icon: Cpu, label: 'System Status', path: '/compatibility', roles: ['admin'] },
  { icon: ClipboardCheck, label: 'System Evaluation', path: '/evaluation', roles: ['admin', 'officer'] },
];

const ROLE_DISPLAY = {
  admin: {
    badge: '👑 Super Admin',
    desc: 'Full Access',
    color: 'bg-amber-400/10 text-amber-300 border-amber-400/30'
  },
  officer: {
    badge: '👮 TMC Officer',
    desc: 'Enforcement Operations',
    color: 'bg-blue-400/10 text-blue-300 border-blue-400/30'
  }
};

export function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const userRole = Cookies.get('user_role') || 'admin';
  const fullName = Cookies.get('user_full_name') || (userRole === 'admin' ? 'System Administrator' : 'TMC Traffic Officer');
  const username = Cookies.get('user_name') || userRole;

  const currentRoleInfo = ROLE_DISPLAY[userRole] || ROLE_DISPLAY.officer;
  const filteredNavItems = allNavItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = () => {
    Cookies.remove('auth_token');
    Cookies.remove('user_role');
    Cookies.remove('user_name');
    Cookies.remove('user_full_name');
    localStorage.removeItem('tmc_user');
    onClose();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 glass border-r border-white/10 flex flex-col z-[60] shadow-2xl overflow-y-auto custom-scrollbar"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <NavLink
                  to="/"
                  onClick={onClose}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Camera className="text-black font-bold w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                      TMC <span className="text-primary">Malaybalay</span>
                    </h1>
                    <p className="text-[10px] text-accent tracking-widest uppercase font-semibold">Traffic AI Monitor</p>
                  </div>
                </NavLink>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors group cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted group-hover:text-white" />
                </button>
              </div>

              {/* Active User Card */}
              <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentRoleInfo.color}`}>
                    {currentRoleInfo.badge}
                  </span>
                  <span className="text-[10px] font-mono text-muted">@{username}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate">{fullName}</h4>
                  <p className="text-[10px] text-muted">{currentRoleInfo.desc}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10'
                          : 'text-muted hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="mt-auto p-6 space-y-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted hover:text-red-400 hover:bg-red-400/5 transition-all duration-200 group border border-transparent hover:border-red-400/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-semibold text-sm">Sign Out Portal</span>
              </button>
              
              <div className="text-[10px] text-center text-muted font-medium tracking-tight uppercase space-y-0.5">
                <div className="font-bold text-white/70">Traffic Management Center</div>
                <div className="text-accent/80 font-semibold italic text-[9px]">Serving with Honor & Pride</div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
