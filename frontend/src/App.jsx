import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { ZoneSetup } from './pages/ZoneSetup';
import { Landing } from './pages/Landing';
import { ViolationLogs } from './pages/ViolationLogs';
import { Login } from './pages/Login';
import { SystemCompatibility } from './pages/SystemCompatibility';
import { EvaluationSurvey } from './pages/EvaluationSurvey';
import { PrivateRoute } from './components/PrivateRoute';
import { Menu, Shield } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';

// Create a layout component to conditionally render Sidebar and Header
function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isPublicPage = ['/', '/login'].includes(location.pathname);
  const showSidebarAndHeader = !isPublicPage;

  const userRole = Cookies.get('user_role') || 'admin';
  const roleDisplayNames = {
    admin: { label: 'Admin', icon: '👑', color: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
    officer: { label: 'TMC Officer', icon: '👮', color: 'bg-blue-400/15 text-blue-300 border-blue-400/30' }
  };
  const activeRole = roleDisplayNames[userRole] || roleDisplayNames.officer;

  return (
    <div className="min-h-screen bg-background text-white selection:bg-accent/30 overflow-x-hidden">
      {showSidebarAndHeader && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      
      {/* Top Header with Toggle - Hide on Login and Landing */}
      {showSidebarAndHeader && (
        <header className="fixed top-0 left-0 right-0 h-16 glass-header flex items-center justify-between px-3 sm:px-6 z-40">
          <div className="flex items-center min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors group shrink-0 cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6 text-muted group-hover:text-white" />
            </button>
            <div className="ml-2 sm:ml-4 h-6 w-[1px] bg-white/10 shrink-0" />
            <h2 className="ml-2 sm:ml-4 font-bold tracking-tight text-white/90 flex items-center gap-2 truncate text-sm sm:text-base">
              <span className="text-primary font-extrabold shrink-0">TMC Malaybalay</span>
              <span className="text-muted text-xs uppercase tracking-widest font-semibold hidden md:inline truncate">| Yellow Box Zone AI Monitor</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Active Role Tag */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-bold shrink-0 ${activeRole.color}`}>
              <span>{activeRole.icon}</span>
              <span>{activeRole.label}</span>
            </span>

            {/* AI Live Status */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">LIVE</span> AI ACTIVE
            </span>
          </div>
        </header>
      )}

      <main className={`${showSidebarAndHeader ? 'pt-16 sm:pt-20 px-2 sm:px-4 md:px-6 pb-6' : ''} transition-all duration-300 w-full`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute allowedRoles={['admin', 'officer']}><Dashboard /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute allowedRoles={['admin', 'officer']}><ViolationLogs /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute allowedRoles={['admin', 'officer']}><Reports /></PrivateRoute>} />
          <Route path="/setup" element={<PrivateRoute allowedRoles={['admin']}><ZoneSetup /></PrivateRoute>} />
          <Route path="/compatibility" element={<PrivateRoute allowedRoles={['admin']}><SystemCompatibility /></PrivateRoute>} />
          <Route path="/evaluation" element={<PrivateRoute allowedRoles={['admin', 'officer']}><EvaluationSurvey /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        className: 'cursor-pointer select-none hover:opacity-90 transition-opacity',
        style: {
          background: '#18181b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          padding: '12px 16px',
          borderRadius: '16px',
        }
      }} />
      <AppLayout />
    </Router>
  );
}

export default App;
