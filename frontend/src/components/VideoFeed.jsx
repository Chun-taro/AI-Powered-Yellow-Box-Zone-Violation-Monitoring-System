import { useState, useEffect } from 'react';
import { Maximize2, RefreshCw } from 'lucide-react';

export function VideoFeed({ src, title = "Live Monitoring", stats = {} }) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isHovered, setIsHovered] = useState(false);

  const refreshFeed = () => {
    setTimestamp(Date.now());
  };

  return (
    <div 
      className="glass rounded-2xl sm:rounded-3xl overflow-hidden relative group w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-x-0 top-0 p-2.5 sm:p-4 flex flex-wrap justify-between items-center z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 text-white">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="truncate">{title}</span>
          </h3>
          
          <div className="flex items-center gap-2 sm:gap-4 border-l border-white/10 pl-2 sm:pl-4">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-tight hidden xs:inline">Vehicles</span>
              <span className="text-xs font-bold text-primary">{stats.vehicle_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-tight hidden xs:inline">FPS</span>
              <span className="text-xs font-bold text-emerald-400">{stats.fps_ai || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <button onClick={refreshFeed} className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Refresh Camera Feed">
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </button>
          <button className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors hidden sm:block" title="Maximize View">
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="aspect-video bg-black flex items-center justify-center relative">
        <img 
          src={`${src}?t=${timestamp}`} 
          alt="Video Feed" 
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden absolute inset-0 flex-col items-center justify-center text-muted gap-3">
          <RefreshCw className="w-10 h-10 opacity-20 animate-spin" />
          <p className="text-sm font-medium">Reconnecting to camera...</p>
        </div>
      </div>
    </div>
  );
}
