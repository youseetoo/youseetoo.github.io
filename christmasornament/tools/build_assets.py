"""Build the website assets from the Inventor export (export_from_inventor.py).

- assets/models/light-cube.glb   preview scene: cube halves, lids, tealight cup (CAD mm, z up)
- assets/presets/*.svg           face designs: the four CAD panels (cut at mid plate, seen from
                                 outside) and procedural Christmas motifs; black = material
- assets/parts/*.stl             lid set in print orientation (event text filled, openUC2 kept)

    uv run --with manifold3d --with trimesh --with shapely --with numpy --with scipy --with networkx \
        python build_assets.py CAD_DIR SITE_DIR
"""
import json
import math
import struct
import sys
from pathlib import Path

import manifold3d as mf
import numpy as np
import trimesh
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.ops import unary_union

WIN = 15.6                     # half size of the design window (pocket opening), mm
PLATE_MID_Y = 24.78 - 0.7      # mid plane of the 1.4 mm front plate in panel part coordinates

PANELS = {                     # preset id: (part name, title)
    "jena-skyline-1": ("PRT - 2181 - Skyline-jena 1-5mm", "Jena skyline I"),
    "jena-skyline-2": ("PRT - 2181 - Skyline-jena 3-5mm", "Jena skyline II"),
    "openuc2-frame": ("PRT - 2181 - Framesiluette", "openUC2 FRAME"),
    "smartphone-microscope": ("PRT - 2181 - smartphonemicroscope siluette", "Smartphone microscope"),
}


def load(cad, name):
    d = np.load(cad / f"{name}.npz")
    return d["v"].astype(np.float64), d["n"].astype(np.float64), d["t"].astype(np.int64)


def welded(v, t):
    for digits in (4, 3, 2):                          # Inventor facets leave sub-micron seams
        m = trimesh.Trimesh(v, t, process=True)
        m.merge_vertices(digits_vertex=digits)
        if m.is_watertight:
            break
    return m


def to_manifold(m):
    mesh = mf.Mesh(vert_properties=np.asarray(m.vertices, np.float32), tri_verts=np.asarray(m.faces, np.uint32))
    return mf.Manifold(mesh)


def from_manifold(man):
    mesh = man.to_mesh()
    return trimesh.Trimesh(np.asarray(mesh.vert_properties)[:, :3], np.asarray(mesh.tri_verts), process=True)


def slab(x0, x1, y0, y1, z0, z1):
    return mf.Manifold.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0])


# --------------------------------------------------------------------------- lids
def christmas_top_lid(cad):
    """Top lid with the event engraving filled: 'openUC2' stays on top and on the +-y sides."""
    v, _n, t = load(cad, "PRT - 1058 - CUBLIDTEALIGHT TOP [STS Weimar 2026]")
    lid = to_manifold(welded(v, t))
    depth = 0.8                                      # engraving is 0.7 deep
    fill = [slab(-22.0, 22.0, -20.0, 2.0, 33.6 - depth, 33.6)]           # 'STS 2026 / Weimar' on top
    for sx in (-1, 1):                                                   # 'STS Weimar 2026' on +-x
        x0, x1 = (24.9 - depth, 24.9) if sx > 0 else (-24.9, -24.9 + depth)
        fill.append(slab(x0, x1, -22.5, 22.5, 25.6, 33.0))
    out = lid
    for f in fill:
        out = out + f
    return from_manifold(out)


def crease_mesh(m, angle_deg=28.0):
    """Split vertices along sharp edges so smooth normals keep the CAD edges crisp."""
    s = m.smooth_shaded if angle_deg is None else trimesh.graph.smooth_shade(m, angle=math.radians(angle_deg))
    return np.asarray(s.vertices), np.asarray(s.vertex_normals), np.asarray(s.faces)


