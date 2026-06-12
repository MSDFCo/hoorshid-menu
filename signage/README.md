# Hoorshid Signage — تیزر منو

24-second looping motion graphic for the in-store TV screen, implemented from the
Claude Design handoff bundle (`design-import/fastfood-test/`). Self-contained —
React/Babel are vendored locally, no internet needed.

- **Design canvas:** 1920×1080 (16:9), 24 s seamless loop
- **Sequence:** golden logo opening with slogan (0–3 s) → 8 menu categories, each
  with hero photo, Persian title, price pill, and sub-item list (3–21.5 s) →
  finale with CTA + phone number (21.4–24 s)
- **Typography:** Digi Nozha everywhere, RTL right-aligned
- All motion is deterministic (pure function of timeline time, seeded RNG) — this
  is what makes the offline frame-by-frame video render possible.

## Play in a browser

Serve this folder over HTTP (Babel can't fetch `.jsx` over `file://`):

```
npx serve .        # or any static server, then open index.html
```

Space = play/pause, ←/→ = seek, 0 = restart. Top-right button toggles ambient audio.

## Render to 4K MP4

```
npm install
npm run render                       # → "Hoorshid Signage 4K.mp4" (3840×2160, 30 fps)
node render.js --fps 60 --out x.mp4  # custom fps / filename
```

The renderer launches local Chrome/Edge headless, seeks the timeline frame-by-frame
(via the `window.__seek` hook in `app.jsx`), screenshots the stage at 2× device
scale (3840×2160), and pipes the frames into ffmpeg (H.264, CRF 16, yuv420p,
faststart — plays on any TV/USB media player). Video is silent by design (in-store
screens run muted; the audio in the HTML version is an optional procedural toggle).

## Files

- `index.html` — entry point (vendored React 18 + Babel standalone)
- `animations.jsx` — Stage/Sprite timeline engine (from the design starter)
- `fx.jsx` — embers, glow, smoke, streaks, sparks, flame line
- `brand.jsx` — gold logo, Persian digits helper, the 8 category data records
- `scenes.jsx` — Opening / ProductScene / Finale
- `app.jsx` — 24 s timeline composition + optional audio + `__seek` render hook
- `render.js` — 4K MP4 renderer (puppeteer-core + ffmpeg-static)
- `assets/` — Digi Nozha font, gold logo, 8 product cutout PNGs

To change menu items/prices, edit `PRODUCTS` in `brand.jsx` and re-render.
