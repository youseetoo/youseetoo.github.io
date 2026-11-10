// Geometry checks: the parametric blank against the CAD panels, all three styles watertight and
// inside the panel envelope, floating parts bridged. Run: npm test
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildFace } from '../js/geometry/build.js';
import { manifoldToSTL } from '../js/geometry/stl.js';
import { buildBlank, buildOpenBlank, PANEL } from '../js/geometry/template.js';
import { manifold, rasterise, ROOT, svgPolygons } from './helpers.mjs';

const OUT = process.env.LIGHTCUBE_TEST_OUT;          // optional: write STLs for the CAD cross-check
const W = 500;                                        // 16 px/mm

// CAD volumes of the PRT - 2181 panels (Apprentice, 2026-11-10). Skyline-jena 1-5mm has its
// pocket wall at 14.88 instead of 15.6 on one side (0.72 x 31.2 x 3.0 mm = 67.5 mm3 more
// material); the generator uses the 31.2 mm pocket of the other three panels.
const CAD = {
  'jena-skyline-1': 1641.8 - 67.5, 'jena-skyline-2': 1499.5, 'openuc2-frame': 1297.5, 'smartphone-microscope': 1652.9,
};

function close(a, b, tol, msg) {
  assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(3)} vs ${b.toFixed(3)} (tol ${tol})`);
}

test('mirror([1, 0]) flips x', async () => {
  const M = await manifold();
  const sq = M.CrossSection.square([1, 1]).translate([1, 0]).mirror([1, 0]);
  close(sq.bounds().min[0], -2, 1e-9, 'min x');
  close(sq.bounds().min[1], 0, 1e-9, 'min y');
});

test('blank matches the CAD panel envelope', async () => {
  const M = await manifold();
  const blank = buildBlank(M);
  assert.equal(blank.status(), 'NoError');
  assert.equal(blank.genus(), 0);
  const b = blank.boundingBox();
  close(b.max[0] - b.min[0], 35.16, 1e-3, 'lip x');
  close(b.max[1] - b.min[1], 35.16, 1e-3, 'lip y');
  close(b.min[2], 0, 1e-6, 'outer face z');
  close(b.max[2], PANEL.depth, 1e-6, 'inner end z');
  // Framesiluette: CAD volume + its open area (657.9 mm2, from the CAD section) x 1.4 mm plate
  close(blank.volume(), 1297.5 + 657.9 * 1.4, 4, 'blank volume');
  blank.delete();
});

test('CAD presets rebuild as cut-outs with the CAD volume', async () => {
  const M = await manifold();
  const closed = buildBlank(M);
  const open = buildOpenBlank(M, closed);
  if (OUT) mkdirSync(OUT, { recursive: true });
  for (const [id, vol] of Object.entries(CAD)) {
    const field = rasterise(svgPolygons(`assets/presets/${id}.svg`), W);
    const t0 = performance.now();
    const res = buildFace(M, { closed, open }, field, W, W, { style: 'cutout', border: 0, detail: 0, smooth: 0.03 });
    const ms = performance.now() - t0;
    assert.equal(res.panel.status(), 'NoError', id);
    close(res.panel.volume(), vol, vol * 0.01, `${id} volume`);
    console.log(`  ${id}: ${res.panel.numTri()} tris, ${ms.toFixed(0)} ms, islands ${res.stats.islands}, open ${(100 * res.stats.openFraction).toFixed(1)} %`);
    if (OUT) writeFileSync(join(OUT, `${id}_cutout.stl`), Buffer.from(manifoldToSTL(res.panel)));
    res.panel.delete();
  }
  closed.delete();
  open.delete();
});

test('shadow and lithophane panels are watertight and stay in the envelope', async () => {
  const M = await manifold();
  const closed = buildBlank(M);
  const open = buildOpenBlank(M, closed);
  const field = rasterise(svgPolygons('assets/presets/jena-skyline-1.svg'), W);
  for (const style of ['shadow', 'litho']) {
    const t0 = performance.now();
    const res = buildFace(M, { closed, open }, field, W, W, { style, tLight: 0.6, tDark: 3.0 });
    const ms = performance.now() - t0;
    assert.equal(res.panel.status(), 'NoError', style);
    assert.equal(res.panel.decompose().length, 1, `${style} is one body`);
    const b = res.panel.boundingBox();
    close(b.min[2], 0, 1e-6, `${style} outer face`);
    assert.ok(b.max[2] <= PANEL.depth + 1e-6, `${style} inner end`);
    console.log(`  ${style}: ${res.panel.numTri()} tris, ${ms.toFixed(0)} ms, volume ${res.panel.volume().toFixed(0)} mm3`);
    if (OUT) writeFileSync(join(OUT, `jena-skyline-1_${style}.stl`), Buffer.from(manifoldToSTL(res.panel)));
    res.panel.delete();
  }
  closed.delete();
  open.delete();
});

/** Degenerate triangles and edges not used exactly twice, after rounding to float32 like an STL. */
function stlAudit(man) {
  const { vertProperties: vp, triVerts: tv, numProp: np } = man.getMesh();
  const ids = new Map();
  const id = (i) => {
    const key = `${Math.fround(vp[i * np])},${Math.fround(vp[i * np + 1])},${Math.fround(vp[i * np + 2])}`;
    if (!ids.has(key)) ids.set(key, ids.size);
    return ids.get(key);
  };
  let degenerate = 0;
  const edges = new Map();
  for (let t = 0; t < tv.length; t += 3) {
    const v = [id(tv[t]), id(tv[t + 1]), id(tv[t + 2])];
    if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) { degenerate++; continue; }
    for (let e = 0; e < 3; e++) {
      const a = v[e], b = v[(e + 1) % 3];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  let open = 0;
  for (const n of edges.values()) if (n !== 2) open++;
  return { degenerate, open };
}

test('STL meshes stay closed after float32 rounding (designs touching the window edge)', async () => {
  const M = await manifold();
  const closed = buildBlank(M);
  const open = buildOpenBlank(M, closed);
  const field = rasterise(svgPolygons('assets/presets/smartphone-microscope.svg'), W);   // open to the edge
  for (const style of ['cutout', 'shadow', 'litho']) {
    for (const border of [0, 1.2]) {
      const res = buildFace(M, { closed, open }, field, W, W, { style, border });
      assert.deepEqual(stlAudit(res.panel), { degenerate: 0, open: 0 }, `${style}, border ${border}`);
      res.panel.delete();
    }
  }
  closed.delete();
  open.delete();
});

test('a floating dot is bridged to the frame', async () => {
  const M = await manifold();
  const closed = buildBlank(M);
  const open = buildOpenBlank(M, closed);
  const field = new Float32Array(W * W).fill(1);               // all open (white) ...
  for (let r = 0; r < W; r++) {
    for (let c = 0; c < W; c++) {
      if (Math.hypot(r - 250, c - 250) < 40) field[r * W + c] = 0;   // ... with a dark dot in the middle
    }
  }
  for (const [mode, islands, parts] of [['bridge', 1, 1], ['remove', 1, 1], ['keep', 1, 2]]) {
    const res = buildFace(M, { closed, open }, field, W, W, { style: 'cutout', islands: mode });
    assert.equal(res.stats.islands, islands, mode);
    assert.equal(res.panel.decompose().length, parts, `${mode}: bodies`);
    res.panel.delete();
  }
  closed.delete();
  open.delete();
});
