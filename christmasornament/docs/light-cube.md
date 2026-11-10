# Light cube designer - design note

## The ask (2026-11-10)

> a little marketing / christmas design tool for our cubes, where people can design a little
> tealight that can be placed inside the openuc2 cubes and customize it to their likings by
> uploading an image and then swapping the faces [...] place it in the template layout and
> convert it into binary or perhaps even lithophane if possible. The website should be static
> and therefore use cadquery with javascript bindings. The website must not look like ai slop
> and use our design scheme, we will upload it to youseetoo.github.io/christmasornament

Template: `ASS - 2089 - CUBJENSKYLNEWEIMAR - V04 - A.iam` (pack-and-go of CAD-new, 2026-11-10).

## What was built

A static page (no build step) with a 3D view of the cube, a 2D side editor and STL export for the
four sides, the diffuser sheets and the tealight lid set. Three looks: cut-out (binary, through),
shadow (binary, two thicknesses in white) and lithophane (grey values). Presets: the four CAD
designs (two Jena skyline halves, openUC2 FRAME, smartphone microscope) and three Christmas
motifs (snowflake, fir tree, starry night). Text can be added per side (Objectivity Bold).

## Decisions

| decision | reason |
|---|---|
| Manifold (WASM) instead of CadQuery in the browser | CadQuery has no browser runtime (OCP.wasm targets build123d via Pyodide, tens of MB); OpenCascade WASM builds (replicad, occt-wasm) are 10-17 MB, slow on image outlines and cannot do lithophanes. Manifold: 540 kB, 30-150 ms per side, always manifold output |
| Inventor stays the source of truth | the template dimensions were measured from the PRT - 2181 parts; `tools/` re-exports and re-checks them |
| Panel rebuilt parametrically, not copied as a mesh | one parameter table (`js/geometry/template.js`) drives all styles; checked against the CAD (below) |
| Print orientation: outer face on the bed | flat face, no supports; lithophane relief faces the light |
| Cut-out floating parts default to bridges | the diffuser is a loose sheet, islands would fall out |
| Relief booleans never share a face | shared faces leave zero-area slivers that collapse in float32 STL (found by the audit test) |
| Top lid: event text filled, "openUC2" kept | the stored model state carries "STS Weimar 2026"; Apprentice cannot switch model states and the live session was not touched |
| Brand: Objectivity (free alternative named in the guidelines, OFL), the five colours, full-colour logo on light | Stolzl is licensed; openuc2.com serves the same Objectivity files |

## Measured (PRT - 2181 panels, part frame, outer face at y = 24.78)

- rim 35.16 square r 0.3, 0.4 deep; 45 deg chamfer to the 33.96 wall (r 0.5) by 1.0 depth
- depth 4.4; front plate 1.4; pocket 31.2 square r 0.5 from 1.4 to 4.4
- design window of the originals 28.8 (border 1.2), smartphone design open to the 31.2 pocket
- snap bumps on all four walls: 0.12 proud, 0.52 flat + 0.12 at 45 deg, 23.30 long at the tip,
  24.2 at the wall (15 deg ends)
- white sheet 30.8 square r 0.5, 0.2 thick, in the pocket against the plate
- Skyline-jena 1-5mm: pocket wall at 14.88 instead of 15.6 on one side (0.72 x 31.2 x 3.0 = 67.5 mm3);
  the 30.8 sheet cannot lie flat in that part. The generator uses the 31.2 pocket.
- tealight ring (1057): 37.8 inside, 40.2 outside, 7.5 high; bottom lid (1056) tube 30.4 / 32.7
- top lid engraving 0.7 deep

## Checks (2026-11-10)

- `npm test`: blank envelope 35.16 x 35.16 x 4.4 and volume (CAD + open area x 1.4, within 4 mm3);
  the four CAD designs rebuilt as cut-outs match the CAD volumes within 1 %; shadow and
  lithophane one body, inside the envelope; floating parts bridged / removed / kept; STL meshes
  closed after float32 rounding for all looks, with and without border.
- `tools/check_against_cad.py`: symmetric difference generated vs CAD 0.11-0.50 % of the panel
  volume (Skyline 1-5mm: plus the 67.4 mm3 pocket difference above); all transforms det +1, so
  the printed panels are the CAD parts and not mirror images.
- Headless Chrome: four sides build in about 2 s (software WebGL); upload, auto lithophane for
  photos, text, drag / wheel / pinch placement, ZIP download (10 files, every STL watertight).

## Open points

1. Lid text: the lid could take a custom line next to "openUC2" (same pipeline as the side text).
2. A German version of the page.
3. Licence for the repository and whether the lid STLs may be public (the preview GLB already
   contains the cube, panels and lids).
4. Print one cut-out, one shadow and one lithophane side to confirm the defaults (0.6 / 3.0 mm,
   0.6 mm smallest detail, 0.8 mm bridges) on a real printer.
