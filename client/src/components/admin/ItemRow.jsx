import { useEffect, useState } from 'react';
import { useLang } from '../../i18n.jsx';
import { formatPrice, localizeDigits } from '../../lib/format.js';
import Toggle from './Toggle.jsx';

/**
 * One item in the admin list: thumbnail, names, inline price editing per
 * size variant, active toggle, discount chip, edit/delete actions.
 */
export default function ItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
  onDiscount,
  onRemoveDiscount,
  onSavePrices,
  onSetStock,
}) {
  const { t, L, lang } = useLang();
  // local editable copy of prices, keyed by variant id
  const [prices, setPrices] = useState({});

  useEffect(() => {
    setPrices(Object.fromEntries(item.variants.map((v) => [v.id, String(v.price)])));
  }, [item]);

  const dirty = item.variants.some((v) => prices[v.id] !== undefined && Number(prices[v.id]) !== v.price);

  const commit = () => {
    if (!dirty) return;
    const variants = item.variants.map((v) => ({
      label_fa: v.label_fa,
      label_en: v.label_en,
      price: Math.max(0, Number(prices[v.id]) || 0),
    }));
    onSavePrices(variants);
  };

  return (
    <div className="admin-item" data-inactive={!item.active}>
      {item.images.length > 0 ? (
        <img className="admin-item-thumb" src={`/uploads/${item.images[0]}`} alt="" loading="lazy" />
      ) : (
        <div className="admin-item-thumb-empty" />
      )}

      <div className="admin-item-info">
        <div className="admin-item-name">{L(item, 'name')}</div>
        <div className="admin-item-sub">{lang === 'fa' ? item.name_en : item.name_fa}</div>
        {item.discount ? (
          <button
            className="discount-chip"
            onClick={onRemoveDiscount}
            title={t('removeDiscount')}
          >
            {localizeDigits(item.discount.percent ?? '', lang)}{lang === 'fa' ? '٪' : '%'} {t('off')}{' '}
            <span className="x">×</span>
          </button>
        ) : (
          <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={onDiscount}>
            {t('addDiscount')}
          </button>
        )}
      </div>

      <div className="admin-variants">
        {item.variants.map((v) => (
          <div className="admin-variant-row" key={v.id}>
            {L(v, 'label') && <span className="vlabel">{L(v, 'label')}</span>}
            <input
              className="price-input"
              type="number"
              min="0"
              value={prices[v.id] ?? ''}
              data-dirty={prices[v.id] !== undefined && Number(prices[v.id]) !== v.price}
              onChange={(e) => setPrices((p) => ({ ...p, [v.id]: e.target.value }))}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            {item.discount && v.final_price < v.price && (
              <span className="admin-variant-final">→ {formatPrice(v.final_price, lang)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="admin-item-actions">
        {/* two clearly-labeled switches so visibility and availability can't be mixed up */}
        <div className="switches">
          <div className="switch-row">
            <span className="switch-label">{t('showInMenu')}</span>
            <Toggle
              variant="show"
              checked={item.active}
              onChange={onToggle}
              label={item.active ? t('active') : t('inactive')}
            />
          </div>
          <div className="switch-row">
            <span className="switch-label">
              {t('availability')}
              {!item.in_stock && <b className="soldout-tag"> — {t('outOfStock')}</b>}
            </span>
            <Toggle
              checked={item.in_stock}
              onChange={() => onSetStock(item.in_stock ? 0 : null)}
              label={item.in_stock ? t('available') : t('outOfStock')}
            />
          </div>
        </div>
        <button className="btn btn-sm" onClick={onEdit}>{t('edit')}</button>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>{t('delete')}</button>
      </div>
    </div>
  );
}
