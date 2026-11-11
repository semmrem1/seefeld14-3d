import * as THREE from 'three';
import { OrbitControls } from './../vendor/OrbitControls.js';
import {
  rooms, outline, openings, windows, terrace, garden, furniture, diningTable,
  facts, WALL_H, DEPTH, BUILDING_LEN,
} from './data.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e4dd);
scene.fog = new THREE.Fog(0xe9e4dd, 70, 160);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 3;
controls.maxDistance = 90;

// ---------- Licht ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc4b6, 1.6));
const sun = new THREE.DirectionalLight(0xfff1dc, 1.7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera;
sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120;
sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
sun.target.position.set(8, 0, 7);

// ---------- Hilfen ----------
const inRect = (x, z, q) => x >= q.x0 && x < q.x1 && z >= q.z0 && z < q.z1;
const inAny = (x, z, list) => list.some((q) => inRect(x, z, q));
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const box = (q, y0, y1, material) => {
  const g = new THREE.BoxGeometry(q.x1 - q.x0, y1 - y0, q.z1 - q.z0);
  const m = new THREE.Mesh(g, material);
  m.position.set((q.x0 + q.x1) / 2, (y0 + y1) / 2, (q.z0 + q.z1) / 2);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
const center = (room) => {
  let a = 0, cx = 0, cz = 0;
  for (const q of room.rects) {
    const s = (q.x1 - q.x0) * (q.z1 - q.z0);
    a += s; cx += s * (q.x0 + q.x1) / 2; cz += s * (q.z0 + q.z1) / 2;
  }
  return new THREE.Vector3(cx / a, 0, cz / a);
};

// ---------- Umgebung ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(0xd8d2c8));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true;
scene.add(ground);

const apartment = new THREE.Group();
scene.add(apartment);

// Garten und Terrasse
const gardenMat = mat(0x8fae7c);
for (const q of garden.rects) {
  const m = box(q, -0.05, 0.02, gardenMat); m.castShadow = false; apartment.add(m);
}
{
  const m = box(terrace, -0.05, 0.06, mat(0xb9a892)); apartment.add(m);
}
const hedgeMat = mat(0x5f7d57);
const gx0 = garden.rects[0].x0, gz1 = garden.rects[0].z1, gx1 = garden.rects[1].x1;
apartment.add(box({ x0: gx0 - 0.3, x1: gx0, z0: 0, z1: gz1 }, 0, 0.9, hedgeMat));
apartment.add(box({ x0: gx0 - 0.3, x1: gx1, z0: gz1, z1: gz1 + 0.3 }, 0, 0.9, hedgeMat));
const tree = (x, z, s = 1) => {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 1.6 * s, 8), mat(0x6e5a48));
  trunk.position.y = 0.8 * s;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 * s, 1), mat(0x6f9163, { flatShading: true }));
  crown.position.y = 2.3 * s;
  trunk.castShadow = crown.castShadow = true;
  g.add(trunk, crown); g.position.set(x, 0, z); return g;
};
[[-2.2, 1.5, 0.8], [-2.4, 7.2, 0.7], [-2.1, 12.3, 1.1], [-1.8, 16.6, 0.8], [3.2, 16.9, 1.15], [6.6, 16.4, 0.8]]
  .forEach(([x, z, s]) => apartment.add(tree(x, z, s)));

// Böden
const floorMats = { parkett: mat(0xd9c3a5, { roughness: 0.6 }), platten: mat(0xc9cbc7, { roughness: 0.4 }) };
const slab = new THREE.Group();
for (const q of outline) { const m = box(q, -0.2, 0, mat(0x9a9189)); m.castShadow = false; slab.add(m); }
apartment.add(slab);
const roomFloors = {};
for (const room of rooms) {
  const g = new THREE.Group();
  const m = floorMats[room.floor].clone();
  for (const q of room.rects) {
    const f = box(q, 0, 0.02, m); f.castShadow = false; g.add(f);
  }
  roomFloors[room.id] = m;
  apartment.add(g);
}

