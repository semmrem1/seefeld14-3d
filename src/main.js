import * as THREE from 'three';
import { OrbitControls } from './../vendor/OrbitControls.js';
import {
  rooms, outline, openings, windows, terrace, garden, furniture, diningTable, ausbaulinien,
  facts, WALL_H, DEPTH, BUILDING_LEN, r,
} from './data.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe8ee);
scene.fog = new THREE.Fog(0xdfe8ee, 90, 220);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 500);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.497;
controls.minDistance = 0.4;
controls.maxDistance = 110;
controls.zoomToCursor = true;
controls.zoomSpeed = 1.3;

// ---------- Licht: Sonne für Uster (47.34° N), 15. Juli ----------
const hemi = new THREE.HemisphereLight(0xeaf2ff, 0xe6ddd0, 1.25);
const amb = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(hemi, amb);
const sun = new THREE.DirectionalLight(0xfff4e2, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
const sc = sun.shadow.camera;
sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 160;
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
sun.target.position.set(10, 0, 7);
// Nordrichtung gemäss Nordpfeil im Grundriss (ca. 40° im Uhrzeigersinn gegenüber Plan-oben)
const NORTH = new THREE.Vector3(0.64, 0, -0.77).normalize();
const EAST = new THREE.Vector3(0.77, 0, 0.64).normalize();
const LAT = 47.34 * Math.PI / 180, DECL = 21.5 * Math.PI / 180, SOLAR_NOON = 13.52; // MESZ
function sunAt(hour) {
  const H = (hour - SOLAR_NOON) * 15 * Math.PI / 180;
  const sinEl = Math.sin(LAT) * Math.sin(DECL) + Math.cos(LAT) * Math.cos(DECL) * Math.cos(H);
  const el = Math.asin(sinEl), cosEl = Math.cos(el);
  const az = Math.atan2(-Math.sin(H) * Math.cos(DECL) / cosEl, (Math.sin(DECL) - sinEl * Math.sin(LAT)) / (cosEl * Math.cos(LAT)));
  const dir = NORTH.clone().multiplyScalar(Math.cos(az) * cosEl).addScaledVector(EAST, Math.sin(az) * cosEl);
  dir.y = sinEl;
  return { el, az, dir };
}
let sunHour = 16;
function applySun() {
  const s = sunAt(sunHour);
  const k = THREE.MathUtils.smoothstep(s.el, 0, 0.3);
  sun.intensity = 2.9 * k;
  sun.color.setHex(0xffb070).lerp(new THREE.Color(0xfff6e8), THREE.MathUtils.smoothstep(s.el, 0.05, 0.6));
  hemi.intensity = 0.5 + 0.6 * k; amb.intensity = 0.3 + 0.45 * k;
  sun.position.copy(sun.target.position).addScaledVector(s.dir.y > 0.02 ? s.dir : s.dir.clone().setY(0.02), 80);
  const hh = Math.floor(sunHour), mm = Math.floor((sunHour - hh) * 60);
  const azDeg = (s.az * 180 / Math.PI + 360) % 360;
  const comp = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(azDeg / 45) % 8];
  sunLabel.textContent = `15. Juli · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · Sonne ${comp}, ${Math.max(0, Math.round(s.el * 180 / Math.PI))}° hoch`;
}

// ---------- Texturen (prozedural, Farbe kommt aus der Ausbaulinie) ----------
function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// Landhausdiele 1900 x 190 mm: Textur = 3.8 m x 1.52 m
const parkettTex = tex(1024, 512, (g, w, h) => {
  const rows = 8, rh = h / rows, pl = w / 2;
  for (let i = 0; i < rows; i++) {
    const off = rnd() * pl;
    for (let x = -pl + off; x < w; x += pl) {
      const v = 205 + rnd() * 50;
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, i * rh, pl, rh);
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = `rgba(90,70,50,${0.04 + rnd() * 0.07})`; g.beginPath();
        const y = i * rh + rnd() * rh; g.moveTo(x, y); g.bezierCurveTo(x + pl * 0.3, y + 3, x + pl * 0.6, y - 3, x + pl, y + 1); g.stroke();
      }
      g.fillStyle = 'rgba(60,45,35,.5)'; g.fillRect(x, i * rh, 1.5, rh);
    }
    g.fillStyle = 'rgba(60,45,35,.45)'; g.fillRect(0, i * rh, w, 1.5);
  }
});
const tileTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) { const v = 225 + rnd() * 30; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(rnd() * w, rnd() * h, 6, 6); }
  g.fillStyle = 'rgba(120,120,120,.8)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
});
const stoneTex = (speck) => tex(256, 256, (g, w, h) => {
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 2600; k++) {
    const v = 255 - rnd() * 220 * speck; g.fillStyle = `rgba(${v},${v},${v},.8)`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3);
  }
});
const slatTex = tex(256, 32, (g, w, h) => {
  for (let x = 0; x < w; x += 8) {
    const v = 205 + rnd() * 50; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 8, h);
    g.fillStyle = 'rgba(40,10,10,.55)'; g.fillRect(x, 0, 1.5, h);
  }
});

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
// Bodenfläche mit UV in Metern, damit Plattenformate massstäblich sind
const floorTargets = [];
function floor(q, material, tx, tz, y = 0.02) {
  const w = q.x1 - q.x0, d = q.z1 - q.z0;
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + q.x0 + w / 2) / tx, (p.getZ(i) + q.z0 + d / 2) / tz);
  const m = new THREE.Mesh(g, material);
  m.position.set(q.x0 + w / 2, y, q.z0 + d / 2); m.receiveShadow = true;
  floorTargets.push(m);
  return m;
}
const center = (room) => {
  let a = 0, cx = 0, cz = 0;
  for (const q of room.rects) {
    const s = (q.x1 - q.x0) * (q.z1 - q.z0);
    a += s; cx += s * (q.x0 + q.x1) / 2; cz += s * (q.z0 + q.z1) / 2;
  }
  return new THREE.Vector3(cx / a, 0, cz / a);
};

