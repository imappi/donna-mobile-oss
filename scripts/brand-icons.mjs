#!/usr/bin/env node
/**
 * Regenerates every app icon, the splash image and the web favicon from ONE
 * source: the shell's mascot, placed on the design system's canvas colour.
 * No new artwork is drawn here; the mascot is scaled and positioned, and the
 * single-colour variants are its silhouette.
 *
 *   node scripts/brand-icons.mjs
 *   node scripts/brand-icons.mjs --mascot path/to/mascot.png --canvas '#FFFFFF'
 *
 * Zero dependencies (Node's zlib only) so a fork with another mascot can
 * re-run it without installing an image toolchain. The input must be an
 * 8-bit RGBA or RGB, non-interlaced PNG with a transparent background.
 *
 * Outputs (paths are what app.config.js references):
 *   icon.png                    1024² opaque RGB. iOS masks it to a rounded
 *                               square and rejects transparency.
 *   android-icon-foreground.png 1024² transparent. Android masks the 108dp
 *                               adaptive layer to any shape; only the central
 *                               66dp circle is guaranteed visible, so the
 *                               whole mascot fits inside it.
 *   android-icon-monochrome.png 1024² alpha-only silhouette (Android 13
 *                               themed icons), same geometry as foreground.
 *   notification-icon.png       96² white silhouette (Android status bar).
 *   splash-icon.png             960² transparent (240dp at xxxhdpi). Android 12+ masks the
 *                               splash icon to the central 2/3 circle, so the
 *                               mascot sits inside it; iOS shows the square
 *                               at `imageWidth` points.
 *   favicon.png                 48² transparent (web).
 * The adaptive icon background and the splash background are the canvas
 * colour itself (app.config.js), not images.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), [])
);
const mascotPath = resolve(root, args.mascot ?? 'assets/images/donna-buddy.png');
// core/design/tokens.ts `color.paper`: the canvas every screen sits on.
const canvasHex = args.canvas ?? '#FEFDFA';
const outDir = resolve(root, args.out ?? 'assets/images');

// ── PNG codec (8-bit, non-interlaced) ──────────────────────────────────────
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** Returns {width, height, data: Float64Array RGBA in 0..1, straight alpha}. */
const decodePng = (file) => {
  const buf = readFileSync(file);
  let pos = 8, width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      colorType = body[9];
      if (body[8] !== 8 || body[12] !== 0 || (colorType !== 6 && colorType !== 2)) {
        throw new Error(`${file}: need an 8-bit, non-interlaced RGB(A) PNG`);
      }
    } else if (type === 'IDAT') idat.push(body);
    pos += 12 + len;
  }
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? px[y * stride + x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter];
      px[y * stride + x] = (v + pred) & 0xff;
    }
  }
  const data = new Float64Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] = px[i * channels + ch] / 255;
    data[i * 4 + 3] = channels === 4 ? px[i * channels + 3] / 255 : 1;
  }
  return { width, height, data };
};

const chunk = (type, body) => {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, 'latin1');
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
};

/** Writes straight-alpha float RGBA; `opaque` drops the alpha channel. */
const encodePng = (file, { width, height, data }, opaque = false) => {
  const channels = opaque ? 3 : 4;
  const stride = width * channels;
  const px = Buffer.alloc(stride * height);
  for (let i = 0; i < width * height; i++) {
    for (let ch = 0; ch < channels; ch++) {
      px[i * channels + ch] = Math.round(Math.min(1, Math.max(0, data[i * 4 + ch])) * 255);
    }
  }
  // Per-row adaptive filter (minimum sum of absolute differences).
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    let best = null, bestScore = Infinity;
    for (let f = 0; f < 5; f++) {
      const row = Buffer.alloc(stride + 1);
      row[0] = f;
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? px[y * stride + x - channels] : 0;
        const b = y > 0 ? px[(y - 1) * stride + x] : 0;
        const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
        const v = (px[y * stride + x] - [0, a, b, (a + b) >> 1, paeth(a, b, c)][f]) & 0xff;
        row[x + 1] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) { best = row; bestScore = score; }
    }
    best.copy(raw, y * (stride + 1));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = opaque ? 2 : 6;
  writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
};

// ── Geometry and resampling ────────────────────────────────────────────────
/** Bounding box of pixels that are visibly there (alpha > 2%). */
const contentBox = ({ width, height, data }) => {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 0.02) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) throw new Error('mascot is fully transparent');
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

const lanczos = (x) => {
  if (x === 0) return 1;
  if (Math.abs(x) >= 3) return 0;
  const px = Math.PI * x;
  return (3 * Math.sin(px) * Math.sin(px / 3)) / (px * px);
};

