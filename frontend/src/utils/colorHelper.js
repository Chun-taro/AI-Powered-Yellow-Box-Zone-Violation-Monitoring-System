/**
 * Utility helper to map detected vehicle color string to vibrant UI colors, hex codes, and badges.
 */
export function getVehicleColorMeta(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') {
    return {
      name: 'Standard',
      text: 'text-zinc-300',
      bg: 'bg-zinc-800/80',
      border: 'border-zinc-700/60',
      hex: '#a1a1aa',
      shadow: 'rgba(161, 161, 170, 0.2)'
    };
  }

  const c = colorStr.trim().toLowerCase();

  if (c.includes('red') || c.includes('maroon') || c.includes('crimson') || c.includes('ruby')) {
    return {
      name: colorStr,
      text: 'text-red-400',
      bg: 'bg-red-500/15',
      border: 'border-red-500/40',
      hex: '#ef4444',
      shadow: 'rgba(239, 68, 68, 0.3)'
    };
  }
  if (c.includes('blue') || c.includes('cyan') || c.includes('navy') || c.includes('cobalt')) {
    return {
      name: colorStr,
      text: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/40',
      hex: '#3b82f6',
      shadow: 'rgba(59, 130, 246, 0.3)'
    };
  }
  if (c.includes('green') || c.includes('lime') || c.includes('emerald') || c.includes('teal')) {
    return {
      name: colorStr,
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      hex: '#10b981',
      shadow: 'rgba(16, 185, 129, 0.3)'
    };
  }
  if (c.includes('yellow') || c.includes('gold') || c.includes('amber')) {
    return {
      name: colorStr,
      text: 'text-yellow-300',
      bg: 'bg-yellow-500/15',
      border: 'border-yellow-500/40',
      hex: '#eab308',
      shadow: 'rgba(234, 179, 8, 0.3)'
    };
  }
  if (c.includes('orange')) {
    return {
      name: colorStr,
      text: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/40',
      hex: '#f97316',
      shadow: 'rgba(249, 115, 22, 0.3)'
    };
  }
  if (c.includes('white')) {
    return {
      name: colorStr,
      text: 'text-zinc-100',
      bg: 'bg-white/15',
      border: 'border-white/40',
      hex: '#ffffff',
      shadow: 'rgba(255, 255, 255, 0.3)'
    };
  }
  if (c.includes('black') || c.includes('dark')) {
    return {
      name: colorStr,
      text: 'text-zinc-300',
      bg: 'bg-zinc-950/90',
      border: 'border-zinc-600/80',
      hex: '#27272a',
      shadow: 'rgba(39, 39, 42, 0.4)'
    };
  }
  if (c.includes('silver') || c.includes('grey') || c.includes('gray')) {
    return {
      name: colorStr,
      text: 'text-slate-200',
      bg: 'bg-slate-400/15',
      border: 'border-slate-400/40',
      hex: '#94a3b8',
      shadow: 'rgba(148, 163, 184, 0.3)'
    };
  }
  if (c.includes('purple') || c.includes('violet') || c.includes('indigo')) {
    return {
      name: colorStr,
      text: 'text-purple-400',
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/40',
      hex: '#a855f7',
      shadow: 'rgba(168, 85, 247, 0.3)'
    };
  }
  if (c.includes('pink') || c.includes('magenta')) {
    return {
      name: colorStr,
      text: 'text-pink-400',
      bg: 'bg-pink-500/15',
      border: 'border-pink-500/40',
      hex: '#ec4899',
      shadow: 'rgba(236, 72, 153, 0.3)'
    };
  }
  if (c.includes('brown') || c.includes('tan') || c.includes('bronze')) {
    return {
      name: colorStr,
      text: 'text-amber-500',
      bg: 'bg-amber-600/15',
      border: 'border-amber-600/40',
      hex: '#b45309',
      shadow: 'rgba(180, 83, 9, 0.3)'
    };
  }

  // Default fallback for any other color name
  return {
    name: colorStr,
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    hex: '#38bdf8',
    shadow: 'rgba(56, 189, 248, 0.3)'
  };
}
