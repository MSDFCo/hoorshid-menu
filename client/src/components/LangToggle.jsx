import { useLang } from '../i18n.jsx';

export default function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      className="lang-toggle"
      onClick={toggle}
      aria-label={lang === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
    >
      <span data-on={lang === 'fa'}>فا</span>
      <span data-on={lang === 'en'}>EN</span>
    </button>
  );
}
