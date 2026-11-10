// Build one face panel from a grey-value field. Styles:
//   cutout  - the design is cut through the 1.4 mm front plate; dark filament + diffuser sheet
//   shadow  - two thicknesses in white filament: thin where the picture is light, thick where dark
//   litho   - lithophane: the thickness follows the grey value, white filament
// Design coordinates: u right, v up, seen from outside, origin at the window centre (mm).

import { blurField, sampler, traceDark } from './field.js';
import { bridgeIslands, splitIslands } from './islands.js';
import { CLEAR, HALF, OVERLAP, PANEL, RELIEF_FROM, roundedSquare, scope } from './template.js';

export const DEFAULTS = Object.freeze({
  style: 'cutout',
  threshold: 0.5,
  smooth: 0.06,          // mm, softens pixel steps before tracing
  lineWeight: 0,         // mm, + makes the material bolder
  detail: 0.6,           // mm, material narrower than this (and gaps under 60 %) is cleaned away
  border: PANEL.border,  // mm, solid frame inside the window
  islands: 'bridge',     // bridge | keep | remove
  bridgeWidth: 0.8,      // mm
  tLight: 0.6,           // mm, relief styles: thickness where the picture is white
  tDark: 3.0,            // mm, ... where it is black
  step: 0.15,            // mm, lithophane grid
  curve: 'natural',      // lithophane tone curve: natural (by light transmission) | linear
});

const MU = 1.1;          // 1/mm, light attenuation of white PLA used for the natural tone curve
const SEGS = 24;

/** Material of the design as a CrossSection in design mm, including the frame outside the window. */
function materialSection(M, k, field, w, h, o) {
  const mmPerPx = PANEL.window / w;
  const f = blurField(field, w, h, o.smooth / mmPerPx);
  const loops = traceDark(f, w, h, o.threshold, mmPerPx);
  const win = k(roundedSquare(M, PANEL.window, PANEL.windowR));
  const big = k(M.CrossSection.square([PANEL.window + 6, PANEL.window + 6], true));
  const outside = k(big.subtract(win));
  let mat = k(new M.CrossSection(loops, 'EvenOdd'));
  mat = k(mat.intersect(win));
  if (Math.abs(o.lineWeight) > 1e-3) mat = k(mat.offset(o.lineWeight, 'Round', 2, SEGS));
  let solid = k(M.CrossSection.union([mat, outside]));
  if (o.border > 0.01) {
    const inner = k(roundedSquare(M, PANEL.window - 2 * o.border, PANEL.windowR));
    solid = k(solid.add(k(win.subtract(inner))));
  }
  const ro = o.detail / 2, rc = o.detail * 0.3;
  if (ro > 0.01) solid = k(k(solid.offset(-ro, 'Round', 2, SEGS)).offset(ro, 'Round', 2, SEGS));
  if (rc > 0.01) solid = k(k(solid.offset(rc, 'Round', 2, SEGS)).offset(-rc, 'Round', 2, SEGS));
  solid = k(solid.simplify(0.003));
  return { solid, win };
}

/** Watertight relief over [-half, half]^2: flat face at z = z0, inner surface at z = thickness. */
export function heightfield(M, thickPrint, n, half, z0 = 0) {
  const step = (2 * half) / (n - 1);
  const ringGrid = [];
  for (let i = 0; i < n - 1; i++) ringGrid.push(i);                       // y = -half, x rising
  for (let j = 0; j < n - 1; j++) ringGrid.push(j * n + n - 1);           // x = +half, y rising
  for (let i = n - 1; i > 0; i--) ringGrid.push((n - 1) * n + i);         // y = +half, x falling
  for (let j = n - 1; j > 0; j--) ringGrid.push(j * n);                   // x = -half, y falling
  const nGrid = n * n, ring = ringGrid.length, base = nGrid, centre = nGrid + ring;
  const vp = new Float32Array((nGrid + ring + 1) * 3);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const p = (j * n + i) * 3;
      vp[p] = -half + i * step;
      vp[p + 1] = -half + j * step;
      vp[p + 2] = thickPrint[j * n + i];
    }
  }
  for (let k = 0; k < ring; k++) {
    const g = ringGrid[k] * 3, p = (base + k) * 3;
    vp[p] = vp[g]; vp[p + 1] = vp[g + 1]; vp[p + 2] = z0;
  }
  vp[centre * 3 + 2] = z0;
  const nTri = 2 * (n - 1) * (n - 1) + ring + 2 * ring;
  const tv = new Uint32Array(nTri * 3);
  let t = 0;
  const tri = (a, b, c) => { tv[t++] = a; tv[t++] = b; tv[t++] = c; };
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i;
      tri(a, a + 1, a + n + 1);
      tri(a, a + n + 1, a + n);
    }
  }
  for (let k = 0; k < ring; k++) {
    const k1 = (k + 1) % ring;
    tri(centre, base + k1, base + k);                                    // outer face, normal -z
    tri(base + k, base + k1, ringGrid[k1]);                              // side wall
    tri(base + k, ringGrid[k1], ringGrid[k]);
  }
  return new M.Manifold(new M.Mesh({ numProp: 3, vertProperties: vp, triVerts: tv }));
}

/**
 * Lithophane thickness on a design-oriented grid (row 0 = top), n x n points over the window
 * grown by OVERLAP (that ring sits inside the walls and is set to the dark thickness).
 */