// ---------- Materialien der Ausbaulinie ----------
const M = {
  parkett: mat(0xffffff, { map: parkettTex, roughness: 0.55 }),
  nass: mat(0xffffff, { map: tileTex, roughness: 0.3 }),
  platten: mat(0xffffff, { map: tileTex, roughness: 0.35 }),
  front: mat(0xffffff, { roughness: 0.6 }),
  stone: mat(0xffffff, { roughness: 0.25 }),
  gard: mat(0xffffff, { roughness: 0.6 }),
};
const stoneMaps = ausbaulinien.map((l) => { const t = stoneTex(l.speck); t.repeat.set(3, 3); return t; });
const tinted = []; // [material, key]
const useMat = (key) => { const m = M[key].clone(); tinted.push([m, key]); return m; };
function applyLinie(i) {
  const l = ausbaulinien[i];
  for (const [m, key] of tinted) { m.color.setHex(l[key]); if (key === 'stone') { m.map = stoneMaps[i]; m.needsUpdate = true; } }
  document.querySelectorAll('.linie').forEach((b, k) => b.classList.toggle('on', k === i));
  document.getElementById('linieText').innerHTML = l.text.map((t) => `<li>${t}</li>`).join('');
}

// ---------- Umgebung ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat(0xd3d0c6));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true;
scene.add(ground);

const apartment = new THREE.Group();
scene.add(apartment);

const gardenMat = mat(0x86a873);
for (const q of garden.rects) apartment.add(floor(q, gardenMat, 1, 1, 0.01));
apartment.add(floor(terrace, useMat('platten'), 0.6, 0.6, 0.05));
const hedgeMat = mat(0x56744f);
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
[[-2.4, 7.4, 0.7], [-2.2, 12.6, 1.0], [-1.9, 16.6, 0.8], [3.4, 16.9, 1.1], [6.6, 16.6, 0.8]]
  .forEach(([x, z, s]) => apartment.add(tree(x, z, s)));

// Bodenplatte, Böden, Decke
for (const q of outline) { const m = box(q, -0.2, 0, mat(0x9a9189)); m.castShadow = false; apartment.add(m); }
const roomFloors = {};
for (const room of rooms) {
  const key = room.floor === 'parkett' ? 'parkett' : room.id === 'abstell' ? 'platten' : 'nass';
  const m = useMat(key);
  const [tx, tz] = key === 'parkett' ? [3.8, 1.52] : key === 'platten' ? [0.6, 0.6] : [0.6, 0.3];
  for (const q of room.rects) apartment.add(floor(q, m, tx, tz));
  roomFloors[room.id] = m;
}
{
  // Decke: von oben unsichtbar, wirft aber Schatten, damit die Sonne nur durch die Fenster fällt
  const cm = mat(0xfbfaf7, { side: THREE.FrontSide }); cm.shadowSide = THREE.DoubleSide;
  for (const q of outline) {
    const g = new THREE.PlaneGeometry(q.x1 - q.x0, q.z1 - q.z0); g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, cm); m.position.set((q.x0 + q.x1) / 2, WALL_H, (q.z0 + q.z1) / 2);
    m.castShadow = true; apartment.add(m);
  }
}

