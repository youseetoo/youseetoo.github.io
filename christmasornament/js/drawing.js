// The side as a drawing seen from outside: panel outline, window, the lit result or the picture,
// dimensions. Drag moves the picture, the wheel or two fingers zoom (and turn).
import { PANEL } from './geometry/template.js';
import { drawLit, polyPath, roundedRect } from './lit.js';
import { paintSource } from './pipeline.js';

const VIEW = 41;                              // mm across the canvas
const BLUE = '#023773';
const GREEN = '#85b918';
const TURQUOISE = '#1f9c7c';

export class Drawing {
  constructor(canvas, { onPlace }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onPlace = onPlace;
    this.view = 'lit';
    this.side = null;
    this.pointers = new Map();
    this.dragging = false;
    new ResizeObserver(() => this.resize()).observe(canvas);
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    canvas.addEventListener('wheel', (e) => this.wheel(e), { passive: false });
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(200, Math.round(r.width * dpr));
    if (this.canvas.width !== px) {
      this.canvas.width = this.canvas.height = px;
      this.draw();
    }
  }

  get k() { return this.canvas.width / VIEW; }

  /** Canvas px of a pointer event -> design mm (v up, origin at the window centre). */
  toMM(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * VIEW - VIEW / 2;
    const y = ((e.clientY - r.top) / r.height) * VIEW - VIEW / 2;
    return [x, -y];
  }

  setSide(side) { this.side = side; this.draw(); }
  setView(view) { this.view = view; this.draw(); }

