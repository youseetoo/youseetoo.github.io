// Floating parts of a cut-out: material that is not connected to the frame would fall out of
// the printed panel. They are either removed, kept (to be glued onto the diffuser) or tied to
// the nearest connected material with a bridge.

/** Uniform grid of segments for nearest-point queries. */
class SegmentGrid {
  constructor(cell = 1.0) {
    this.cell = cell;
    this.cells = new Map();
    this.segs = [];
  }

  key(ix, iy) { return ix * 73856093 ^ iy * 19349663; }

  addPolygons(polys) {
    for (const poly of polys) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const id = this.segs.push([a[0], a[1], b[0], b[1]]) - 1;
        const x0 = Math.floor(Math.min(a[0], b[0]) / this.cell), x1 = Math.floor(Math.max(a[0], b[0]) / this.cell);
        const y0 = Math.floor(Math.min(a[1], b[1]) / this.cell), y1 = Math.floor(Math.max(a[1], b[1]) / this.cell);
        for (let ix = x0; ix <= x1; ix++) {
          for (let iy = y0; iy <= y1; iy++) {
            const k = this.key(ix, iy);
            let list = this.cells.get(k);
            if (!list) this.cells.set(k, (list = []));
            list.push(id);
          }
        }
      }
    }
  }

  /** Closest point on any stored segment to (x, y), searching rings up to maxRings cells. */
  nearest(x, y, maxRings = 64) {
    const cx = Math.floor(x / this.cell), cy = Math.floor(y / this.cell);
    let best = { d2: Infinity, qx: 0, qy: 0 };
    for (let r = 0; r <= maxRings; r++) {
      for (let ix = cx - r; ix <= cx + r; ix++) {
        for (let iy = cy - r; iy <= cy + r; iy++) {
          if (Math.max(Math.abs(ix - cx), Math.abs(iy - cy)) !== r) continue;
          const list = this.cells.get(this.key(ix, iy));
          if (!list) continue;
          for (const id of list) {
            const [ax, ay, bx, by] = this.segs[id];
            const dx = bx - ax, dy = by - ay;
            const l2 = dx * dx + dy * dy;
            let s = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
            s = s < 0 ? 0 : s > 1 ? 1 : s;
            const qx = ax + s * dx, qy = ay + s * dy;
            const d2 = (qx - x) ** 2 + (qy - y) ** 2;
            if (d2 < best.d2) best = { d2, qx, qy };
          }
        }
      }
      if (best.d2 <= (r * this.cell) ** 2) break;    // nothing closer can be further out
    }
    return best;
  }
}

/** Points along a polygon, at least every `step` mm, so vertex queries approximate edges. */
function densify(poly, step) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let s = 0; s < n; s++) out.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
  }
  return out;
}

/**
 * Split the material (a CrossSection that includes the frame around the window) into the
 * part connected to the frame and the floating islands. Returns CrossSections the caller owns.
 */
export function splitIslands(solid, frameReach) {
  const parts = solid.decompose();
  let attached = null;
  const islands = [];
  for (const p of parts) {
    const b = p.bounds();
    const touchesFrame = b.max[0] > frameReach || b.min[0] < -frameReach || b.max[1] > frameReach || b.min[1] < -frameReach;
    if (touchesFrame && !attached) attached = p;
    else if (touchesFrame) { const u = attached.add(p); attached.delete(); p.delete(); attached = u; }
    else islands.push(p);
  }
  return { attached, islands };
}

function closest(grid, pts) {
  let best = { d2: Infinity, qx: 0, qy: 0, px: 0, py: 0 };
  for (const [x, y] of pts) {
    const q = grid.nearest(x, y);
    if (q.d2 < best.d2) best = { ...q, px: x, py: y };
  }
  return best;
}

function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

/** Closest link from pts to a small set of segments, brute force. */
function closestToSegments(segs, pts) {
  let best = { d2: Infinity, qx: 0, qy: 0, px: 0, py: 0 };
  for (const [x, y] of pts) {
    for (const [ax, ay, bx, by] of segs) {
      const dx = bx - ax, dy = by - ay;
      const l2 = dx * dx + dy * dy;
      let s = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
      s = s < 0 ? 0 : s > 1 ? 1 : s;
      const qx = ax + s * dx, qy = ay + s * dy;
      const d2 = (qx - x) ** 2 + (qy - y) ** 2;
      if (d2 < best.d2) best = { d2, qx, qy, px: x, py: y };
    }
  }
  return best;
}

function segmentsOf(polys) {
  const segs = [];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      segs.push([a[0], a[1], b[0], b[1]]);
    }
  }
  return segs;
}

/**
 * Tie every island to the connected material with a bridge of the given width, shortest link
 * first, so a bridged island can anchor the next one. Consumes (deletes) the islands.
 * Returns { solid (owned by the caller), bridges: [[x0, y0, x1, y1], ...] }.
 */
export function bridgeIslands(M, attached, islands, width) {
  const grid = new SegmentGrid(1.0);
  grid.addPolygons(attached.toPolygons());
  const pending = islands.map((cs) => {
    const pts = cs.toPolygons().flatMap((poly) => densify(poly, 0.2));
    return { cs, pts, box: bbox(pts), best: closest(grid, pts) };
  });
  const bridges = [];
  const pieces = [];
  const r = width / 2;
  while (pending.length) {
    let bi = 0;
    for (let i = 1; i < pending.length; i++) if (pending[i].best.d2 < pending[bi].best.d2) bi = i;
    const { cs, best } = pending.splice(bi, 1)[0];
    if (!Number.isFinite(best.d2)) { cs.delete(); continue; }
    const len = Math.sqrt(best.d2) || 1e-6;
    const dx = (best.px - best.qx) / len, dy = (best.py - best.qy) / len;
    const p = [best.px + dx * r * 0.6, best.py + dy * r * 0.6];      // reach into the island
    const q = [best.qx - dx * r * 0.6, best.qy - dy * r * 0.6];      // and into the material
    const c1 = M.CrossSection.circle(r, 24).translate(p);
    const c2 = M.CrossSection.circle(r, 24).translate(q);
    const bridge = M.CrossSection.hull([c1, c2]);
    c1.delete(); c2.delete();
    pieces.push(bridge, cs);
    bridges.push([best.qx, best.qy, best.px, best.py]);
    const freshPolys = [...cs.toPolygons(), ...bridge.toPolygons()];   // only new geometry can
    const fresh = segmentsOf(freshPolys);                               // shorten other links
    const fb = bbox(freshPolys.flat());
    for (const it of pending) {
      const gx = Math.max(0, fb[0] - it.box[2], it.box[0] - fb[2]);
      const gy = Math.max(0, fb[1] - it.box[3], it.box[1] - fb[3]);
      if (gx * gx + gy * gy >= it.best.d2) continue;
      const b = closestToSegments(fresh, it.pts);
      if (b.d2 < it.best.d2) it.best = b;
    }
  }
  const solid = M.CrossSection.union([attached, ...pieces]);
  for (const p of pieces) p.delete();
  return { solid, bridges };
}