// Wände über ein 5-cm-Raster: alles innerhalb der Kontur, das kein Raum und keine Öffnung ist
const CELL = 0.05;
const allRoomRects = rooms.flatMap((q) => q.rects);
const xMax = Math.max(...outline.map((q) => q.x1)), zMax = Math.max(...outline.map((q) => q.z1));
const nx = Math.ceil(xMax / CELL), nz = Math.ceil(zMax / CELL);
const cellType = (i, j) => {
  const x = (i + 0.5) * CELL, z = (j + 0.5) * CELL;
  if (!inAny(x, z, outline)) return 0;
  if (inAny(x, z, allRoomRects) || inAny(x, z, openings)) return 0;
  if (inAny(x, z, windows)) return 2;
  return 1;
};
const runs = []; // {i0,i1,j0,j1,t}
let open = new Map();
for (let j = 0; j <= nz; j++) {
  const next = new Map();
  if (j < nz) {
    let i = 0;
    while (i < nx) {
      const t = cellType(i, j);
      if (!t) { i++; continue; }
      let k = i; while (k < nx && cellType(k, j) === t) k++;
      const key = `${i}:${k}:${t}`;
      const prev = open.get(key);
      if (prev) { prev.j1 = j + 1; next.set(key, prev); open.delete(key); }
      else next.set(key, { i0: i, i1: k, j0: j, j1: j + 1, t });
      i = k;
    }
  }
  for (const v of open.values()) runs.push(v);
  open = next;
}
const wallMat = mat(0xf4f1ec);
const capMat = mat(0x6f5560);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xa9cfe0, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0 });
const walls = new THREE.Group();
for (const q of runs) {
  const rect = { x0: q.i0 * CELL, x1: q.i1 * CELL, z0: q.j0 * CELL, z1: q.j1 * CELL };
  if (q.t === 1) {
    walls.add(box(rect, 0, WALL_H, [wallMat, wallMat, capMat, wallMat, wallMat, wallMat]));
  } else {
    walls.add(box(rect, WALL_H - 0.22, WALL_H, [wallMat, wallMat, capMat, wallMat, wallMat, wallMat]));
    const w = rect.x1 - rect.x0, d = rect.z1 - rect.z0;
    const thin = w > d
      ? { ...rect, z0: (rect.z0 + rect.z1) / 2 - 0.03, z1: (rect.z0 + rect.z1) / 2 + 0.03 }
      : { ...rect, x0: (rect.x0 + rect.x1) / 2 - 0.03, x1: (rect.x0 + rect.x1) / 2 + 0.03 };
    const g = box(thin, 0, WALL_H - 0.22, glassMat); g.castShadow = false; walls.add(g);
  }
}
apartment.add(walls);

// Möbel
const furn = new THREE.Group();
for (const q of furniture) furn.add(box(q, q.y, q.y + q.h, mat(q.color)));
{
  const top = new THREE.Mesh(new THREE.CylinderGeometry(diningTable.r, diningTable.r, 0.05, 40), mat(0x9b8469));
  top.position.set(diningTable.x, 0.74, diningTable.z); top.castShadow = true;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 0.72, 16), mat(0x5c5049));
  leg.position.set(diningTable.x, 0.36, diningTable.z);
  furn.add(top, leg);
  for (let a = 0; a < 5; a++) {
    const ang = a / 5 * Math.PI * 2;
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.42), mat(0x8f8478));
    ch.position.set(diningTable.x + Math.cos(ang) * 1.0, 0.23, diningTable.z + Math.sin(ang) * 1.0);
    ch.rotation.y = -ang; ch.castShadow = true; furn.add(ch);
  }
}
apartment.add(furn);

// ---------- Übriges Gartengeschoss und Gebäude darüber ----------
const restMat = mat(0xb7b0a7, { transparent: true, opacity: 0.55 });
const rest = new THREE.Group();
const aptTop = outline[0].x1, aptBump = outline[1].x1;
rest.add(box({ x0: aptTop, x1: BUILDING_LEN, z0: 0, z1: outline[1].z0 }, 0, WALL_H, restMat));
rest.add(box({ x0: aptBump, x1: BUILDING_LEN, z0: outline[1].z0, z1: outline[1].z1 }, 0, WALL_H, restMat));
rest.add(box({ x0: outline[2].x1, x1: BUILDING_LEN, z0: outline[1].z1, z1: DEPTH }, 0, WALL_H, restMat));
rest.children.forEach((m) => { m.castShadow = false; });
scene.add(rest);