  down(e) {
    if (!this.side?.src && !this.side?.text.value) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, this.toMM(e));
    this.start = { place: { ...this.side.place }, pts: [...this.pointers.values()].map((p) => [...p]) };
    this.dragging = true;
    this.canvas.classList.add('dragging');
    this.draw();
  }

  move(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, this.toMM(e));
    const pts = [...this.pointers.values()];
    const p0 = this.start.place;
    const place = this.side.place;
    if (pts.length === 1 && this.start.pts.length === 1) {
      place.x = p0.x + pts[0][0] - this.start.pts[0][0];
      place.y = p0.y + pts[0][1] - this.start.pts[0][1];
    } else if (pts.length >= 2 && this.start.pts.length >= 2) {
      const [a0, b0] = this.start.pts, [a1, b1] = pts;
      const d0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
      const d1 = Math.hypot(b1[0] - a1[0], b1[1] - a1[1]);
      const f = d1 / d0;
      const turn = Math.atan2(b1[1] - a1[1], b1[0] - a1[0]) - Math.atan2(b0[1] - a0[1], b0[0] - a0[0]);
      const m0 = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2], m1 = [(a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2];
      place.scale = p0.scale * f;
      place.rot = wrap(p0.rot - (turn * 180) / Math.PI);
      place.x = m1[0] + (p0.x - m0[0]) * f;
      place.y = m1[1] + (p0.y - m0[1]) * f;
    } else {
      return;
    }
    this.onPlace(false);
    this.draw();
  }

  up(e) {
    if (!this.pointers.delete(e.pointerId)) return;
    if (this.pointers.size) {
      this.start = { place: { ...this.side.place }, pts: [...this.pointers.values()].map((p) => [...p]) };
      return;
    }
    this.dragging = false;
    this.canvas.classList.remove('dragging');
    this.onPlace(true);
    this.draw();
  }

  wheel(e) {
    if (!this.side?.src) return;
    e.preventDefault();
    const f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
    const [mx, my] = this.toMM(e);
    const place = this.side.place;
    place.scale *= f;
    place.x = mx + (place.x - mx) * f;
    place.y = my + (place.y - my) * f;
    this.onPlace(false);
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => this.onPlace(true), 160);
    this.draw();
  }

  draw() {
    const { ctx, canvas } = this;
    const W = canvas.width, k = this.k, c = W / 2;
    const side = this.side;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#faf9f9';
    ctx.fillRect(0, 0, W, W);
    grid(ctx, W, k);
    if (!side) return;
    const style = side.opts.style;
    const lip = PANEL.lip / 2, win = PANEL.window / 2;

    // panel face (the rim around the window, as printed)
    ctx.beginPath();
    roundedRect(ctx, c - lip * k, c - lip * k, 2 * lip * k, 2 * lip * k, PANEL.lipR * k);
    ctx.fillStyle = style === 'cutout' ? '#23272e' : '#f3f1ec';
    ctx.fill();

    // picture faintly outside the window, so the crop is visible
    if (side.src && (this.view === 'picture' || this.dragging)) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, W);
      roundedRect(ctx, c - win * k, c - win * k, 2 * win * k, 2 * win * k, PANEL.windowR * k);
      ctx.clip('evenodd');
      ctx.globalAlpha = 0.22;
      paintSource(ctx, side, c, c, k);
      ctx.restore();
    }

    // window content
    if (this.view === 'picture' && side.grey) {
      ctx.save();
      ctx.beginPath();
      roundedRect(ctx, c - win * k, c - win * k, 2 * win * k, 2 * win * k, PANEL.windowR * k);
      ctx.clip();
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(side.grey, c - win * k, c - win * k, 2 * win * k, 2 * win * k);
      ctx.restore();
    } else {
      drawLit(ctx, side.result?.preview, style, c, c, PANEL.window * k);
      if (side.result?.preview?.kind === 'material' && style === 'cutout') this.marks(side.result.preview, side.opts.islands);
    }

    // outlines and dimensions
    ctx.lineWidth = Math.max(1, W / 520);
    ctx.strokeStyle = BLUE;
    ctx.beginPath();
    roundedRect(ctx, c - lip * k, c - lip * k, 2 * lip * k, 2 * lip * k, PANEL.lipR * k);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    roundedRect(ctx, c - win * k, c - win * k, 2 * win * k, 2 * win * k, PANEL.windowR * k);
    ctx.stroke();
    if (side.opts.border > 0.05) {
      const b = win - side.opts.border;
      ctx.setLineDash([4 * W / 520, 3 * W / 520]);
      ctx.beginPath();
      roundedRect(ctx, c - b * k, c - b * k, 2 * b * k, 2 * b * k, PANEL.windowR * k);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
    dimension(ctx, c, k, -win, win, -(lip + 1.25), `${PANEL.window} mm`, W);
    dimension(ctx, c, k, -lip, lip, lip + 1.25, `${PANEL.lip} mm`, W);
    if (!side.src && !side.text.value) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `300 ${Math.round(W / 34)}px Objectivity, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Choose a picture', c, c);
    }
  }

  /** Bridges (green) and floating parts (turquoise outline) on a cut-out. */
  marks(preview, mode) {
    const { ctx } = this;
    const W = this.canvas.width, k = this.k, c = W / 2;
    ctx.save();
    ctx.translate(c, c);
    ctx.scale(k, k);
    if (mode !== 'bridge' && preview.islands.length) {
      ctx.lineWidth = 2.2 / k * (W / 520);
      ctx.setLineDash(mode === 'remove' ? [0.5, 0.35] : []);
      ctx.strokeStyle = TURQUOISE;
      for (const isl of preview.islands) ctx.stroke(polyPath(isl));
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = GREEN;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.45;
    for (const [x0, y0, x1, y1] of preview.bridges) {
      ctx.beginPath();
      ctx.moveTo(x0, -y0);
      ctx.lineTo(x1, -y1);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function wrap(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function grid(ctx, W, k) {
  ctx.save();
  ctx.strokeStyle = 'rgba(2,55,115,0.07)';
  ctx.lineWidth = 1;
  const c = W / 2;
  for (let mm = -20; mm <= 20; mm += 5) {
    const p = Math.round(c + mm * k) + 0.5;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  ctx.restore();
}

/** Horizontal dimension from u0 to u1 at height v (mm), label in the middle. */
function dimension(ctx, c, k, u0, u1, v, label, W) {
  const y = c - v * k, x0 = c + u0 * k, x1 = c + u1 * k, a = W / 110;
  ctx.save();
  ctx.strokeStyle = BLUE;
  ctx.fillStyle = BLUE;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = Math.max(1, W / 700);
  ctx.beginPath();
  ctx.moveTo(x0, y); ctx.lineTo(x1, y);
  ctx.moveTo(x0, y - a); ctx.lineTo(x0, y + a);
  ctx.moveTo(x1, y - a); ctx.lineTo(x1, y + a);
  ctx.stroke();
  ctx.font = `300 ${Math.round(W / 40)}px Objectivity, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(label).width + W / 60;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#faf9f9';
  ctx.fillRect(c + ((u0 + u1) / 2) * k - tw / 2, y - W / 60, tw, W / 30);
  ctx.fillStyle = BLUE;
  ctx.fillText(label, c + ((u0 + u1) / 2) * k, y + 1);
  ctx.restore();
}
