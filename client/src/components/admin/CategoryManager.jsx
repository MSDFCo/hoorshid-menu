import { useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { api } from '../../lib/api.js';
import Toggle from './Toggle.jsx';

/** Category management: rename (FA/EN), reorder, show/hide, add, delete empty ones. */
export default function CategoryManager({ categories, onChanged, onClose }) {
  const { t } = useLang();
  const [error, setError] = useState('');
  const [newFa, setNewFa] = useState('');
  const [newEn, setNewEn] = useState('');
  // local name drafts so typing doesn't fire a request per keystroke
  const [drafts, setDrafts] = useState({});

  const run = async (fn) => {
    setError('');
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const rename = (cat) => {
    const d = drafts[cat.id];
    if (!d || (d.name_fa === cat.name_fa && d.name_en === cat.name_en)) return;
    run(() => api.put(`/api/categories/${cat.id}`, { name_fa: d.name_fa, name_en: d.name_en }));
  };

  const move = (index, delta) => {
    const order = categories.map((c) => c.id);
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    run(() => api.patch('/api/categories/reorder', { order }));
  };

  const setVisible = (cat) =>
    run(() => api.put(`/api/categories/${cat.id}`, { visible: !cat.visible }));

  const remove = (cat) => run(() => api.delete(`/api/categories/${cat.id}`));

  const add = () => {
    if (!newFa.trim() || !newEn.trim()) return;
    run(() => api.post('/api/categories', { name_fa: newFa.trim(), name_en: newEn.trim() }));
    setNewFa('');
    setNewEn('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('manageCategories')}</h2>

        {categories.map((cat, i) => {
          const d = drafts[cat.id] ?? { name_fa: cat.name_fa, name_en: cat.name_en };
          return (
            <div className="catman-row" key={cat.id}>
              <div className="catman-arrows">
                <button className="btn btn-sm" aria-label={t('moveUp')} disabled={i === 0}
                  onClick={() => move(i, -1)}>↑</button>
                <button className="btn btn-sm" aria-label={t('moveDown')} disabled={i === categories.length - 1}
                  onClick={() => move(i, 1)}>↓</button>
              </div>
              <input className="input" dir="rtl" value={d.name_fa}
                onChange={(e) => setDrafts((p) => ({ ...p, [cat.id]: { ...d, name_fa: e.target.value } }))}
                onBlur={() => rename(cat)} />
              <input className="input" dir="ltr" value={d.name_en}
                onChange={(e) => setDrafts((p) => ({ ...p, [cat.id]: { ...d, name_en: e.target.value } }))}
                onBlur={() => rename(cat)} />
              <Toggle variant="show" checked={cat.visible} onChange={() => setVisible(cat)}
                label={cat.visible ? t('visible') : t('hidden')} />
              <button className="btn btn-sm btn-danger" disabled={cat.items.length > 0}
                title={cat.items.length > 0 ? undefined : t('deleteCategory')}
                onClick={() => remove(cat)}>×</button>
            </div>
          );
        })}

        <div className="catman-row" style={{ borderBlockEnd: 'none' }}>
          <input className="input" dir="rtl" placeholder={t('nameFa')} value={newFa}
            onChange={(e) => setNewFa(e.target.value)} />
          <input className="input" dir="ltr" placeholder={t('nameEn')} value={newEn}
            onChange={(e) => setNewEn(e.target.value)} />
          <button className="btn btn-sm btn-primary" onClick={add} disabled={!newFa.trim() || !newEn.trim()}>
            + {t('addCategory')}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}