// Wände über ein 5-cm-Raster: alles innerhalb der Kontur, das kein Raum und keine Öffnung ist
const CELL = 0.05;
const allRoomRects = rooms.flatMap((q) => q.rects);
const xMax = Math.max(...outline.map((q) => q.x1)), zMax = Math.max(...outline.map((q) => q.z1));
const nx = Math.ceil(xMax / CELL), nz = Math.ceil(zMax / CELL);
const typeAt = (x, z) => {
  if (!inAny(x, z, outline)) return 0;
  if (inAny(x, z, allRoomRects) || inAny(x, z, openings)) return 0;
  if (inAny(x, z, windows)) return 2;
  return 1;
};
const cellType = (i, j) => typeAt((i + 0.5) * CELL, (j + 0.5) * CELL);
const runs = [];
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
const wallMat = mat(0xf6f3ee);
const capMat = mat(0x5b4a50);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xbfdcea, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false });
const frameMat = mat(0x2b2726);
const walls = new THREE.Group();
// Fenster: zusammenhängende Zellen pro Fenster-Rechteck als ein Element
for (const q of runs) {
  if (q.t !== 1) continue;
  const rect = { x0: q.i0 * CELL, x1: q.i1 * CELL, z0: q.j0 * CELL, z1: q.j1 * CELL };
  walls.add(box(rect, 0, WALL_H, [wallMat, wallMat, capMat, wallMat, wallMat, wallMat]));
}
for (const wq of windows) {
  // auf die Wanddicke zuschneiden: Bereich des Rechtecks, der in der Kontur und in keinem Raum liegt
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let x = wq.x0; x < wq.x1; x += CELL) for (let z = wq.z0; z < wq.z1; z += CELL) {
    if (typeAt(x, z) === 2) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + CELL); z0 = Math.min(z0, z); z1 = Math.max(z1, z + CELL); }
  }
  if (x0 === Infinity) continue;
  const rect = { x0, x1, z0, z1 };
  walls.add(box(rect, WALL_H - 0.18, WALL_H, [wallMat, wallMat, capMat, wallMat, wallMat, wallMat]));
  const w = x1 - x0, d = z1 - z0, alongX = w > d;
  const mid = alongX ? (z0 + z1) / 2 : (x0 + x1) / 2;
  const thin = alongX ? { ...rect, z0: mid - 0.02, z1: mid + 0.02 } : { ...rect, x0: mid - 0.02, x1: mid + 0.02 };
  const g = box(thin, 0, WALL_H - 0.18, glassMat); g.castShadow = false; g.receiveShadow = false; walls.add(g);
  const fr = alongX ? { ...rect, z0: mid - 0.04, z1: mid + 0.04 } : { ...rect, x0: mid - 0.04, x1: mid + 0.04 };
  walls.add(box(fr, 0, 0.06, frameMat), box(fr, WALL_H - 0.24, WALL_H - 0.18, frameMat));
  const len = alongX ? w : d, n = Math.max(2, Math.round(len / 1.1) + 1);
  for (let k = 0; k < n; k++) {
    const a = (alongX ? x0 : z0) + (len - 0.06) * k / (n - 1);
    const post = alongX ? { x0: a, x1: a + 0.06, z0: mid - 0.04, z1: mid + 0.04 } : { x0: mid - 0.04, x1: mid + 0.04, z0: a, z1: a + 0.06 };
    walls.add(box(post, 0, WALL_H - 0.18, frameMat));
  }
}
apartment.add(walls);

// ---------- Küche, Bäder, Möbel ----------
const furn = new THREE.Group();      // lose Möblierung (ausblendbar)
const fitout = new THREE.Group();    // Küche und Nasszellen gemäss Ausbaulinie
apartment.add(furn, fitout);
const white = mat(0xfafafa, { roughness: 0.2 });
const steel = mat(0xb8bcc0, { roughness: 0.3, metalness: 0.7 });
const dark = mat(0x1d1f21, { roughness: 0.3 });
const mirror = mat(0xd4e3ea, { roughness: 0.08, metalness: 0.15 });
{
  const front = useMat('front'), stone = useMat('stone');
  // Kochinsel mit Natursteinabdeckung und Kochfeld
  const isl = r(230, 258, 90, 140);
  fitout.add(box({ x0: isl.x0 + 0.03, x1: isl.x1 - 0.03, z0: isl.z0 + 0.03, z1: isl.z1 - 0.03 }, 0.1, 0.88, front));
  fitout.add(box(isl, 0.88, 0.92, stone));
  fitout.add(box(r(236, 252, 100, 124), 0.92, 0.93, dark));
  // Küchenzeile an der Wand: Hochschränke aussen, Arbeitsfläche mit Spüle in der Mitte
  fitout.add(box(r(299, 321, 50, 92), 0.1, 2.2, front));
  fitout.add(box(r(299, 321, 150, 188), 0.1, 2.2, front));
  fitout.add(box(r(299.5, 321, 92, 150), 0.1, 0.88, front));
  fitout.add(box(r(298.5, 321, 92, 150), 0.88, 0.92, stone));
  fitout.add(box(r(320, 321, 92, 150), 0.92, 1.45, stone));            // Rückwand
  fitout.add(box(r(307, 321, 92, 150), 1.45, 2.2, front));              // Oberschränke
  fitout.add(box(r(304, 316, 112, 130), 0.9, 0.925, steel));            // Spülbecken
  fitout.add(box(r(298.6, 299, 56, 88), 0.75, 1.3, dark));              // Backofen
  fitout.add(box(r(298.6, 299, 56, 88), 1.36, 1.82, dark));             // Kombisteamer
  fitout.add(box(r(300, 321, 50, 188), 0, 0.1, dark));                  // Sockel
  // Bad / WC
  const tub = r(507, 571, 50, 82);
  fitout.add(box(tub, 0, 0.56, white));
  fitout.add(box({ x0: tub.x0 + 0.08, x1: tub.x1 - 0.08, z0: tub.z0 + 0.08, z1: tub.z1 - 0.08 }, 0.5, 0.565, mat(0xe9eef0, { roughness: 0.1 })));
  fitout.add(box(r(504, 523, 98, 154), 0.45, 0.85, white));             // Doppelwaschtisch
  fitout.add(box(r(503.2, 508, 98, 154), 1.15, 1.85, mirror));          // Spiegelschrank
  fitout.add(box(r(504, 524, 166, 182), 0.2, 0.42, white));             // WC
  // Dusche / WC
  fitout.add(box(r(538, 594, 296, 313), 0.45, 0.85, white));
  fitout.add(box(r(538, 594, 295.3, 299), 1.15, 1.85, mirror));
  fitout.add(box(r(507, 525, 296, 318), 0.2, 0.42, white));
  const sg = box(r(601, 602.5, 296, 350), 0, 2.0, glassMat); sg.castShadow = false; fitout.add(sg);
  fitout.add(box(r(640, 643, 328, 336), 0.9, 2.1, steel));              // Brausestange
}
const gardMat = useMat('gard');
for (const q of furniture) furn.add(box(q, q.y, q.y + q.h, q.color === 'gard' ? gardMat : mat(q.color)));
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

