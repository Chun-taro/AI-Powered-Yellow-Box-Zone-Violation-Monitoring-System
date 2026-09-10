import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Download, SearchIcon, Clock, AlertCircle, Palette, Edit2, Check, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getVehicleColorMeta } from '../utils/colorHelper';
import { ZoomableEvidenceImage } from '../components/ZoomableEvidenceImage';

const API_BASE = "http://localhost:5000";

export function ViolationLogs() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("ALL");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [isEditingPlate, setIsEditingPlate] = useState(false);
  const [manualPlate, setManualPlate] = useState("");
  const [isSavingPlate, setIsSavingPlate] = useState(false);

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleSelectViolation = (v) => {
    setSelectedViolation(v);
    setIsEditingPlate(false);
    const existing = v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && !v.plate_number.toUpperCase().includes('UNREAD')
      ? v.plate_number
      : "";
    setManualPlate(existing);
  };

  const handleSavePlate = async () => {
    if (!manualPlate.trim() || !selectedViolation) return;
    setIsSavingPlate(true);
    try {
      const cleanPlate = manualPlate.trim().toUpperCase();
      await axios.patch(`${API_BASE}/api/violations/${selectedViolation.id}/plate`, {
        plate_number: cleanPlate
      });
      setSelectedViolation(prev => ({ ...prev, plate_number: cleanPlate }));
      setViolations(prev => prev.map(v => v.id === selectedViolation.id ? { ...v, plate_number: cleanPlate } : v));
      setIsEditingPlate(false);
      toast.success(`License plate updated: ${cleanPlate}`, { icon: '🚘' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update plate");
    } finally {
      setIsSavingPlate(false);
    }
  };


  const fetchViolations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/violations`);
      setViolations(res.data);
      setLoading(false);
    } catch (error) {
       console.error(error);
    }
  };

  const availableColors = Array.from(new Set(violations.map(v => v.vehicle_color || 'Standard'))).filter(Boolean);

  const filtered = violations.filter(v => {
    // Color filter
    if (colorFilter !== 'ALL') {
      const vCol = (v.vehicle_color || 'Standard').toLowerCase();
      if (!vCol.includes(colorFilter.toLowerCase())) {
        return false;
      }
    }
    // Search query (label, plate, timestamp, vehicle_color, location)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchLabel = v.label?.toLowerCase().includes(q);
      const matchPlate = v.plate_number?.toLowerCase().includes(q);
      const matchTime = v.timestamp?.toLowerCase().includes(q);
      const matchColor = v.vehicle_color?.toLowerCase().includes(q);
      const matchLoc = v.location?.toLowerCase().includes(q);
      if (!matchLabel && !matchPlate && !matchTime && !matchColor && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  const downloadImage = async (path) => {
    try {
      const response = await fetch(`${API_BASE}/${path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Violation History</h2>
          <p className="text-muted text-xs sm:text-sm mt-0.5">
            Full database of captured yellow box stop-time violations ({filtered.length} of {violations.length})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search vehicle, color, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-accent/50 transition-colors w-full sm:w-64 text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-accent/50 text-white cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Colors</option>
              {availableColors.map(c => (
                <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>
          {(colorFilter !== 'ALL' || search.trim()) && (
            <button 
              onClick={() => { setColorFilter('ALL'); setSearch(''); }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-muted hover:text-white transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <div className="glass rounded-2xl sm:rounded-[2rem] overflow-hidden border-white/5 shadow-xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Evidence</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Vehicle Class</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Color</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Plate No.</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Location</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted">Timestamp</th>
                <th className="px-4 sm:px-6 py-4 sm:py-5 text-xs font-bold uppercase tracking-wider text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(filtered || []).map((v, i) => (
                <tr key={v.id || i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-16 h-10 rounded-lg bg-black/40 overflow-hidden border border-white/10">
                      <img 
                        src={`${API_BASE}/${v.image_path}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'%3E%3C/path%3E%3Cpath d='m11 13 3-3 3 3'%3E%3C/path%3E%3Cpath d='m14 10 10 10'%3E%3C/path%3E%3Ccircle cx='14' cy='10' r='10'%3E%3C/circle%3E%3C/svg%3E"; 
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-red-400/10 text-red-400 text-xs font-bold border border-red-400/20 uppercase">
                      {v.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const cMeta = getVehicleColorMeta(v.vehicle_color);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${cMeta.bg} ${cMeta.border} ${cMeta.text}`}>
                          <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: cMeta.hex }} />
                          {cMeta.name}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {v.plate_number && !v.plate_number.toUpperCase().includes('DISABLED') && !v.plate_number.toUpperCase().includes('UNREAD') ? (
                      <span className="text-xs font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded border border-emerald-400/20">
                        {v.plate_number}
                      </span>
                    ) : v.plate_number && v.plate_number.toUpperCase().includes('DISABLED') ? (
                      <span className="text-[11px] font-semibold tracking-wider text-white/50 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                        LPR DISABLED
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
                        UNREADABLE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted max-w-[180px] truncate">
                    {v.location || 'Sayre Highway - Fortich St.'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{v.timestamp?.split(' ')[0]}</span>
                      <span className="text-[10px] text-muted">{v.timestamp?.split(' ')[1]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleSelectViolation(v)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-accent hover:text-white transition-all text-muted"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center text-muted gap-4">
                <SearchIcon className="w-16 h-16 opacity-10" />
                <p className="text-lg font-medium opacity-40">No violations match your search</p>
             </div>
          )}
        </div>
      </div>

      {/* Modal for viewing image */}
      <AnimatePresence>
        {selectedViolation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedViolation(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto glass rounded-3xl sm:rounded-[2.5rem] border border-white/10 shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
                   <button 
                    onClick={() => setSelectedViolation(null)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white transition-colors border border-white/10"
                   >
                     ✕
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12">
                   <div className="lg:col-span-8 bg-black/60 p-2 relative flex items-center justify-center min-h-[280px] sm:min-h-[420px]">
                      <ZoomableEvidenceImage 
                        src={`${API_BASE}/${selectedViolation.image_path}`} 
                        vehicleColor={selectedViolation.vehicle_color}
                        alt="Evidence"
                        className="w-full h-full min-h-[280px] sm:min-h-[420px]"
                      />
                   </div>
                   <div className="lg:col-span-4 p-5 sm:p-8 space-y-6 self-center border-t lg:border-t-0 lg:border-l border-white/10">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold mb-1">Violation Details</h3>
                        <p className="text-muted text-xs italic">Captured on Automated AI Intercept</p>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                         <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                            <span className="text-xs sm:text-sm text-muted flex items-center gap-2"><Clock className="w-4 h-4" /> Timestamp</span>
                            <span className="text-xs sm:text-sm font-bold truncate max-w-[160px]">{selectedViolation.timestamp}</span>
                         </div>
                         <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                            <span className="text-xs sm:text-sm text-muted flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Type</span>
                            <span className="text-xs sm:text-sm font-bold text-red-400 capitalize">{selectedViolation.label}</span>
                         </div>
                         <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                            <span className="text-xs sm:text-sm text-muted flex items-center gap-2"><Palette className="w-4 h-4" /> Vehicle Color</span>
                            {(() => {
                              const cMeta = getVehicleColorMeta(selectedViolation.vehicle_color);
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-black uppercase tracking-wider ${cMeta.bg} ${cMeta.border} ${cMeta.text}`}>
                                  <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: cMeta.hex }} />
                                  {cMeta.name}
                                </span>
                              );
                            })()}
                         </div>
                         <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                            <span className="text-xs sm:text-sm text-muted flex items-center gap-2"><Eye className="w-4 h-4" /> Confidence</span>
                            <span className="text-xs sm:text-sm font-bold">{selectedViolation.confidence ? (selectedViolation.confidence * 100).toFixed(1) : '0'}%</span>
                         </div>
                         <div className="py-2.5 border-b border-white/5">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs sm:text-sm text-muted flex items-center gap-1.5">Plate Number</span>
                              {!isEditingPlate && (
                                <button
                                  onClick={() => setIsEditingPlate(true)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-white transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{selectedViolation.plate_number ? 'Edit' : 'Enter Plate'}</span>
                                </button>
                              )}
                            </div>

                            {isEditingPlate ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="e.g. ABC 1234"
                                  value={manualPlate}
                                  onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSavePlate();
                                    if (e.key === 'Escape') setIsEditingPlate(false);
                                  }}
                                  autoFocus
                                  className="flex-1 bg-white/10 border border-accent/50 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-mono tracking-widest text-white uppercase outline-none focus:ring-1 focus:ring-accent"
                                />
                                <button
                                  onClick={handleSavePlate}
                                  disabled={isSavingPlate || !manualPlate.trim()}
                                  title="Save Plate"
                                  className="p-2 rounded-xl bg-accent hover:bg-accent/90 text-white disabled:opacity-40 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setIsEditingPlate(false)}
                                  title="Cancel"
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-muted hover:text-white transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                {selectedViolation.plate_number && !selectedViolation.plate_number.toUpperCase().includes('DISABLED') && !selectedViolation.plate_number.toUpperCase().includes('UNREAD') ? (
                                  <span className="text-xs font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20">
                                    {selectedViolation.plate_number}
                                  </span>
                                ) : selectedViolation.plate_number && selectedViolation.plate_number.toUpperCase().includes('DISABLED') ? (
                                  <span className="text-xs font-semibold tracking-wider text-white/50 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                                    LPR DISABLED
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
                                    UNREADABLE
                                  </span>
                                )}
                              </div>
                            )}
                         </div>
                      </div>

                      <button 
                        onClick={() => downloadImage(selectedViolation.image_path)}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-accent/20"
                      >
                         <Download className="w-4 h-4" />
                         Download Evidence
                      </button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
