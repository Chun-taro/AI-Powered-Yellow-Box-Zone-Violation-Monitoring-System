import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Eye, Database, Activity, ArrowRight, Camera, 
  Cpu, CheckCircle2, Zap, Layers, Lock, Clock, Video, 
  TrendingUp, Compass, Server, ChevronRight
} from 'lucide-react';

const statsPills = [
  { label: '93.7% mAP Precision', icon: Zap, color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  { label: '4.15 ms GPU Inference', icon: Cpu, color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
  { label: '30s Dwell Enforcement', icon: Clock, color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
  { label: 'NCAP Ready Evidence', icon: CheckCircle2, color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
];

const workflowSteps = [
  {
    step: '01',
    title: 'RTSP Stream Ingestion',
    desc: 'High-Definition 1080p roadside CCTV stream decoding via OpenCV multi-threaded pipelines.',
    icon: Video,
    tag: 'Continuous 30 FPS'
  },
  {
    step: '02',
    title: 'AI 5-Point Dwell Tracking',
    desc: 'YOLOv8 FP16 vehicle detection paired with 2-Stage Ray-Casting & Kalman state tracking.',
    icon: Layers,
    tag: 'Anti-Occlusion AI'
  },
  {
    step: '03',
    title: 'Automated Citation Capture',
    desc: 'Instant evidence snapshot capture with bounding overlays, timestamps, and SQLite database logging.',
    icon: Database,
    tag: 'Tamper-Evident'
  }
];

const features = [
  { 
    icon: Shield, 
    title: 'AI-Powered Detection', 
    desc: 'Deep learning multi-class identification for cars (incl. multicabs), trucks, buses, and motorcycles with 93.7% precision.' 
  },
  { 
    icon: Eye, 
    title: 'Ray-Casting Zone Geometry', 
    desc: 'Mathematical Point-in-Polygon intersection boundary checking distinguishing vehicles passing through from illegal stopping.' 
  },
  { 
    icon: Database, 
    title: 'NCAP Evidence Generator', 
    desc: 'Generates high-resolution photographic evidence embedded with vehicle label, track ID, timestamp, and dwell duration.' 
  },
  { 
    icon: Activity, 
    title: 'Real-Time Analytics', 
    desc: 'Comprehensive hourly volume metrics, daily violation trends, and exportable reports in Excel, CSV, and PDF formats.' 
  }
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-start px-4 sm:px-8 py-8 md:py-16 w-full space-y-16 sm:space-y-24">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-accent/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl text-center space-y-6 sm:space-y-8 relative z-10 mx-auto"
      >
        {/* Official LGU Branding Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur shadow-lg shadow-primary/5">
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-accent">
            TMC Malaybalay City • AI Traffic Operations
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="hidden sm:inline text-[10px] text-muted font-medium">R.A. 4136 & NCAP Framework</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.1]">
          Traffic <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-yellow-400">Enforcement</span><br />
          Powered by AI Vision
        </h1>

        <p className="text-sm sm:text-lg md:text-xl text-muted max-w-3xl mx-auto leading-relaxed px-2">
          The AI-Powered Yellow Box Zone Monitoring System is built for the <strong className="text-white font-semibold">Traffic Management Center (TMC) of Malaybalay City, Bukidnon</strong> to detect, record, and eliminate intersection gridlock automatically.
        </p>

        {/* Key Empirical Performance Metric Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          {statsPills.map((pill) => (
            <div
              key={pill.label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${pill.color} backdrop-blur shadow-sm`}
            >
              <pill.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{pill.label}</span>
            </div>
          ))}
        </div>

        {/* Dual Primary & Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-slate-950 rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2.5 group cursor-pointer"
          >
            Launch Command Center
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl glass hover:bg-white/10 text-white font-bold text-sm sm:text-base border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Lock className="w-4 h-4 text-accent" />
            Authorized Officer Portal
          </button>
        </div>
      </motion.div>

      {/* Simulated AI HUD Intersection Live Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="glass p-3 sm:p-5 rounded-3xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
          {/* Top Camera Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/60 backdrop-blur rounded-2xl border border-white/5 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-white tracking-wide uppercase text-[11px]">Live Camera 01: Sayre Highway - Fortich St.</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted font-mono">
              <span>RES: 1920x1080</span>
              <span>FPS: 30.0</span>
              <span className="text-emerald-400 font-bold">FP16 CUDA: ACTIVE</span>
            </div>
          </div>

          {/* Simulated Annotated HUD Frame */}
          <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

            {/* Simulated Yellow Box Geometric Boundary Lines */}
            <div className="absolute inset-[15%] sm:inset-[20%] border-2 border-dashed border-amber-400/80 bg-amber-400/5 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-amber-400/40 text-[9px] sm:text-[10px] font-mono font-bold text-amber-300">
                YELLOW BOX ZONE BOUNDARY (#01)
              </div>
            </div>

            {/* Simulated Vehicle 1: Passing Through (Green Indicator) */}
            <div className="absolute top-[25%] left-[28%] p-2 rounded-lg border-2 border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/10 hidden sm:block">
              <div className="text-[9px] font-mono font-bold text-emerald-300 bg-black/80 px-1.5 py-0.5 rounded border border-emerald-400/40 inline-block mb-1">
                TRUCK #18 | 0.94 CONF | TRANSIT [4.2s]
              </div>
              <div className="w-24 h-14 border border-emerald-400/40 rounded flex items-center justify-center text-[10px] font-bold text-emerald-400">
                PASSING
              </div>
            </div>

            {/* Simulated Vehicle 2: Violation Triggered (Red Indicator) */}
            <div className="absolute top-[38%] right-[24%] sm:right-[30%] p-2 rounded-lg border-2 border-rose-500 bg-rose-500/15 shadow-xl shadow-rose-500/20 animate-pulse">
              <div className="text-[9px] sm:text-[10px] font-mono font-black text-rose-300 bg-black/90 px-2 py-0.5 rounded border border-rose-500 inline-flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                CAR #42 | STOPPED [31.4s] • VIOLATION
              </div>
              <div className="w-28 sm:w-36 h-16 sm:h-20 border border-rose-400/40 rounded flex flex-col items-center justify-center text-center p-1 bg-black/40">
                <span className="text-[10px] sm:text-xs font-black text-rose-400">NCAP EVIDENCE</span>
                <span className="text-[8px] sm:text-[9px] font-mono text-white/80">GRIDLOCK OBSTRUCTION</span>
              </div>
            </div>

            {/* Overlay Watermark Telemetry */}
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 text-[9px] sm:text-[10px] font-mono text-muted text-right">
              <div>TMC MALAYBALAY AI INTERCEPT ENGINE</div>
              <div className="text-white font-bold">LATENCY: 4.15 ms | MOTA: 91.8%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3-Step Interactive Process Flow */}
      <div className="w-full max-w-6xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Automated Pipeline</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">How the System Enforces Violations</h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto">From video ingestion to uncompressed evidence logging in milliseconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {workflowSteps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="glass p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-primary/40 group-hover:text-primary transition-colors">{s.step}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-accent">{s.tag}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{s.title}</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Core Architectural Features Grid */}
      <div className="w-full max-w-6xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-[10px] sm:text-xs font-bold text-accent uppercase tracking-[0.2em]">Technical Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Engineered for Municipal Scale</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="glass p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-white/20 transition-colors group space-y-3"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Municipal Footer */}
      <footer className="w-full max-w-6xl border-t border-white/10 pt-8 pb-4 text-center space-y-3 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted">
          <span>Traffic Management Center (TMC)</span>
          <span>•</span>
          <span>City Government of Malaybalay</span>
          <span>•</span>
          <span>Bukidnon State University IT Department</span>
        </div>
        <p className="text-[10px] text-muted/60 uppercase tracking-widest">
          AI-Powered Yellow Box Zone Monitoring System • Licensed for LGU Traffic Operations
        </p>
      </footer>
    </div>
  );
}
