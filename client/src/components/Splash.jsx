import { useState } from 'react';
import { useLang } from '../i18n.jsx';

/* Faded outline fast-food icons scattered around the splash screen. */
const ICONS = {
  pizza: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M3 4c6-2.5 12-2.5 18 0L12 22 3 4Z" />
      <path d="M4.5 7c5-1.8 10-1.8 15 0" />
      <circle cx="10" cy="10" r="1.1" />
      <circle cx="14" cy="13" r="1.1" />
      <circle cx="11" cy="16" r="1.1" />
    </svg>
  ),
  burger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 10a8 8 0 0 1 16 0H4Z" />
      <path d="M3.5 13.5h17" />
      <path d="M4 17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1H4v1Z" />
    </svg>
  ),
  sandwich: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13c0-2 2-4 9-4s9 2 9 4H3Z" />
      <path d="M3 13c1.5 1.2 3 1.8 4.5.9 1.5-.9 3-.9 4.5 0s3 .9 4.5 0c1.5-.9 3-.3 4.5.9" transform="translate(0 1.5) scale(1 0.7)" />
      <path d="M4 17.5h16" />
    </svg>
  ),
  drink: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l-1.5 14h-9L6 7Z" />
      <path d="M5 7h14" />
      <path d="M12 7l2.5-5" />
    </svg>
  ),
  fries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l1.5 12h9L18 9" />
      <path d="M8 9V3.5M11 9V2.5M14 9V3M16.5 9V4.5" />
      <path d="M5 9h14" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M12 2c1.5 4-3.5 6-2 10 .8 2.1 3 2.4 3 4.6a3.6 3.6 0 0 1-7.2 0c0-3.2 2.8-4 2-7.6 2 .8 2.6 2 2.6 2C11.6 8 10 5 12 2Z" transform="translate(3 1)" />
    </svg>
  ),
};

// position/rotation/float-timing per scattered icon (mirrors automatically via
// inset-inline; rotation lives in --rot so the float animation can compose with it).
// Icons near the center are extra faint (--op) to keep the minimal look.
const SCATTER = [
  { icon: 'burger', style: { top: '12%', insetInlineEnd: '8%', width: 34, '--rot': '12deg', '--dur': '5.2s', '--delay': '0s' } },
  { icon: 'pizza', style: { top: '17%', insetInlineStart: '7%', width: 38, '--rot': '-24deg', '--dur': '6.4s', '--delay': '-2.1s' } },
  { icon: 'drink', style: { top: '9%', insetInlineStart: '38%', width: 24, '--rot': '8deg', '--dur': '5.5s', '--delay': '-4s', '--op': 0.11 } },
  { icon: 'sandwich', style: { top: '30%', insetInlineEnd: '15%', width: 30, '--rot': '-14deg', '--dur': '6s', '--delay': '-1.6s', '--op': 0.12 } },
  { icon: 'fries', style: { top: '34%', insetInlineStart: '13%', width: 26, '--rot': '18deg', '--dur': '4.9s', '--delay': '-3s', '--op': 0.12 } },
  { icon: 'flame', style: { top: '46%', insetInlineEnd: '5%', width: 24, '--rot': '10deg', '--dur': '5.4s', '--delay': '-0.4s', '--op': 0.12 } },
  { icon: 'burger', style: { top: '48%', insetInlineStart: '4%', width: 28, '--rot': '-16deg', '--dur': '6.6s', '--delay': '-2.5s', '--op': 0.12 } },
  { icon: 'drink', style: { top: '58%', insetInlineEnd: '10%', width: 30, '--rot': '14deg', '--dur': '4.6s', '--delay': '-1.2s' } },
  { icon: 'fries', style: { top: '63%', insetInlineStart: '9%', width: 30, '--rot': '-10deg', '--dur': '5.8s', '--delay': '-3.4s' } },
  { icon: 'sandwich', style: { top: '72%', insetInlineEnd: '24%', width: 26, '--rot': '20deg', '--dur': '6.2s', '--delay': '-4.4s', '--op': 0.11 } },
  { icon: 'pizza', style: { top: '82%', insetInlineEnd: '9%', width: 36, '--rot': '28deg', '--dur': '6.8s', '--delay': '-0.7s' } },
  { icon: 'flame', style: { top: '85%', insetInlineStart: '12%', width: 26, '--rot': '-8deg', '--dur': '4.2s', '--delay': '-2.8s' } },
  { icon: 'burger', style: { top: '90%', insetInlineStart: '42%', width: 24, '--rot': '6deg', '--dur': '5s', '--delay': '-1.9s', '--op': 0.11 } },
];

/** Landing screen shown on QR scan: floating fast-food icons, glowing logo, "Menu" button. */
export default function Splash({ leaving, onEnter, settings }) {
  const { t, lang } = useLang();
  const hours = lang === 'fa' ? settings?.hours_fa : settings?.hours_en;
  const [tapped, setTapped] = useState(false);

  // Show the press motion (scale + expanding ring) before fading into the menu.
  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    setTimeout(onEnter, 280);
  };

  return (
    <div className="splash" data-leaving={leaving || undefined}>
      {SCATTER.map((s, i) => (
        <span className="splash-icon" style={s.style} key={i} aria-hidden="true">
          {ICONS[s.icon]}
        </span>
      ))}

      <div className="splash-center">
        <span className="splash-ring" aria-hidden="true" />
        <img className="splash-emblem" src="/emblem.png" alt="" aria-hidden="true" />
        <img className="splash-logo-img" src="/logo.png" alt={t('brand')} />
        <p className="splash-tagline">{t('tagline')}</p>
        {hours && (
          <p className="splash-hours">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            {hours}
          </p>
        )}
      </div>

      <div className="splash-bottom">
        <button className="splash-btn" data-tapped={tapped || undefined} onClick={handleTap}>
          {t('menuBtn')}
        </button>
        <p className="splash-hint">{t('splashHint')}</p>
      </div>
    </div>
  );
}
