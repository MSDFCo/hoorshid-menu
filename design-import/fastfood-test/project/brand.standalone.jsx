// brand.jsx — GoldLogo (pre-baked golden wordmark) + category data + helpers
const LOGO_AR = 1242 / 699;

// Golden wordmark — pre-baked gold PNG (screenshot/export safe) + glow + shine sweep.
function GoldLogo({ width, shine = null, glow = 0.6 }) {
  const t = useTime();
  const height = width / LOGO_AR;
  const logoUrl = window.__resources.logoGold;
  const mask = {
    WebkitMaskImage: `url(${logoUrl})`, maskImage: `url(${logoUrl})`,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    WebkitMaskSize: 'contain', maskSize: 'contain',
  };
  const sx = shine != null ? shine : (((t / 6) % 1));
  const pos = -60 + sx * 220;
  return (
    <div style={{
      position: 'relative', width, height,
      filter: `drop-shadow(0 0 ${22 * glow}px rgba(247,176,60,${0.55 * glow})) drop-shadow(0 0 ${54 * glow}px rgba(255,120,30,${0.32 * glow}))`,
    }}>
      <img src={logoUrl} alt="هورشید"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)',
        backgroundSize: '260% 100%', backgroundPositionX: `${pos}%`,
        mixBlendMode: 'screen', ...mask, pointerEvents: 'none',
      }} />
    </div>
  );
}

// Persian-digit helper
const FA = (s) => String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// 8 categories — exact names + order, sub-items, full uploaded photo (kept intact).
const PRODUCTS = [
  { id: 'american', img: window.__resources.american, name: 'پیتزا آمریکایی', variant: 'spin', price: 'از ۵۷۰٬۰۰۰ تومان',
    items: ['رست بیف', 'مرغ و قارچ', 'پپرونی', 'مخصوص', 'پپرونی و گوشت ویژه', 'مخصوص ارگانیک', 'تورکی برست', 'تورکی رونی'],
    accent: ['#7FB04A', '#E8C15A', '#C8862B'] },
  { id: 'italian',  img: window.__resources.italian,  name: 'پیتزا ایتالیایی', variant: 'slideRight', price: 'از ۵۸۰٬۰۰۰ تومان',
    items: ['رست بیف', 'مرغ و قارچ', 'پپرونی', 'مخصوص', 'ارگانیک', 'تورکی برست'],
    accent: ['#C44536', '#7FB04A', '#E8C15A'] },
  { id: 'baalbaki', img: window.__resources.baalbaki, name: 'پیتزا بعلبکی لبنانی', variant: 'dropBounce', price: 'از ۶۲۵٬۰۰۰ تومان', imgScale: 0.94, imgYAdjust: 26,
    items: ['گوشت', 'میکس', 'شاورما مرغ', 'بوقلمون', 'مخصوص', 'پپرونی', 'مخصوص ارگانیک'],
    accent: ['#E8C15A', '#C8862B', '#9A5B2A'] },
  { id: 'burger',   img: window.__resources.burger,   name: 'برگر', variant: 'smoke', price: 'از ۳۹۵٬۰۰۰ تومان',
    items: ['برگر ذغالی', 'چیزبرگر', 'ماشروم برگر', 'بانی برگر', 'میکس برگر'],
    accent: ['#C8862B', '#E8C15A', '#C44536'] },
  { id: 'grilled',  img: window.__resources.grilled,  name: 'ساندویچ گریل', variant: 'flyLeft', price: 'از ۳۹۰٬۰۰۰ تومان',
    items: ['رست بیف', 'مرغ', 'پپرونی', 'مخصوص'],
    accent: ['#C8862B', '#E8C15A', '#7FB04A'] },
  { id: 'sandwich', img: window.__resources.sandwich, name: 'ساندویچ', variant: 'popSpark', price: 'از ۲۹۰٬۰۰۰ تومان',
    items: ['شاورما مرغ', 'رست بیف', 'ژامبون میکس سرد', 'هات داگ'],
    accent: ['#C44536', '#E8C15A', '#C8862B'] },
  { id: 'snack',    img: window.__resources.snack,    name: 'اسنک', variant: 'slideRight', price: 'از ۲۶۰٬۰۰۰ تومان',
    items: ['گوشت', 'مرغ', 'پپرونی', 'مخصوص', 'مخصوص ارگانیک'],
    accent: ['#E8C15A', '#7FB04A', '#F4A82E'] },
  { id: 'appetizer',img: window.__resources.appetizer,name: 'پیش غذا', variant: 'smoke', price: 'از ۲۳۰٬۰۰۰ تومان',
    items: ['سیب زمینی سرخ شده', 'چیز فرایز', 'هالوپینو فرایز'],
    accent: ['#E8C15A', '#7FB04A', '#F4A82E'] },
];

Object.assign(window, { GoldLogo, LOGO_AR, FA, PRODUCTS });
