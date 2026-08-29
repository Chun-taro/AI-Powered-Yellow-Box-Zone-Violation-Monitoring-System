import { useState, useRef } from 'react';
import { Maximize2, Minimize2, RefreshCw, Camera, Activity, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function VideoFeed({ src, title = "Live Monitoring", stats = {} }) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  const refreshFeed = (e) => {
    if (e) e.stopPropagation();
    setIsRefreshing(true);
    const newTs = Date.now();
    setTimestamp(newTs);
    toast.success('Camera stream refreshed', { id: 'feed-refresh', duration: 2000 });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const toggleExpand = (e) => {
    if (e) e.stopPropagation();
    setIsExpanded(prev => !prev);
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="glass rounded-2xl sm:rounded-3xl overflow-hidden relative group w-full border border-white/10 shadow-2xl"
      >
        {/* Top Floating Control Bar - Always Interactive & Clear */}
        <div className="absolute inset-x-0 top-0 p-3 sm:p-4 flex flex-wrap justify-between items-center z-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-5">
            <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2 text-white bg-black/60 px-2.5 py-1 rounded-xl border border-white/10 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="truncate">{title}</span>
            </h3>
            
            <div className="flex items-center gap-2 sm:gap-3 bg-black/50 px-2.5 py-1 rounded-xl border border-white/5 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-tight">Active</span>
                <span className="text-xs font-bold text-primary">{stats.vehicle_count || 0}</span>
              </div>
              <span className="text-white/20">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-tight">FPS</span>
                <span className="text-xs font-bold text-emerald-400">{stats.fps_ai || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Button */}
            <button 
              type="button"
              onClick={refreshFeed} 
              className="p-2 sm:p-2.5 rounded-xl bg-black/70 hover:bg-white/20 border border-white/10 text-white transition-all cursor-pointer active:scale-95 shadow-lg flex items-center gap-1.5" 
              title="Refresh Camera Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
              <span className="text-[10px] font-bold hidden md:inline">Refresh</span>
            </button>

            {/* Large View / Fullscreen Button */}
            <button 
              type="button"
              onClick={toggleExpand}
              className="p-2 sm:p-2.5 rounded-xl bg-black/70 hover:bg-white/20 border border-white/10 text-white transition-all cursor-pointer active:scale-95 shadow-lg flex items-center gap-1.5" 
              title="Expand Large View"
            >
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
              <span className="text-[10px] font-bold hidden md:inline">Large View</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="aspect-video max-h-[38vh] sm:max-h-[44vh] md:max-h-[48vh] lg:max-h-[52vh] 2xl:max-h-[58vh] bg-zinc-950 flex items-center justify-center relative select-none w-full">
          <img 
            src={`${src}?t=${timestamp}`} 
            alt="Live Video Feed" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              e.target.style.display = 'block';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'none';
              }
            }}
          />
          
          {/* Reconnection Fallback Banner */}
          <div className="hidden absolute inset-0 flex-col items-center justify-center bg-zinc-950/90 text-muted gap-3 p-4 text-center z-10">
            <RefreshCw className="w-10 h-10 opacity-40 animate-spin text-primary" />
            <p className="text-sm font-bold text-white">Reconnecting to camera stream...</p>
            <button
              onClick={refreshFeed}
              className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 transition-colors cursor-pointer"
            >
              Force Retry Connection
            </button>
          </div>
        </div>
      </div>

      {/* High-Resolution Expanded Modal (Large View) */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md">
            {/* Click outside to close backdrop */}
            <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-7xl max-h-[96vh] glass rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col bg-zinc-950"
            >
              {/* Modal Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/10 bg-black/60">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono border border-primary/30">
                        THEATRE MODE
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={refreshFeed} 
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button 
                    onClick={() => setIsExpanded(false)} 
                    className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-white transition-colors cursor-pointer"
                    title="Close Large View"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* High-Resolution Frame */}
              <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden min-h-[50vh] max-h-[80vh]">
                <img 
                  src={`${src}?t=${timestamp}`} 
                  alt="Expanded Live Stream" 
                  className="w-full h-full object-contain max-h-[80vh]"
                />
              </div>

              {/* Modal Footer Telemetry Bar */}
              <div className="p-3 sm:p-4 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-muted font-mono">
                  <span>Vehicles Tracked: <strong className="text-primary">{stats.vehicle_count || 0}</strong></span>
                  <span>AI FPS: <strong className="text-emerald-400">{stats.fps_ai || 0}</strong></span>
                </div>
                <div className="text-[11px] text-muted font-mono">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Esc</kbd> or click outside to exit
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
