import { useLang } from '../i18n.jsx';

/** Brand block in the sticky header / admin: the Hoorshid emblem + wordmark. */
export default function Logo({ small = false }) {
  const { t } = useLang();
  return (
    <div className={`logo ${small ? 'logo-small' : ''}`}>
      <img className="logo-sun" src="/emblem.png" alt="" aria-hidden="true" />
      <div className="logo-text">
        <strong>{t('brand')}</strong>
        {!small && <span>{t('menuTitle')}</span>}
      </div>
    </div>
  );
}
