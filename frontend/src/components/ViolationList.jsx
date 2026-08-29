import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock, AlertCircle, Check } from 'lucide-react';

export function ViolationList({ violations, onViewImage, viewedIds = [], onMarkViewed }) {
  const isItemNew = (v) => {
    if (!v) return false;
    const id = v.id || v.detection_id || v.timestamp;
    return !viewedIds.includes(id);
  };

  const handleCardClick = (v) => {
    if (onMarkViewed) {
      const id = v.id || v.detection_id || v.timestamp;
      if (id) onMarkViewed(id);
    }
    if (onViewImage) {
      onViewImage(v);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {violations && violations.length > 0 ? (
          violations.slice(0, 10).map((v, index) => {
            const isNew = isItemNew(v);
            const keyId = v.id || v.detection_id || index;

            return (
              <motion.div
                key={keyId}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleCardClick(v)}
                className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 cursor-pointer ${
                  isNew
                    ? 'border-2 border-red-500/80 bg-gradient-to-r from-red-950/40 via-red-900/15 to-panel shadow-[0_0_22px_rgba(239,68,68,0.22)] ring-1 ring-red-500/30 hover:border-red-400 hover:shadow-[0_0_30px_rgba(239,68,68,0.35)]'
                    : 'glass hover:bg-white/5 border-white/5 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Glowing left accent bar for unviewed alerts */}
                {isNew && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse" />
                )}

                <div className="flex items-center gap-3 sm:gap-4 pl-1">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden bg-black/40 border transition-all ${
                    isNew ? 'border-red-500/50 shadow-md shadow-red-500/20 ring-1 ring-red-500/30' : 'border-white/10'
                  }`}>
                    {/* Thumbnail placeholder or real image if available */}
                    <img 
                      src={`http://localhost:5000/${v.image_path}`} 
                      className={`w-full h-full object-cover transition-opacity ${
                        isNew ? 'opacity-90 group-hover:opacity-100' : 'opacity-60 group-hover:opacity-100'
                      }`} 
                      alt="Violation Evidence"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'%3E%3C/path%3E%3Cpath d='m11 13 3-3 3 3'%3E%3C/path%3E%3Cpath d='m14 10 10 10'%3E%3C/path%3E%3Ccircle cx='14' cy='10' r='10'%3E%3C/circle%3E%3C/svg%3E"; 
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        isNew 
                          ? 'text-red-300 bg-red-500/20 border-red-400/40 font-extrabold' 
                          : 'text-red-400 bg-red-400/10 border-red-400/20'
                      }`}>
                        {v.label || 'Violation'}
                      </span>

                      {isNew ? (
                        <span className="flex items-center gap-1 text-[9px] font-black tracking-wider text-white bg-red-600/90 px-1.5 py-0.5 rounded-full border border-red-400/60 shadow-sm animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                          NEW
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted/60 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 text-muted/50" />
                          viewed
                        </span>
                      )}

                      <span className="text-[10px] text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {v.timestamp ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-muted font-medium truncate max-w-[110px]">{v.vehicle_color || 'Standard'}</p>
                      {v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && v.plate_number !== 'UNREAD' ? (
                        <span className="text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                          {v.plate_number}
                        </span>
                      ) : v.plate_number && v.plate_number.toUpperCase().includes('DISABLED') ? (
                        <span className="text-[10px] font-bold text-amber-300/90 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          LPR Disabled
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-400/70 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">
                          LPR Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(v);
                  }}
                  title={isNew ? "View New Alert Evidence" : "View Evidence"}
                  className={`p-2.5 rounded-xl transition-all shadow-sm ${
                    isNew
                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/40 shadow-red-500/10'
                      : 'bg-white/5 hover:bg-accent hover:text-white text-muted'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-muted gap-4">
            <AlertCircle className="w-12 h-12 opacity-10" />
            <p className="text-sm font-medium opacity-40">Scanning for violations...</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
