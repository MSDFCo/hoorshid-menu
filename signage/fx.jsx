// fx.jsx — Hoorshid signage effects layer
// All ambient motion is periodic over the 20s loop so the seam is invisible.
// Exports to window: HoorBackground, EmberField, GlowDisc, SmokePuff, LightStreak,
//   SparkBurst, FlameLine, FloatBits, rnd

// ── seeded RNG so particle fields are stable across renders ──────────────────
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

const GOLD = '#F5A623';
const AMBER = '#FFCE84';
const EMBER = '#FF6A22';

// Periodic vertical-rise particle field. yfrac = frac(t/period + seed); opacity
// peaks mid-rise and is 0 at the wrap, hiding the reset. period divides 20.
function EmberField({ count = 40, color = EMBER, area = 'full', opacity = 1 }) {
  const t = useTime();
  const parts = React.useMemo(() => {
    const r = mulberry32(99);
    const periods = [20, 10, 20 / 3, 5];
    return Array.from({ length: count }, (_, i) => ({
      x: r() * 100,
      drift: 2 + r() * 6,
      driftPhase: r() * Math.PI * 2,
      driftPeriod: [20, 10][Math.floor(r() * 2)],
      size: 3 + r() * 7,
      seed: r(),
      period: periods[Math.floor(r() * periods.length)],
      hue: r(),
      baseY: 6 + r() * 94,
      glow: r() > 0.5,
    }));
  }, [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {parts.map((p, i) => {
        const yfrac = ((t / p.period + p.seed) % 1 + 1) % 1;
        const rise = area === 'bottom' ? yfrac * 46 : yfrac * 100; // % travelled up
        const y = area === 'bottom' ? 100 - rise : p.baseY - (yfrac - 0.5) * 30;
        const dx = Math.sin((t / p.driftPeriod) * Math.PI * 2 + p.driftPhase) * p.drift;
        const o = Math.sin(Math.PI * yfrac) * (0.75 + p.hue * 0.25) * opacity;
        const col = p.hue > 0.6 ? AMBER : color;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x + dx}%`, top: `${y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: col,
            opacity: o,
            boxShadow: p.glow ? `0 0 ${p.size * 3}px ${p.size}px ${col}66` : 'none',
            filter: 'blur(0.3px)',
          }} />
        );
      })}
    </div>
  );
}

// Charcoal stage background with warm bottom firelight + slow breathing glow.
function HoorBackground({ warm = 0.5 }) {
  const t = useTime();
  const breathe = 0.5 + 0.5 * Math.sin((t / 10) * Math.PI * 2);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* base */}
      <div style={{ position: 'absolute', inset: 0, background:
        'radial-gradient(120% 90% at 50% 16%, #221913 0%, #16110c 45%, #0c0907 100%)' }} />
      {/* warm firelight from bottom */}
      <div style={{ position: 'absolute', inset: 0, background:
        `radial-gradient(80% 55% at 50% 116%, rgba(255,120,30,${0.30 * warm + 0.06 * breathe}) 0%, rgba(255,90,20,0.10) 30%, rgba(0,0,0,0) 60%)` }} />
      {/* faint top key light */}
      <div style={{ position: 'absolute', inset: 0, background:
        `radial-gradient(60% 45% at 50% -8%, rgba(255,205,140,${0.12 + 0.05 * breathe}) 0%, rgba(0,0,0,0) 55%)` }} />
      {/* vignette */}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 320px 90px rgba(0,0,0,0.7)' }} />
    </div>
  );
}

// Radial golden glow disc that sits behind a hero product.
function GlowDisc({ x, y, size, intensity = 1, color = GOLD, pulse = true }) {
  const t = useTime();
  const p = pulse ? (0.92 + 0.08 * Math.sin((t / 2.5) * Math.PI * 2)) : 1;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}${Math.round(38 * intensity).toString(16).padStart(2,'0')} 0%, ${color}26 22%, ${color}14 42%, rgba(0,0,0,0) 72%)`,
      transform: `scale(${p})`,
      pointerEvents: 'none',
    }} />
  );
}

// Soft rising smoke puff (for the burger reveal). progress 0..1 drives rise+fade.
function SmokePuff({ x, y, w = 520, h = 520, progress, tint = 'rgba(220,210,200,0.5)' }) {
  const rise = progress * 140;
  const o = Math.sin(Math.PI * Math.min(progress * 1.1, 1)) * 0.6;
  const sc = 0.7 + progress * 0.8;
  return (
    <div style={{
      position: 'absolute', left: x, top: y - rise,
      width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${tint} 0%, rgba(160,150,140,0.18) 36%, rgba(0,0,0,0) 64%)`,
      filter: 'blur(8px)',
      opacity: o, transform: `scale(${sc})`, pointerEvents: 'none',
    }} />
  );
}

