import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';

/**
 * Full-screen photo viewer: swipeable slides (CSS scroll-snap) with dot
 * indicators. Opened by tapping an item photo on the customer menu.
 */
export default function Lightbox({ images, alt, onClose }) {
  const { t } = useLang();
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  // lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = prev);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    // scrollLeft is negative in RTL — abs() makes the math direction-agnostic
    setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    // scrollIntoView(inline) is unreliable in RTL scrollers — compute the offset
    // ourselves (scrollLeft grows negative in RTL).
    const dirFactor = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollTo({ left: dirFactor * i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button className="lightbox-close" aria-label={t('closeGallery')} onClick={onClose}>
        ×
      </button>
      <div
        className="lightbox-track"
        ref={trackRef}
        onScroll={onScroll}
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((f) => (
          <div className="lightbox-slide" key={f}>
            <img src={`/uploads/${f}`} alt={alt} loading="eager" decoding="async" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="lightbox-dots" onClick={(e) => e.stopPropagation()}>
          {images.map((f, i) => (
            <button
              key={f}
              className="lightbox-dot"
              data-on={i === index}
              aria-label={`${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