const upper = new THREE.Group();
const upperMats = [];
const um = (color) => { const m = mat(color, { transparent: true }); upperMats.push(m); return m; };
const woodA = um(0xb98f64), woodB = um(0xa67c54), bandMat = um(0xefe9e0), roofMat = um(0x5b4f4a), pvMat = um(0x1e2f4f);
const STOREY = 2.85, Y0 = WALL_H + 0.25;
const foot = { x0: 0, x1: BUILDING_LEN, z0: 0, z1: DEPTH };
const names = ['EG', '1. OG', '2. OG'];
names.forEach((n, i) => {
  const y = Y0 + i * STOREY;
  upper.add(box(foot, y, y + STOREY - 0.25, i % 2 ? woodB : woodA));
  upper.add(box({ x0: -0.15, x1: BUILDING_LEN + 0.15, z0: -0.15, z1: DEPTH + 0.15 }, y - 0.25, y, bandMat));
  // Fensterbänder
  for (let k = 0; k < 9; k++) {
    const x = 1.4 + k * 2.9;
    for (const z of [-0.03, DEPTH - 0.03]) {
      upper.add(box({ x0: x, x1: x + 1.5, z0: z, z1: z + 0.06 }, y + 0.2, y + STOREY - 0.6, glassMat));
    }
  }
});
{
  // Satteldach mit Dachgeschoss, First entlang der Längsachse
  const y = Y0 + 3 * STOREY;
  upper.add(box({ x0: -0.15, x1: BUILDING_LEN + 0.15, z0: -0.15, z1: DEPTH + 0.15 }, y - 0.25, y, bandMat));
  const h = 4.6, o = 0.5;
  const s = new THREE.Shape();
  s.moveTo(-o, 0); s.lineTo(DEPTH + o, 0); s.lineTo(DEPTH / 2, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: BUILDING_LEN + 2 * o, bevelEnabled: false });
  const roof = new THREE.Mesh(g, roofMat);
  roof.rotation.y = -Math.PI / 2; roof.position.set(BUILDING_LEN + o, y, 0);
  roof.castShadow = true; upper.add(roof);
  // Photovoltaik auf beiden Dachflächen (Baubeschrieb Pos. 239: PV-Anlage auf dem Hauptdach)
  const slope = Math.atan2(h, DEPTH / 2 + o), len = Math.hypot(h, DEPTH / 2 + o);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, len * 0.62), pvMat);
      const zc = DEPTH / 2 + side * (DEPTH / 4 + o / 2);
      p.position.set(2.2 + k * 2.3, y + h / 2 + 0.08, zc);
      p.rotation.x = side * slope;
      upper.add(p);
    }
  }
}
scene.add(upper);

// ---------- Nordpfeil (gemäss Plan, ca.) ----------
const NORTH = new THREE.Vector3(0.64, 0, -0.77).normalize();
{
  const g = new THREE.Group();
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 3), mat(0x6f5560));
  arrow.rotation.x = Math.PI / 2; arrow.rotation.z = 0; g.add(arrow);
  g.position.set(-7, 0.1, -3);
  g.lookAt(g.position.clone().sub(NORTH));
  scene.add(g);
}

// ---------- Beschriftungen ----------
const labelLayer = document.getElementById('labels');
const labels = [];
const addLabel = (pos, html, cls = '') => {
  const el = document.createElement('div');
  el.className = 'label ' + cls; el.innerHTML = html; labelLayer.appendChild(el);
  const l = { pos, el, group: cls }; labels.push(l); return l;
};
const centers = {};
for (const room of rooms) {
  centers[room.id] = center(room);
  const l = addLabel(centers[room.id].clone().setY(0.3), `<b>${room.name}</b><span>${room.area.toFixed(1)} m²</span>`, 'room');
  l.id = room.id;
  l.el.addEventListener('click', () => focusRoom(room.id));
}
addLabel(new THREE.Vector3(-1.75, 0.2, 9.5), `<b>Garten</b><span>${garden.area.toFixed(1)} m²</span>`, 'room out');
addLabel(new THREE.Vector3((terrace.x0 + terrace.x1) / 2, 0.2, (terrace.z0 + terrace.z1) / 2), `<b>Terrasse</b><span>${terrace.area} m²</span>`, 'room out');
addLabel(new THREE.Vector3(21.5, WALL_H, 7), '<b>Keller · Velos · Waschen · Autolift</b>', 'room out');
addLabel(new THREE.Vector3(-7, 1.2, -3), '<b>N</b>', 'north');
addLabel(new THREE.Vector3(13.5, Y0 + 3 * STOREY + 5.4, DEPTH / 2), '<b>Photovoltaik</b><span>auf dem Hauptdach</span>', 'building');
addLabel(new THREE.Vector3(4, 1.4, DEPTH + 0.4), '<b>Wohnung 01</b><span>Gartengeschoss</span>', 'building');

