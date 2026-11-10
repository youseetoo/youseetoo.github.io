// Copy the pinned browser libraries from node_modules into vendor/ (run: npm run vendor).
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const out = join(root, 'vendor');

const files = [
  ['three/build/three.module.js', 'three/three.module.js'],
  ['three/build/three.core.js', 'three/three.core.js'],
  ['three/examples/jsm/controls/OrbitControls.js', 'three/addons/controls/OrbitControls.js'],
  ['three/examples/jsm/loaders/GLTFLoader.js', 'three/addons/loaders/GLTFLoader.js'],
  ['three/examples/jsm/utils/BufferGeometryUtils.js', 'three/addons/utils/BufferGeometryUtils.js'],
  ['three/examples/jsm/utils/SkeletonUtils.js', 'three/addons/utils/SkeletonUtils.js'],
  ['three/LICENSE', 'three/LICENSE'],
  ['manifold-3d/manifold.js', 'manifold/manifold.js'],
  ['manifold-3d/manifold.wasm', 'manifold/manifold.wasm'],
  ['manifold-3d/LICENSE', 'manifold/LICENSE'],
  ['fflate/esm/browser.js', 'fflate/fflate.js'],
  ['fflate/LICENSE', 'fflate/LICENSE'],
];

rmSync(out, { recursive: true, force: true });
for (const [src, dst] of files) {
  mkdirSync(dirname(join(out, dst)), { recursive: true });
  cpSync(join(nm, src), join(out, dst));
  console.log('vendor/' + dst);
}