// ---------- Übriges Gartengeschoss und Gebäude darüber (rote Holzfassade, dunkles Satteldach) ----------
const RED = 0xa8473f;
const restMat = mat(RED, { transparent: true, opacity: 1, map: slatTex.clone() });
restMat.map.repeat.set(30, 1);
const rest = new THREE.Group();
rest.add(box({ x0: outline[0].x1, x1: BUILDING_LEN, z0: 0, z1: outline[1].z0 }, 0, WALL_H, restMat));
rest.add(box({ x0: outline[1].x1, x1: BUILDING_LEN, z0: outline[1].z0, z1: outline[1].z1 }, 0, WALL_H, restMat));
rest.add(box({ x0: outline[2].x1, x1: BUILDING_LEN, z0: outline[1].z1, z1: DEPTH }, 0, WALL_H, restMat));
scene.add(rest);

const upper = new THREE.Group();
const upperMats = [];
const um = (color, o = {}) => { const m = mat(color, { transparent: true, ...o }); upperMats.push(m); return m; };
const slat = (rep) => { const t = slatTex.clone(); t.repeat.set(rep, 1); return t; };
const facade = um(RED, { map: slat(46) }), facadeEnd = um(RED), bandMat = um(0x5a2a26), roofMat = um(0x24262a, { roughness: 0.6 });
const winMat = um(0x1c2226, { roughness: 0.15 }), shutter = um(0x953d36), zinc = um(0xb4b8ba, { roughness: 0.4, metalness: 0.5 });
const balMat = um(0x2e2a29), railMat = um(0x2e2a29), pvMat = um(0x10203c, { roughness: 0.2, metalness: 0.4 });
const STOREY = 2.85, Y0 = WALL_H + 0.25, EAVE = Y0 + 3 * STOREY;
const foot = { x0: 0, x1: BUILDING_LEN, z0: 0, z1: DEPTH };
const addWin = (face, a, y, w = 1.1, h = 2.2) => {
  // face: 'w' (x=0), 'e', 'n' (z=0), 's'
  const t = 0.05;
  const q = face === 'w' ? { x0: -t, x1: 0.02, z0: a, z1: a + w } : face === 'e' ? { x0: BUILDING_LEN - 0.02, x1: BUILDING_LEN + t, z0: a, z1: a + w }
    : face === 'n' ? { x0: a, x1: a + w, z0: -t, z1: 0.02 } : { x0: a, x1: a + w, z0: DEPTH - 0.02, z1: DEPTH + t };
  const m = box(q, y, y + h, winMat); m.castShadow = false; upper.add(m);
  const s = { ...q };
  if (face === 'w' || face === 'e') { s.z0 = a + w; s.z1 = a + w + 0.45; s.x0 -= 0.04; s.x1 += 0.04; } else { s.x0 = a + w; s.x1 = a + w + 0.45; s.z0 -= 0.04; s.z1 += 0.04; }
  upper.add(box(s, y, y + h, shutter));
};
const addBalcony = (face, a, y, w = 3.2, d = 1.4) => {
  const q = face === 'w' ? { x0: -d, x1: 0, z0: a, z1: a + w } : { x0: a, x1: a + w, z0: DEPTH, z1: DEPTH + d };
  upper.add(box(q, y - 0.16, y, balMat));
  // Geländer aus Stäben
  const n = Math.round(w / 0.14);
  for (let k = 0; k <= n; k++) {
    const b = a + (w - 0.03) * k / n;
    upper.add(box(face === 'w' ? { x0: -d, x1: -d + 0.03, z0: b, z1: b + 0.03 } : { x0: b, x1: b + 0.03, z0: DEPTH + d - 0.03, z1: DEPTH + d }, y, y + 1.0, railMat));
  }
  upper.add(box(face === 'w' ? { x0: -d, x1: -d + 0.05, z0: a, z1: a + w } : { x0: a, x1: a + w, z0: DEPTH + d - 0.05, z1: DEPTH + d }, y + 1.0, y + 1.05, railMat));
};
for (let i = 0; i < 3; i++) {
  const y = Y0 + i * STOREY;
  upper.add(box(foot, y - 0.25, y + STOREY - 0.25, facade));
  upper.add(box({ x0: -0.06, x1: BUILDING_LEN + 0.06, z0: -0.06, z1: DEPTH + 0.06 }, y - 0.25, y - 0.12, bandMat));
  for (let k = 0; k < 8; k++) {
    const x = 1.5 + k * 3.25 + (i % 2 ? 0.7 : 0);
    addWin('n', x, y + 0.05); addWin('s', x, y + 0.05);
  }
  // Giebelseite West: versetzte Fenster und Balkone wie in der Visualisierung
  const zs = i % 2 ? [1.2, 5.6, 10.6] : [2.4, 7.2, 11.2];
  zs.forEach((z) => addWin('w', z, y + 0.05, 1.3));
  addBalcony('w', i % 2 ? 4.6 : 1.4, y + 0.05);
  addBalcony('w', i % 2 ? 9.6 : 8.2, y + 0.05, 2.6);
  [1.5, 6, 10.5].forEach((z) => addWin('e', z, y + 0.05));
  if (i > 0) addBalcony('s', 17 + (i % 2) * 3, y + 0.05, 3.0);
}
{
  const E = EAVE - 0.25;
  upper.add(box({ x0: -0.06, x1: BUILDING_LEN + 0.06, z0: -0.06, z1: DEPTH + 0.06 }, E - 0.02, E + 0.1, bandMat));
  // Satteldach: First entlang der Längsachse, Giebelfelder in Holz
  const h = 6.2, o = 0.35;
  const body = new THREE.Shape();
  body.moveTo(0, 0); body.lineTo(DEPTH, 0); body.lineTo(DEPTH / 2, h); body.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(body, { depth: BUILDING_LEN, bevelEnabled: false }), [facadeEnd, facadeEnd]);
  gable.rotation.y = -Math.PI / 2; gable.position.set(BUILDING_LEN, E, 0); gable.castShadow = true; upper.add(gable);
  const slope = Math.atan2(h, DEPTH / 2), len = Math.hypot(h, DEPTH / 2) + 0.6;
  for (const side of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(BUILDING_LEN + 2 * o, 0.16, len), roofMat);
    p.position.set(BUILDING_LEN / 2, E + h / 2 + 0.03, DEPTH / 2 + side * (DEPTH / 4 + 0.14));
    p.rotation.x = side * slope; p.castShadow = true; upper.add(p);
    // Photovoltaik: Modulraster auf dem Hauptdach (Baubeschrieb Pos. 239), Lage schematisch
    for (let k = 0; k < 12; k++) {
      if (side === -1 && k >= 1 && k <= 3) continue; // Platz für den Dachaufbau
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, len * 0.7), pvMat);
      m.position.set(1.9 + k * 2.15, E + h / 2 + 0.15, DEPTH / 2 + side * (DEPTH / 4 + 0.12));
      m.rotation.x = side * slope; upper.add(m);
    }
  }
  // Giebelfenster und Balkone im Dachgeschoss (West)
  addWin('w', DEPTH / 2 - 2.9, E + 0.2, 1.3); addWin('w', DEPTH / 2 + 1.2, E + 0.2, 1.3);
  addBalcony('w', DEPTH / 2 - 0.6, E + 0.2, 3.0);
  addWin('w', DEPTH / 2 - 0.65, E + 3.0, 1.3, 1.9);
  addBalcony('w', DEPTH / 2 - 1.2, E + 3.0, 2.4, 1.1);
  addWin('e', DEPTH / 2 - 2.2, E + 0.2, 1.3); addWin('e', DEPTH / 2 + 0.9, E + 0.2, 1.3);
  // Dachaufbau in Zinkblech auf der Nordseite
  upper.add(box({ x0: 3.2, x1: 9.2, z0: 0.5, z1: 5.4 }, E + 0.3, E + 3.4, zinc));
  const dw = box({ x0: 3.6, x1: 5.8, z0: 0.44, z1: 0.52 }, E + 0.9, E + 3.1, winMat); upper.add(dw);
}
scene.add(upper);

