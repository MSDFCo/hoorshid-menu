import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { formatPrice, localizeDigits } from '../lib/format.js';
import Lightbox from './Lightbox.jsx';

/**
 * One menu item on the customer page, styled after the design reference:
 * orange item name, light description, photo on the card's end side.
 * Tapping the photo opens a swipeable full-screen gallery of all photos.
 */
export default function ItemCard({ item }) {
  const { t, L, lang } = useLang();
  const discounted = !!item.discount;
  const soldOut = !item.in_stock;
  const [gallery, setGallery] = useState(false);

  return (
    <article className="item-card" data-soldout={soldOut || undefined}>
      {soldOut ? (
        <span className="soldout-badge">{t('outOfStock')}</span>
      ) : (
        discounted &&
        item.discount.percent > 0 && (
          <span className="discount-badge">
            {localizeDigits(item.discount.percent, lang)}
            {lang === 'fa' ? '٪' : '%'} {t('off')}
          </span>
        )
      )}

      {/* Photo floats at the inline-start side: right of the text in Persian,
          left of it in English. Text wraps around it like the design reference. */}
      {item.images.length > 0 && (
        <button
          type="button"
          className="item-media"
          onClick={() => setGallery(true)}
          aria-label={L(item, 'name')}
        >
          <img
            src={`/uploads/${item.images[0]}`}
            alt={L(item, 'name')}
            loading="lazy"
            decoding="async"
            width="96"
            height="96"
          />
          {item.images.length > 1 && (
            <span className="item-media-count" aria-hidden="true">
              {localizeDigits(item.images.length, lang)}
            </span>
          )}
        </button>
      )}

      <h3 className="item-name">{L(item, 'name')}</h3>
      {L(item, 'desc') && <p className="item-desc">{L(item, 'desc')}</p>}
      <ul className="price-list">
        {item.variants.map((v) => (
          <li className="price-row" key={v.id}>
            {L(v, 'label') ? <span className="price-label">{L(v, 'label')}</span> : <span />}
            <span className="price-dots" aria-hidden="true" />
            <span className="price-value">
              {discounted && v.final_price < v.price && (
                <s className="price-old">{formatPrice(v.price, lang)}</s>
              )}
              <strong className={discounted && v.final_price < v.price ? 'price-new' : ''}>
                {formatPrice(discounted ? v.final_price : v.price, lang)}
              </strong>
              <span className="price-unit">{t('toman')}</span>
            </span>
          </li>
        ))}
      </ul>

      {gallery && (
        <Lightbox images={item.images} alt={L(item, 'name')} onClose={() => setGallery(false)} />
      )}
    </article>
  );
}