// Diagonal light streak sweep. progress 0..1 sweeps across.
function LightStreak({ progress, angle = 22, thickness = 220, color = 'rgba(255,225,170,0.55)' }) {
  const x = -40 + progress * 180; // % across
  const o = Math.sin(Math.PI * progress) * 0.9;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '-30%', left: `${x}%`,
        width: thickness, height: '160%',
        background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${color} 50%, rgba(0,0,0,0) 100%)`,
        filter: 'blur(14px)',
        transform: `rotate(${angle}deg)`,
        opacity: o, mixBlendMode: 'screen',
      }} />
    </div>
  );
}

// Outward spark burst from a point. progress 0..1.
function SparkBurst({ x, y, progress, count = 16, color = AMBER, spread = 260 }) {
  const parts = React.useMemo(() => {
    const r = mulberry32(7);
    return Array.from({ length: count }, () => ({
      a: r() * Math.PI * 2, d: 0.5 + r() * 0.5, s: 2 + r() * 4, delay: r() * 0.15,
    }));
  }, [count]);
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {parts.map((p, i) => {
        const pr = clamp((progress - p.delay) / (1 - p.delay), 0, 1);
        const dist = Easing.easeOutCubic(pr) * spread * p.d;
        const o = (1 - pr) * (progress > 0 ? 1 : 0);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: Math.cos(p.a) * dist, top: Math.sin(p.a) * dist,
            width: p.s, height: p.s, borderRadius: '50%',
            background: color, opacity: o,
            boxShadow: `0 0 ${p.s * 3}px ${p.s}px ${color}77`,
          }} />
        );
      })}
    </div>
  );
}

// Wavy golden flame line (menu motif). drawProgress 0..1 reveals it L→R.
function FlameLine({ width = 240, height = 26, color = GOLD, drawProgress = 1, glow = true }) {
  const dash = 600;
  return (
    <svg width={width} height={height} viewBox="0 0 240 26" fill="none"
      style={{ filter: glow ? `drop-shadow(0 0 6px ${color}aa)` : 'none', overflow: 'visible' }}>
      <path d="M4 13 C 24 1, 44 1, 64 13 S 104 25, 124 13 S 164 1, 184 13 S 224 25, 236 13"
        stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={dash} strokeDashoffset={dash * (1 - drawProgress)} />
    </svg>
  );
}

// Drifting flecks (herbs / spice / sesame) around a product. Periodic & local.
function FloatBits({ x, y, radius = 300, count = 12, progress = 1, colors = ['#7FB04A', '#C8862B', '#E8C15A'] }) {
  const t = useTime();
  const parts = React.useMemo(() => {
    const r = mulberry32(23);
    return Array.from({ length: count }, () => ({
      a: r() * Math.PI * 2, rr: 0.55 + r() * 0.5, s: 4 + r() * 6,
      sp: 0.4 + r() * 0.8, ph: r() * Math.PI * 2, c: Math.floor(r() * 3), rot: r() * 360,
    }));
  }, [count]);
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {parts.map((p, i) => {
        const ang = p.a + t * p.sp * 0.25;
        const rad = radius * p.rr * (0.9 + 0.1 * Math.sin(t * 1.5 + p.ph));
        const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad * 0.7;
        const o = (0.4 + 0.5 * Math.sin(t * 2 + p.ph)) * progress;
        return (
          <div key={i} style={{
            position: 'absolute', left: px, top: py,
            width: p.s, height: p.s * 0.5, borderRadius: '40%',
            background: colors[p.c],
            transform: `rotate(${p.rot + t * 40 * p.sp}deg)`,
            opacity: clamp(o, 0, 1), filter: 'blur(0.4px)',
          }} />
        );
      })}
    </div>
  );
}

Object.assign(window, {
  HoorBackground, EmberField, GlowDisc, SmokePuff, LightStreak,
  SparkBurst, FlameLine, FloatBits, GOLD, AMBER, EMBER,
});