/** 1-D resample of premultiplied RGBA along one axis (Lanczos-3, widened when shrinking). */
const resampleAxis = (src, srcLen, lines, dstLen, scale, offset, horizontal) => {
  const out = new Float64Array(dstLen * lines * 4);
  const support = 3 * Math.max(1, 1 / scale);
  const stretch = Math.max(1, 1 / scale);
  for (let d = 0; d < dstLen; d++) {
    const center = (d + 0.5 - offset) / scale - 0.5;
    const lo = Math.max(0, Math.ceil(center - support)), hi = Math.min(srcLen - 1, Math.floor(center + support));
    if (lo > hi) continue;
    const weights = [];
    let sum = 0;
    for (let s = lo; s <= hi; s++) { const w = lanczos((s - center) / stretch); weights.push(w); sum += w; }
    // Normalise by the full kernel so the source edge fades to transparent.
    let full = 0;
    for (let s = Math.ceil(center - support); s <= Math.floor(center + support); s++) full += lanczos((s - center) / stretch);
    const norm = full || sum || 1;
    for (let l = 0; l < lines; l++) {
      const acc = [0, 0, 0, 0];
      for (let s = lo; s <= hi; s++) {
        const i = horizontal ? (l * srcLen + s) * 4 : (s * lines + l) * 4;
        const w = weights[s - lo];
        for (let ch = 0; ch < 4; ch++) acc[ch] += src[i + ch] * w;
      }
      const o = horizontal ? (l * dstLen + d) * 4 : (d * lines + l) * 4;
      for (let ch = 0; ch < 4; ch++) out[o + ch] = acc[ch] / norm;
    }
  }
  return out;
};

/**
 * Places the mascot on a transparent `size`² canvas: its content box is
 * scaled uniformly by `scale` and centred on (cx, cy) of the canvas.
 */
const place = (img, box, size, scale, cx, cy) => {
  const pre = new Float64Array(img.data.length);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    for (let ch = 0; ch < 3; ch++) pre[i * 4 + ch] = img.data[i * 4 + ch] * a;
    pre[i * 4 + 3] = a;
  }
  const offX = cx - (box.x + box.w / 2) * scale;
  const offY = cy - (box.y + box.h / 2) * scale;
  const horiz = resampleAxis(pre, img.width, img.height, size, scale, offX, true);
  const both = resampleAxis(horiz, img.height, size, size, scale, offY, false);
  // Clamp Lanczos ringing and return to straight alpha.
  const data = new Float64Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const a = Math.min(1, Math.max(0, both[i * 4 + 3]));
    for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] = a > 0 ? Math.min(1, Math.max(0, both[i * 4 + ch] / a)) : 0;
    data[i * 4 + 3] = a;
  }
  return { width: size, height: size, data };
};

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`canvas colour must be #RRGGBB, got ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
};

const onCanvas = (img, rgb) => {
  const data = new Float64Array(img.data.length);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3];
    for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] = img.data[i * 4 + ch] * a + rgb[ch] * (1 - a);
    data[i * 4 + 3] = 1;
  }
  return { ...img, data };
};

/**
 * The mascot's silhouette in white, at source resolution. Dark enclosed
 * areas (Donna's visor, highlights included) are knocked out so the shape
 * still reads as the mascot in one colour: a pixel is kept only if it can
 * be reached from the image border without crossing a dark pixel. Faint
 * alpha (a soft floor shadow) is dropped.
 */
const silhouette = (img) => {
  const { width, height } = img;
  const n = width * height;
  const dark = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const [r, g, b, a] = img.data.subarray(i * 4, i * 4 + 4);
    dark[i] = a > 0.5 && 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.2 ? 1 : 0;
  }
  const reached = new Uint8Array(n);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  while (stack.length) {
    const i = stack.pop();
    if (reached[i] || dark[i]) continue;
    reached[i] = 1;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < n - width) stack.push(i + width);
  }
  const data = new Float64Array(img.data.length);
  for (let i = 0; i < n; i++) {
    const a = reached[i] ? Math.min(1, Math.max(0, (img.data[i * 4 + 3] - 0.35) / 0.3)) : 0;
    data.set([1, 1, 1, a], i * 4);
  }
  return { ...img, data };
};

// ── Layout per target ──────────────────────────────────────────────────────
const mascot = decodePng(mascotPath);
const box = contentBox(mascot);
const diag = Math.hypot(box.w, box.h);
const canvas = hexToRgb(canvasHex);
const write = (name, img, opaque) => {
  encodePng(join(outDir, name), img, opaque);
  console.log(`${name.padEnd(28)} ${img.width}x${img.height}`);
};

// Fits the content box so its longer side is `fraction` of the canvas.
const fitSide = (size, fraction) => (size * fraction) / Math.max(box.w, box.h);
// Fits the content box (its diagonal) inside a centred circle.
const fitCircle = (size, diameterFraction) => (size * diameterFraction) / diag;

// iOS/App Store icon: 1024, opaque. The rounded-square mask leaves the
// central ~80% untouched; 70% keeps clear of it with room to breathe.
write('icon.png', onCanvas(place(mascot, box, 1024, fitSide(1024, 0.7), 512, 512), canvas), true);

// Android adaptive: the 66/108 safe circle (61%), less a small margin.
const mono = silhouette(mascot);
write('android-icon-foreground.png', place(mascot, box, 1024, fitCircle(1024, 0.58), 512, 512));
write('android-icon-monochrome.png', place(mono, box, 1024, fitCircle(1024, 0.58), 512, 512));

// Android status-bar icon: 24dp at 4x, white on transparent, with the
// platform's 2dp inset.
write('notification-icon.png', place(mono, box, 96, fitSide(96, 20 / 24), 48, 48));

// Splash: inside the 2/3 circle Android 12+ keeps, less a margin.
write('splash-icon.png', place(mascot, box, 960, fitCircle(960, 0.62), 480, 480));

// Web favicon: as large as the tab allows.
write('favicon.png', place(mascot, box, 48, fitSide(48, 46 / 48), 24, 24));
