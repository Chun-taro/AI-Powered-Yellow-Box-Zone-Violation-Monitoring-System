import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { VideoFeed } from '../components/VideoFeed';
import { ViolationList } from '../components/ViolationList';
import { AlertTriangle, Camera, X, ExternalLink, Calendar, Activity, CreditCard, Upload, PlayCircle, Film, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVehicleColorMeta } from '../utils/colorHelper';
import toast from 'react-hot-toast';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = "http://localhost:5000";

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio Context requirement fallback
  }
};

export function Dashboard() {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({ total_violations: 0 });
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraConfig, setCameraConfig] = useState({ camera_source: '0' });
  const [isUpdatingSource, setIsUpdatingSource] = useState(false);
  const [showCustomSource, setShowCustomSource] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [realtimeStats, setRealtimeStats] = useState({});
  const [testVideos, setTestVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lprEnabled, setLprEnabled] = useState(true);
  const [isTogglingLpr, setIsTogglingLpr] = useState(false);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tmc_viewed_violations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const markViolationAsViewed = (id) => {
    if (!id) return;
    setViewedIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('tmc_viewed_violations', JSON.stringify(next));
      } catch (e) {
        console.error("Error saving viewed violations", e);
      }
      return next;
    });
  };

  const handleMarkAllAsViewed = () => {
    const allIds = violations.map(v => v.id || v.detection_id || v.timestamp).filter(Boolean);
    setViewedIds(prev => {
      const next = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('tmc_viewed_violations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    toast.success("All live alerts marked as viewed", { icon: '✓' });
  };

  const handleViewViolation = (violation) => {
    setSelectedViolation(violation);
    if (violation) {
      const id = violation.id || violation.detection_id || violation.timestamp;
      if (id) {
        markViolationAsViewed(id);
      }
    }
  };

  const userRole = Cookies.get('user_role') || 'admin';

  const fetchData = async () => {
    try {
      const [vRes, sRes, cRes, tvRes] = await Promise.all([
        axios.get(`${API_BASE}/api/recent_violations`),
        axios.get(`${API_BASE}/api/stats`),
        axios.get(`${API_BASE}/api/config`),
        axios.get(`${API_BASE}/api/test_videos`)
      ]);
      setViolations(vRes.data);
      setStats(sRes.data);
      setCameraConfig(cRes.data);
      if (cRes.data && cRes.data.lpr_enabled !== undefined) {
        setLprEnabled(cRes.data.lpr_enabled);
      }
      setTestVideos(tvRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleToggleLPR = async () => {
    if (userRole !== 'admin') {
      toast.error("Only Super Administrators can toggle LPR system features.");
      return;
    }
    const nextState = !lprEnabled;
    setIsTogglingLpr(true);
    try {
      let res;
      try {
        res = await axios.post(`${API_BASE}/api/settings/lpr`, { enabled: nextState });
      } catch (err) {
        res = await axios.post(`${API_BASE}/set_lpr`, { enabled: nextState });
      }
      if (res && res.data && res.data.success) {
        setLprEnabled(res.data.lpr_enabled);
        if (res.data.lpr_enabled) {
          toast.success("License Plate Recognition (ALPR) Enabled", { icon: '🔍' });
        } else {
          toast("LPR OCR Bypassed (Bypassing low-res text OCR)", { icon: '⚡' });
        }
      }
    } catch (error) {
      console.error("Failed to toggle LPR:", error);
      toast.error("Failed to update LPR setting. Please restart backend server if newly updated.");
    } finally {
      setIsTogglingLpr(false);
    }
  };

  const handleSourceChange = async (source) => {
    if (!source) return;
    setIsUpdatingSource(true);
    try {
      await axios.post(`${API_BASE}/set_camera`, { source });
      setCameraConfig(prev => ({ ...prev, camera_source: source }));
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
      console.error("Failed to update camera source:", error);
    } finally {
      setIsUpdatingSource(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setIsUploading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/upload_video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const tvRes = await axios.get(`${API_BASE}/api/test_videos`);
        setTestVideos(tvRes.data);
        handleSourceChange(`camera/${res.data.filename}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload video.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const pollForUpdates = async () => {
      while (isMounted) {
        try {
          const res = await axios.get(`${API_BASE}/api/wait_for_violation`, {
            signal: abortController.signal
          });
          if (res.data.update && isMounted) {
            playAlertSound();
            
            // Fetch updated violations list to get latest details
            try {
              const latestRes = await axios.get(`${API_BASE}/api/recent_violations`);
              const latestList = latestRes.data || [];
              setViolations(latestList);
              const latestViolation = latestList.length > 0 ? latestList[0] : null;

              toast.custom((t) => (
                <div
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (latestViolation) {
                      handleViewViolation(latestViolation);
                    } else {
                      window.location.href = '/logs';
                    }
                  }}
                  className={`${
                    t.visible ? 'animate-enter opacity-100 scale-100' : 'animate-leave opacity-0 scale-95'
                  } max-w-md w-full bg-zinc-950/95 backdrop-blur-2xl border-2 border-red-500/70 shadow-[0_0_35px_rgba(239,68,68,0.4)] rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-red-400 hover:scale-[1.03] transition-all group pointer-events-auto select-none`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 group-hover:bg-red-500 group-hover:text-black transition-colors shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black uppercase tracking-wider text-red-400">
                          🚨 Violation Detected!
                        </p>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-200">
                          Click to View
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {latestViolation ? `${latestViolation.label.toUpperCase()} (${latestViolation.stop_duration}s stop time)` : 'Yellow Box Stop-Time Violation'}
                      </p>
                      <p className="text-[11px] text-muted group-hover:text-primary transition-colors flex items-center gap-1 mt-0.5">
                        <span>Click popup to inspect NCAP evidence snapshot</span>
                        <ExternalLink className="w-3 h-3 text-primary" />
                      </p>
                    </div>
                  </div>
                </div>
              ), {
                duration: 8000,
                position: 'top-right'
              });
            } catch (err) {
              console.error("Error fetching latest violation for toast:", err);
            }

            await fetchData();
          }
        } catch (error) {
          if (axios.isCancel(error) || !isMounted) break;
          console.error("Polling error:", error);
          if (isMounted) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
    };

    fetchData().then(() => {
      if (isMounted) pollForUpdates();
    });

    // Real-time stats polling (every 2 seconds)
    const statsInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await axios.get(`${API_BASE}/api/realtime_stats`, {
          signal: abortController.signal
        });
        setRealtimeStats(res.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error fetching realtime stats:", error);
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(statsInterval);
    };
  }, []);


  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1600px] mx-auto w-full">
      {/* Responsive Command Center Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 bg-zinc-900/70 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/5 backdrop-blur-md shadow-lg">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-black tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2 text-white">
            <span>TMC Malaybalay</span>
            <span className="text-primary font-bold text-xs sm:text-sm">• Live Command Center</span>
          </h2>
          <p className="text-muted text-[11px] sm:text-xs truncate">AI-Powered Yellow Box Zone Intersection Monitoring & Enforcement</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 w-full md:w-auto">
          {/* Camera Source Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest hidden sm:inline">Source</span>
            <select
              value={showCustomSource ? 'custom' : cameraConfig.camera_source}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomSource(true);
                } else {
                  setShowCustomSource(false);
                  handleSourceChange(e.target.value);
                }
              }}
              disabled={isUpdatingSource}
              className="bg-black/60 border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold outline-none focus:border-accent/50 transition-colors cursor-pointer disabled:opacity-50 text-white max-w-[160px] sm:max-w-none"
            >
              <option value="0" className="bg-zinc-900 text-white">Camera 0 (Default)</option>
              <option value="1" className="bg-zinc-900 text-white">Camera 1 (Secondary)</option>
              <option value="2" className="bg-zinc-900 text-white">Camera 2 (Third)</option>
              
              {testVideos.map(video => (
                <option key={video} value={`camera/${video}`} className="bg-zinc-900 text-white">
                  Test: {video}
                </option>
              ))}
              
              <option value="custom" className="bg-zinc-900 text-white">+ Custom RTSP/Stream</option>
            </select>
          </div>

          {/* Upload Video Button */}
          <div className="relative">
            <input
              type="file"
              id="video-upload"
              className="hidden"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={isUploading}
            />
            <label
              htmlFor="video-upload"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs font-bold cursor-pointer hover:border-accent/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className={`w-3.5 h-3.5 text-accent ${isUploading ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isUploading ? 'UPLOADING...' : 'UPLOAD VIDEO'}</span>
              <span className="sm:hidden">{isUploading ? '...' : 'UPLOAD'}</span>
            </label>
          </div>

          {showCustomSource && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="rtsp://admin:pass@ip:port/..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSourceChange(customSource)}
                className="bg-black/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium w-full sm:w-56 outline-none focus:border-accent/50 text-white"
              />
              <button
                onClick={() => handleSourceChange(customSource)}
                disabled={isUpdatingSource || !customSource}
                className="px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-[10px] font-bold rounded-xl transition-all disabled:opacity-50 shrink-0"
              >
                CONNECT
              </button>
            </div>
          )}

          {/* Admin LPR Toggle */}
          {userRole === 'admin' && (
            <button
              onClick={handleToggleLPR}
              disabled={isTogglingLpr}
              title={lprEnabled ? "LPR Active: Click to Disable" : "LPR Disabled: Click to Enable"}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
                lprEnabled
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-300 hover:bg-amber-400/20 shadow-md shadow-amber-400/5'
                  : 'bg-zinc-800/80 border-white/10 text-muted hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${lprEnabled ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="hidden sm:inline">LPR:</span>
              <span className={lprEnabled ? 'text-amber-300 font-extrabold' : 'text-zinc-400'}>
                {lprEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* AI Active Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs">{isUpdatingSource ? 'SWITCHING...' : 'AI ACTIVE'}</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Column Responsive Command Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-stretch">
        {/* Left Column: Live Video Feed + Telemetry Stats Row */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col justify-between gap-3 sm:gap-3.5">
          <VideoFeed 
            src={`${API_BASE}/video_feed`} 
            stats={realtimeStats}
          />

          {/* Compact Telemetry Stats Row - Always in View */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            <StatCard
              title="Total Violations"
              value={loading ? '—' : stats.total_violations}
              icon={AlertTriangle}
              color="danger"
            />
            <StatCard
              title="Saved Videos"
              value={loading ? '—' : testVideos.length}
              icon={Film}
              color="primary"
            />
            <StatCard
              title="Active Cameras"
              value="1"
              icon={Camera}
              color="accent"
            />
          </div>
        </div>

        {/* Right Column: Live Alerts Feed - Synchronized Height */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex flex-col min-h-[380px] lg:min-h-0">
          <div className="glass p-3 sm:p-4 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] h-full flex flex-col border border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-2.5 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white/90">Live Alerts</h3>
                {violations.filter(v => {
                  const id = v.id || v.detection_id || v.timestamp;
                  return id && !viewedIds.includes(id);
                }).length > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-[9px] sm:text-[10px] font-black text-red-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    {violations.filter(v => {
                      const id = v.id || v.detection_id || v.timestamp;
                      return id && !viewedIds.includes(id);
                    }).length} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {violations.filter(v => {
                  const id = v.id || v.detection_id || v.timestamp;
                  return id && !viewedIds.includes(id);
                }).length > 0 && (
                  <button
                    onClick={handleMarkAllAsViewed}
                    className="text-[10px] font-bold text-muted hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer border border-white/5"
                    title="Mark all alerts as viewed"
                  >
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-accent/10 border border-accent/20 rounded-full">
                  <span className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-wider">
                    {violations.length} recent
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent max-h-[460px] lg:max-h-[calc(100vh-240px)]">
              <ViolationList
                violations={violations}
                onViewImage={handleViewViolation}
                viewedIds={viewedIds}
                onMarkViewed={markViolationAsViewed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Modal */}
      <AnimatePresence>
        {selectedViolation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedViolation(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass rounded-3xl lg:rounded-[2.5rem] shadow-2xl border border-white/10"
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Image */}
                <div className="lg:flex-1 bg-black/40 flex items-center justify-center min-h-[240px] sm:min-h-[360px] p-2 relative group select-none">
                  <img
                    src={`${API_BASE}/${selectedViolation.image_path}`}
                    alt="Violation Evidence"
                    className="max-w-full max-h-[50vh] lg:max-h-full object-contain rounded-2xl shadow-lg"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=Evidence+Not+Available";
                    }}
                  />

                  {/* Floating Detected Vehicle Color Overlay Badge */}
                  {(() => {
                    const cMeta = getVehicleColorMeta(selectedViolation.vehicle_color);
                    return (
                      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/80 border border-white/15 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                        <span 
                          className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-sm"
                          style={{ backgroundColor: cMeta.hex, boxShadow: `0 0 10px ${cMeta.shadow}` }}
                        />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Color:</span>
                        <span className={`text-xs font-black uppercase tracking-wider ${cMeta.text}`}>
                          {cMeta.name}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Details */}
                <div className="w-full lg:w-80 p-5 sm:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Violation Details</h4>
                      <h3 className="text-xl font-bold capitalize text-white">{selectedViolation.label}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedViolation(null)}
                      className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-muted hover:text-white" />
                    </button>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-accent/10 transition-colors">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight">Timestamp</p>
                        <p className="text-xs font-medium">
                          {new Date(selectedViolation.timestamp || selectedViolation.violation_timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight">Stop Duration & Color</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-orange-400 font-bold">{selectedViolation.stop_duration}s</span>
                          <span className="text-white/20">•</span>
                          {(() => {
                            const cMeta = getVehicleColorMeta(selectedViolation.vehicle_color);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-black uppercase tracking-wider ${cMeta.bg} ${cMeta.border} ${cMeta.text}`}>
                                <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: cMeta.hex }} />
                                {cMeta.name}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-amber-500/10 transition-colors">
                        <CreditCard className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight">Plate Number</p>
                        {selectedViolation.plate_number && !selectedViolation.plate_number.toUpperCase().includes('DISABLED') && !selectedViolation.plate_number.toUpperCase().includes('UNREAD') ? (
                          <p className="text-xs font-black tracking-widest text-emerald-400">
                            {selectedViolation.plate_number}
                          </p>
                        ) : selectedViolation.plate_number && selectedViolation.plate_number.toUpperCase().includes('DISABLED') ? (
                          <span className="inline-block mt-0.5 text-[11px] font-semibold tracking-wider text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            LPR DISABLED
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 text-[11px] font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            UNREADABLE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-blue-500/10 transition-colors">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight">Location</p>
                        <p className="text-[11px] font-medium text-white/80">
                          {selectedViolation.location || "Sayre Highway - Fortich St., Malaybalay City"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