# --------------------------------------------------------------------------- GLB
def write_glb(path, meshes, nodes):
    """meshes: {name: (v, n, t, rgba)}; nodes: [(node name, mesh name, 4x4 matrix or None)]."""
    views, accessors, gl_meshes, materials, chunks, index = [], [], [], [], [], {}
    offset = 0

    def view(arr, target):
        nonlocal offset
        b = arr.tobytes()
        pad = (-len(b)) % 4
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(b), "target": target})
        chunks.append(b + b"\0" * pad)
        offset += len(b) + pad
        return len(views) - 1

    for name, (v, n, t, rgba) in meshes.items():
        v = v.astype(np.float32)
        n = n.astype(np.float32)
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        a = len(accessors)
        accessors += [
            {"bufferView": view(v, 34962), "componentType": 5126, "count": len(v), "type": "VEC3",
             "min": v.min(0).tolist(), "max": v.max(0).tolist()},
            {"bufferView": view(n, 34962), "componentType": 5126, "count": len(n), "type": "VEC3"},
            {"bufferView": view(t.astype(np.uint32).ravel(), 34963), "componentType": 5125, "count": int(t.size),
             "type": "SCALAR"},
        ]
        materials.append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": rgba, "metallicFactor": 0.0,
                                                                  "roughnessFactor": 0.75}})
        gl_meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": a, "NORMAL": a + 1},
                                                        "indices": a + 2, "material": len(materials) - 1}]})
        index[name] = len(gl_meshes) - 1
    gl_nodes = []
    for node_name, mesh_name, mat in nodes:
        nd = {"name": node_name, "mesh": index[mesh_name]}
        if mat is not None:
            nd["matrix"] = np.asarray(mat, np.float64).T.ravel().tolist()     # column major
        gl_nodes.append(nd)
    gltf = {"asset": {"version": "2.0", "generator": "openUC2 light cube build_assets.py"}, "scene": 0,
            "scenes": [{"nodes": list(range(len(gl_nodes)))}], "nodes": gl_nodes, "meshes": gl_meshes,
            "materials": materials, "accessors": accessors, "bufferViews": views,
            "buffers": [{"byteLength": offset}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((-len(js)) % 4)
    bin_ = b"".join(chunks)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(bin_), 0x004E4942) + bin_)


def write_stl(path, m):
    tri = np.asarray(m.vertices)[np.asarray(m.faces)]
    nrm = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-12)
    rec = np.zeros(len(tri), dtype=[("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
    rec["n"], rec["v"] = nrm, tri
    with open(path, "wb") as f:
        f.write(b"openUC2 light cube".ljust(80, b" ") + struct.pack("<I", len(tri)) + rec.tobytes())


# --------------------------------------------------------------------------- presets
def svg_doc(body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-WIN} {-WIN} {2 * WIN} {2 * WIN}" '
            f'width="1248" height="1248"><title>{title}</title>{body}</svg>\n')


def poly_path(geom, digits=3):
    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom, "geoms", []))
    out = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            xy = np.asarray(ring.coords)[:-1]
            out.append("M" + "L".join(f"{x:.{digits}f} {-y:.{digits}f}" for x, y in xy) + "Z")
    return "".join(out)


def panel_preset(cad, part, asm_rows):
    """Material of the front plate inside the window, in face coordinates seen from outside."""
    v, _n, t = load(cad, part)
    m = welded(v, t)
    sec = m.section(plane_origin=[0, PLATE_MID_Y, 0], plane_normal=[0, 1, 0])
    loops = []
    print(f"  {part}: watertight {m.is_watertight}, {len(sec.entities)} section loops")
    for ent in sec.entities:
        p = sec.vertices[ent.points]
        if len(p) >= 4:
            loops.append(Polygon(p[:, [0, 2]]).buffer(0))
    row = next(r for r in asm_rows if Path(r["file"]).stem == part)
    M = np.asarray(row["matrix_mm"])[:3, :3]
    nrm, up = M[:, 1], np.array([0.0, 0.0, 1.0])
    right = np.cross(up, nrm)
    # part (x, z) -> face (u, v):  u = (x col_x + z col_z) . right,  v = (...) . up
    a, b = M[:, 0] @ right, M[:, 2] @ right
    c, d = M[:, 0] @ up, M[:, 2] @ up
    # even-odd assembly of the section loops (outer boundary, holes, islands)
    region = Polygon()
    for lp in sorted(loops, key=lambda g: -g.area):
        region = region.symmetric_difference(lp)
    from shapely import affinity
    region = affinity.affine_transform(region, [a, b, c, d, 0.0, 0.0])
    region = region.intersection(box(-WIN, -WIN, WIN, WIN)).simplify(0.004)
    face = "-Y" if nrm[1] < -0.5 else "+Y" if nrm[1] > 0.5 else "+X" if nrm[0] > 0.5 else "-X"
    return region, face


