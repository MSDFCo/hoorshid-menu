import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { api } from '../lib/api.js';
import Logo from '../components/Logo.jsx';
import LangToggle from '../components/LangToggle.jsx';
import ItemRow from '../components/admin/ItemRow.jsx';
import ItemModal from '../components/admin/ItemModal.jsx';
import DiscountModal from '../components/admin/DiscountModal.jsx';
import CategoryManager from '../components/admin/CategoryManager.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import SettingsModal from '../components/admin/SettingsModal.jsx';
import UsersModal from '../components/admin/UsersModal.jsx';
import LogsModal from '../components/admin/LogsModal.jsx';

export default function AdminPage() {
  const { t, L } = useLang();
  const [auth, setAuth] = useState('checking'); // checking | anonymous | ok
  const [me, setMe] = useState(null); // {id, username, role}
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [toast, setToast] = useState('');

  // which modal is open: {type:'item', item?}, {type:'discount', item}, {type:'cats'}, {type:'delete', item}
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.get('/api/me').then((d) => {
      setMe(d.user ?? null);
      setAuth(d.authenticated ? 'ok' : 'anonymous');
    });
  }, []);

  const reload = () =>
    api.get('/api/admin/menu').then((d) => {
      setCategories(d.categories);
      setSettings(d.settings ?? null);
    });

  useEffect(() => {
    if (auth === 'ok') reload();
  }, [auth]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setLoginError('');
    try {
      const d = await api.post('/api/login', { username, password });
      setPassword('');
      setMe(d.user ?? null);
      setAuth('ok');
    } catch (err) {
      setLoginError(err.message === 'wrong password' ? t('wrongPassword') : err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api.post('/api/logout');
    setMe(null);
    setAuth('anonymous');
  };

  // ---- mutations (every one persists via API, then refreshes the list) ----

  const run = async (fn, successMsg) => {
    try {
      await fn();
      await reload();
      if (successMsg) notify(successMsg);
    } catch (err) {
      notify(err.message);
    }
  };

  const toggleItem = (item) => run(() => api.patch(`/api/items/${item.id}/toggle`));
  const setStock = (item, stock) =>
    run(() => api.patch(`/api/items/${item.id}/stock`, { stock }));
  const saveDiscount = (item, payload) =>
    run(() => api.patch(`/api/items/${item.id}/discount`, payload), t('itemSaved'));
  const removeDiscount = (item) =>
    run(() => api.patch(`/api/items/${item.id}/discount`, { type: null }), t('itemSaved'));
  const deleteItem = (item) => run(() => api.delete(`/api/items/${item.id}`), t('itemSaved'));
  const savePrices = (item, variants) =>
    run(
      () =>
        api.put(`/api/items/${item.id}`, {
          category_id: item.category_id,
          name_fa: item.name_fa,
          name_en: item.name_en,
          desc_fa: item.desc_fa,
          desc_en: item.desc_en,
          images: item.images,
          variants,
        }),
      t('itemSaved')
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => catFilter === 'all' || c.id === Number(catFilter))
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) =>
            !q ||
            it.name_fa.toLowerCase().includes(q) ||
            it.name_en.toLowerCase().includes(q) ||
            c.name_fa.toLowerCase().includes(q) ||
            c.name_en.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0 || (!q && catFilter !== 'all'));
  }, [categories, query, catFilter]);

  if (auth === 'checking') {
    return <div className="admin-page"><div className="status-box">{t('loading')}</div></div>;
  }

  if (auth === 'anonymous') {
    return (
      <div className="admin-page">
        <form className="admin-login" onSubmit={login}>
          <Logo small />
          <h1>{t('adminTitle')}</h1>
          <label className="field">
            {t('username')}
            <input
              className="input"
              dir="ltr"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field">
            {t('password')}
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="btn btn-primary" disabled={busy || !password || !username.trim()}>
            {t('login')}
          </button>
          <div style={{ alignSelf: 'center' }}>
            <LangToggle />
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-row">
          <Logo small />
          <div className="admin-header-actions">
            <a className="btn btn-sm" href="/">{t('viewMenu')}</a>
            <button className="btn btn-sm" onClick={() => setModal({ type: 'cats' })}>
              {t('manageCategories')}
            </button>
            <button className="btn btn-sm" onClick={() => setModal({ type: 'settings' })}>
              {t('settings')}
            </button>
            {me?.role === 'manager' && (
              <>
                <button className="btn btn-sm" onClick={() => setModal({ type: 'users' })}>
                  {t('users')}
                </button>
                <button className="btn btn-sm" onClick={() => setModal({ type: 'logs' })}>
                  {t('activityLog')}
                </button>
              </>
            )}
            <button className="btn btn-sm btn-primary" onClick={() => setModal({ type: 'item' })}>
              + {t('newItem')}
            </button>
            <LangToggle />
            {me && <span className="me-badge" dir="ltr">{me.username}</span>}
            <button className="btn btn-sm" onClick={logout}>{t('logout')}</button>
          </div>
        </div>
        <div className="admin-toolbar">
          <input
            className="input"
            placeholder={t('search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">{t('allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{L(c, 'name')}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="admin-main">
        {filtered.length === 0 && <div className="status-box">{t('noResults')}</div>}
        {filtered.map((cat) => (
          <section key={cat.id}>
            <h2 className="admin-cat-title">
              {L(cat, 'name')}
              {!cat.visible && <span className="tag">{t('hidden')}</span>}
            </h2>
            {cat.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item)}
                onEdit={() => setModal({ type: 'item', item })}
                onDelete={() => setModal({ type: 'delete', item })}
                onDiscount={() => setModal({ type: 'discount', item })}
                onRemoveDiscount={() => removeDiscount(item)}
                onSavePrices={(variants) => savePrices(item, variants)}
                onSetStock={(stock) => setStock(item, stock)}
              />
            ))}
          </section>
        ))}
      </main>

      {modal?.type === 'item' && (
        <ItemModal
          item={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
            notify(t('itemSaved'));
          }}
        />
      )}
      {modal?.type === 'discount' && (
        <DiscountModal
          item={modal.item}
          onClose={() => setModal(null)}
          onApply={(payload) => {
            setModal(null);
            saveDiscount(modal.item, payload);
          }}
        />
      )}
      {modal?.type === 'settings' && (
        <SettingsModal
          settings={settings}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
            notify(t('itemSaved'));
          }}
        />
      )}
      {modal?.type === 'users' && <UsersModal me={me} onClose={() => setModal(null)} />}
      {modal?.type === 'logs' && <LogsModal onClose={() => setModal(null)} />}
      {modal?.type === 'cats' && (
        <CategoryManager
          categories={categories}
          onChanged={reload}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmDialog
          title={t('confirmDeleteTitle')}
          body={`${t('confirmDeleteBody')} (${L(modal.item, 'name')})`}
          confirmLabel={t('delete')}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            deleteItem(modal.item);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
