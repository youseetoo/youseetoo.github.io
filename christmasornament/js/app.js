// openUC2 light cube designer: four sides, each with a picture, a look and its panel geometry.
import { Drawing } from './drawing.js';
import { LOOKS, download, fileName, zipAll } from './export.js';
import { DEFAULTS } from './geometry/build.js';
import { PANEL } from './geometry/template.js';
import { drawLit, roundedRect } from './lit.js';
import { FIELD_PX, Pipeline, renderField } from './pipeline.js';
import { SIDES, Viewer } from './viewer.js';

const START = ['jena-skyline-1', 'snowflake', 'openuc2-frame', 'starry-night'];
const BY_SOURCE = {
  cad: { detail: 0.4, smooth: 0.04, border: 0, threshold: 0.5 },     // CAD designs: as drawn
  motif: { detail: 0.6, smooth: 0.06, border: PANEL.border, threshold: 0.5 },
  upload: { detail: 0.6, smooth: 0.06, border: PANEL.border, threshold: 0.5 },
};
const MAX_IMAGE = 2400;                 // px, larger uploads are scaled down once
const PLA = 1.24e-3;                    // g per mm3

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const state = {
  presets: [],
  images: new Map(),
  sides: SIDES.map((def, index) => ({
    index, key: def.key, name: def.name,
    src: null,
    place: { x: 0, y: 0, scale: 1, rot: 0, flip: false },
    tone: { brightness: 0, contrast: 0, gamma: 1, invert: false },
    opts: { ...DEFAULTS },
    text: { value: '', size: 5, y: -9, tone: 'light' },
    result: null, error: null, grey: null, note: '',
  })),
  active: 0,
};

let drawing, viewer, pipeline;
const current = () => state.sides[state.active];

// ------------------------------------------------------------------ pictures
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This file could not be read as a picture.'));
    img.src = url;
  });
}

async function presetImage(id) {
  if (!state.images.has(id)) {
    const img = await loadImage(`assets/presets/${id}.svg`);
    state.images.set(id, { img, w: img.naturalWidth || 1248, h: img.naturalHeight || 1248 });
  }
  return state.images.get(id);
}

const fillScale = (src) => PANEL.window / Math.min(src.w, src.h);
const fitScale = (src) => PANEL.window / Math.max(src.w, src.h);

function resetPlace(side) {
  side.place = { x: 0, y: 0, rot: 0, flip: false, scale: side.src ? fillScale(side.src) : 1 };
}

async function choosePreset(side, id) {
  const meta = state.presets.find((p) => p.id === id);
  const img = await presetImage(id);
  side.src = { ...img, preset: id, title: meta?.title ?? id };
  Object.assign(side.opts, BY_SOURCE[meta?.source === 'cad' ? 'cad' : 'motif']);
  side.tone = { brightness: 0, contrast: 0, gamma: 1, invert: false };
  side.note = '';
  resetPlace(side);
}