def snowflake():
    """White (open) six-fold snowflake on black material; arms never touch, so no islands."""
    s = []
    w = 1.15
    for k in range(6):
        ang = math.radians(90 + 60 * k)
        ca, sa = math.cos(ang), math.sin(ang)
        rot = lambda x, y: (x * ca - y * sa, x * sa + y * ca)
        segs = [((0, 0), (12.2, 0))]
        for r, L in ((4.2, 2.6), (7.1, 3.4), (9.9, 2.2)):
            for sgn in (-1, 1):
                ex = r + L * math.cos(math.radians(55))
                ey = sgn * L * math.sin(math.radians(55))
                segs.append(((r, 0), (ex, ey)))
        for (x0, y0), (x1, y1) in segs:
            X0, Y0 = rot(x0, y0)
            X1, Y1 = rot(x1, y1)
            s.append(f'<line x1="{X0:.3f}" y1="{-Y0:.3f}" x2="{X1:.3f}" y2="{-Y1:.3f}"/>')
    hexa = " ".join(f"{2.6 * math.cos(math.radians(30 + 60 * i)):.3f},{2.6 * math.sin(math.radians(30 + 60 * i)):.3f}"
                    for i in range(6))
    body = (f'<rect x="{-WIN}" y="{-WIN}" width="{2 * WIN}" height="{2 * WIN}" fill="#000"/>'
            f'<g stroke="#fff" stroke-width="{w}" stroke-linecap="round">{"".join(s)}</g>'
            f'<polygon points="{hexa}" fill="#fff"/>')
    return svg_doc(body, "Snowflake")


def star_points(cx, cy, r_out, r_in, n=5, rot=-90):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot + 180 * i / n)
        pts.append(f"{cx + r * math.cos(a):.3f},{cy + r * math.sin(a):.3f}")
    return " ".join(pts)


def fir_tree():
    """Glowing fir tree with a star on black material (all openings, nothing can fall out)."""
    tiers = [(-11.5, 11.0, -2.6), (-6.6, 8.6, 2.2), (-2.0, 6.4, 6.4), (2.2, 4.2, 9.6)]   # base y, half width, tip y
    shapes = []
    for y0, hw, tip in tiers:
        shapes.append(f'<polygon points="{-hw:.2f},{-y0:.2f} {hw:.2f},{-y0:.2f} 0,{-tip:.2f}"/>')
    shapes.append('<rect x="-1.6" y="11.5" width="3.2" height="2.6"/>')
    shapes.append(f'<polygon points="{star_points(0, -12.2, 2.3, 0.95)}"/>')
    body = (f'<rect x="{-WIN}" y="{-WIN}" width="{2 * WIN}" height="{2 * WIN}" fill="#000"/>'
            f'<g fill="#fff" stroke="#fff" stroke-width="0.6" stroke-linejoin="round">{"".join(shapes)}</g>')
    return svg_doc(body, "Fir tree")


def starry_night():
    """Black night sky with stars and a crescent moon cut out (openings only)."""
    rng = np.random.default_rng(24)
    shapes = ['<path d="M7.2 -10.5 a5.2 5.2 0 1 0 4.3 8.6 a4.1 4.1 0 1 1 -4.3 -8.6Z"/>']
    placed = [(8.5, -6.6, 6.0)]
    big = [(-8.5, -9.0, 2.2), (-2.0, 2.0, 1.8), (9.5, 7.5, 2.0), (-10.0, 8.5, 1.6), (1.5, -11.0, 1.3),
           (-5.0, -1.5, 1.2), (4.0, 10.5, 1.3), (-12.0, -2.0, 1.0), (12.0, -1.0, 1.0), (3.5, -4.5, 1.0)]
    for cx, cy, r in big:
        shapes.append(f'<polygon points="{star_points(cx, cy, r, r * 0.42, rot=-90 + rng.uniform(-12, 12))}"/>')
        placed.append((cx, cy, r))
    for _ in range(400):
        if len(placed) > 30:
            break
        cx, cy = rng.uniform(-13.5, 13.5, 2)
        r = rng.uniform(0.45, 0.6)
        if all(math.hypot(cx - x, cy - y) > r + rr + 1.2 for x, y, rr in placed):
            shapes.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/>')
            placed.append((cx, cy, r))
    body = (f'<rect x="{-WIN}" y="{-WIN}" width="{2 * WIN}" height="{2 * WIN}" fill="#000"/>'
            f'<g fill="#fff">{"".join(shapes)}</g>')
    return svg_doc(body, "Starry night")


