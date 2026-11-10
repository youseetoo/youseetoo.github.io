// Geometry worker: builds the side panels with Manifold (WASM) off the main thread.
import Module from '../vendor/manifold/manifold.js';
import { buildFace, renderMesh } from './geometry/build.js';
import { manifoldToSTL } from './geometry/stl.js';
import { buildBlank, buildOpenBlank, buildSheet } from './geometry/template.js';

let M;
let blanks;
const panels = new Map();            // side index -> { panel, style }

const ready = (async () => {
  M = await Module();
  M.setup();
  const closed = buildBlank(M);
  blanks = { closed, open: buildOpenBlank(M, closed) };
})();

function build({ id, side, field, w, h, options }) {
  const t0 = performance.now();
  const res = buildFace(M, blanks, field, w, h, options);
  const old = panels.get(side);
  if (old) old.panel.delete();
  panels.set(side, { panel: res.panel, style: options.style });
  const mesh = renderMesh(res.panel);
  const stats = { ...res.stats, volume: res.panel.volume(), tris: res.panel.numTri(), ms: performance.now() - t0 };
  const transfer = [mesh.positions.buffer, mesh.normals.buffer, mesh.indices.buffer];
  if (res.preview.T) transfer.push(res.preview.T.buffer);
  self.postMessage({ type: 'built', id, side, style: options.style, mesh, preview: res.preview, stats }, transfer);
}

function stl({ id, sides, sheet }) {
  const files = [];
  for (const side of sides) {
    const p = panels.get(side);
    if (!p) continue;
    files.push({ side, kind: 'panel', style: p.style, data: manifoldToSTL(p.panel, `openUC2 light cube side ${side + 1}`) });
    if (sheet && p.style === 'cutout') {
      const s = buildSheet(M, sheet);
      files.push({ side, kind: 'sheet', style: p.style, data: manifoldToSTL(s, 'openUC2 light cube diffuser sheet') });
      s.delete();
    }
  }
  self.postMessage({ type: 'stl', id, files }, files.map((f) => f.data));
}

self.onmessage = async ({ data }) => {
  try {
    await ready;
    if (data.type === 'build') build(data);
    else if (data.type === 'stl') stl(data);
  } catch (err) {
    self.postMessage({ type: 'error', kind: data.type, id: data.id, side: data.side, message: String(err?.message ?? err) });
  }
};
