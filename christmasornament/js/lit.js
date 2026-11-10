// How a side looks with the tealight on, drawn from the geometry the worker built:
// cut-out: openings show the lit diffuser; shadow / lithophane: light falls off with thickness.
import { PANEL } from './geometry/template.js';

const MU = 1.1;                                  // 1/mm, same attenuation as the tone curve
export const LIGHT = [255, 226, 160];            // lit white sheet / thin plastic
export const DARK = [18, 20, 24];                // dark filament

const rgb = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** Brightness 0..1 of white plastic of thickness t, relative to the thin setting. */
export function transmission(t, tLight) {
  return Math.exp(-MU * (t - tLight));
}

export function roundedRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Path of polygons given in design mm (v up), for a context already scaled to mm with y down. */
export function polyPath(polys) {
  const p = new Path2D();
  for (const poly of polys) {
    if (poly.length < 3) continue;
    p.moveTo(poly[0][0], -poly[0][1]);
    for (let i = 1; i < poly.length; i++) p.lineTo(poly[i][0], -poly[i][1]);
    p.closePath();
  }
  return p;
}

function thicknessImage(preview) {
  if (preview._img) return preview._img;
  const { T, n, tLight } = preview;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const b = Math.min(1, transmission(T[i], tLight));
    const col = mix(DARK, LIGHT, Math.pow(b, 0.8));
    img.data[4 * i] = col[0];
    img.data[4 * i + 1] = col[1];
    img.data[4 * i + 2] = col[2];
    img.data[4 * i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  preview._img = c;
  return c;
}

/**
 * Draw the lit window of a side into ctx: the window (PANEL.window mm) is mapped onto the
 * square of side `size` px centred at (cx, cy).
 */
export function drawLit(ctx, preview, style, cx, cy, size) {
  const k = size / PANEL.window;
  const h = PANEL.window / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.beginPath();
  roundedRect(ctx, -h, -h, 2 * h, 2 * h, PANEL.windowR);
  ctx.clip();
  if (!preview) {
    ctx.fillStyle = rgb(mix(DARK, LIGHT, 0.08));
    ctx.fillRect(-h, -h, 2 * h, 2 * h);
  } else if (preview.kind === 'thickness') {
    const ph = preview.half ?? h;               // the grid reaches a little into the walls
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(thicknessImage(preview), -ph, -ph, 2 * ph, 2 * ph);
  } else {
    const thick = style === 'shadow' ? Math.pow(transmission(preview.tDark, preview.tLight), 0.8) : 0;
    ctx.fillStyle = rgb(LIGHT);
    ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.fillStyle = rgb(mix(DARK, LIGHT, thick));
    ctx.fill(polyPath(preview.material), 'evenodd');
  }
  ctx.restore();
}
