// Generates the extension icons and the Chrome Web Store promo tile with no
// image editor and no dependencies. Run: node tools/make-icons.js
//
// Draws a rounded square with a white "M" and a downward arrow — the Markdown
// idiom — supersampled 4x so the small sizes stay smooth.
//
// Icons go to extension/icons/ (they ship). The promo tile goes to store/,
// which must NOT be included in the uploaded zip.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [37, 99, 235];      // blue that stays visible on light and dark toolbars
const FG = [255, 255, 255];
const ICON_SIZES = [16, 32, 48, 128];
const SS = 4;                   // supersampling factor

function makeCanvas(w, h) {
  return { w, h, px: new Float64Array(w * h * 4) };
}

function setPx(c, x, y, rgb) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.px[i] = rgb[0];
  c.px[i + 1] = rgb[1];
  c.px[i + 2] = rgb[2];
  c.px[i + 3] = 255;
}

function fillRect(c, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPx(c, x, y, rgb);
  }
}

function fillRoundedRect(c, x0, y0, w, h, r, rgb) {
  for (let y = Math.floor(y0); y < y0 + h; y++) {
    for (let x = Math.floor(x0); x < x0 + w; x++) {
      const dx = Math.max(x0 + r - x, x - (x0 + w - 1 - r), 0);
      const dy = Math.max(y0 + r - y, y - (y0 + h - 1 - r), 0);
      if (dx * dx + dy * dy <= r * r) setPx(c, x, y, rgb);
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
      if (Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) <= width / 2) setPx(c, x, y, rgb);
    }
  }
}

function fillTriangle(c, pts, rgb) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const d1 = side(pts[0], pts[1], [x, y]);
      const d2 = side(pts[1], pts[2], [x, y]);
      const d3 = side(pts[2], pts[0], [x, y]);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) setPx(c, x, y, rgb);
    }
  }
}

// The "M↓" mark, drawn on a 128-unit grid scaled by u and shifted by the offset.
function drawMark(c, u, dx, dy) {
  const stroke = 11 * u;
  const X = (n) => n * u + dx;
  const Y = (n) => n * u + dy;

  drawLine(c, X(28), Y(88), X(28), Y(42), stroke, FG);
  drawLine(c, X(28), Y(42), X(48), Y(68), stroke, FG);
  drawLine(c, X(48), Y(68), X(68), Y(42), stroke, FG);
  drawLine(c, X(68), Y(42), X(68), Y(88), stroke, FG);

  drawLine(c, X(96), Y(42), X(96), Y(66), stroke, FG);
  fillTriangle(c, [[X(80), Y(60)], [X(112), Y(60)], [X(96), Y(90)]], FG);
}

function downsample(c, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * c.w + (x * SS + sx)) * 4;
          r += c.px[i]; g += c.px[i + 1]; b += c.px[i + 2]; a += c.px[i + 3];
        }
      }
      const n = SS * SS;
      const o = (y * w + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function drawIcon(size) {
  const S = size * SS;
  const c = makeCanvas(S, S);
  const u = S / 128;

  fillRoundedRect(c, 0, 0, S, S, 26 * u, BG);
  drawMark(c, u, 0, 0);
  return downsample(c, size, size);
}

// Chrome Web Store small promo tile: optional for a listing, but required for
// the extension to be considered for featuring.
function drawPromoTile(w, h) {
  const c = makeCanvas(w * SS, h * SS);
  fillRect(c, 0, 0, c.w, c.h, BG);

  const u = (c.h / 128) * 0.55;
  drawMark(c, u, (c.w - 140 * u) / 2, (c.h - 130 * u) / 2);
  return downsample(c, w, h);
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

function encodePng(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // colour type: RGBA

  // Each scanline is prefixed with its filter byte (0 = none).
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const root = path.join(__dirname, "..");
const iconDir = path.join(root, "extension", "icons");
const storeDir = path.join(root, "store");
fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(storeDir, { recursive: true });

const write = (file, buf) => {
  fs.writeFileSync(file, buf);
  console.log(`wrote ${path.relative(root, file)}`);
};

for (const size of ICON_SIZES) {
  write(path.join(iconDir, `icon${size}.png`), encodePng(drawIcon(size), size, size));
}
write(path.join(storeDir, "promo-tile-440x280.png"), encodePng(drawPromoTile(440, 280), 440, 280));
