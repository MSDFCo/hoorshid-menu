// Small validation helpers — every admin input goes through these.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

/** Trimmed string, length-capped; throws if required and empty. */
export function str(value, { field, required = false, max = 300 } = {}) {
  if (value == null) value = '';
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const v = value.trim().slice(0, max);
  if (required && !v) throw new ValidationError(`${field} is required`);
  return v;
}

/** Positive integer (prices in Toman, ids, etc.). */
export function int(value, { field, min = 0, max = 1_000_000_000 } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(`${field} must be an integer between ${min} and ${max}`);
  }
  return n;
}

/** Variants array: 1..6 entries of { label_fa, label_en, price }. */
export function variantList(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 6) {
    throw new ValidationError('variants must be an array of 1 to 6 entries');
  }
  return value.map((v, i) => ({
    label_fa: str(v?.label_fa, { field: `variants[${i}].label_fa`, max: 60 }),
    label_en: str(v?.label_en, { field: `variants[${i}].label_en`, max: 60 }),
    price: int(v?.price, { field: `variants[${i}].price`, min: 0 }),
  }));
}

/** Image filename as produced by the upload endpoint — rejects anything path-like. */
export function imageName(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^img_[A-Za-z0-9_-]+\.webp$/.test(value)) {
    throw new ValidationError('image must be a filename returned by /api/upload');
  }
  return value;
}

/** Photo list: up to 6 upload filenames; the first one is the main card photo. */
export function imagesList(value) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 6) {
    throw new ValidationError('images must be an array of at most 6 filenames');
  }
  return value.map(imageName).filter(Boolean);
}

/** Express error handler for ValidationError + everything else. */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'server error' });
}
