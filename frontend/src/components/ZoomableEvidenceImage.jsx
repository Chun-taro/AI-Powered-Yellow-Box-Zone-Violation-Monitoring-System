import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Move, Maximize2, Sun } from 'lucide-react';
import { getVehicleColorMeta } from '../utils/colorHelper';

/**
 * ZoomableEvidenceImage
 * Interactive, high-resolution evidence inspector allowing traffic enforcers
 * to zoom, pan, and visually enhance license plate and vehicle features.
 */
export function ZoomableEvidenceImage({ 
  src, 
  alt = "Violation Evidence", 
  vehicleColor = "Standard",
  className = "",
  maxScale = 6,
  minScale = 1
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [enhanceLPR, setEnhanceLPR] = useState(false);
  const [invertColors, setInvertColors] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  // Reset zoom and pan
  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom In
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(maxScale, Number((prev + 0.5).toFixed(2))));
  }, [maxScale]);

  // Zoom Out
  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(minScale, Number((prev - 0.5).toFixed(2)));
      if (next === minScale) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  }, [minScale]);

  // Double-click to toggle zoom at cursor
  const handleDoubleClick = (e) => {
    if (scale > 1) {
      handleReset();
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      
      const targetScale = 2.5;
      setScale(targetScale);
      // Center roughly toward clicked location
      setPosition({
        x: -clickX * (targetScale - 1) * 0.6,
        y: -clickY * (targetScale - 1) * 0.6
      });
    }
  };

  // Wheel zoom (non-passive to prevent page scrolling)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.3 : -0.3;
      
      setScale(prevScale => {
        const newScale = Math.min(maxScale, Math.max(minScale, Number((prevScale + zoomFactor).toFixed(2))));
        if (newScale === minScale) {
          setPosition({ x: 0, y: 0 });
          return newScale;
        }

        // Adjust position slightly to zoom toward mouse position
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        const scaleRatio = newScale / prevScale;

        setPosition(prevPos => ({
          x: (prevPos.x - mouseX) * scaleRatio + mouseX,
          y: (prevPos.y - mouseY) * scaleRatio + mouseY
        }));

        return newScale;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [maxScale, minScale]);

  // Pointer drag events for panning
  const handlePointerDown = (e) => {
    if (scale <= 1 || e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: startPosRef.current.x + dx,
      y: startPosRef.current.y + dy
    });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already lost
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'e' || e.key === 'E') {
        setEnhanceLPR(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleReset]);

  // CSS filters for LPR enhancement
  const filterStyles = [
    enhanceLPR ? 'contrast(150%) brightness(110%) saturate(85%)' : '',
    invertColors ? 'invert(1)' : ''
  ].filter(Boolean).join(' ') || 'none';

  const colorMeta = getVehicleColorMeta(vehicleColor);

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`relative overflow-hidden select-none bg-slate-950 flex items-center justify-center rounded-2xl ${className} ${
        scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
      }`}
      style={{ touchAction: scale > 1 ? 'none' : 'auto' }}
    >
      {/* Evidence Image with Transform */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-[50vh] lg:max-h-[68vh] object-contain rounded-xl transition-transform duration-75 ease-out origin-center pointer-events-none"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          filter: filterStyles,
          imageRendering: scale > 2 ? 'crisp-edges' : 'auto'
        }}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/1280x720/1a1a1a/ffffff?text=Evidence+Snapshot+Not+Available";
        }}
      />

      {/* Floating HUD Controls Bar (Top Left) */}
      <div 
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          disabled={scale >= maxScale}
          title="Zoom In (+)"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-white min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomOut}
          disabled={scale <= minScale}
          title="Zoom Out (-)"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        <button
          onClick={handleReset}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          title="Reset Zoom (100% / Key: R)"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* LPR Contrast / Sharpen Enhancement Toggle */}
        <button
          onClick={() => setEnhanceLPR(prev => !prev)}
          title={enhanceLPR ? "LPR Sharpen Filter: ON" : "Enhance License Plate Clarity (Key: E)"}
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold transition-all ${
            enhanceLPR 
              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
              : 'bg-white/5 hover:bg-white/15 text-muted hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">LPR Clarity</span>
        </button>

        {/* Invert Filter Toggle */}
        <button
          onClick={() => setInvertColors(prev => !prev)}
          title={invertColors ? "Invert Colors: ON" : "Invert Negative Filter (Night/Sun Glare)"}
          className={`p-1.5 rounded-xl text-xs font-semibold transition-all ${
            invertColors 
              ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20' 
              : 'bg-white/5 hover:bg-white/15 text-muted hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom / Pan Instructions Tip (Appears when zoomed) */}
      {scale > 1 && (
        <div className="absolute top-3 right-14 z-20 hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md text-[11px] font-medium text-white/80 pointer-events-none animate-in fade-in">
          <Move className="w-3 h-3 text-accent" />
          <span>Click & drag to pan • Double-click to reset</span>
        </div>
      )}

      {/* Floating Detected Vehicle Color Overlay Badge (Bottom Left) */}
      <div 
        className={`absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-black/80 border border-white/15 backdrop-blur-md flex items-center gap-2 shadow-2xl transition-opacity duration-200 ${
          scale > 1.8 ? 'opacity-40 hover:opacity-100' : 'opacity-100'
        }`}
      >
        <span 
          className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-sm"
          style={{ backgroundColor: colorMeta.hex, boxShadow: `0 0 10px ${colorMeta.shadow}` }}
        />
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Color:</span>
        <span className={`text-xs font-black uppercase tracking-wider ${colorMeta.text}`}>
          {colorMeta.name}
        </span>
      </div>
    </div>
  );
}
