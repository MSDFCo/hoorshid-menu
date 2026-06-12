import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { api } from '../lib/api.js';
import Logo from '../components/Logo.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ItemCard from '../components/ItemCard.jsx';
import Footer from '../components/Footer.jsx';
import Splash from '../components/Splash.jsx';

export default function MenuPage() {
  const { t, L, lang } = useLang();
  const [categories, setCategories] = useState(null);
  const [settings, setSettings] = useState(null);
  const [splash, setSplash] = useState('shown'); // shown | leaving | gone
  const [error, setError] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const sectionRefs = useRef({});
  const tabsRef = useRef(null);
  // Set while a tab click is auto-scrolling, so the scroll-spy doesn't fight it.
  const clickScrollUntil = useRef(0);

  const load = () => {
    setError(false);
    api
      .get('/api/menu')
      .then((data) => {
        setCategories(data.categories);
        setSettings(data.settings ?? null);
        if (data.categories.length) setActiveCat(data.categories[0].id);
      })
      .catch(() => setError(true));
  };
  useEffect(load, []);

  // Lock page scroll while the splash screen is up.
  useEffect(() => {
    document.body.style.overflow = splash === 'gone' ? '' : 'hidden';
    return () => (document.body.style.overflow = '');
  }, [splash]);

  const enterMenu = () => {
    setSplash('leaving');
    setTimeout(() => setSplash('gone'), 450); // matches the CSS fade duration
  };

  // Scroll-spy: highlight the tab of the section closest to the top.
  useEffect(() => {
    if (!categories?.length) return;
    const onScroll = () => {
      if (Date.now() < clickScrollUntil.current) return;
      const offset = 130; // sticky header + tabs height
      let current = categories[0].id;
      for (const cat of categories) {
        const el = sectionRefs.current[cat.id];
        if (el && el.getBoundingClientRect().top <= offset + 1) current = cat.id;
      }
      setActiveCat(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [categories]);

  // Keep the active tab visible inside the horizontal tab strip.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector('[data-active="true"]');
    tab?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeCat]);

  const jumpTo = (catId) => {
    setActiveCat(catId);
    clickScrollUntil.current = Date.now() + 1200;
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      {splash !== 'gone' && (
        <Splash leaving={splash === 'leaving'} onEnter={enterMenu} settings={settings} />
      )}
      <header className="site-header">
        <div className="site-header-row">
          <Logo />
          <LangToggle />
        </div>
        {categories?.length > 0 && (
          <nav className="cat-tabs" ref={tabsRef} aria-label={t('menuTitle')}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="cat-tab"
                data-active={cat.id === activeCat}
                onClick={() => jumpTo(cat.id)}
              >
                {L(cat, 'name')}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="menu-main">
        {error && (
          <div className="status-box">
            <p>{t('loadError')}</p>
            <button className="btn btn-primary" onClick={load}>
              {t('retry')}
            </button>
          </div>
        )}
        {!error && !categories && <div className="status-box">{t('loading')}</div>}
        {categories?.map((cat) => (
          <section
            key={cat.id}
            className="menu-section"
            ref={(el) => (sectionRefs.current[cat.id] = el)}
            aria-labelledby={`cat-${cat.id}`}
          >
            <h2 className="section-title" id={`cat-${cat.id}`}>
              <span className="section-title-accent" aria-hidden="true" />
              {L(cat, 'name')}
            </h2>
            {cat.items.length === 0 ? (
              <p className="muted">{t('emptyCategory')}</p>
            ) : (
              <div className="item-grid">
                {cat.items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {categories && <Footer settings={settings} />}
      {/* re-render on language change so Intl formatting updates */}
      <span hidden>{lang}</span>
    </div>
  );
}