const v = new THREE.Vector3();
function updateLabels() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const l of labels) {
    v.copy(l.pos); if (l.group === 'building') v.y += lift * 16 * (l.pos.y > 5 ? 1 : 0);
    v.project(camera);
    const vis = v.z < 1 && v.z > -1;
    const show = l.group === 'building' ? 1 - lift : l.group === 'north' ? 1 : lift;
    l.el.style.opacity = vis ? show : 0;
    l.el.style.pointerEvents = vis && show > 0.6 && l.id ? 'auto' : 'none';
    l.el.style.transform = `translate(-50%,-50%) translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px)`;
    l.el.classList.toggle('active', !!l.id && l.id === activeRoom);
  }
}

// ---------- Zustand und Animation ----------
let lift = 0;          // 0 = Gebäude geschlossen, 1 = Geschosse abgehoben
let liftTarget = 0;
let activeRoom = null;
let token = 0;
let playing = false;
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sleep = (ms, tk) => new Promise((res) => {
  const t0 = performance.now();
  const tick = () => (tk !== token ? res(false) : performance.now() - t0 >= ms ? res(true) : requestAnimationFrame(tick));
  tick();
});
function fly(pos, target, ms, tk) {
  const p0 = camera.position.clone(), t0v = controls.target.clone();
  const p1 = new THREE.Vector3(...pos), t1v = new THREE.Vector3(...target);
  const start = performance.now();
  return new Promise((res) => {
    const step = () => {
      if (tk !== token) return res(false);
      const k = Math.min(1, (performance.now() - start) / ms), e = ease(k);
      camera.position.lerpVectors(p0, p1, e);
      controls.target.lerpVectors(t0v, t1v, e);
      if (k < 1) requestAnimationFrame(step); else res(true);
    };
    step();
  });
}
const AC = [7.6, 0, 7];
const roomView = (id) => {
  const c = centers[id];
  const narrow = innerWidth < 760;
  return [[c.x - 3.6, narrow ? 21 : 11.5, c.z + (narrow ? 11 : 8.2)], [c.x, 0.4, c.z]];
};
const caption = document.getElementById('caption');
function setCaption(title, text) {
  caption.innerHTML = title ? `<b>${title}</b>${text ? `<span>${text}</span>` : ''}` : '';
  caption.classList.toggle('show', !!title);
}
function setActive(id) {
  activeRoom = id;
  for (const [k, m] of Object.entries(roomFloors)) m.emissive.setHex(k === id ? 0x6f5560 : 0x000000), m.emissiveIntensity = 0.28;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
}
async function focusRoom(id) {
  stop();
  const tk = token; liftTarget = 1; setActive(id);
  const room = rooms.find((q) => q.id === id);
  setCaption(`${room.name} · ${room.area.toFixed(1)} m²`, room.note);
  const [p, t] = roomView(id);
  await fly(p, t, 1400, tk);
}
function stop() { token++; playing = false; playBtn.textContent = 'Tour starten'; }

