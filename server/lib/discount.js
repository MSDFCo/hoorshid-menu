// Discount math shared by the public menu and the admin API.

/**
 * Final price of one variant after the item's discount.
 * - 'percent': value is % off, rounded to the nearest 1,000 Toman (menu-friendly numbers).
 * - 'fixed':   value IS the final price (capped at the original so it never goes up).
 */
export function finalPrice(price, discountType, discountValue) {
  if (discountType === 'percent') {
    const pct = Math.min(Math.max(discountValue ?? 0, 0), 100);
    return Math.round((price * (100 - pct)) / 100 / 1000) * 1000;
  }
  if (discountType === 'fixed') {
    return Math.min(Math.max(discountValue ?? price, 0), price);
  }
  return price;
}

/** Effective % off for the badge (derived for 'fixed' discounts from the cheapest variant). */
export function discountPercent(item, variants) {
  if (!item.discount_type) return null;
  if (item.discount_type === 'percent') return Math.min(Math.max(item.discount_value, 0), 100);
  const base = variants[0];
  if (!base || base.price <= 0) return null;
  return Math.round((1 - finalPrice(base.price, 'fixed', item.discount_value) / base.price) * 100);
}

/** Serialize an item row + its variant/image rows into the API shape, with computed prices. */
export function serializeItem(item, variants, images = []) {
  return {
    id: item.id,
    category_id: item.category_id,
    name_fa: item.name_fa,
    name_en: item.name_en,
    desc_fa: item.desc_fa,
    desc_en: item.desc_en,
    images, // ordered filenames; images[0] is the main card photo
    image: images[0] ?? null,
    // stock: null = unlimited/not tracked; 0 = sold out (shown dimmed on the menu)
    stock: item.stock ?? null,
    in_stock: item.stock == null || item.stock > 0,
    active: !!item.active,
    sort_order: item.sort_order,
    discount: item.discount_type
      ? {
          type: item.discount_type,
          value: item.discount_value,
          percent: discountPercent(item, variants),
        }
      : null,
    variants: variants.map((v) => ({
      id: v.id,
      label_fa: v.label_fa,
      label_en: v.label_en,
      price: v.price,
      final_price: finalPrice(v.price, item.discount_type, item.discount_value),
    })),
  };
}
