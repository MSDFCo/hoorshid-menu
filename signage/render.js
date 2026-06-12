// render.js — renders the Hoorshid signage loop to a 4K (3840x2160) MP4.
//
// The animation engine is fully deterministic (all motion is a function of the
// timeline `time`, seeded RNG for particles), so we seek frame-by-frame via the
// window.__seek hook exposed by app.jsx, screenshot the 1920x1080 stage at
// deviceScaleFactor 2, and pipe the PNG frames straight into ffmpeg.
//
// Usage: node render.js [--fps 30] [--out "Hoorshid Signage 4K.mp4"]

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const ffmpegPath = require('ffmpeg-static');

const DURATION = 24;            // must match Stage duration in app.jsx
const FPS = parseInt(argOf('--fps', '30'), 10);
const OUT = argOf('--out', path.join(__dirname, 'Hoorshid Signage 4K.mp4'));
const TOTAL = DURATION * FPS;   // last frame is t = DURATION - 1/FPS (loop point excluded)

function argOf(flag, dflt) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('No Chrome/Edge found');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
};

function serve(dir) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(dir, urlPath === '/' ? 'index.html' : urlPath);
      if (!fp.startsWith(dir) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve(__dirname);
  const port = srv.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;
  console.log(`Serving ${__dirname} at ${url}`);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: [
      '--force-device-scale-factor=2',
      '--hide-scrollbars',
      '--disable-lcd-text',          // grayscale AA — subpixel fringes look bad in video
      '--font-render-hinting=none',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 2 });

  page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE:', m.text()); });

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

  // Hide viewer chrome (sound toggle) — position:fixed, overlaps the canvas capture.
  await page.addStyleTag({ content: '.ui-chrome { display: none !important; }' });

  // Wait until Babel has executed all scripts (App mounted + seek hook ready),
  // fonts are loaded, and every product image is decoded.
  await page.waitForFunction('typeof window.__seek === "function"', { timeout: 120000 });
  await page.evaluate(async () => {
    window.__seek(0);
    await document.fonts.ready;
    const srcs = ['assets/logo_gold.png', ...window.PRODUCTS.map((p) => p.img)];
    await Promise.all(srcs.map((s) => new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => im.decode().then(res, res);
      im.onerror = () => rej(new Error('image failed: ' + s));
      im.src = s;
    })));
  });

  const canvas = await page.$('#anim-canvas');
  if (!canvas) throw new Error('#anim-canvas not found');

  // Sanity-check capture dimensions on frame 0.
  const probe = Buffer.from(await canvas.screenshot({ type: 'png' }));
  const w = probe.readUInt32BE(16), h = probe.readUInt32BE(20);
  console.log(`Frame size: ${w}x${h}`);
  if (w !== 3840 || h !== 2160) throw new Error(`Expected 3840x2160, got ${w}x${h}`);

  const ff = spawn(ffmpegPath, [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-level', '5.1',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart',
    OUT,
  ], { stdio: ['pipe', 'inherit', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', (d) => { ffErr += d.toString(); if (ffErr.length > 40000) ffErr = ffErr.slice(-20000); });
  const ffDone = new Promise((res, rej) => ff.on('close', (code) =>
    code === 0 ? res() : rej(new Error('ffmpeg exited ' + code + '\n' + ffErr.slice(-4000)))));

  const t0 = Date.now();
  for (let f = 0; f < TOTAL; f++) {
    const t = f / FPS;
    await page.evaluate((tt) => {
      window.__seek(tt);
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, t);
    const png = Buffer.from(await canvas.screenshot({ type: 'png' }));
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 30 === 0 || f === TOTAL - 1) {
      const el = (Date.now() - t0) / 1000;
      const eta = f > 0 ? Math.round((el / (f + 1)) * (TOTAL - f - 1)) : '?';
      console.log(`frame ${f + 1}/${TOTAL} (t=${t.toFixed(2)}s) elapsed=${Math.round(el)}s eta=${eta}s`);
    }
  }
  ff.stdin.end();
  await ffDone;

  await browser.close();
  srv.close();

  const size = fs.statSync(OUT).size;
  console.log(`DONE: ${OUT} (${(size / 1024 / 1024).toFixed(1)} MB, ${TOTAL} frames @ ${FPS}fps, ${DURATION}s)`);
})().catch((e) => { console.error(e); process.exit(1); });