// ---------- Nordpfeil ----------
{
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.6, 3), mat(0x6f5560));
  arrow.rotation.x = Math.PI / 2;
  const g = new THREE.Group(); g.add(arrow);
  g.position.set(-7, 0.1, -3);
  g.lookAt(g.position.clone().add(NORTH));
  scene.add(g);
}

// ---------- Beschriftungen und Masse ----------
const labelLayer = document.getElementById('labels');
const labels = [];
const addLabel = (pos, html, cls = '') => {
  const el = document.createElement('div');
  el.className = 'label ' + cls; el.innerHTML = html; labelLayer.appendChild(el);
  const l = { pos, el, group: cls.split(' ').pop() }; labels.push(l); return l;
};
const centers = {};
for (const room of rooms) {
  centers[room.id] = center(room);
  const l = addLabel(centers[room.id].clone().setY(0.3), `<b>${room.name}</b><span>${room.area.toFixed(1)} m²</span>`, 'room');
  l.id = room.id;
  l.el.addEventListener('click', () => focusRoom(room.id));
}
addLabel(new THREE.Vector3(-1.75, 0.2, 10.5), `<b>Garten</b><span>${garden.area.toFixed(1)} m²</span>`, 'out room');
addLabel(new THREE.Vector3((terrace.x0 + terrace.x1) / 2, 0.2, (terrace.z0 + terrace.z1) / 2), `<b>Terrasse</b><span>${terrace.area} m²</span>`, 'out room');
addLabel(new THREE.Vector3(21.5, WALL_H, 7), '<b>Keller · Velos · Waschen · Autolift</b>', 'out room');
addLabel(new THREE.Vector3(-7, 1.2, -3), '<b>N</b>', 'north');
addLabel(new THREE.Vector3(13.5, EAVE + 7, DEPTH / 2), '<b>Photovoltaik</b><span>auf dem Hauptdach</span>', 'building');
addLabel(new THREE.Vector3(-1.6, 1.6, DEPTH * 0.75), '<b>Wohnung 01</b><span>Gartengeschoss</span>', 'building');