async function useFile(file) {
  if (!file) return;
  const side = current();
  if (!/^image\//.test(file.type) && !/\.(svg|png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
    setStatus('Please choose a picture file (PNG, JPG, WebP or SVG).', true);
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    let img = await loadImage(url);
    let w = img.naturalWidth || 1024, h = img.naturalHeight || 1024;
    if (Math.max(w, h) > MAX_IMAGE) {
      const f = MAX_IMAGE / Math.max(w, h);
      const c = document.createElement('canvas');
      c.width = Math.round(w * f);
      c.height = Math.round(h * f);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      img = c;
      w = c.width;
      h = c.height;
    }
    side.src = { img, w, h, title: file.name };
    Object.assign(side.opts, BY_SOURCE.upload);
    side.tone = { brightness: 0, contrast: 0, gamma: 1, invert: false };
    resetPlace(side);
    // photos (many mid-tones) look best as a lithophane, drawings as cut-outs
    const f = renderField(side);
    let mid = 0;
    for (let i = 0; i < f.length; i += 7) if (f[i] > 0.18 && f[i] < 0.82) mid++;
    const photo = mid / (f.length / 7) > 0.35;
    side.opts.style = photo ? 'litho' : side.opts.style;
    side.note = photo ? 'This looks like a photo, so the side is set to Lithophane. Cut-out and Shadow suit drawings and logos.' : '';
    syncControls();
    rebuild(state.active);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// ------------------------------------------------------------------ building
let throttle = 0;
function rebuild(i, soon = false) {
  if (soon) {
    if (throttle) return;
    throttle = setTimeout(() => { throttle = 0; rebuild(i); }, 70);
    return;
  }
  const side = state.sides[i];
  side.error = null;
  const field = renderField(side);
  if (i === state.active) drawing.draw();
  pipeline.first = state.active;
  pipeline.request(i, field, { ...side.opts });
}

function onBuilt({ side: i, mesh, preview, stats, style }) {
  const side = state.sides[i];
  side.result = { preview, stats, style };
  viewer.setPanel(i, mesh, style);
  viewer.setGlow(i, (ctx, size) => drawLit(ctx, preview, style, size / 2, size / 2, size));
  paintThumb(i);
  renderTable();
  if (i === state.active) {
    drawing.draw();
    showStatus();
  }
}

function onError(i, message) {
  if (i < 0) {
    setStatus(`The geometry engine could not start (${message}). Please use a current Chrome, Edge, Firefox or Safari.`, true);
    return;
  }
  state.sides[i].error = message;
  if (i === state.active) showStatus();
}

// ------------------------------------------------------------------ status, thumbnails, table
function setStatus(text, notice = false) {
  const el = $('#status');
  el.textContent = text;
  el.classList.toggle('notice', notice);
}

function showStatus() {
  const side = current();
  if (side.error) return setStatus(`This side could not be built: ${side.error}`, true);
  const r = side.result;
  if (!r) return setStatus('Building…');
  const s = r.stats;
  const g = (s.volume * PLA).toFixed(1);
  const parts = [];
  let notice = false;
  if (r.style === 'litho') {
    parts.push(`${s.meanThickness.toFixed(1)} mm thick on average`, `about ${g} g of white PLA`);
  } else if (r.style === 'shadow') {
    parts.push(`${Math.round(100 * s.openFraction)} % of the window is thin and glows`, `about ${g} g of white PLA`);
  } else {
    const open = Math.round(100 * s.openFraction);
    parts.push(`${open} % of the window is open`, `about ${g} g`);
    const n = s.islands, pl = n === 1 ? 'part' : 'parts';
    if (n && side.opts.islands === 'bridge') parts.push(`${n} floating ${pl} held by green bridges`);
    if (n && side.opts.islands === 'remove') parts.push(`${n} floating ${pl} left out`);
    if (n && side.opts.islands === 'keep') { parts.push(`${n} floating ${pl} kept: glue ${n === 1 ? 'it' : 'them'} onto the diffuser`); notice = true; }
    if (open < 6) { parts.push('very little light gets through'); notice = true; }
  }
  const cad = state.presets.find((p) => p.id === side.src?.preset)?.source === 'cad';
  if (r.style !== 'litho' && side.opts.detail < 0.6 && !cad) { parts.push('details under 0.6 mm may not print with a 0.4 mm nozzle'); notice = true; }
  const text = parts.join(' · ');
  setStatus(side.note ? `${side.note} ${text[0].toUpperCase()}${text.slice(1)}.` : `${text[0].toUpperCase()}${text.slice(1)}.`, notice);
}

function paintSide(ctx, i, size) {
  const side = state.sides[i];
  const style = side.result?.style ?? side.opts.style;
  const k = size / PANEL.lip;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = style === 'cutout' ? '#23272e' : '#ece9e2';
  ctx.beginPath();
  roundedRect(ctx, 0, 0, size, size, PANEL.lipR * k);
  ctx.fill();
  drawLit(ctx, side.result?.preview, style, size / 2, size / 2, PANEL.window * k);
}

function paintThumb(i) {
  const c = $$('.side-thumb')[i];
  if (c) paintSide(c.getContext('2d'), i, c.width);
  const btn = $$('.side-btn')[i];
  if (btn) $('.side-look', btn).textContent = LOOKS[state.sides[i].opts.style].name;
}

function renderTable() {
  const body = $('#partsBody');
  body.replaceChildren(...state.sides.map((side, i) => {
    const look = LOOKS[side.result?.style ?? side.opts.style];
    const tr = document.createElement('tr');
    const g = side.result ? `${(side.result.stats.volume * PLA).toFixed(1)} g` : '–';
    tr.innerHTML = `
      <td><span class="side-cell"><canvas width="80" height="80" aria-hidden="true"></canvas>${i + 1} ${side.name}</span></td>
      <td>${look.name}</td>
      <td><span class="swatch" style="background:${look.swatch}"></span>${look.filament}</td>
      <td class="num">${g}</td>
      <td><button type="button" class="btn-line" data-stl="${i}" ${side.result ? '' : 'disabled'}>STL</button></td>`;
    paintSide($('canvas', tr).getContext('2d'), i, 80);
    return tr;
  }));
  const anyCut = state.sides.some((s) => (s.result?.style ?? s.opts.style) === 'cutout');
  $('#optSheets').closest('.check').hidden = !anyCut;
}

// ------------------------------------------------------------------ controls
const getPath = (o, p) => p.split('.').reduce((a, k) => a[k], o);
function setPath(o, p, v) {
  const ks = p.split('.');
  const last = ks.pop();
  ks.reduce((a, k) => a[k], o)[last] = v;
}

function showValue(path) {
  const out = $(`output[data-for="${path}"]`);
  if (!out) return;
  const v = getPath(current(), path);
  const fmt = out.dataset.fmt;
  let t;
  if (fmt === 'pct') t = `${Math.round(v * 100)} %`;
  else if (fmt === 'signed') t = `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(path.startsWith('tone') ? 2 : 1)}`;
  else t = Number.isInteger(v) ? String(v) : v.toFixed(path === 'opts.step' ? 2 : 1);
  out.textContent = t + (out.dataset.unit ?? '');
}

function setPressed(attr, value) {
  $$(`[${attr}]`).forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === value)));
}