function lithoThickness(field, w, h, o) {
  const mmPerPx = PANEL.window / w;
  const half = HALF + OVERLAP;
  const n = Math.max(32, Math.round((2 * half) / o.step) + 1);
  const step = (2 * half) / (n - 1);
  const f = blurField(field, w, h, Math.max(o.smooth, step / 2) / mmPerPx);
  const at = sampler(f, w, h, mmPerPx);
  const tl = o.tLight, td = Math.max(o.tDark, o.tLight + 0.2);
  const Tl = Math.exp(-MU * tl), Td = Math.exp(-MU * td);
  const edge = HALF - Math.max(o.border, 0);
  const T = new Float32Array(n * n);
  for (let r = 0; r < n; r++) {
    const v = half - r * step;
    for (let c = 0; c < n; c++) {
      const u = -half + c * step;
      let t;
      if (Math.abs(u) > edge || Math.abs(v) > edge) t = td;
      else {
        const L = at(u, v);
        t = o.curve === 'linear' ? td - (td - tl) * L : -Math.log(Td + L * (Tl - Td)) / MU;
      }
      T[r * n + c] = t;
    }
  }
  return { T, n, step, half };
}

/**
 * Build the panel. blanks = { closed, open } from template.js (not consumed).
 * Returns { panel (Manifold, caller owns), preview, stats }.
 */
export function buildFace(M, blanks, field, w, h, options) {
  const o = { ...DEFAULTS, ...options };
  return scope((k) => {
    if (o.style === 'litho') {
      const { T, n, step, half } = lithoThickness(field, w, h, o);
      const P = new Float32Array(n * n);                     // print frame: x = -u, y = v
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) P[j * n + i] = T[(n - 1 - j) * n + (n - 1 - i)];
      const relief = k(heightfield(M, P, n, half, RELIEF_FROM));
      const panel = blanks.open.add(relief);
      let sum = 0, cnt = 0;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (Math.abs(-half + c * step) > HALF || Math.abs(half - r * step) > HALF) continue;
          sum += T[r * n + c];
          cnt++;
        }
      }
      return {
        panel,
        preview: { kind: 'thickness', T, n, step, half, tLight: o.tLight, tDark: o.tDark },
        stats: { meanThickness: sum / cnt },
      };
    }

    const { solid, win } = materialSection(M, k, field, w, h, o);
    let material = solid;
    const stats = { islands: 0, bridges: 0 };
    let islandPolys = [], bridges = [];
    if (o.style === 'cutout') {
      const { attached, islands } = splitIslands(solid, HALF + 1);
      if (attached) k(attached);
      stats.islands = islands.length;
      islandPolys = islands.map((cs) => cs.toPolygons());
      if (!attached || islands.length === 0) {
        islands.forEach((cs) => cs.delete());
      } else if (o.islands === 'bridge') {
        const res = bridgeIslands(M, attached, islands, o.bridgeWidth);
        material = k(res.solid);
        bridges = res.bridges;
        stats.bridges = bridges.length;
      } else if (o.islands === 'remove') {
        islands.forEach((cs) => cs.delete());
        material = attached;
      } else {
        islands.forEach((cs) => cs.delete());
      }
    }
    const inWin = k(material.intersect(win));
    const clearWin = k(win.offset(-CLEAR, 'Round', 2, SEGS));
    const openings = k(clearWin.subtract(inWin));
    stats.openFraction = openings.area() / win.area();
    const preview = { kind: 'material', material: inWin.toPolygons(), islands: islandPolys, bridges };

    let panel;
    if (o.style === 'cutout') {
      const cutter = k(k(k(openings.mirror([1, 0])).extrude(PANEL.plate + 0.2)).translate([0, 0, -0.1]));
      panel = blanks.closed.subtract(cutter);
    } else {
      const tl = Math.min(Math.max(o.tLight, 0.4), PANEL.plate);
      const td = Math.min(Math.max(o.tDark, tl + 0.2), PANEL.depth - 0.1);
      const grown = k(win.offset(OVERLAP, 'Round', 2, SEGS));
      const edgeRing = k(grown.subtract(clearWin));       // ties dark areas into the walls
      const darkCs = k(k(inWin.add(edgeRing)).mirror([1, 0]));
      const base = k(k(grown.extrude(tl - RELIEF_FROM)).translate([0, 0, RELIEF_FROM]));
      const dark = k(k(darkCs.extrude(td - RELIEF_FROM - 0.05)).translate([0, 0, RELIEF_FROM + 0.05]));
      panel = M.Manifold.union([blanks.open, base, dark]);
      preview.tLight = tl;
      preview.tDark = td;
    }
    return { panel, preview, stats };
  });
}

/** Positions/normals/indices for display, with normals split along sharp edges. */
export function renderMesh(man, sharpDeg = 35) {
  const withN = man.calculateNormals(3, sharpDeg);
  const mesh = withN.getMesh(3);
  withN.delete();
  const np = mesh.numProp, nv = mesh.vertProperties.length / np;
  const positions = new Float32Array(nv * 3), normals = new Float32Array(nv * 3);
  for (let i = 0; i < nv; i++) {
    for (let c = 0; c < 3; c++) {
      positions[i * 3 + c] = mesh.vertProperties[i * np + c];
      normals[i * 3 + c] = mesh.vertProperties[i * np + 3 + c];
    }
  }
  return { positions, normals, indices: new Uint32Array(mesh.triVerts) };
}