// Masslinien: dünner Strich am Boden mit Endmarken, Wert aus dem Modell (gerundet, ca.)
const dims = new THREE.Group(); apartment.add(dims);
const dimMat = new THREE.MeshBasicMaterial({ color: 0x2e2629 });
function dim(x0, z0, x1, z1, y = 0.035) {
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0), t = 0.035, k = 0.14;
  const line = alongX ? { x0, x1, z0: z0 - t / 2, z1: z0 + t / 2 } : { x0: x0 - t / 2, x1: x0 + t / 2, z0, z1 };
  const mk = (q) => { const m = box(q, y, y + 0.012, dimMat); m.castShadow = m.receiveShadow = false; dims.add(m); };
  mk(line);
  for (const e of [0, 1]) {
    const a = e ? (alongX ? x1 : z1) : (alongX ? x0 : z0);
    mk(alongX ? { x0: a - t / 2, x1: a + t / 2, z0: z0 - k, z1: z0 + k } : { x0: x0 - k, x1: x0 + k, z0: a - t / 2, z1: a + t / 2 });
  }
  addLabel(new THREE.Vector3((x0 + x1) / 2, y + 0.05, (z0 + z1) / 2), `${L.toFixed(1)} m`, 'dim');
}
{
  const R = Object.fromEntries(rooms.map((q) => [q.id, q.rects[0]]));
  const both = (q, ox = 0.45, oz = 0.45) => { dim(q.x0, q.z1 - oz, q.x1, q.z1 - oz); dim(q.x0 + ox, q.z0, q.x0 + ox, q.z1); };
  both(R.kueche, 0.4, 0.3); both(R.zimmer1); both(R.zimmer2); both(R.zimmer3);
  dim(R.wohnen.x0, R.wohnen.z0 + 1.2, R.wohnen.x1, R.wohnen.z0 + 1.2);
  dim(R.wohnen.x0 + 0.4, R.wohnen.z0, R.wohnen.x0 + 0.4, R.wohnen.z1);
  dim(R.korridor.x0, R.korridor.z1 - 0.3, R.korridor.x1, R.korridor.z1 - 0.3);
  dim(R.bad.x0, R.bad.z1 - 0.4, R.bad.x1, R.bad.z1 - 0.4);
  dim(R.dusche.x0, R.dusche.z1 - 0.3, R.dusche.x1, R.dusche.z1 - 0.3);
  // Aussenmasse, Garten, Terrasse
  dim(0, -0.7, outline[1].x1, -0.7); dim(outline[1].x1 + 0.7, 0, outline[1].x1 + 0.7, DEPTH);
  dim(garden.rects[0].x0, 5.2, 0, 5.2); dim(garden.rects[0].x0 + 0.5, 0, garden.rects[0].x0 + 0.5, garden.rects[0].z1);
  dim(0, garden.rects[1].z1 - 0.5, garden.rects[1].x1, garden.rects[1].z1 - 0.5);
  dim(garden.rects[1].x1 - 0.5, DEPTH, garden.rects[1].x1 - 0.5, garden.rects[1].z1);
}
let dimsOn = true;

const v = new THREE.Vector3();
function updateLabels() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  for (const l of labels) {
    v.copy(l.pos); if (l.group === 'building' && l.pos.y > 5) v.y += ease(lift) * 26;
    const dist = v.distanceTo(camera.position);
    v.project(camera);
    const vis = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    let show = l.group === 'building' ? 1 - lift : l.group === 'north' ? (walking ? 0 : 1) : lift;
    if (l.group === 'room' && walking) show = 0;
    if (l.group === 'dim') show = dimsOn && dist < (walking ? 4.2 : 45) ? lift : 0;
    l.el.style.opacity = vis ? show : 0;
    l.el.style.pointerEvents = vis && show > 0.6 && l.id ? 'auto' : 'none';
    l.el.style.transform = `translate(-50%,-50%) translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px)`;
    l.el.classList.toggle('active', !!l.id && l.id === activeRoom);
  }
}

// ---------- Zustand und Animation ----------
let lift = 0, liftTarget = 0;   // 0 = Gebäude geschlossen, 1 = Geschosse abgehoben
let activeRoom = null, token = 0, playing = false, walking = false;
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
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
const AC = [7.5, 0, 6.9];
const roomView = (id) => {
  const c = centers[id], narrow = innerWidth < 760;
  return [[c.x - 3.6, narrow ? 21 : 11.5, c.z + (narrow ? 11 : 8.2)], [c.x, 0.4, c.z]];
};
const caption = document.getElementById('caption');
function setCaption(title, text) {
  caption.innerHTML = title ? `<b>${title}</b>${text ? `<span>${text}</span>` : ''}` : '';
  caption.classList.toggle('show', !!title);
}
function setActive(id) {
  activeRoom = id;
  for (const [k, m] of Object.entries(roomFloors)) { m.emissive.setHex(k === id ? 0x6f5560 : 0x000000); m.emissiveIntensity = 0.22; }
  document.querySelectorAll('.chip[data-id]').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
}
async function focusRoom(id) {
  if (walking) { standIn(id); return; }
  stop();
  const tk = token; liftTarget = 1; setActive(id);
  const room = rooms.find((q) => q.id === id);
  setCaption(`${room.name} · ${room.area.toFixed(1)} m²`, room.note);
  const [p, t] = roomView(id);
  await fly(p, t, 1400, tk);
}
function stop() { token++; playing = false; playBtn.textContent = 'Tour starten'; }

