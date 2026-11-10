// Face panel of the openUC2 light cube, measured from the PRT - 2181 panels (CAD-new) and the
// ASS - 2089 assembly. All values in mm.
//
// Print frame: the outer face lies on the bed at z = 0 and the panel grows to z = depth (towards
// the inside of the cube). x/y are seen from the inside, so a design (u right, v up, seen from
// outside the cube) maps to x = -u, y = v.

export const PANEL = Object.freeze({
  lip: 35.16, lipR: 0.3, lipDepth: 0.4,      // outer rim, flush with the cube face
  wall: 33.96, wallR: 0.5, chamferTo: 1.0,    // 45 deg chamfer from the rim down to the wall
  depth: 4.4,                                 // outer face to inner end
  plate: 1.4,                                 // front plate that carries the design
  window: 31.2, windowR: 0.5,                 // pocket opening behind the plate = design area
  border: 1.2,                                // solid border of the originals (window 28.8)
  bump: Object.freeze({ proud: 0.12, flat: 0.52, ramp: 0.12, tipHalf: 11.6522, baseHalf: 12.1 }),
  sheet: Object.freeze({ size: 30.8, r: 0.5, t: 0.2 }),   // diffuser sheet in the pocket
  faceOffset: 24.78,                          // outer face to cube centre
});

export const HALF = PANEL.window / 2;

/** Run fn(keep) and delete every WASM object passed through keep() afterwards. */
export function scope(fn) {
  const objs = [];
  const keep = (o) => { objs.push(o); return o; };
  try {
    return fn(keep);
  } finally {
    for (const o of objs) {
      try { o.delete(); } catch { /* already freed */ }
    }
  }
}

/** Square of side `size` centred on the origin with corner radius r. */
export function roundedSquare(M, size, r, segs = 48) {
  const core = M.CrossSection.square([size - 2 * r, size - 2 * r], true);
  const out = core.offset(r, 'Round', 2, segs);
  core.delete();
  return out;
}

/** The snap bump on the +y side: 0.12 proud, 0.52 flat, 45 deg lead-in, 15 deg ends. */
function bump(M) {
  const { proud, flat, ramp, tipHalf, baseHalf } = PANEL.bump;
  const d1 = PANEL.depth;
  const d0 = d1 - flat;
  const dr = d0 - ramp;
  const e = 0.05;                              // reach into the wall for a clean union
  const pts = [];
  for (const s of [-1, 1]) {
    for (const z of [d1, d0]) pts.push([s * baseHalf, -e, z], [s * baseHalf, 0, z], [s * tipHalf, proud, z]);
    pts.push([s * baseHalf, -e, dr], [s * baseHalf, 0, dr]);
  }
  return M.Manifold.hull(pts);
}

/** Panel without a design: the front plate is closed over the whole window. Caller owns it. */
export function buildBlank(M) {
  const { Manifold } = M;
  const P = PANEL;
  return scope((k) => {
    const lipCs = k(roundedSquare(M, P.lip, P.lipR));
    const wallCs = k(roundedSquare(M, P.wall, P.wallR));
    const pocketCs = k(roundedSquare(M, P.window, P.windowR));
    const lip = k(lipCs.extrude(P.lipDepth));
    const lipTop = k(k(lipCs.extrude(0.001)).translate([0, 0, P.lipDepth - 0.001]));
    const wallFoot = k(k(wallCs.extrude(0.001)).translate([0, 0, P.chamferTo]));
    const chamfer = k(Manifold.hull([lipTop, wallFoot]));
    const wall = k(k(wallCs.extrude(P.depth - P.chamferTo)).translate([0, 0, P.chamferTo]));
    const pocket = k(k(pocketCs.extrude(P.depth - P.plate + 1)).translate([0, 0, P.plate]));
    const b = k(bump(M));
    const bumps = [0, 90, 180, 270].map((a) => k(k(b.translate([0, P.wall / 2, 0])).rotate([0, 0, a])));
    const solid = k(Manifold.union([lip, chamfer, wall, ...bumps]));
    return solid.subtract(pocket);
  });
}

// Booleans never get two operands that share a face (that leaves zero-area slivers, which
// collapse when the mesh is written as float32 STL):
//   relief styles keep a SKIN of the front plate over the window and start the relief inside it,
//   and the relief reaches OVERLAP into the pocket walls; cut-out openings stay CLEAR of the walls.
export const SKIN = 0.3;
export const RELIEF_FROM = 0.2;
export const OVERLAP = 0.1;
export const CLEAR = 0.02;

/** Blank with the front plate thinned to SKIN inside the window (for relief styles). Caller owns it. */
export function buildOpenBlank(M, blank) {
  return scope((k) => {
    const w = k(roundedSquare(M, PANEL.window, PANEL.windowR));
    const cut = k(k(w.extrude(PANEL.plate + 0.2 - SKIN)).translate([0, 0, SKIN]));
    return blank.subtract(cut);
  });
}

/** Diffuser sheet, flat on the bed. Caller owns it. */
export function buildSheet(M, t = PANEL.sheet.t) {
  return scope((k) => k(roundedSquare(M, PANEL.sheet.size, PANEL.sheet.r)).extrude(t));
}
