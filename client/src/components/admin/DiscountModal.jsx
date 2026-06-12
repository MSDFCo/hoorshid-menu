import { useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { formatPrice } from '../../lib/format.js';

// Mirror of the server's discount math (server/lib/discount.js) for live preview.
function preview(price, type, value) {
  const v = Number(value) || 0;
  if (type === 'percent') {
    return Math.round((price * (100 - Math.min(Math.max(v, 0), 100))) / 100 / 1000) * 1000;
  }
  return Math.min(Math.max(v, 0), price);
}

/** Discount editor: percentage off OR fixed final price, with computed preview. */
export default function DiscountModal({ item, onClose, onApply }) {
  const { t, L, lang } = useLang();
  const [type, setType] = useState(item.discount?.type ?? 'percent');
  const [value, setValue] = useState(item.discount?.value ?? '');

  const valid =
    type === 'percent'
      ? Number(value) >= 1 && Number(value) <= 99
      : Number(value) >= 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {t('discount')} — {L(item, 'name')}
        </h2>
        <div className="discount-editor">
          <div className="radio-row">
            <label>
              <input type="radio" checked={type === 'percent'} onChange={() => setType('percent')} />
              {t('percentOff')} (٪)
            </label>
            <label>
              <input type="radio" checked={type === 'fixed'} onChange={() => setType('fixed')} />
              {t('fixedPrice')}
            </label>
          </div>
          <label className="field">
            {t('discountValue')}
            <input
              className="input"
              type="number"
              min="1"
              max={type === 'percent' ? 99 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </label>
          <div className="discount-preview">
            <strong>{t('finalPrice')}:</strong>
            {item.variants.map((v) => (
              <span key={v.id}>
                {L(v, 'label') && `${L(v, 'label')}: `}
                <s style={{ opacity: 0.6 }}>{formatPrice(v.price, lang)}</s>{' '}
                <strong style={{ color: 'var(--accent-bright)' }}>
                  {formatPrice(valid ? preview(v.price, type, value) : v.price, lang)}
                </strong>{' '}
                {t('toman')}
              </span>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('cancel')}</button>
          <button
            className="btn btn-primary"
            disabled={!valid}
            onClick={() => onApply({ type, value: Number(value) })}
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
