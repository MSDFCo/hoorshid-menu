// Shared number/price formatting:
// FA → Persian digits with Persian separators (۶۲۵٬۰۰۰), EN → Latin digits (625,000).

const faFormatter = new Intl.NumberFormat('fa-IR', { useGrouping: true });
const enFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

export function formatPrice(value, lang) {
  if (value == null || Number.isNaN(Number(value))) return '';
  return (lang === 'fa' ? faFormatter : enFormatter).format(Number(value));
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Localize digits inside an arbitrary string (used for the phone number, percents, etc.). */
export function localizeDigits(str, lang) {
  if (lang !== 'fa') return String(str);
  return String(str).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
}
