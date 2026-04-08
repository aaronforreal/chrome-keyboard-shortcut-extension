/**
 * Generates keyboard-shortcut-themed PNG icons at 16, 32, 48, and 128px.
 * Uses only Node.js built-ins — no npm dependencies required.
 *
 * Design: blue rounded square with a white "K" glyph (keyboard key motif).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── Minimal PNG encoder ────────────────────────────────────────────────────

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB (we'll handle alpha via RGBA → use type 6)
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw scanlines (filter byte 0 per row)
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst]     = rgba[src];
      raw[dst + 1] = rgba[src + 1];
      raw[dst + 2] = rgba[src + 2];
      raw[dst + 3] = rgba[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// ─── Icon painter ───────────────────────────────────────────────────────────

function paintIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Background color: #3B82F6 (blue)
  const bgR = 0x3B, bgG = 0x82, bgB = 0xF6;

  // Corner radius: ~22% of size
  const radius = Math.round(size * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Rounded-rect test
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius));
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        // Transparent outside the rounded rect
        pixels[idx + 3] = 0;
        continue;
      }

      // Anti-alias the edge
      const alpha = dist > radius - 1 ? Math.round((radius - dist) * 255) : 255;

      pixels[idx]     = bgR;
      pixels[idx + 1] = bgG;
      pixels[idx + 2] = bgB;
      pixels[idx + 3] = alpha;
    }
  }

  // Draw white keyboard glyph: three rows of keys
  // Scaled to ~60% of icon size, centered
  const glyph = buildKeyboardGlyph(size);
  for (const [gx, gy, ga] of glyph) {
    if (gx < 0 || gx >= size || gy < 0 || gy >= size) continue;
    const idx = (gy * size + gx) * 4;
    // Only paint if inside the blue area
    if (pixels[idx + 3] === 0) continue;
    // Alpha-composite white over blue
    const wa = ga / 255;
    pixels[idx]     = Math.round(pixels[idx]     * (1 - wa) + 255 * wa);
    pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - wa) + 255 * wa);
    pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - wa) + 255 * wa);
  }

  return pixels;
}

/**
 * Returns an array of [x, y, alpha] tuples representing a simplified keyboard
 * glyph — three rows of rounded-rect "keys" scaled to fit the icon.
 */
function buildKeyboardGlyph(size) {
  const points = [];

  // Glyph occupies ~62% of width, ~50% of height, vertically centered
  const gW = Math.round(size * 0.62);
  const gH = Math.round(size * 0.46);
  const gX = Math.round((size - gW) / 2);
  const gY = Math.round((size - gH) / 2);

  // Three rows, each with N keys
  const rows = [
    { count: 4, y: 0 },
    { count: 4, y: 1 },
    { count: 3, y: 2 },
  ];
  const rowCount = rows.length;
  const keyH = Math.max(2, Math.floor(gH / rowCount * 0.72));
  const rowSpacing = Math.floor(gH / rowCount);
  const kr = Math.max(1, Math.round(keyH * 0.3));

  for (const row of rows) {
    const rowY = gY + row.y * rowSpacing;
    const totalGap = Math.round(gW * 0.1);
    const keyW = Math.floor((gW - totalGap) / row.count - Math.round(gW * 0.02));
    const gap = Math.round((gW - row.count * keyW) / (row.count + 1));

    // On last row, center and widen slightly to represent spacebar
    const isLastRow = row.y === rowCount - 1;
    const actualKeyW = isLastRow ? Math.round(keyW * 1.3) : keyW;
    const lastGap = isLastRow ? Math.round((gW - row.count * actualKeyW) / (row.count + 1)) : gap;

    for (let k = 0; k < row.count; k++) {
      const kx = gX + lastGap + k * (actualKeyW + lastGap);
      fillRoundRect(points, kx, rowY, actualKeyW, keyH, kr);
    }
  }

  return points;
}

/** Fill a rounded rectangle, returning [x,y,alpha] tuples with anti-aliased edges. */
function fillRoundRect(out, rx, ry, rw, rh, rr) {
  for (let dy = 0; dy <= rh; dy++) {
    for (let dx = 0; dx <= rw; dx++) {
      const px = rx + dx, py = ry + dy;
      const cx = Math.max(rr - dx, 0, dx - (rw - rr));
      const cy = Math.max(rr - dy, 0, dy - (rh - rr));
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist > rr + 0.5) continue;
      const alpha = dist > rr - 0.5 ? Math.round((rr + 0.5 - dist) * 255) : 255;
      out.push([px, py, alpha]);
    }
  }
}

// ─── Generate & write ───────────────────────────────────────────────────────

const sizes = [16, 32, 48, 128];
fs.mkdirSync('icons', { recursive: true });

for (const size of sizes) {
  const rgba = paintIcon(size);
  const png = encodePng(size, size, rgba);
  const outPath = path.join('icons', `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`  ✓ icons/icon-${size}.png  (${png.length} bytes)`);
}

console.log('\nIcons generated in icons/');
