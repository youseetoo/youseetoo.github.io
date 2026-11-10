"""Read the light-cube assembly and its parts from disk through Inventor Apprentice.

Writes one .npz per part (positions mm, normals, triangle indices; part coordinates) and
assembly.json (occurrence -> part file, model state, 4x4 transform in mm). Inventor's own
session is not touched. Run with the pyinventor env:

    python export_from_inventor.py "<...>/ASS - 2089 - CUBJENSKYLNEWEIMAR - V04 - A.iam" OUTDIR
"""
import json
import sys
from pathlib import Path

import numpy as np
import win32com.client

TOL_CM = 0.0008          # chordal tolerance for the facets (8 um)


def facets(body):
    _vc, _fc, coords, normals, idx = body.CalculateFacets(TOL_CM)
    v = np.asarray(coords, np.float64).reshape(-1, 3) * 10.0
    n = np.asarray(normals, np.float64).reshape(-1, 3)
    t = np.asarray(idx, np.int64).reshape(-1, 3)
    return v, n, t - t.min()


def export_part(appr, path: Path, out: Path, state: str = ""):
    target = str(path) + (f"<{state}>" if state else "")
    try:
        doc = appr.Open(target)
    except Exception as exc:                       # the state suffix is not always accepted
        print(f"  open {target!r} failed ({exc}); reading the stored state")
        doc = appr.Open(str(path))
    try:
        bodies = doc.ComponentDefinition.SurfaceBodies
        vs, ns, ts, off = [], [], [], 0
        for i in range(1, bodies.Count + 1):
            v, n, t = facets(bodies.Item(i))
            vs.append(v); ns.append(n); ts.append(t + off); off += len(v)
        v, n, t = np.vstack(vs), np.vstack(ns), np.vstack(ts)
        name = path.stem + (f" [{state}]" if state else "")
        np.savez_compressed(out / f"{name}.npz", v=v.astype(np.float32), n=n.astype(np.float32), t=t.astype(np.uint32))
        print(f"  {name}: {len(v)} verts, {len(t)} tris, box {v.min(0).round(2)} .. {v.max(0).round(2)}")
        return name
    finally:
        doc.Close()


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    asm_path, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    out.mkdir(parents=True, exist_ok=True)
    appr = win32com.client.Dispatch("Inventor.ApprenticeServer")
    asm = appr.Open(str(asm_path))
    rows, parts = [], {}
    try:
        def walk(occs, parent):
            for o in occs:
                full = o.ReferencedDocumentDescriptor.FullDocumentName
                file, _, state = full.partition("<")
                m = o.Transformation
                mat = [[m.Cell(i, j) * (10.0 if j == 4 and i < 4 else 1.0) for j in range(1, 5)] for i in range(1, 5)]
                sub = o.SubOccurrences
                if sub is not None and sub.Count:
                    walk(sub, o.Name)
                    continue
                rows.append({"name": o.Name, "parent": parent, "file": file, "state": state.rstrip(">"),
                             "matrix_mm": mat, "suppressed": bool(o.Suppressed)})
                parts[(file, state.rstrip(">"))] = None
        walk(asm.ComponentDefinition.Occurrences, "")
    finally:
        asm.Close()
    for (file, state) in list(parts):
        print(Path(file).name, state or "")
        parts[(file, state)] = export_part(appr, Path(file), out, state)
    # the plain top lid, without the event text, for the Christmas version
    top = next(f for (f, _s) in parts if "1058" in f)
    print("plain top lid:")
    plain = export_part(appr, Path(top), out, "[Primary]")
    for r in rows:
        r["mesh"] = parts[(r["file"], r["state"])]
    (out / "assembly.json").write_text(json.dumps({"assembly": asm_path.name, "occurrences": rows,
                                                    "plain_top_lid": plain}, indent=1), encoding="utf-8")
    print("wrote", out / "assembly.json")


if __name__ == "__main__":
    main()
