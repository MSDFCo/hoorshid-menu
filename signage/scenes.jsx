// scenes.jsx — Opening · ProductScene (floating hero + cinematic entrances) · Finale
// Canvas 1920×1080, RTL. Hero photo floats free (left); category title + sub-items
// sit in a right-aligned column (right). All text uses Digi Nozha. No slide number.

// Layout anchors
const HERO_CX = 612, HERO_CY = 552, HERO_BOX = 808;
const HERO_L = HERO_CX - HERO_BOX / 2, HERO_T = HERO_CY - HERO_BOX / 2;
const TXT_RIGHT = 1696, TXT_LEFT = 952;   // text column spans these x; right-aligned

// Per-variant entrance transform (the "lively" motion the brand liked).
function entryTransform(variant, e) {
  const eb = Easing.easeOutBack(e), ec = Easing.easeOutCubic(e), eq = Easing.easeOutQuart(e);
  switch (variant) {
    case 'spin':       return { scale: 0.42 + 0.58 * eb, rot: -24 * (1 - eb), tx: 0, ty: 0 };
    case 'slideRight': return { scale: 0.93 + 0.07 * ec, rot: 16 * (1 - ec), tx: 600 * (1 - ec), ty: 0 };
    case 'smoke':      return { scale: 0.88 + 0.12 * ec, rot: 0, tx: 0, ty: 220 * (1 - ec) };
    case 'dropBounce': return { scale: 0.96 + 0.04 * eb, rot: -6 * (1 - eb), tx: 0, ty: -470 * (1 - eb) };
    case 'flyLeft':    return { scale: 0.9 + 0.1 * eq, rot: -13 * (1 - eq), tx: -680 * (1 - eq), ty: 0 };
    case 'popSpark':   return { scale: 0.46 + 0.54 * eb, rot: 6 * (1 - eb), tx: 0, ty: 0 };
    default:           return { scale: e, rot: 0, tx: 0, ty: 0 };
  }
}

