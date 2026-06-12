// app.jsx — Hoorshid signage: 20s timeline composition + optional audio
// Loads: animations.jsx, fx.jsx, brand.jsx, scenes.jsx (in that order)

// ── Timeline windows (seconds). 0.1s overlaps give clean crossfades ─────────
const OPENING = { start: 0.0,  end: 3.1 };
const FINALE  = { start: 21.4, end: 24.0 };
// 8 category windows over a 24s loop — ~2.35s cadence with 0.55s crossfade overlap
const SHOW = [
  { start: 2.95,  end: 5.75  },
  { start: 5.30,  end: 8.10  },
  { start: 7.65,  end: 10.45 },
  { start: 10.00, end: 12.80 },
  { start: 12.35, end: 15.15 },
  { start: 14.70, end: 17.50 },
  { start: 17.05, end: 19.85 },
  { start: 19.40, end: 21.65 },
];
const WHOOSH_AT = [2.95, 5.30, 7.65, 10.00, 12.35, 14.70, 17.05, 19.40, 21.4];

// ── Timecode label (for review comments) ────────────────────────────────────
function Timecode() {
  const t = useTime();
  React.useEffect(() => {
    const root = document.getElementById('video-root');
    if (root) root.setAttribute('data-screen-label', `t=${t.toFixed(1)}s`);
  }, [Math.floor(t * 4)]);
  return null;
}

// ── Debug seeker (exposes window.__seek / __play for frame capture) ──────────
function Seeker() {
  const tl = useTimeline();
  React.useEffect(() => {
    window.__seek = (t) => { tl.setPlaying(false); tl.setTime(t); };
    window.__play = () => tl.setPlaying(true);
  }, [tl]);
  return null;
}

// ── Optional procedural audio (default muted) ───────────────────────────────
function createAudio() {
  let ctx = null, master = null, raf = null, prevT = 0;
  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    // warm drone bed
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.02; droneGain.connect(master);
    [55, 82.5, 110].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 1 : 0.4;
      o.connect(g); g.connect(droneGain); o.start();
    });
    // sizzle bed
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const dd = buf.getChannelData(0);
    for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.7;
    const sizzleGain = ctx.createGain(); sizzleGain.gain.value = 0.022;
    noise.connect(bp); bp.connect(sizzleGain); sizzleGain.connect(master); noise.start();
  }
  function whoosh() {
    if (!ctx) return;
    const dur = 0.5;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const dd = buf.getChannelData(0);
    for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    bp.frequency.setValueAtTime(400, now); bp.frequency.exponentialRampToValueAtTime(4200, now + dur);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.11, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp); bp.connect(g); g.connect(master); src.start(now); src.stop(now + dur);
  }
  function watch() {
    const tick = () => {
      try {
        const t = parseFloat(localStorage.getItem('hooranim:t') || '0');
        for (const b of WHOOSH_AT) { if (prevT < b && t >= b) whoosh(); }
        if (t < prevT) prevT = 0; // loop wrap
        prevT = t;
      } catch {}
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  return {
    enable() {
      try {
        ensure();
        if (ctx.state === 'suspended') ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.4);
        if (!raf) watch();
      } catch (e) {}
    },
    disable() {
      try { if (master) master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.3); } catch (e) {}
    },
  };
}

function SoundToggle() {
  const [on, setOn] = React.useState(false);
  const engineRef = React.useRef(null);
  if (!engineRef.current) engineRef.current = createAudio();
  const toggle = () => {
    const next = !on; setOn(next);
    if (next) engineRef.current.enable(); else engineRef.current.disable();
  };
  return (
    <button className="ui-chrome" onClick={toggle} title={on ? 'قطع صدا' : 'پخش صدا'}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 50,
        width: 46, height: 46, borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(28,20,12,0.7)', border: '1px solid rgba(240,160,60,0.4)',
        color: '#f0a83a', backdropFilter: 'blur(6px)',
      }}>
      {on ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none"/>
          <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/>
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none"/>
          <path d="M22 9l-6 6M16 9l6 6"/>
        </svg>
      )}
    </button>
  );
}

function App() {
  return (
    <React.Fragment>
      <Stage width={1920} height={1080} duration={24} background="#140f0a" persistKey="hooranim" loop={true} autoplay={true}>
        <HoorBackground />
        <EmberField count={48} opacity={1} />
        <Timecode />
        <Seeker />

        <Opening start={OPENING.start} end={OPENING.end} />

        {PRODUCTS.map((p, i) => (
          <ProductScene key={p.id} p={p} index={i} start={SHOW[i].start} end={SHOW[i].end} />
        ))}

        <Finale start={FINALE.start} end={FINALE.end} />
      </Stage>
      <SoundToggle />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
