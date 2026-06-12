import { useLang } from '../i18n.jsx';
import { localizeDigits } from '../lib/format.js';

const FALLBACK_PHONE = '0900 240 6050';

/** Footer: tagline, tap-to-call phone, address and the location on Google Maps. */
export default function Footer({ settings }) {
  const { t, lang } = useLang();
  const phone = settings?.phone || FALLBACK_PHONE;
  const tel = '+98' + phone.replace(/[^0-9]/g, '').replace(/^0/, '');
  const address = lang === 'fa' ? settings?.address_fa : settings?.address_en;
  const mapsQuery = settings?.maps_query?.trim();

  return (
    <footer className="site-footer">
      <p className="footer-tagline">{t('tagline')}</p>
      <a className="footer-phone" href={`tel:${tel}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
        </svg>
        <span dir="ltr">{localizeDigits(phone, lang)}</span>
      </a>

      {address && (
        <div className="footer-address">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
          <span>{address}</span>
        </div>
      )}

      {mapsQuery && (
        <div className="footer-map">
          <iframe
            title={t('address')}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&z=16&hl=${lang}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className="btn btn-sm footer-map-link"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('openMap')} ↗
          </a>
        </div>
      )}

      <p className="footer-brand">© {localizeDigits(new Date().getFullYear(), lang)} {t('brand')}</p>
    </footer>
  );
}