function ProductScene({ p, index, start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const lt = localTime, dur = duration;
        const ENTRY = 0.72, EXIT = 0.5;
        const exitStart = dur - EXIT;
        const e = clamp(lt / ENTRY, 0, 1);
        const tr = entryTransform(p.variant, e);

        // opacity envelope — same fade-in timing for ALL variants so text can sync
        let opacity, extraScale = 1, extraTy = 0;
        if (lt < ENTRY) {
          opacity = Easing.easeOutCubic(clamp(lt / (ENTRY * 0.55), 0, 1));
        } else if (lt > exitStart) {
          const ex = Easing.easeInCubic(clamp((lt - exitStart) / EXIT, 0, 1));
          // continue the slow zoom-in while fading — no zoom-out, no jump
          opacity = 1 - ex; extraScale = 1.05 + 0.015 * ex; extraTy = -10 - 14 * ex;
        } else {
          opacity = 1;
          const hT = (lt - ENTRY) / Math.max(0.001, exitStart - ENTRY);
          extraScale = 1 + 0.05 * hT; extraTy = -10 * hT;   // slow ken-burns rise
        }

        const scale = tr.scale * extraScale;
        const float = Math.sin(lt * 1.4) * 4;               // gentle bob
        const heroTransform = `translate(${tr.tx}px, ${tr.ty + extraTy + float}px) rotate(${tr.rot}deg) scale(${scale})`;

        // fx progress
        const sparkP  = clamp(lt / 0.6, 0, 1);
        const smokeP  = clamp(lt / 1.2, 0, 1);
        const streakP = clamp((lt - 0.05) / 0.65, 0, 1);
        const flyP    = clamp(lt / 0.5, 0, 1);
        const glowScale = (p.variant === 'spin' || p.variant === 'popSpark') ? Easing.easeOutCubic(e) : clamp(lt / 0.5, 0, 1);

        // text reveal — anchored to hero entrance: title lands as the photo settles
        const textBase = clamp((lt - ENTRY * 0.7) / 0.5, 0, 1) * (lt > exitStart ? clamp((dur - lt) / 0.4, 0, 1) : 1);
        const titleP = Easing.easeOutCubic(textBase);
        const flameP = clamp((lt - ENTRY * 0.55) / 0.6, 0, 1);

        const items = p.items;
        const twoCol = items.length > 4;
        const half = Math.ceil(items.length / 2);
        const cols = twoCol ? [items.slice(0, half), items.slice(half)] : [items];
        const itemFont = twoCol ? 58 : 72;
        const itemGap = twoCol ? 26 : 32;
        const nameLen = p.name.length;
        const titleFont = nameLen > 16 ? 92 : nameLen > 11 ? 104 : 118;
        const imgScale = p.imgScale || 1;
        const imgYAdjust = p.imgYAdjust || 0;
        const itemProg = (i) => {
          const s = ENTRY * 0.92 + i * (twoCol ? 0.04 : 0.055);
          let v = Easing.easeOutCubic(clamp((lt - s) / 0.5, 0, 1));
          if (lt > exitStart) v = Math.min(v, clamp((dur - lt) / 0.4, 0, 1));
          return v;
        };

        return (
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* glow disc behind hero */}
            <div style={{ position: 'absolute', left: HERO_CX, top: HERO_CY, opacity: opacity * 0.8 }}>
              <div style={{ transform: `scale(${0.55 + glowScale * 0.7})`, transformOrigin: 'center' }}>
                <GlowDisc x={0} y={0} size={880} intensity={0.6} />
              </div>
            </div>

            {/* reveal-specific atmospherics */}
            {p.variant === 'smoke' && <SmokePuff x={HERO_CX} y={HERO_CY + 70} progress={smokeP} />}
            {p.variant === 'dropBounce' && <SmokePuff x={HERO_CX} y={HERO_CY + 40} w={440} h={440} progress={smokeP} tint="rgba(235,228,215,0.4)" />}
            {(p.variant === 'smoke' || p.variant === 'popSpark' || p.variant === 'flyLeft') && (
              <LightStreak progress={p.variant === 'flyLeft' ? flyP : streakP}
                angle={p.variant === 'flyLeft' ? -8 : 22}
                thickness={p.variant === 'flyLeft' ? 340 : 240} />
            )}

            {/* hero product (free-floating cutout) */}
            <div style={{
              position: 'absolute', left: HERO_L, top: HERO_T, width: HERO_BOX, height: HERO_BOX,
              transform: heroTransform, transformOrigin: 'center', opacity,
              filter: 'drop-shadow(0 36px 48px rgba(0,0,0,0.62))', willChange: 'transform, opacity',
            }}>
              <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                transform: `translateY(${imgYAdjust}px) scale(${imgScale})`, transformOrigin: 'center' }} />
            </div>

            {/* drifting flecks + sparks */}
            <div style={{ position: 'absolute', left: HERO_CX, top: HERO_CY, opacity: opacity * 0.6 }}>
              <FloatBits x={0} y={0} radius={430} count={7} progress={opacity} colors={p.accent} />
            </div>
            {p.variant === 'spin' && <div style={{ position: 'absolute', left: HERO_CX, top: HERO_CY }}><SparkBurst x={0} y={0} progress={sparkP} count={22} spread={420} /></div>}
            {p.variant === 'popSpark' && <div style={{ position: 'absolute', left: HERO_CX, top: HERO_CY }}><SparkBurst x={0} y={0} progress={sparkP} count={20} spread={360} /></div>}
            {p.variant === 'flyLeft' && <div style={{ position: 'absolute', left: HERO_CX - 120, top: HERO_CY }}><SparkBurst x={0} y={0} progress={flyP} count={14} spread={280} color={EMBER} /></div>}

            {/* text column — RTL, right-aligned, vertically centered */}
            <div style={{
              position: 'absolute', left: TXT_LEFT, top: 0, width: TXT_RIGHT - TXT_LEFT, height: 1080,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
              direction: 'rtl', textAlign: 'right',
              transform: `translateX(${(1 - titleP) * 34}px)`, willChange: 'transform',
            }}>
              {/* flame divider */}
              <div style={{ marginBottom: 24, opacity: flameP }}>
                <FlameLine width={260} height={28} drawProgress={flameP} />
              </div>

              {/* category title */}
              <div style={{ opacity: titleP, transform: `translateY(${(1 - titleP) * 22}px)`,
                fontFamily: 'DigiNozha, sans-serif', fontSize: titleFont, lineHeight: 1.1,
                color: '#FBE2A6', letterSpacing: '0.004em', whiteSpace: 'nowrap',
                textShadow: '0 2px 26px rgba(247,176,60,0.42), 0 1px 2px rgba(0,0,0,0.55)' }}>
                {p.name}
              </div>

              {/* price pill */}
              {p.price && (
                <div style={{ marginTop: 22, opacity: titleP, transform: `translateY(${(1 - titleP) * 18}px)`,
                  fontFamily: 'DigiNozha, sans-serif', fontSize: 46, lineHeight: 1, whiteSpace: 'nowrap',
                  color: '#1a1208', background: 'linear-gradient(120deg,#F7B64A,#FFE0A0 52%,#F0A22C)',
                  padding: '14px 40px', borderRadius: 999, direction: 'rtl',
                  boxShadow: '0 10px 30px rgba(247,176,60,0.4)' }}>
                  {p.price}
                </div>
              )}

              {/* sub-items — two columns when more than 4 */}
              <div style={{ marginTop: 36, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 56 }}>
                {cols.map((col, ci) => (
                  <div key={ci} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: itemGap }}>
                    {col.map((it, j) => {
                      const i = ci * half + j;
                      const ip = itemProg(i);
                      return (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 18,
                          opacity: ip, transform: `translateX(${(1 - ip) * 22}px)`, willChange: 'transform, opacity' }}>
                          <span style={{ width: 14, height: 14, flexShrink: 0, transform: 'rotate(45deg)',
                            background: 'linear-gradient(135deg, #FFD98A, #E08A22)', borderRadius: 2,
                            boxShadow: '0 0 10px rgba(247,176,60,0.6)' }} />
                          <span style={{ fontFamily: 'DigiNozha, sans-serif', whiteSpace: 'nowrap',
                            fontSize: itemFont, lineHeight: 1.16, color: '#EBDABD',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{it}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Opening ──────────────────────────────────────────────────────────────────
function Opening({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const lt = localTime, dur = duration;
        const exitStart = dur - 0.7;
        const logoIn = Easing.easeOutCubic(clamp(lt / 1.1, 0, 1));
        const logoScale = 1.12 - 0.12 * logoIn;
        let opacity = Easing.easeOutCubic(clamp(lt / 0.7, 0, 1));
        if (lt > exitStart) opacity = Easing.easeInOutCubic(clamp((dur - lt) / 0.7, 0, 1));
        const shine = clamp((lt - 0.8) / 1.3, 0, 1);
        const bloom = Easing.easeOutCubic(clamp(lt / 1.0, 0, 1));
        const sloP = Easing.easeOutCubic(clamp((lt - 1.1) / 0.8, 0, 1)) * (lt > exitStart ? opacity : 1);

        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', opacity }}>
            <div style={{ position: 'relative', transform: `scale(${logoScale})`, marginBottom: 8 }}>
              <GoldLogo width={880} shine={lt < 0.8 ? 1.4 : shine} glow={0.1 + bloom * 0.12} />
            </div>
            <div style={{ marginTop: 26, transform: `translateY(${(1 - sloP) * 22}px)`, opacity: sloP, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <FlameLine width={360} height={28} drawProgress={clamp((lt - 1.2) / 0.9, 0, 1)} />
              </div>
              <div style={{ fontFamily: 'DigiNozha, sans-serif', fontSize: 82, color: '#F4C778',
                letterSpacing: '0.02em', direction: 'rtl', whiteSpace: 'nowrap',
                textShadow: '0 2px 22px rgba(247,176,60,0.45)' }}>تازه، داغ و خوشمزه</div>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

// ── Finale ───────────────────────────────────────────────────────────────────
function Finale({ start, end }) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const lt = localTime, dur = duration;
        const inP = Easing.easeOutCubic(clamp(lt / 1.0, 0, 1));
        const fadeOut = Easing.easeInOutCubic(clamp((dur - lt) / 0.7, 0, 1));
        const opacity = Easing.easeOutCubic(clamp(lt / 0.7, 0, 1)) * fadeOut;
        const ctaP = Easing.easeOutCubic(clamp((lt - 0.7) / 0.7, 0, 1));
        const phoneP = Easing.easeOutCubic(clamp((lt - 1.1) / 0.7, 0, 1));
        const bloom = Easing.easeOutCubic(clamp(lt / 0.9, 0, 1));

        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', opacity }}>
            <div style={{ transform: `scale(${0.94 + inP * 0.06})`, marginBottom: 36 }}>
              <GoldLogo width={740} shine={clamp((lt - 0.4) / 1.3, 0, 1)} glow={0.16} />
            </div>
            <div style={{ opacity: ctaP, transform: `translateY(${(1 - ctaP) * 20}px)`,
              fontFamily: 'DigiNozha, sans-serif', fontSize: 88, color: '#FBE2A6', direction: 'rtl',
              letterSpacing: '0.01em', whiteSpace: 'nowrap',
              textShadow: '0 2px 24px rgba(247,176,60,0.5)' }}>همین حالا سفارش دهید</div>
            <div style={{ marginTop: 40, opacity: phoneP, transform: `translateY(${(1 - phoneP) * 16}px)`,
              display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap',
              fontFamily: 'DigiNozha, sans-serif', fontSize: 70,
              color: '#0d0a07', background: 'linear-gradient(120deg,#F7B64A,#FFD98A 50%,#F4A82E)',
              padding: '14px 62px', borderRadius: 999, direction: 'ltr',
              boxShadow: '0 10px 38px rgba(247,176,60,0.45)' }}>
              <span style={{ letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{FA('0900 240 6050')}</span>
            </div>
          </div>
        );
      }}
    </Sprite>
  );
}

Object.assign(window, { ProductScene, Opening, Finale, HERO_CX, HERO_CY });
