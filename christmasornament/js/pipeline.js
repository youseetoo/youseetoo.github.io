// From a side's picture to a panel: render the grey-value field on the main thread, build the
// geometry in the worker. One build runs at a time; per side only the newest request waits.
import { adjustField, lumaFromRGBA } from './geometry/field.js';
import { PANEL } from './geometry/template.js';

export const FIELD_PX = 500;                 // 16 px per mm over the 31.2 mm window

const work = document.createElement('canvas');
work.width = work.height = FIELD_PX;
const wctx = work.getContext('2d', { willReadFrequently: true });

/** Draw a side's picture and text into ctx, window centre at (cx, cy), k px per mm. */
export function paintSource(ctx, side, cx, cy, k) {
  const { src, place, text } = side;
  if (src) {
    ctx.save();
    ctx.translate(cx + place.x * k, cy - place.y * k);
    ctx.rotate((place.rot * Math.PI) / 180);
    const s = place.scale * k;
    ctx.scale(place.flip ? -s : s, s);
    ctx.drawImage(src.img, -src.w / 2, -src.h / 2, src.w, src.h);
    ctx.restore();
  }
  const lines = text.value.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length) {
    let px = text.size * k;
    ctx.save();
    ctx.fillStyle = text.tone === 'dark' ? '#000' : '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const spaced = 'letterSpacing' in ctx;
    const setFont = () => {
      ctx.font = `700 ${px}px Objectivity, sans-serif`;
      if (spaced) ctx.letterSpacing = `${(0.08 * px).toFixed(2)}px`;   // room for printable gaps
    };
    setFont();
    // the size is a maximum: long lines shrink to stay inside the border
    const room = (PANEL.window - 2 * Math.max(side.opts.border, 0) - 1.6) * k;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest > room) {
      px *= room / widest;
      setFont();
    }
    const gap = spaced ? 0.08 * px : 0;
    const lh = px * 1.12;
    const top = cy - text.y * k - ((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => ctx.fillText(l, cx + gap / 2, top + i * lh));
    ctx.restore();
  }
}

/** Grey-value field of a side (adjusted), plus a canvas with the same grey image for display. */
export function renderField(side) {
  const k = FIELD_PX / PANEL.window;
  wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.fillStyle = '#fff';
  wctx.fillRect(0, 0, FIELD_PX, FIELD_PX);
  wctx.imageSmoothingQuality = 'high';
  paintSource(wctx, side, FIELD_PX / 2, FIELD_PX / 2, k);
  const img = wctx.getImageData(0, 0, FIELD_PX, FIELD_PX);
  const field = adjustField(lumaFromRGBA(img.data, FIELD_PX, FIELD_PX), side.tone);
  for (let i = 0, p = 0; i < field.length; i++, p += 4) {
    const g = Math.round(field[i] * 255);
    img.data[p] = img.data[p + 1] = img.data[p + 2] = g;
    img.data[p + 3] = 255;
  }
  if (!side.grey) {
    side.grey = document.createElement('canvas');
    side.grey.width = side.grey.height = FIELD_PX;
  }
  side.grey.getContext('2d').putImageData(img, 0, 0);
  return field;
}

export class Pipeline {
  constructor({ onBuilt, onError, onBusy }) {
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    this.pending = new Map();
    this.busy = false;
    this.seq = 0;
    this.waiters = new Map();
    this.first = 0;                          // side to serve first (the one being edited)
    this.onBuilt = onBuilt;
    this.onError = onError;
    this.onBusy = onBusy;
    this.worker.onmessage = ({ data }) => this.receive(data);
    this.worker.onerror = (e) => this.onError?.(-1, e.message || 'The geometry worker could not start.');
  }

  request(side, field, options) {
    this.pending.set(side, { field, options });
    this.pump();
  }

  pump() {
    if (this.busy) {
      this.onBusy?.(true);
      return;
    }
    if (!this.pending.size) {
      this.onBusy?.(false);
      return;
    }
    const side = this.pending.has(this.first) ? this.first : this.pending.keys().next().value;
    const { field, options } = this.pending.get(side);
    this.pending.delete(side);
    this.busy = true;
    this.onBusy?.(true);
    this.worker.postMessage({ type: 'build', id: ++this.seq, side, field, w: FIELD_PX, h: FIELD_PX, options }, [field.buffer]);
  }

  receive(data) {
    if (data.type === 'built' || (data.type === 'error' && data.kind === 'build')) {
      this.busy = false;
      if (data.type === 'built') this.onBuilt?.(data);
      else this.onError?.(data.side, data.message);
      this.pump();
      return;
    }
    const w = this.waiters.get(data.id);
    if (!w) return;
    this.waiters.delete(data.id);
    if (data.type === 'error') w.reject(new Error(data.message));
    else w.resolve(data.files);
  }

  /** STL files of the given sides (and diffuser sheets of the cut-out sides if sheet > 0). */
  files(sides, sheet) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.waiters.set(id, { resolve, reject });
      this.worker.postMessage({ type: 'stl', id, sides, sheet });
    });
  }
}