function zoomValue(side) {
  if (!side.src) return 0.4;
  return (Math.log2(side.place.scale / fillScale(side.src)) + 2) / 5;
}

function syncControls() {
  const side = current();
  $$('[data-bind]').forEach((el) => {
    const v = getPath(side, el.dataset.bind);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
    showValue(el.dataset.bind);
  });
  $('#zoom').value = zoomValue(side);
  setPressed('data-style', side.opts.style);
  setPressed('data-islands', side.opts.islands);
  setPressed('data-curve', side.opts.curve);
  setPressed('data-texttone', side.text.tone);
  $$('[data-show]').forEach((el) => { el.hidden = !el.dataset.show.split(' ').includes(side.opts.style); });
  $$('.preset').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === side.src?.preset)));
  $('#drop').classList.toggle('active', !!side.src && !side.src.preset);
  $('.upload-title').textContent = side.src && !side.src.preset ? side.src.title : 'Use your own picture';
  $('#text').value = side.text.value;
  $('#sideTitle').textContent = side.name;
  $('#sideKicker').textContent = `Side ${side.index + 1} of 4`;
  $$('.side-btn').forEach((b, i) => b.setAttribute('aria-current', String(i === state.active)));
  showStatus();
}

function select(i, turn = true) {
  state.active = i;
  pipeline.first = i;
  viewer.setActive(i);
  if (turn) viewer.face(i);
  drawing.setSide(current());
  syncControls();
}

