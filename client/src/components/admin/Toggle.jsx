/**
 * Accessible on/off switch styled via CSS (.toggle).
 * variant: 'green' (default — availability) or 'show' (orange — visibility in menu),
 * so the two switches in the item row are visually distinct.
 */
export default function Toggle({ checked, onChange, label, variant }) {
  return (
    <button
      type="button"
      className={`toggle${variant === 'show' ? ' toggle-show' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
    />
  );
}
