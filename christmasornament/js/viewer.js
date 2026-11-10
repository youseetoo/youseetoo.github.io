// 3D view of the cube (CAD units: mm, z up). The four sides are the generated panels; with the
// light on, the lit look of each side is laid over its outer face with additive blending.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PANEL } from './geometry/template.js';

export const SIDES = [
  { key: 'front', name: 'Front', n: [0, -1, 0] },
  { key: 'right', name: 'Right', n: [1, 0, 0] },
  { key: 'back', name: 'Back', n: [0, 1, 0] },
  { key: 'left', name: 'Left', n: [-1, 0, 0] },
];

const UP = new THREE.Vector3(0, 0, 1);
const TABLE_Z = -31.2;                         // underside of the bottom lid

function radial(stops, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Basis of a side: x = right as seen from outside, y = up, z = outward normal. */
function sideBasis(i) {
  const n = new THREE.Vector3(...SIDES[i].n);
  const r = new THREE.Vector3().crossVectors(UP, n);
  return { n, r };
}

export class Viewer {
  constructor(el, { onPick }) {
    this.el = el;
    this.onPick = onPick;
    this.light = 'night';
    this.active = 0;
    this.dirty = true;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0x000000, 0);
    el.prepend(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(28, 1, 5, 3000);
    camera.up.set(0, 0, 1);
    camera.position.set(118, -168, 92);
    this.camera = camera;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 1.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 110;
    controls.maxDistance = 420;
    controls.enablePan = false;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener('change', () => { this.dirty = true; });
    this.controls = controls;

    this.hemi = new THREE.HemisphereLight(0xffffff, 0xb9c0c9, 1.0);
    this.key = new THREE.DirectionalLight(0xffffff, 1.6);
    this.key.position.set(80, -120, 160);
    this.rim = new THREE.DirectionalLight(0xbfd4ff, 0.0);
    this.rim.position.set(-120, 140, 60);
    this.inner = new THREE.PointLight(0xffc370, 0, 0, 0);
    this.inner.position.set(0, 0, 6);
    scene.add(this.hemi, this.key, this.rim, this.inner);

    this.mats = {
      dark: new THREE.MeshStandardMaterial({ color: 0x272b31, roughness: 0.72, metalness: 0 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.55, metalness: 0 }),
      sheet: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 }),
      cube: new THREE.MeshStandardMaterial({ color: 0x1b1e23, roughness: 0.62, metalness: 0 }),
      lid: new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.6, metalness: 0 }),
    };

    // table glow (night) and contact shadow (day)
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshBasicMaterial({
      map: radial([[0, 'rgba(255,196,110,0.55)'], [0.35, 'rgba(255,170,80,0.16)'], [1, 'rgba(255,170,80,0)']]),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.pool.position.z = TABLE_Z - 0.05;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({
      map: radial([[0, 'rgba(2,20,45,0.30)'], [0.45, 'rgba(2,20,45,0.10)'], [1, 'rgba(2,20,45,0)']]),
      transparent: true, depthWrite: false,
    }));
    this.shadow.position.z = TABLE_Z - 0.05;
    scene.add(this.pool, this.shadow);

    this.sides = SIDES.map((_, i) => this.makeSide(i));

    this.raycaster = new THREE.Raycaster();
    this.downAt = null;
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', (e) => { this.downAt = [e.clientX, e.clientY]; this.setSpin(false); });
    dom.addEventListener('pointerup', (e) => this.pick(e));

    new ResizeObserver(() => this.resize()).observe(el);
    this.resize();
    this.setLight('night');
    const loop = () => {
      requestAnimationFrame(loop);
      if (this.controls.update() || this.dirty) {
        this.dirty = false;
        renderer.render(scene, camera);
      }
    };
    loop();
  }

  makeSide(i) {
    const { n, r } = sideBasis(i);
    const group = new THREE.Group();
    // print frame -> world: x_p -> -r, y_p -> up, z_p -> -n, origin on the outer face
    const m = new THREE.Matrix4().makeBasis(r.clone().negate(), UP, n.clone().negate());
    m.setPosition(n.clone().multiplyScalar(PANEL.faceOffset));
    const panel = new THREE.Mesh(new THREE.BufferGeometry(), this.mats.dark);
    panel.matrixAutoUpdate = false;
    panel.matrix.copy(m);
    panel.userData.side = i;

    const face = new THREE.Matrix4().makeBasis(r, UP, n);     // seen from outside
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(PANEL.sheet.size, PANEL.sheet.size, PANEL.sheet.t), this.mats.sheet);
    sheet.matrixAutoUpdate = false;
    sheet.matrix.copy(face).setPosition(n.clone().multiplyScalar(PANEL.faceOffset - PANEL.plate - PANEL.sheet.t / 2));

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 512;
    const tex = new THREE.CanvasTexture(glowCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(PANEL.window, PANEL.window), new THREE.MeshBasicMaterial({
      map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    glow.matrixAutoUpdate = false;
    glow.matrix.copy(face).setPosition(n.clone().multiplyScalar(PANEL.faceOffset + 0.04));

    // marker for the side being edited: a thin frame just outside the cube face
    const s = PANEL.lip / 2 + 0.9, t = PANEL.lip / 2 + 0.35;
    const shape = new THREE.Shape([[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, y]) => new THREE.Vector2(x, y)));
    shape.holes.push(new THREE.Path([[-t, -t], [-t, t], [t, t], [t, -t]].map(([x, y]) => new THREE.Vector2(x, y))));
    const marker = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0x85b918, toneMapped: false }));
    marker.matrixAutoUpdate = false;
    marker.matrix.copy(face).setPosition(n.clone().multiplyScalar(24.93));

    group.add(panel, sheet, glow, marker);
    this.scene.add(group);
    return { group, panel, sheet, glow, glowCanvas, tex, marker, style: 'cutout' };
  }

  async load(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    gltf.scene.traverse((o) => {
      if (o.isMesh) o.material = /CUBHLF|cube-half/i.test(o.name) ? this.mats.cube : this.mats.lid;
    });
    this.scene.add(gltf.scene);
    this.dirty = true;
  }

  /** New panel mesh for side i: { positions, normals, indices } in the print frame. */
  setPanel(i, mesh, style) {
    const s = this.sides[i];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
    g.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    g.computeBoundingSphere();
    s.panel.geometry.dispose();
    s.panel.geometry = g;
    s.style = style;
    this.applyStyle(i);
  }

  /** Lit look of side i, drawn by draw(ctx, size) in design orientation. */
  setGlow(i, draw) {
    const s = this.sides[i];
    const ctx = s.glowCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 512, 512);
    draw(ctx, 512);
    s.tex.needsUpdate = true;
    this.dirty = true;
  }

  applyStyle(i) {
    const s = this.sides[i];
    const night = this.light === 'night';
    s.panel.material = s.style === 'cutout' ? this.mats.dark : this.mats.white;
    s.sheet.visible = s.style === 'cutout';
    s.glow.visible = night;
    this.dirty = true;
  }

  setActive(i) {
    this.active = i;
    this.sides.forEach((s, k) => { s.marker.visible = k === i; });
    this.dirty = true;
  }

  setLight(mode) {
    this.light = mode;
    const night = mode === 'night';
    this.el.dataset.light = mode;
    this.hemi.intensity = night ? 0.16 : 1.05;
    this.hemi.color.set(night ? 0x9fb6e0 : 0xffffff);
    this.key.intensity = night ? 0.0 : 1.7;
    this.rim.intensity = night ? 0.55 : 0.0;
    this.inner.intensity = night ? 1.0 : 0;
    this.pool.visible = night;
    this.shadow.visible = !night;
    this.mats.white.emissive.set(night ? 0x2a1c08 : 0x000000);
    this.sides.forEach((_, i) => this.applyStyle(i));
  }

  setSpin(on) {
    this.controls.autoRotate = on;
    this.el.querySelector('#spin')?.setAttribute('aria-pressed', String(on));
  }

  pick(e) {
    if (!this.downAt || Math.hypot(e.clientX - this.downAt[0], e.clientY - this.downAt[1]) > 5) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(p, this.camera);
    const hits = this.raycaster.intersectObjects(this.sides.map((s) => s.panel), false);
    if (hits.length) this.onPick(hits[0].object.userData.side);
  }

  /** Turn the camera so that side i faces the viewer (a little from the right and above). */
  face(i) {
    const { n, r } = sideBasis(i);
    const dist = this.camera.position.distanceTo(this.controls.target);
    const dir = n.clone().multiplyScalar(0.82).add(r.clone().multiplyScalar(0.34)).add(UP.clone().multiplyScalar(0.42)).normalize();
    this.camera.position.copy(this.controls.target).add(dir.multiplyScalar(dist));
    this.controls.update();
    this.dirty = true;
  }

  resize() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }
}
