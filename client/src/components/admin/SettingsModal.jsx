import { useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { api } from '../../lib/api.js';

/** Restaurant settings: address (FA/EN), phone and the Google Maps location. */
export default function SettingsModal({ settings, onClose, onSaved }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    address_fa: settings?.address_fa ?? '',
    address_en: settings?.address_en ?? '',
    phone: settings?.phone ?? '',
    maps_query: settings?.maps_query ?? '',
    hours_fa: settings?.hours_fa ?? '',
    hours_en: settings?.hours_en ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put('/api/settings', form);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{t('settings')}</h2>
        <div className="modal-grid">
          <label className="field span2">
            {t('addressFa')}
            <textarea className="textarea" dir="rtl" value={form.address_fa}
              onChange={(e) => set('address_fa', e.target.value)} />
          </label>
          <label className="field span2">
            {t('addressEn')}
            <textarea className="textarea" dir="ltr" value={form.address_en}
              onChange={(e) => set('address_en', e.target.value)} />
          </label>
          <label className="field">
            {t('phoneLabel')}
            <input className="input" dir="ltr" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label className="field">
            {t('mapsQuery')}
            <input className="input" dir="ltr" value={form.maps_query}
              onChange={(e) => set('maps_query', e.target.value)} />
          </label>
          <span className="hint span2">{t('mapsHint')}</span>
          <label className="field">
            {t('hoursFa')}
            <input className="input" dir="rtl" value={form.hours_fa}
              onChange={(e) => set('hours_fa', e.target.value)} />
          </label>
          <label className="field">
            {t('hoursEn')}
            <input className="input" dir="ltr" value={form.hours_en}
              onChange={(e) => set('hours_en', e.target.value)} />
          </label>
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