async function tour() {
  if (walking) setWalk(false);
  token++; const tk = token; playing = true; playBtn.textContent = 'Tour anhalten';
  const far = innerWidth < 760 ? 1.45 : 1;
  setActive(null); liftTarget = 0;
  setCaption('Seefeldstrasse 14, Uster', 'Ersatzneubau mit 11 Eigentumswohnungen, Bezug Ende 2028');
  if (!await fly([-24 * far, 15 * far, -16 * far], [11, 7, 7], 1600, tk)) return;
  if (!await fly([-22 * far, 17 * far, 34 * far], [11, 7, 7], 6500, tk)) return;
  setCaption('Photovoltaik auf dem Hauptdach', 'Wärmepumpe mit Erdsonden, Freecooling im Sommer');
  if (!await fly([13, 40 * far, 30 * far], [13, 10, 7], 3200, tk)) return;
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
  setCaption('Privater Garten · 97.0 m²', 'Südwestseite, dazu 5.5 m² Terrasse vor dem Jahreszeitenzimmer');
  if (!await fly([-13 * far, 8 * far, 22 * far], [1, 0, 10], 2800, tk)) return;
  if (!await sleep(2600, tk)) return;
  setCaption("CHF 1'890'000", 'Frei zoomen oder mit «Begehen» durch die Wohnung laufen');
  if (!await fly([-8 * far, 17 * far, 24 * far], AC, 2600, tk)) return;
  playing = false; playBtn.textContent = 'Tour nochmals';
}

// ---------- Begehen (Ich-Perspektive) ----------
const EYE = 1.62;
const LOOK = { kueche: [-1, 0.15], wohnen: [-0.55, -0.85], zimmer1: [-0.2, -1], zimmer2: [0.1, 1], zimmer3: [-0.3, 1], korridor: [-1, 0.1], bad: [-0.3, -1], dusche: [1, 0.2], garderobe: [1, 0.3], abstell: [1, 0.2] };
function standIn(id) {
  const c = centers[id], q = rooms.find((x) => x.id === id).rects[0], [dx, dz] = LOOK[id], n = Math.hypot(dx, dz);
  let k = 0.32;
  for (; k > 0; k -= 0.08) {
    const x = c.x - dx / n * (q.x1 - q.x0) * k, z = c.z - dz / n * (q.z1 - q.z0) * k;
    if (!blocked(x, z)) { camera.position.set(x, EYE, z); break; }
  }
  if (k <= 0) camera.position.set(c.x, EYE, c.z);
  yaw = Math.atan2(dx, -dz); pitch = -0.12; walkTarget = null;
}
let yaw = 0, pitch = 0, walkTarget = null, teleport = false;
const keys = new Set();
const allowedOutside = [terrace, ...garden.rects];
const passable = [windows[2]]; // Jahreszeitenzimmer: Front zur Terrasse ist öffenbar
function blockedPoint(x, z) {
  if (inAny(x, z, outline)) { const t = typeAt(x, z); return t === 1 || (t === 2 && !inAny(x, z, passable)); }
  return !inAny(x, z, allowedOutside);
}
function blocked(x, z) {
  const rr = 0.22;
  return blockedPoint(x + rr, z) || blockedPoint(x - rr, z) || blockedPoint(x, z + rr) || blockedPoint(x, z - rr);
}
function tryMove(dx, dz) {
  const p = camera.position;
  if (!blocked(p.x + dx, p.z + dz)) { p.x += dx; p.z += dz; return true; }
  if (!blocked(p.x + dx, p.z)) { p.x += dx; return true; }
  if (!blocked(p.x, p.z + dz)) { p.z += dz; return true; }
  return false;
}
function setWalk(on) {
  if (on === walking) return;
  stop(); walking = on; controls.enabled = !on;
  walkBtn.classList.toggle('active', on); walkBtn.textContent = on ? 'Begehen beenden' : 'Begehen';
  if (on) {
    liftTarget = 1; setActive(null);
    standIn('wohnen'); camera.fov = 68; camera.updateProjectionMatrix();
    caption.dataset.w = '';
  } else {
    camera.fov = 42; camera.updateProjectionMatrix(); walkTarget = null;
    camera.position.set(-8, 17, 24); controls.target.set(...AC);
    setCaption('Wohnung 01 im Gartengeschoss', '');
  }
  hint.classList.toggle('show', on);
}
let down = null;
const ray = new THREE.Raycaster();
canvas.addEventListener('pointerdown', (e) => { if (playing) stop(); down = { x: e.clientX, y: e.clientY, moved: 0 }; });
addEventListener('pointermove', (e) => {
  if (!down || !walking) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  down.moved += Math.abs(dx) + Math.abs(dy); down.x = e.clientX; down.y = e.clientY;
  yaw -= dx * 0.0042; pitch = THREE.MathUtils.clamp(pitch + dy * 0.0042, -1.2, 1.2);
});
addEventListener('pointerup', (e) => {
  if (down && walking && down.moved < 7) {
    const b = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(floorTargets, false)[0];
    if (hit) { walkTarget = hit.point.clone(); teleport = false; }
  }
  down = null;
});
canvas.addEventListener('wheel', (e) => {
  if (playing) stop();
  if (!walking) return;
  e.preventDefault();
  const s = THREE.MathUtils.clamp(-e.deltaY * 0.004, -0.6, 0.6); walkTarget = null;
  tryMove(Math.sin(yaw) * s, -Math.cos(yaw) * s);
}, { passive: false });
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setWalk(false);
  if (walking && !e.metaKey && !e.ctrlKey) { keys.add(e.key.toLowerCase()); if (e.key.startsWith('Arrow')) e.preventDefault(); }
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
function walkStep(dt) {
  const fx = Math.sin(yaw), fz = -Math.cos(yaw); // Blickrichtung in der Ebene
  let mf = 0, ms = 0, turn = 0;
  if (keys.has('w') || keys.has('arrowup')) mf += 1;
  if (keys.has('s') || keys.has('arrowdown')) mf -= 1;
  if (keys.has('d')) ms += 1;
  if (keys.has('a')) ms -= 1;
  if (keys.has('arrowleft')) turn -= 1;
  if (keys.has('arrowright')) turn += 1;
  yaw += turn * dt * 1.8;
  if (mf || ms) {
    walkTarget = null; const sp = 2.4 * dt;
    tryMove((fx * mf - fz * ms) * sp, (fz * mf + fx * ms) * sp);
  }
  if (walkTarget) {
    const p = camera.position, dx = walkTarget.x - p.x, dz = walkTarget.z - p.z, d = Math.hypot(dx, dz);
    if (teleport) { p.x = walkTarget.x; p.z = walkTarget.z; walkTarget = null; }
    else if (d < 0.08) walkTarget = null;
    else { const sp = Math.min(d, 3.2 * dt); if (!tryMove(dx / d * sp, dz / d * sp)) walkTarget = null; }
  }
  camera.position.y = EYE;
  camera.rotation.set(pitch, -yaw, 0, 'YXZ');
  const here = rooms.find((q) => inAny(camera.position.x, camera.position.z, q.rects));
  const name = here ? `${here.name} · ${here.area.toFixed(1)} m²` : inRect(camera.position.x, camera.position.z, terrace) ? 'Terrasse · 5.5 m²' : 'Garten · 97.0 m²';
  if (caption.dataset.w !== name) { caption.dataset.w = name; setCaption(name, here ? here.note : ''); }
}

