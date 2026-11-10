# openUC2 light cube designer

A static web page for the Christmas light cube: people pick a picture for each of the four sides
of an openUC2 cube (ASS - 2000), choose how the light comes through, and download print-ready
STL files. Everything runs in the browser; pictures never leave the visitor's computer.

Planned address: <https://youseetoo.github.io/christmasornament/>

## Looks

| look | geometry | print |
|---|---|---|
| Cut-out | design cut through the 1.4 mm front plate; floating parts bridged, kept or removed | dark PLA + 0.2 mm white diffuser sheet |
| Shadow | white panel, thin (0.6 mm) where the picture is light, thick (3 mm) where it is dark | white PLA |
| Lithophane | thickness follows the grey value (0.6-3 mm, light-transmission tone curve) | white PLA |

The side panel is the PRT - 2181 face insert of `ASS - 2089 - CUBJENSKYLNEWEIMAR - V04 - A`:
35.16 mm rim, 1.4 mm front plate, 31.2 mm window/pocket, 4.4 mm deep, snap bumps 0.12 mm proud.
All dimensions live in [`js/geometry/template.js`](js/geometry/template.js).

## How it works

- `js/geometry/` builds the panels with [Manifold](https://github.com/elalish/manifold) (C++
  mesh CSG compiled to WebAssembly, 540 kB). Grey-value field -> marching squares -> Manifold
  `CrossSection` (clean-up by offsets, islands, bridges) -> extrusions and booleans; lithophanes
  are a watertight height field. It runs in a module worker (`js/worker.js`).
- `js/viewer.js` shows the CAD cube (`assets/models/light-cube.glb`) with three.js; `js/drawing.js`
  is the 2D side view where the picture is placed; `js/lit.js` draws how a side looks lit.
- CadQuery itself needs Python + OCP and has no browser runtime; the OpenCascade WASM builds are
  10-17 MB and cannot make lithophanes (a height field is not B-rep material), so the browser side
  uses Manifold and the CAD side keeps Inventor as the source of truth.

## Run locally

```bash
npm install        # only for tests and for refreshing vendor/
npm run serve      # http://localhost:8642
npm test           # geometry checks (Node 20+)
```

The page needs no build step. `vendor/` holds pinned copies of three.js 0.186.0, manifold-3d 3.5.4
and fflate 0.8.3 (`npm run vendor` refreshes them from `node_modules`).

## Updating the CAD assets

1. `tools/export_from_inventor.py` (pyinventor env, reads the assembly through Inventor
   Apprentice, the running Inventor session is not touched):
   `python tools/export_from_inventor.py "<...>/ASS - 2089 - CUBJENSKYLNEWEIMAR - V04 - A.iam" <cad_dir>`
2. `tools/build_assets.py` writes the preview GLB, the preset SVGs and the lid STLs:
   `uv run --with manifold3d --with trimesh --with shapely --with numpy --with scipy --with networkx python tools/build_assets.py <cad_dir> .`
3. `tools/check_against_cad.py` compares generated cut-outs with the CAD panels
   (`LIGHTCUBE_TEST_OUT=<dir> npm test` writes the STLs it needs).

## Deploy (GitHub Pages)

Push this folder to `youseetoo/christmasornament`, then Settings -> Pages -> Deploy from a branch ->
`main` / root. All paths are relative and `.nojekyll` is in place, so the page works under
`/christmasornament/`.

## Credits and licences

three.js (MIT), Manifold (Apache 2.0), fflate (MIT) in `vendor/` with their licence files.
Objectivity by Alexander Slobzheninov, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
Logo and colours: openUC2 brand guidelines. Cube, panels and lids: openUC2 CAD library.