function wire() {
  $$('[data-bind]').forEach((el) => {
    el.addEventListener('input', () => {
      const v = el.type === 'checkbox' ? el.checked : parseFloat(el.value);
      setPath(current(), el.dataset.bind, v);
      showValue(el.dataset.bind);
      if (el.dataset.bind === 'place.rot') drawing.draw();
      rebuild(state.active, true);
    });
  });
  $('#zoom').addEventListener('input', (e) => {
    const side = current();
    if (!side.src) return;
    const s = fillScale(side.src) * 2 ** (5 * parseFloat(e.target.value) - 2);
    const f = s / side.place.scale;
    side.place.scale = s;
    side.place.x *= f;
    side.place.y *= f;
    drawing.draw();
    rebuild(state.active, true);
  });
  $$('[data-place]').forEach((b) => b.addEventListener('click', () => {
    const side = current();
    if (!side.src) return;
    const p = side.place;
    if (b.dataset.place === 'fit') Object.assign(p, { x: 0, y: 0, scale: fitScale(side.src) });
    if (b.dataset.place === 'fill') Object.assign(p, { x: 0, y: 0, scale: fillScale(side.src) });
    if (b.dataset.place === 'flip') p.flip = !p.flip;
    if (b.dataset.place === 'center') Object.assign(p, { x: 0, y: 0 });
    syncControls();
    rebuild(state.active);
  }));
  const choice = (attr, apply) => $$(`[${attr}]`).forEach((b) => b.addEventListener('click', () => {
    apply(current(), b.getAttribute(attr));
    syncControls();
    rebuild(state.active);
  }));
  choice('data-style', (s, v) => { s.opts.style = v; s.note = ''; });
  choice('data-islands', (s, v) => { s.opts.islands = v; });
  choice('data-curve', (s, v) => { s.opts.curve = v; });
  choice('data-texttone', (s, v) => { s.text.tone = v; });
  $('#text').addEventListener('input', (e) => { current().text.value = e.target.value; rebuild(state.active, true); });

  $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
    setPressed('data-view', b.dataset.view);
    drawing.setView(b.dataset.view);
  }));
  $$('[data-light]').forEach((b) => b.addEventListener('click', () => {
    setPressed('data-light', b.dataset.light);
    viewer.setLight(b.dataset.light);
  }));
  $('#spin').addEventListener('click', () => viewer.setSpin(!viewer.controls.autoRotate));

  const drop = $('#drop');
  $('#file').addEventListener('change', (e) => { useFile(e.target.files[0]); e.target.value = ''; });
  for (const el of [drop, $('#drawing')]) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    el.addEventListener('dragleave', () => drop.classList.remove('over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('over');
      useFile(e.dataTransfer.files[0]);
    });
  }
  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items ?? [])].find((it) => it.type.startsWith('image/'));
    if (item) useFile(item.getAsFile());
  });

  const canvas = $('#drawing');
  canvas.tabIndex = 0;
  canvas.addEventListener('keydown', (e) => {
    const side = current();
    if (!side.src) return;
    const d = e.shiftKey ? 1 : 0.2;
    const moves = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    if (!moves[e.key]) return;
    e.preventDefault();
    side.place.x += moves[e.key][0];
    side.place.y += moves[e.key][1];
    drawing.draw();
    rebuild(state.active, true);
  });

  $('#partsBody').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-stl]');
    if (!b) return;
    const i = Number(b.dataset.stl);
    const files = await pipeline.files([i], 0);
    const f = files.find((x) => x.kind === 'panel');
    if (f) download(f.data, `light-cube_${fileName(i, state.sides[i].key, f.style, 'panel')}`, 'model/stl');
  });
  $('#downloadAll').addEventListener('click', downloadAll);
}

async function downloadAll() {
  const btn = $('#downloadAll');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Preparing files…';
  try {
    const sheetT = $('#optSheets').checked ? PANEL.sheet.t : 0;
    const files = await pipeline.files(state.sides.map((_, i) => i), sheetT);
    const zip = await zipAll(state.sides, files, { sheetT, lids: $('#optLids').checked });
    download(zip, 'openUC2-light-cube.zip', 'application/zip');
  } catch (err) {
    $('#zipNote').textContent = `Something went wrong: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}

// ------------------------------------------------------------------ start
function buildSides() {
  const tpl = $('#sideTemplate');
  $('#sides').replaceChildren(...state.sides.map((side, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    $('.side-num', li).textContent = `Side ${i + 1}`;
    $('.side-name', li).textContent = side.name;
    $('.side-look', li).textContent = LOOKS[side.opts.style].name;
    $('.side-btn', li).addEventListener('click', () => select(i));
    return li;
  }));
}

function buildPresets() {
  $('#presets').replaceChildren(...state.presets.map((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.dataset.preset = p.id;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<img src="assets/presets/${p.id}.svg" alt="" loading="lazy" width="96" height="96"><span>${p.title}</span>`;
    b.addEventListener('click', async () => {
      await choosePreset(current(), p.id);
      syncControls();
      rebuild(state.active);
    });
    return b;
  }));
}

async function start() {
  drawing = new Drawing($('#drawing'), { onPlace: (final) => { $('#zoom').value = zoomValue(current()); rebuild(state.active, !final); } });
  viewer = new Viewer($('#viewer'), { onPick: (i) => select(i, false) });
  pipeline = new Pipeline({ onBuilt, onError, onBusy: (b) => { $('#busy').hidden = !b; } });
  const res = await fetch('assets/presets/presets.json');
  state.presets = await res.json();
  buildSides();
  buildPresets();
  wire();
  viewer.load('assets/models/light-cube.glb').catch((err) => setStatus(`The cube model could not be loaded: ${err.message}`, true));
  await document.fonts.load('700 24px Objectivity').catch(() => {});
  await Promise.all(state.sides.map((side, i) => choosePreset(side, START[i])));
  select(0, false);
  renderTable();
  state.sides.forEach((_, i) => rebuild(i));
}

start().catch((err) => setStatus(`Could not start: ${err.message}`, true));
window.lightcube = { state, select: (i) => select(i), rebuild: (i) => rebuild(i) };   // for tests and the console
console.info(`openUC2 light cube designer · field ${FIELD_PX} px over ${PANEL.window} mm`);
