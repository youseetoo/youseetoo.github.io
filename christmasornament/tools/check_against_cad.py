"""Compare generated cut-out panels (print frame) with the CAD panels: symmetric difference volume.

The CAD panel is moved into the print frame (outer face on z = 0, seen-from-outside design
mirrored in x) with the same face orientation the presets use; a proper rotation (det +1) proves
the printed panel is the CAD part and not its mirror image.

    uv run --with manifold3d --with trimesh --with numpy --with scipy --with networkx \
        python check_against_cad.py CAD_DIR GENERATED_STL_DIR
"""
import json
import sys
from pathlib import Path

import manifold3d as mf
import numpy as np
import trimesh

PANELS = {
    "jena-skyline-1": "PRT - 2181 - Skyline-jena 1-5mm",
    "jena-skyline-2": "PRT - 2181 - Skyline-jena 3-5mm",
    "openuc2-frame": "PRT - 2181 - Framesiluette",
    "smartphone-microscope": "PRT - 2181 - smartphonemicroscope siluette",
}


def welded(v, t):
    for digits in (4, 3, 2):
        m = trimesh.Trimesh(v, t, process=True)
        m.merge_vertices(digits_vertex=digits)
        if m.is_watertight:
            break
    return m


def man(m):
    return mf.Manifold(mf.Mesh(vert_properties=np.asarray(m.vertices, np.float32),
                               tri_verts=np.asarray(m.faces, np.uint32)))


def main():
    cad, gen = Path(sys.argv[1]), Path(sys.argv[2])
    rows = json.loads((cad / "assembly.json").read_text(encoding="utf-8"))["occurrences"]
    for pid, part in PANELS.items():
        row = next(r for r in rows if Path(r["file"]).stem == part)
        R = np.asarray(row["matrix_mm"])[:3, :3]
        nrm, up = R[:, 1], np.array([0.0, 0.0, 1.0])
        right = np.cross(up, nrm)
        a, b = R[:, 0] @ right, R[:, 2] @ right
        c, d = R[:, 0] @ up, R[:, 2] @ up
        T = np.eye(4)
        T[:3, :3] = [[-a, 0, -b], [c, 0, d], [0, -1, 0]]
        T[2, 3] = 24.78
        det = np.linalg.det(T[:3, :3])
        d_ = np.load(cad / f"{part}.npz")
        cm = welded(d_["v"].astype(float), d_["t"].astype(np.int64))
        cm.apply_transform(T)
        g = trimesh.load(gen / f"{pid}_cutout.stl", process=True)
        g.merge_vertices()
        A, B = man(cm), man(g)
        only_cad = (A - B).volume()
        only_gen = (B - A).volume()
        print(f"{pid:22s} det {det:+.0f}  CAD {A.volume():7.1f}  generated {B.volume():7.1f}  "
              f"only in CAD {only_cad:6.1f}  only in generated {only_gen:6.1f} mm3  "
              f"({100 * (only_cad + only_gen) / A.volume():.2f} % of CAD)")


if __name__ == "__main__":
    main()
