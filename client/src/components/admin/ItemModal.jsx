import { useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { api } from '../../lib/api.js';

/** Add / edit item form: bilingual names & descriptions, category, photo, size variants. */
export default function ItemModal({ item, categories, onClose, onSaved }) {
  const { t, L } = useLang();
  const editing = !!item;

  const [form, setForm] = useState(() => ({
    category_id: item?.category_id ?? categories[0]?.id ?? '',
    name_fa: item?.name_fa ?? '',
    name_en: item?.name_en ?? '',
    desc_fa: item?.desc_fa ?? '',
    desc_en: item?.desc_en ?? '',
    images: item?.images ?? [],
    variants: item
      ? item.variants.map((v) => ({ label_fa: v.label_fa, label_en: v.label_en, price: v.price }))
      : [{ label_fa: '', label_en: '', price: '' }],
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setVariant = (i, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, j) => (j === i ? { ...v, [key]: value } : v)),
    }));

  const addVariant = () =>
    setForm((f) => ({ ...f, variants: [...f.variants, { label_fa: '', label_en: '', price: '' }] }));
  const removeVariant = (i) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));

  const uploadPhoto = async (file) => {
    if (!file || form.images.length >= 6) return;
    setBusy(true);
    setError('');
    try {
      const { filename } = await api.upload(file);
      setForm((f) => ({ ...f, images: [...f.images, filename] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }));

  // move a photo to the front — the first photo is the one shown on the card
  const makeMain = (i) =>
    setForm((f) => ({ ...f, images: [f.images[i], ...f.images.filter((_, j) => j !== i)] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      variants: form.variants.map((v) => ({ ...v, price: Number(v.price) || 0 })),
    };
    try {
      if (editing) await api.put(`/api/items/${item.id}`, payload);
      else await api.post('/api/items', payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{editing ? t('editItem') : t('addItem')}</h2>
        <div className="modal-grid">
          <label className="field">
            {t('nameFa')}
            <input className="input" dir="rtl" required value={form.name_fa}
              onChange={(e) => set('name_fa', e.target.value)} />
          </label>
          <label className="field">
            {t('nameEn')}
            <input className="input" dir="ltr" required value={form.name_en}
              onChange={(e) => set('name_en', e.target.value)} />
          </label>
          <label className="field span2">
            {t('descFa')}
            <textarea className="textarea" dir="rtl" value={form.desc_fa}
              onChange={(e) => set('desc_fa', e.target.value)} />
          </label>
          <label className="field span2">
            {t('descEn')}
            <textarea className="textarea" dir="ltr" value={form.desc_en}
              onChange={(e) => set('desc_en', e.target.value)} />
          </label>
          <label className="field span2">
            {t('category')}
            <select className="select" value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{L(c, 'name')}</option>
              ))}
            </select>
          </label>

          <div className="field span2">
            {t('photos')}
            <div className="photo-list">
              {form.images.map((f, i) => (
                <div className="photo-tile" key={f}>
                  <img className="upload-preview" src={`/uploads/${f}`} alt="" />
                  {i === 0 ? (
                    <span className="photo-main-tag">{t('mainPhoto')}</span>
                  ) : (
                    <button type="button" className="photo-make-main" title={t('makeMain')}
                      onClick={() => makeMain(i)}>★</button>
                  )}
                  <button type="button" className="photo-remove" title={t('removePhoto')}
                    onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
              {form.images.length < 6 && (
                <label className="btn btn-sm photo-add">
                  + {t('uploadPhoto')}
                  <input type="file" accept="image/*" hidden
                    onChange={(e) => { uploadPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <span className="hint">{t('photosHint')} — {t('uploadHint')}</span>
          </div>

          <div className="field span2">
            {t('sizesPrices')}
            {form.variants.map((v, i) => (
              <div className="variant-edit-row" key={i}>
                <input className="input" dir="rtl" placeholder={t('sizeLabelFa')} value={v.label_fa}
                  onChange={(e) => setVariant(i, 'label_fa', e.target.value)} />
                <input className="input" dir="ltr" placeholder={t('sizeLabelEn')} value={v.label_en}
                  onChange={(e) => setVariant(i, 'label_en', e.target.value)} />
                <input className="input" type="number" min="0" required placeholder={t('price')}
                  style={{ maxWidth: 120 }} value={v.price}
                  onChange={(e) => setVariant(i, 'price', e.target.value)} />
                {form.variants.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariant(i)}>
                    ×
                  </button>
                )}
              </div>
            ))}
            {form.variants.length < 6 && (
              <button type="button" className="btn btn-sm" onClick={addVariant}>
                + {t('addSize')}
              </button>
            )}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? t('saving') : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
