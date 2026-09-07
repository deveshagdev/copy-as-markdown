// Generates extension/icons/icon{16,32,48,128}.png with no image editor and no
// dependencies. Run: node tools/make-icons.js
//
// Draws a rounded square with a white "M" and a downward arrow — the Markdown
// idiom — supersampled 4x so the small sizes stay smooth.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [37, 99, 235];      // blue that stays visible on light and dark toolbars
const FG = [255, 255, 255];
const SIZES = [16, 32, 48, 128];
const SS = 4;                   // supersampling factor

function makeCanvas(size) {
  return { size, px: new Float64Array(size * size * 4) };
}

function setPx(c, x, y, rgb, alpha) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  const a = alpha === undefined ? 1 : alpha;
  c.px[i] = rgb[0] * a + c.px[i] * (1 - a);
  c.px[i + 1] = rgb[1] * a + c.px[i + 1] * (1 - a);
  c.px[i + 2] = rgb[2] * a + c.px[i + 2] * (1 - a);
  c.px[i + 3] = 255 * a + c.px[i + 3] * (1 - a);
}

function fillRoundedRect(c, x0, y0, w, h, r, rgb) {
  for (let y = Math.floor(y0); y < y0 + h; y++) {
    for (let x = Math.floor(x0); x < x0 + w; x++) {
      const dx = Math.max(x0 + r - x, x - (x0 + w - 1 - r), 0);
      const dy = Math.max(y0 + r - y, y - (y0 + h - 1 - r), 0);
      if (dx * dx + dy * dy <= r * r) setPx(c, x, y, rgb, 1);
    }
  }
}

// Thick line segment, drawn as a distance field so diagonals aren't jagged.
function drawLine(c, x1, y1, x2, y2, width, rgb) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const dist = Math.hypot(x - px, y - py);
      if (dist <= width / 2) setPx(c, x, y, rgb, 1);
    }
  }
}

function fillTriangle(c, pts, rgb) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const area = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const p = [x, y];
      const d1 = area(pts[0], pts[1], p);
      const d2 = area(pts[1], pts[2], p);
      const d3 = area(pts[2], pts[0], p);
      const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
      const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(hasNeg && hasPos)) setPx(c, x, y, rgb, 1);
    }
  }
}

function drawIcon(size) {
  const S = size * SS;
  const c = makeCanvas(S);
  const u = S / 128;   // design the artwork at 128, scale by u

  fillRoundedRect(c, 0, 0, S, S, 26 * u, BG);

  const stroke = 11 * u;
  const top = 42 * u;
  const bottom = 88 * u;

  // "M" — two uprights joined by a V
  drawLine(c, 28 * u, bottom, 28 * u, top, stroke, FG);
  drawLine(c, 28 * u, top, 48 * u, 68 * u, stroke, FG);
  drawLine(c, 48 * u, 68 * u, 68 * u, top, stroke, FG);
  drawLine(c, 68 * u, top, 68 * u, bottom, stroke, FG);

  // Downward arrow
  drawLine(c, 96 * u, top, 96 * u, 66 * u, stroke, FG);
  fillTriangle(c, [[80 * u, 60 * u], [112 * u, 60 * u], [96 * u, bottom + 2 * u]], FG);

  return downsample(c, size);
}

function downsample(c, size) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * c.size + (x * SS + sx)) * 4;
          r += c.px[i]; g += c.px[i + 1]; b += c.px[i + 2]; a += c.px[i + 3];
        }
      }
      const n = SS * SS;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

// --- minimal PNG encoder -----------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colour type: RGBA
  // 10-12 default to 0: deflate, adaptive filtering, no interlace

  // Each scanline is prefixed with its filter byte (0 = none).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const outDir = path.join(__dirname, "..", "extension", "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of SIZES) {
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, encodePng(drawIcon(size), size));
  console.log(`wrote ${path.relative(path.join(__dirname, ".."), file)} (${size}x${size})`);
}
