import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { VideoFeed } from '../components/VideoFeed';
import { ViolationList } from '../components/ViolationList';
import { AlertTriangle, Camera, X, ExternalLink, Calendar, Activity, CreditCard, Upload, PlayCircle, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

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
      setTestVideos(tvRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
                      setSelectedViolation(latestViolation);
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
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto w-full">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex flex-wrap items-center gap-2 text-white">
            TMC Malaybalay <span className="text-primary font-bold text-base sm:text-lg">• Live Command Center</span>
          </h2>
          <p className="text-muted text-xs mt-0.5">AI-Powered Yellow Box Zone Intersection Monitoring & Enforcement</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest hidden sm:inline">Source</span>
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
              className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold outline-none focus:border-accent/50 transition-colors cursor-pointer disabled:opacity-50 text-white max-w-[180px] sm:max-w-none"
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
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold cursor-pointer hover:border-accent/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isUploading ? 'UPLOADING...' : 'UPLOAD TEST VIDEO'}</span>
              <span className="sm:hidden">{isUploading ? '...' : 'UPLOAD'}</span>
            </label>
          </div>

          {showCustomSource && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="rtsp://admin:password@ip:port/..."
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSourceChange(customSource)}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium w-full sm:w-64 outline-none focus:border-accent/50 text-white"
              />
              <button
                onClick={() => handleSourceChange(customSource)}
                disabled={isUpdatingSource || !customSource}
                className="px-3 sm:px-4 py-1.5 bg-accent hover:bg-accent/90 text-white text-[10px] font-bold rounded-xl transition-all disabled:opacity-50 shrink-0"
              >
                CONNECT
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isUpdatingSource ? 'SWITCHING...' : 'AI ACTIVE'}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Main Feed + Stats */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <VideoFeed 
            src={`${API_BASE}/video_feed`} 
            stats={realtimeStats}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

        {/* Live Alerts */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="glass p-4 sm:p-6 rounded-3xl lg:rounded-[2.5rem] h-[450px] lg:h-[620px] xl:h-[680px] flex flex-col border border-white/5">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-white/90">Live Alerts</h3>
              <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  {violations.length} recent
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <ViolationList
                violations={violations}
                onViewImage={setSelectedViolation}
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
                <div className="lg:flex-1 bg-black/40 flex items-center justify-center min-h-[240px] sm:min-h-[360px] p-2">
                  <img
                    src={`${API_BASE}/${selectedViolation.image_path}`}
                    alt="Violation Evidence"
                    className="max-w-full max-h-[50vh] lg:max-h-full object-contain rounded-2xl"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=Evidence+Not+Available";
                    }}
                  />
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
                        <p className="text-xs font-medium">
                          <span className="text-orange-400 font-bold">{selectedViolation.stop_duration}s</span> • {selectedViolation.vehicle_color || "Standard"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-amber-500/10 transition-colors">
                        <CreditCard className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight">Plate Number</p>
                        <p className="text-xs font-bold tracking-wider text-emerald-400">
                          {selectedViolation.plate_number || "UNREAD / NOT DETECTED"}
                        </p>
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
