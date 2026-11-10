// Test helpers: load manifold in Node and rasterise the preset SVGs (polygon paths only).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Module from '../vendor/manifold/manifold.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let mod;
export async function manifold() {
  if (!mod) {
    mod = await Module();
    mod.setup();
  }
  return mod;
}

/** Polygons of every <path d="M..L..Z"> in an SVG file (SVG coordinates). */
export function svgPolygons(file) {
  const svg = readFileSync(join(ROOT, file), 'utf8');
  const polys = [];
  for (const m of svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)) {
    for (const sub of m[1].split('Z')) {
      const nums = sub.replace(/[ML]/g, ' ').trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length < 6) continue;
      const poly = [];
      for (let i = 0; i < nums.length; i += 2) poly.push([nums[i], nums[i + 1]]);
      polys.push(poly);
    }
  }
  return polys;
}

/** Even-odd fill of SVG polygons into a field over the window: black (0) inside, white outside. */
export function rasterise(polys, w, size = 31.2, ss = 4) {
  const half = size / 2, s = size / w, sub = s / ss;
  const field = new Float32Array(w * w);
  const edges = [];
  for (const p of polys) for (let i = 0; i < p.length; i++) edges.push([p[i], p[(i + 1) % p.length]]);
  const acc = new Float32Array(w);
  for (let r = 0; r < w; r++) {
    acc.fill(0);
    for (let k = 0; k < ss; k++) {
      const y = -half + r * s + (k + 0.5) * sub;
      const xs = [];
      for (const [a, b] of edges) {
        if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let q = 0; q < w * ss; q++) {
          const x = -half + (q + 0.5) * sub;
          if (x >= xs[i] && x < xs[i + 1]) acc[Math.floor(q / ss)] += 1;
        }
      }
    }
    for (let c = 0; c < w; c++) field[r * w + c] = 1 - acc[c] / (ss * ss);
  }
  return field;
}