def main():
    cad, site = Path(sys.argv[1]), Path(sys.argv[2])
    asm = json.loads((cad / "assembly.json").read_text(encoding="utf-8"))
    rows = asm["occurrences"]

    # presets from the CAD panels
    (site / "assets/presets").mkdir(parents=True, exist_ok=True)
    catalogue = []
    for pid, (part, title) in PANELS.items():
        region, face = panel_preset(cad, part, rows)
        body = (f'<rect x="{-WIN}" y="{-WIN}" width="{2 * WIN}" height="{2 * WIN}" fill="#fff"/>'
                f'<path fill="#000" fill-rule="evenodd" d="{poly_path(region)}"/>')
        (site / f"assets/presets/{pid}.svg").write_text(svg_doc(body, title), encoding="utf-8")
        open_area = 4 * WIN * WIN - region.area
        catalogue.append({"id": pid, "title": title, "source": "cad", "face": face})
        print(f"preset {pid:24s} face {face}  material {region.area:7.1f} mm2  open {open_area:7.1f} mm2")
    for pid, title, fn in (("snowflake", "Snowflake", snowflake), ("fir-tree", "Fir tree", fir_tree),
                           ("starry-night", "Starry night", starry_night)):
        (site / f"assets/presets/{pid}.svg").write_text(fn(), encoding="utf-8")
        catalogue.append({"id": pid, "title": title, "source": "motif"})
    (site / "assets/presets/presets.json").write_text(json.dumps(catalogue, indent=1), encoding="utf-8")

    # lids
    top = christmas_top_lid(cad)
    print("top lid watertight", top.is_watertight, "volume", round(top.volume, 1))
    bottom = welded(*[load(cad, "PRT - 1056 - CUBLIDTEALIGHT")[i] for i in (0, 2)])
    cup = welded(*[load(cad, "PRT - 1057 - CUBLIDTEALIGHT UPP")[i] for i in (0, 2)])

    # preview scene (assembly poses)
    mats = {Path(r["file"]).stem: r for r in rows}
    meshes, nodes = {}, []
    v, n, t = load(cad, "PRT - 1003 - CUBHLF111 - V04")
    meshes["cube-half"] = (v, n, t, [0.10, 0.11, 0.13, 1.0])
    for r in rows:
        if "CUBHLF111" in r["file"]:
            nodes.append((r["name"], "cube-half", r["matrix_mm"]))
    tv, tn, tt = crease_mesh(top)
    meshes["lid-top"] = (tv, tn, tt, [0.93, 0.93, 0.92, 1.0])
    # the assembly turns the lid by 180 deg about z; in part orientation 'openUC2' reads from the
    # front side of the preview (the lid fits either way: only the engraving is not symmetric)
    nodes.append(("lid-top", "lid-top", np.eye(4).tolist()))
    v, n, t = load(cad, "PRT - 1056 - CUBLIDTEALIGHT")
    meshes["lid-bottom"] = (v, n, t, [0.93, 0.93, 0.92, 1.0])
    nodes.append(("lid-bottom", "lid-bottom", mats["PRT - 1056 - CUBLIDTEALIGHT"]["matrix_mm"]))
    v, n, t = load(cad, "PRT - 1057 - CUBLIDTEALIGHT UPP")
    meshes["tealight-cup"] = (v, n, t, [0.93, 0.93, 0.92, 1.0])
    nodes.append(("tealight-cup", "tealight-cup", mats["PRT - 1057 - CUBLIDTEALIGHT UPP"]["matrix_mm"]))
    (site / "assets/models").mkdir(parents=True, exist_ok=True)
    write_glb(site / "assets/models/light-cube.glb", meshes, nodes)
    print("glb", (site / "assets/models/light-cube.glb").stat().st_size // 1024, "KiB")

    # lid set in print orientation
    (site / "assets/parts").mkdir(parents=True, exist_ok=True)
    top_p = top.copy()
    top_p.apply_translation([0, 0, -25.0])                                 # underside on the bed
    bottom_p = bottom.copy()
    bottom_p.apply_transform(np.diag([1.0, -1.0, -1.0, 1.0]))               # plate on the bed, tube up
    bottom_p.apply_translation([0, 0, 33.6])
    cup_p = cup.copy()
    cup_p.apply_transform(np.array([[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1.0]]))  # floor down
    for name, m in (("lid-top_openUC2", top_p), ("lid-bottom_tealight", bottom_p), ("tealight-cup", cup_p)):
        b = m.bounds
        print(f"part {name:22s} z {b[0][2]:6.2f} .. {b[1][2]:6.2f}  watertight {m.is_watertight}")
        write_stl(site / f"assets/parts/{name}.stl", m)


if __name__ == "__main__":
    main()
