// Grey-value fields (Float32Array, row 0 at the top, 0 = black, 1 = white) and their tracing.
// A field always covers the design window: w px for PANEL.window mm.

/** RGBA bytes -> luminance 0..1, transparent pixels count as white (open). */
export function lumaFromRGBA(rgba, w, h) {
  const f = new Float32Array(w * h);
  for (let i = 0, p = 0; i < f.length; i++, p += 4) {
    const a = rgba[p + 3] / 255;
    const y = (0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2]) / 255;
    f[i] = y * a + (1 - a);
  }
  return f;
}

/** Brightness / contrast (-1..1), gamma (>0) and invert, in place. */
export function adjustField(f, { brightness = 0, contrast = 0, gamma = 1, invert = false } = {}) {
  const c = Math.tan((Math.min(Math.max(contrast, -0.98), 0.98) + 1) * Math.PI / 4);
  for (let i = 0; i < f.length; i++) {
    let v = (f[i] - 0.5) * c + 0.5 + brightness;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    if (gamma !== 1) v = Math.pow(v, gamma);
    f[i] = invert ? 1 - v : v;
  }
  return f;
}

function boxPass(src, dst, w, h, r, horizontal) {
  const n = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 1 : w;
  const inv = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = horizontal ? l * w : l;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[base + Math.min(Math.max(k, 0), n - 1) * step];
    for (let k = 0; k < n; k++) {
      dst[base + k * step] = acc * inv;
      const add = Math.min(k + r + 1, n - 1);
      const sub = Math.max(k - r, 0);
      acc += src[base + add * step] - src[base + sub * step];
    }
  }
}

/** Gaussian blur approximated by three box blurs; sigma in pixels. Returns a new field. */
export function blurField(f, w, h, sigma) {
  if (!(sigma > 0.3)) return f.slice();
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2 - 0.5));
  const a = f.slice();
  const b = new Float32Array(f.length);
  for (let i = 0; i < 3; i++) {
    boxPass(a, b, w, h, r, true);
    boxPass(b, a, w, h, r, false);
  }
  return a;
}

/** Bilinear sample of the field at design coordinates (u right, v up, mm, origin at the centre). */
export function sampler(f, w, h, mmPerPx) {
  const half = (w * mmPerPx) / 2;
  return (u, v) => {
    let x = (u + half) / mmPerPx - 0.5;
    let y = (half - v) / mmPerPx - 0.5;
    x = x < 0 ? 0 : x > w - 1 ? w - 1 : x;
    y = y < 0 ? 0 : y > h - 1 ? h - 1 : y;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
    const fx = x - x0, fy = y - y0;
    const a = f[y0 * w + x0], b = f[y0 * w + x1], c = f[y1 * w + x0], d = f[y1 * w + x1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };
}

/**
 * Marching squares: closed loops around the dark parts (value < iso) in design mm.
 * The field is padded with dark pixels, so every loop closes (the frame is material anyway),
 * and the first loop is a rectangle around the padding, so that the EvenOdd fill rule reads
 * the padding as dark. Loops have no particular orientation: build them with EvenOdd.
 */
export function traceDark(f, w, h, iso, mmPerPx) {
  const W = w + 2, H = h + 2;
  const g = new Float32Array(W * H).fill(-1);
  const t = iso + 1e-6;                       // no corner exactly on the iso value
  for (let j = 0; j < h; j++) g.set(f.subarray(j * w, j * w + w), (j + 1) * W + 1);
  // mirror light edge pixels about the iso value: their contour then runs on the window edge
  const pad = (v) => (v < t ? -1 : 2 * t - v);
  for (let i = 1; i <= w; i++) {
    g[i] = pad(g[W + i]);
    g[(H - 1) * W + i] = pad(g[(H - 2) * W + i]);
  }
  for (let j = 1; j <= h; j++) {
    g[j * W] = pad(g[j * W + 1]);
    g[j * W + W - 1] = pad(g[j * W + W - 2]);
  }
  const half = (w * mmPerPx) / 2;
  const ux = (i) => (i - 0.5) * mmPerPx - half;      // padded index -> mm
  const vy = (j) => half - (j - 0.5) * mmPerPx;
  const nE = 2 * W * H;
  const px = new Float64Array(nE), py = new Float64Array(nE);
  const nbA = new Int32Array(nE).fill(-1), nbB = new Int32Array(nE).fill(-1);
  const hId = (i, j) => 2 * (j * W + i);
  const vId = (i, j) => 2 * (j * W + i) + 1;

  const cross = (id, x0, y0, x1, y1, a, b) => {
    const s = (t - a) / (b - a);
    px[id] = x0 + (x1 - x0) * s;
    py[id] = y0 + (y1 - y0) * s;
  };
  const link = (a, b) => {
    if (nbA[a] < 0) nbA[a] = b; else nbB[a] = b;
    if (nbA[b] < 0) nbA[b] = a; else nbB[b] = a;
  };

  for (let j = 0; j < H - 1; j++) {
    for (let i = 0; i < W - 1; i++) {
      const tl = g[j * W + i], tr = g[j * W + i + 1];
      const bl = g[(j + 1) * W + i], br = g[(j + 1) * W + i + 1];
      const c = (tl < t ? 8 : 0) | (tr < t ? 4 : 0) | (br < t ? 2 : 0) | (bl < t ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const T = hId(i, j), B = hId(i, j + 1), L = vId(i, j), R = vId(i + 1, j);
      const x0 = ux(i), x1 = ux(i + 1), y0 = vy(j), y1 = vy(j + 1);
      if ((tl < t) !== (tr < t)) cross(T, x0, y0, x1, y0, tl, tr);
      if ((bl < t) !== (br < t)) cross(B, x0, y1, x1, y1, bl, br);
      if ((tl < t) !== (bl < t)) cross(L, x0, y0, x0, y1, tl, bl);
      if ((tr < t) !== (br < t)) cross(R, x1, y0, x1, y1, tr, br);
      const mid = (tl + tr + bl + br) / 4 < t;
      switch (c) {
        case 1: case 14: link(L, B); break;
        case 2: case 13: link(B, R); break;
        case 3: case 12: link(L, R); break;
        case 4: case 11: link(T, R); break;
        case 6: case 9: link(T, B); break;
        case 7: case 8: link(L, T); break;
        case 5: if (mid) { link(L, T); link(B, R); } else { link(T, R); link(L, B); } break;
        case 10: if (mid) { link(T, R); link(L, B); } else { link(L, T); link(B, R); } break;
        default: break;
      }
    }
  }

  const R = half + 2 * mmPerPx;
  const loops = [[[-R, -R], [R, -R], [R, R], [-R, R]]];
  const seen = new Uint8Array(nE);
  for (let e = 0; e < nE; e++) {
    if (nbA[e] < 0 || seen[e]) continue;
    const loop = [];
    let prev = -1, cur = e;
    while (cur >= 0 && !seen[cur]) {
      seen[cur] = 1;
      loop.push([px[cur], py[cur]]);
      const next = nbA[cur] !== prev ? nbA[cur] : nbB[cur];
      prev = cur;
      cur = next;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}