// ---------- Bedienung ----------
const hint = document.getElementById('hint');
const playBtn = document.getElementById('play');
playBtn.addEventListener('click', () => (playing ? stop() : tour()));
const walkBtn = document.getElementById('walk');
walkBtn.addEventListener('click', () => setWalk(!walking));
const bldBtn = document.getElementById('building');
bldBtn.addEventListener('click', () => { if (walking) setWalk(false); stop(); liftTarget = liftTarget > 0.5 ? 0 : 1; });
const furnBtn = document.getElementById('furn');
furnBtn.addEventListener('click', () => { furn.visible = !furn.visible; furnBtn.classList.toggle('off', !furn.visible); });
const dimBtn = document.getElementById('dims');
dimBtn.addEventListener('click', () => { dimsOn = !dimsOn; dims.visible = dimsOn; dimBtn.classList.toggle('off', !dimsOn); });
const sunLabel = document.getElementById('sunLabel'), sunInput = document.getElementById('sun'), sunPlay = document.getElementById('sunPlay');
let sunRun = false;
sunInput.addEventListener('input', () => { sunHour = +sunInput.value; applySun(); });
sunPlay.addEventListener('click', () => { sunRun = !sunRun; sunPlay.textContent = sunRun ? 'Pause' : 'Tagesverlauf'; });

const chips = document.getElementById('chips');
for (const room of rooms) {
  const b = document.createElement('button');
  b.className = 'chip'; b.dataset.id = room.id;
  b.innerHTML = `${room.name}<i>${room.area.toFixed(1)}</i>`;
  b.addEventListener('click', () => focusRoom(room.id));
  chips.appendChild(b);
}
const linien = document.getElementById('linien');
ausbaulinien.forEach((l, i) => {
  const b = document.createElement('button'); b.className = 'chip linie'; b.textContent = l.name;
  b.addEventListener('click', () => applyLinie(i)); linien.appendChild(b);
});
const groups = document.getElementById('groups');
groups.innerHTML = facts.gruppen.map((g, i) => `
  <details ${i < 1 ? 'open' : ''}><summary>${g.titel}</summary>
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
applyLinie(0);
applySun();

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  lift += (liftTarget - lift) * Math.min(1, dt * 2.2);
  upper.position.y = ease(lift) * 26;
  const op = 1 - lift;
  upper.visible = lift < 0.58;
  for (const m of upperMats) m.opacity = Math.max(0, 1 - lift * 1.7);
  restMat.opacity = 0.35 + 0.65 * op;
  bldBtn.textContent = liftTarget > 0.5 ? 'Gebäude zeigen' : 'Wohnung zeigen';
  if (sunRun) { sunHour += dt * 0.6; if (sunHour > 21) sunHour = 6; sunInput.value = sunHour; applySun(); }
  if (walking) walkStep(dt); else controls.update();
  renderer.render(scene, camera);
  updateLabels();
  requestAnimationFrame(frame);
}

camera.position.set(-24, 15, -16); controls.target.set(11, 7, 7);
frame();
window.__app = { setWalk, stop, camera, controls, setSun(h) { sunHour = h; sunInput.value = h; applySun(); }, setLift(x) { liftTarget = x; } };
if (matchMedia('(prefers-reduced-motion: reduce)').matches || location.hash === '#still') {
  liftTarget = 1; camera.position.set(-8, 17, 24); controls.target.set(...AC);
  setCaption('Wohnung 01 im Gartengeschoss', 'Tour mit dem Knopf starten');
  playBtn.textContent = 'Tour starten';
} else {
  tour();
}
