// Print files: one ZIP with the sides, diffuser sheets, the lid set and a short README.
import { strToU8, zipSync } from '../vendor/fflate/fflate.js';

export const LOOKS = {
  cutout: { name: 'Cut-out', file: 'cut-out', filament: 'Dark PLA, white sheet behind', swatch: '#23272e' },
  shadow: { name: 'Shadow', file: 'shadow', filament: 'White PLA', swatch: '#f3f1ec' },
  litho: { name: 'Lithophane', file: 'lithophane', filament: 'White PLA', swatch: '#f3f1ec' },
};

export const LIDS = [
  ['lid-top_openUC2.stl', 'Top lid'],
  ['lid-bottom_tealight.stl', 'Bottom lid with tube'],
  ['tealight-cup.stl', 'Tealight ring'],
];

export function fileName(sideIndex, sideKey, style, kind) {
  const base = `${sideIndex + 1}-${sideKey}`;
  return kind === 'sheet' ? `${base}_diffuser-sheet.stl` : `${base}_${LOOKS[style].file}.stl`;
}

export function download(data, name, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function readme(sides, sheetT, lids) {
  const rows = sides.map((s, i) => {
    const look = LOOKS[s.opts.style];
    return `  ${i + 1}  ${s.name.padEnd(6)} ${look.name.padEnd(11)} ${look.filament}`;
  });
  const lines = [
    'openUC2 light cube - print files',
    '================================',
    '',
    'Sides (each STL lies with its outer face on the bed, no supports needed):',
    ...rows,
    '',
    'Cut-out sides:      dark PLA, 0.2 mm layers.',
    'Shadow, lithophane: white PLA, 0.1-0.12 mm layers, 100 % infill.',
  ];
  if (sides.some((s) => s.opts.style === 'cutout') && sheetT) {
    lines.push(`Diffuser sheets:    white PLA, ${sheetT} mm (one layer), or tracing paper cut to 30.8 x 30.8 mm.`,
      '                    The sheet lies in the pocket on the inside of the side.');
  }
  if (lids) {
    lines.push('', 'Lid set (from the openUC2 CAD library):', ...LIDS.map(([f, d]) => `  ${f.padEnd(26)} ${d}`));
  }
  lines.push('',
    'Assembly: press each side into a window of an openUC2 cube from the outside until it',
    'sits flush; put an LED tealight (up to 37.8 mm across) into the ring on the bottom lid.',
    'Use LED tealights only - PLA softens at about 60 degC.',
    '',
    'Made with the openUC2 light cube designer.');
  return lines.join('\r\n');
}

/** Zip the side files (from the worker) and, optionally, the lid set from assets/parts. */
export async function zipAll(sides, files, { sheetT, lids }) {
  const entries = {};
  const dir = 'openUC2-light-cube/';
  for (const f of files) {
    const s = sides[f.side];
    entries[dir + fileName(f.side, s.key, f.style, f.kind)] = new Uint8Array(f.data);
  }
  if (lids) {
    for (const [name] of LIDS) {
      const res = await fetch(`assets/parts/${name}`);
      if (!res.ok) throw new Error(`Could not load ${name}`);
      entries[dir + name] = new Uint8Array(await res.arrayBuffer());
    }
  }
  entries[dir + 'README.txt'] = strToU8(readme(sides, sheetT, lids));
  return new Blob([zipSync(entries, { level: 6 })], { type: 'application/zip' });
}