async function tour() {
  token++; const tk = token; playing = true; playBtn.textContent = 'Tour anhalten';
  const far = innerWidth < 760 ? 1.45 : 1;
  setActive(null); liftTarget = 0;
  setCaption('Seefeldstrasse 14, Uster', 'Ersatzneubau mit 11 Eigentumswohnungen, Bezug Ende 2028');
  if (!await fly([-20 * far, 17 * far, 36 * far], [11, 6, 7], 1600, tk)) return;
  if (!await fly([34 * far, 22 * far, 34 * far], [13, 7, 7], 6500, tk)) return;
  setCaption('Photovoltaik auf dem Hauptdach', 'Wärmepumpe mit Erdsonden, Freecooling im Sommer');
  if (!await fly([14, 38 * far, 22 * far], [13, 9, 7], 3200, tk)) return;
  if (!await sleep(1600, tk)) return;
  setCaption('Wohnung 01 im Gartengeschoss', '4.5 Zimmer, 151.3 m² Wohnfläche');
  liftTarget = 1;
  if (!await fly([-9 * far, 21 * far, 25 * far], AC, 3600, tk)) return;
  if (!await sleep(900, tk)) return;
  if (!await fly([AC[0], 27 * far, AC[2] + 0.01], AC, 2600, tk)) return;
  if (!await sleep(1800, tk)) return;
  for (const room of rooms) {
    setActive(room.id);
    setCaption(`${room.name} · ${room.area.toFixed(1)} m²`, room.note);
    const [p, t] = roomView(room.id);
    if (!await fly(p, t, 1900, tk)) return;
    if (!await sleep(1700, tk)) return;
  }
  setActive(null);
  setCaption('Privater Garten · 97.0 m²', 'Dazu 5.5 m² Terrasse vor dem Jahreszeitenzimmer');
  if (!await fly([-13 * far, 8 * far, 22 * far], [1, 0, 10], 2800, tk)) return;
  if (!await sleep(2600, tk)) return;
  setCaption("CHF 1'890'000", 'Frei drehen und zoomen, Räume antippen');
  if (!await fly([-8 * far, 17 * far, 24 * far], AC, 2600, tk)) return;
  playing = false; playBtn.textContent = 'Tour nochmals';
}

// ---------- Bedienung ----------
const playBtn = document.getElementById('play');
playBtn.addEventListener('click', () => (playing ? stop() : tour()));
const bldBtn = document.getElementById('building');
bldBtn.addEventListener('click', () => { stop(); liftTarget = liftTarget > 0.5 ? 0 : 1; });
const furnBtn = document.getElementById('furn');
furnBtn.addEventListener('click', () => { furn.visible = !furn.visible; furnBtn.classList.toggle('off', !furn.visible); });
canvas.addEventListener('pointerdown', () => { if (playing) stop(); });
canvas.addEventListener('wheel', () => { if (playing) stop(); }, { passive: true });

const chips = document.getElementById('chips');
for (const room of rooms) {
  const b = document.createElement('button');
  b.className = 'chip'; b.dataset.id = room.id;
  b.innerHTML = `${room.name}<i>${room.area.toFixed(1)}</i>`;
  b.addEventListener('click', () => focusRoom(room.id));
  chips.appendChild(b);
}
const groups = document.getElementById('groups');
groups.innerHTML = facts.gruppen.map((g, i) => `
  <details ${i < 2 ? 'open' : ''}><summary>${g.titel}</summary>
  <dl>${g.zeilen.map(([k, w]) => `<div><dt>${k}</dt><dd>${w}</dd></div>`).join('')}</dl></details>`).join('');
const panel = document.getElementById('panel');
document.getElementById('toggle').addEventListener('click', () => panel.classList.toggle('open'));

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let sunT = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  lift += (liftTarget - lift) * Math.min(1, dt * 2.2);
  upper.position.y = ease(lift) * 16;
  const op = 1 - lift;
  upper.visible = op > 0.02;
  for (const m of upperMats) m.opacity = op;
  restMat.opacity = 0.55 + 0.45 * op;
  bldBtn.textContent = liftTarget > 0.5 ? 'Gebäude zeigen' : 'Wohnung zeigen';
  // Sonne wandert langsam von Südost nach Südwest (schematisch)
  sunT += dt * 0.05;
  const a = Math.sin(sunT) * 0.9;
  const south = NORTH.clone().multiplyScalar(-1);
  const dir = south.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
  sun.position.set(8 + dir.x * 26, 52, 7 + dir.z * 26);
  controls.update();
  renderer.render(scene, camera);
  updateLabels();
  requestAnimationFrame(frame);
}

camera.position.set(-20, 17, 36); controls.target.set(11, 6, 7);
frame();
window.__ready = true;
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  liftTarget = 1; camera.position.set(-8, 17, 24); controls.target.set(...AC);
  setCaption('Wohnung 01 im Gartengeschoss', 'Tour mit dem Knopf starten');
} else {
  tour();
}
