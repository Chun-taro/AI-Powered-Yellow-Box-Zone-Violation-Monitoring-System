import { useState, useRef, useEffect } from 'react';
import { Save, Undo, Info, Camera, MousePointer2, CheckCircle2, AlertTriangle, XCircle, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:5000";

export function ZoneSetup() {
  const navigate = useNavigate();
  const [points, setPoints] = useState([]);
  const [currentZone, setCurrentZone] = useState([]);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Custom Modal/Popup State (Replaces browser window.alert)
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'warning' | 'error' | 'confirm'
    title: '',
    message: '',
    details: null,
    onConfirm: null
  });

  useEffect(() => {
    // Fetch current zone configuration
    axios.get(`${API_BASE}/api/config`)
      .then(res => {
        if (res.data && res.data.yellow_zone) {
          setCurrentZone(res.data.yellow_zone);
        }
      })
      .catch(err => console.error("Failed to load zone config:", err));
    
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resizeCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      draw();
    }
  };

  const handleCanvasClick = (e) => {
    if (points.length >= 4) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Maximum Points Reached',
        message: 'You have already plotted 4 corner points. Click "Save Configuration" to apply or "Reset Points" to start over.',
        details: null,
        onConfirm: null
      });
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPoints(prev => [...prev, { x, y }]);
  };

  const removeLastPoint = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p, i) => {
        if (i > 0) ctx.lineTo(p.x, p.y);
        
        // Draw point circle
        ctx.save();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw point index label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`P${i+1}`, p.x + 10, p.y - 10);
        ctx.restore();
      });

      if (points.length === 4) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    draw();
  }, [points]);

  const handleSaveClick = () => {
    if (points.length !== 4) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Incomplete Boundary',
        message: `Please select exactly 4 corner points on the video stream to outline the Yellow Box Zone. Currently selected: ${points.length}/4.`,
        details: null,
        onConfirm: null
      });
      return;
    }

    const video = videoRef.current;
    if (!video || !video.clientWidth || !video.clientHeight) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Video Stream Unready',
        message: 'Camera feed is still initializing. Please wait a moment and try again.',
        details: null,
        onConfirm: null
      });
      return;
    }

    const scaleX = video.naturalWidth / video.clientWidth;
    const scaleY = video.naturalHeight / video.clientHeight;

    const realPoints = points.map(p => [
      Math.round(p.x * scaleX),
      Math.round(p.y * scaleY)
    ]);

    // Show Confirmation Dialog Modal
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Apply Zone Configuration?',
      message: 'This will update the Yellow Box detection boundary used by AI camera tracking and violation detection.',
      details: realPoints,
      onConfirm: () => executeSave(realPoints)
    });
  };

  const executeSave = async (realPoints) => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/zone`, { zone: realPoints });
      setCurrentZone(realPoints);
      setPoints([]);
      setSaving(false);
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Zone Saved Successfully!',
        message: 'The Yellow Box monitoring perimeter has been updated and applied to the live surveillance engine.',
        details: null,
        onConfirm: null
      });
    } catch (err) {
      console.error(err);
      setSaving(false);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Failed to Save Zone',
        message: 'An error occurred while transmitting coordinates to the server. Please check your backend connection.',
        details: null,
        onConfirm: null
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Zone Configuration</h2>
          <p className="text-muted text-xs sm:text-sm mt-0.5">Define the Yellow Box detection boundary coordinates for TMC surveillance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
          {points.length > 0 && (
            <button 
              onClick={removeLastPoint} 
              className="btn-secondary px-3.5 sm:px-4 py-2.5 rounded-2xl flex items-center gap-2 border-white/10 text-xs sm:text-sm font-semibold shrink-0"
              title="Undo last point"
            >
              <CornerDownLeft className="w-4 h-4" />
              Undo Point
            </button>
          )}
          <button 
            onClick={() => setPoints([])} 
            className="btn-secondary px-4 sm:px-6 py-2.5 rounded-2xl flex items-center gap-2 border-white/10 text-xs sm:text-sm font-semibold shrink-0"
          >
            <Undo className="w-4 h-4" />
            Reset Points
          </button>
          <button 
            onClick={handleSaveClick} 
            disabled={points.length !== 4 || saving}
            className="btn-primary px-4 sm:px-6 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-accent/20 text-xs sm:text-sm font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Instructions & Selected Points */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
          <div className="glass p-5 sm:p-6 rounded-3xl space-y-3 sm:space-y-4">
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              Instructions
            </h3>
            <ul className="text-xs sm:text-sm text-muted space-y-3 sm:space-y-4">
              <li className="flex gap-2.5 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent/10 border border-accent/20 flex-shrink-0 flex items-center justify-center text-accent text-xs font-bold">1</span>
                <span>Wait for live video feed to load.</span>
              </li>
              <li className="flex gap-2.5 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent/10 border border-accent/20 flex-shrink-0 flex items-center justify-center text-accent text-xs font-bold">2</span>
                <span>Click the 4 corners of the Yellow Box Zone in clockwise or counter-clockwise order.</span>
              </li>
              <li className="flex gap-2.5 sm:gap-3">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-accent/10 border border-accent/20 flex-shrink-0 flex items-center justify-center text-accent text-xs font-bold">3</span>
                <span>The polygon closes automatically after plotting the 4th point. Click Save to apply.</span>
              </li>
            </ul>
          </div>

          <div className="glass p-5 sm:p-6 rounded-3xl bg-amber-400/5 border-amber-400/10 flex items-center justify-between sm:block">
            <div className="flex items-center gap-2.5 text-amber-400 sm:mb-2">
              <MousePointer2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <h3 className="font-bold text-sm sm:text-base">Points Selected</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{points.length} / 4</p>
              {points.length === 4 && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                  Ready to Save
                </span>
              )}
            </div>
          </div>

          {/* Coordinate List Display */}
          {points.length > 0 && (
            <div className="glass p-4 sm:p-5 rounded-3xl border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Corner Coordinates</h4>
              <div className="space-y-1.5 font-mono text-xs">
                {points.map((pt, idx) => (
                  <div key={idx} className="flex justify-between items-center px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-amber-400 font-bold">P{idx + 1}</span>
                    <span className="text-muted">X: {Math.round(pt.x)}, Y: {Math.round(pt.y)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Canvas Container */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative border-white/5 shadow-2xl">
            <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-black/70 backdrop-blur border border-white/10 flex items-center gap-2 sm:gap-3">
               <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
               <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white">Setup Mode</span>
            </div>
            
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img 
                ref={videoRef}
                src={`${API_BASE}/video_feed`}
                alt="Setup Feed"
                className="w-full h-full object-contain select-none pointer-events-none"
                onLoad={resizeCanvas}
              />
              <canvas 
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 cursor-crosshair z-10 w-full h-full touch-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modern Pop-up / Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative max-w-md w-full glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                {/* Icon based on Type */}
                {modal.type === 'success' && (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                )}
                {modal.type === 'warning' && (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}
                {modal.type === 'error' && (
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
                    <XCircle className="w-8 h-8" />
                  </div>
                )}
                {modal.type === 'confirm' && (
                  <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/20">
                    <Save className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{modal.title}</h3>
                  <p className="text-muted text-xs sm:text-sm mt-1.5 leading-relaxed">{modal.message}</p>
                </div>

                {/* Coordinate Details for Confirmation */}
                {modal.details && (
                  <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5 text-left font-mono text-xs text-muted space-y-1">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1">Target Matrix (Pixels):</div>
                    {modal.details.map((pt, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white/80">Point {i + 1}:</span>
                        <span className="text-accent">[{pt[0]}, {pt[1]}]</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="w-full pt-2 flex flex-col sm:flex-row gap-2.5">
                  {modal.type === 'confirm' ? (
                    <>
                      <button
                        onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        className="w-full sm:w-1/2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (modal.onConfirm) modal.onConfirm();
                        }}
                        className="w-full sm:w-1/2 py-3 rounded-2xl bg-accent hover:bg-accent/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        Confirm & Apply
                      </button>
                    </>
                  ) : modal.type === 'success' ? (
                    <>
                      <button
                        onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        className="w-full sm:w-1/2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all"
                      >
                        Stay Here
                      </button>
                      <button
                        onClick={() => {
                          setModal(prev => ({ ...prev, isOpen: false }));
                          navigate('/dashboard');
                        }}
                        className="w-full sm:w-1/2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-500/90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                      className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/10 transition-all"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
