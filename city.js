/* ---------- MePocket City ----------
   The money drawn as a little city. Loaded only when the city is opened (app.js → openCity()).
   - Pocket Save = head office (HQ) in the middle, every other Pocket = a company in the group,
     every goal box = a small business. A new card gets the next empty plot.
   - Floors + staff = how big the company has ever grown (its highest balance, never goes down).
   - Crates in the yard = the money there right now (Pocket Cashflow: green = cash, blue = bank).
   - Trucks = money moving: in from outside town (income), out of town (spending, which is fine),
     or between companies (transfers).
   - Auto deposits / withdrawals that are still waiting sit on the lobby chairs as a queue.
   Tap a building to open it: the floors spread apart so you can see the desks inside. */
(function () {
'use strict';
const THREE = window.THREE;
if (!THREE) return;

const PREF_KEY = 'mepocket-city-v1';
const P = 14;                 // block pitch (block + road)
const HALF = 5.2;             // half a block, sidewalk edge
const ROADW = 3.6;
const BASE_Y = 0.12;          // top of the sidewalk slab
const ACC_T = [0, 2000, 8000, 20000, 50000, 120000, 300000, 750000];   // highest balance (THB) for each level
const SPIRAL = [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1],[2,0],[0,2],[-2,0],[0,-2],[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1],[2,2],[-2,2],[-2,-2],[2,-2]];
const SKIN = [0xf1c7a5, 0xd9a47c, 0xb57b55, 0x8a5a3c];
const SHIRTS = [0x3d6fd8, 0xe0574f, 0x2fa877, 0xf2a93b, 0x8e5bd8, 0x2d3440, 0x19a3b5, 0xe8789f];
const DIMS = {
  hq:   { w: 6.4, d: 6.0, fh: 1.6 },
  sub:  { w: 5.8, d: 5.2, fh: 1.5 },
  goal: { w: 3.2, d: 2.8, fh: 1.25 }
};
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- small helpers ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const col = c => (c instanceof THREE.Color ? c : new THREE.Color(c));
const tint = (c, w, to = 0xffffff) => col(c).clone().lerp(col(to), w);
const safeColor = (hex, fallback) => { try { const c = new THREE.Color(hex || fallback); return c; } catch (e) { return new THREE.Color(fallback); } };
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; }
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
const escH = v => String(v ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
const hidden = () => Boolean(state.settings && state.settings.hideBalances);
const money = (v, cur = 'THB') => hidden() ? '••••' : formatAmount(v, cur);
const rate = cur => (typeof rateOf === 'function' ? rateOf(cur) : 1);
const svg = name => `<svg class="mpc-ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function loadPrefs() {
  try { const p = JSON.parse(localStorage.getItem(PREF_KEY)); if (p && typeof p === 'object') return { peaks: p.peaks || {}, seen: Array.isArray(p.seen) ? p.seen : [] }; } catch (e) {}
  return { peaks: {}, seen: [] };
}
let prefSaveTimer = 0;
function savePrefs() {
  clearTimeout(prefSaveTimer);
  prefSaveTimer = setTimeout(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }, 400);
}

/* geometry baker: many coloured boxes / cylinders merged into one mesh = few draw calls on the phone */
const UNIT = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), ball: new THREE.IcosahedronGeometry(1, 1), lump: new THREE.IcosahedronGeometry(1, 0), cone: new THREE.ConeGeometry(1, 1, 7) };
const NONIDX = {};
Object.keys(UNIT).forEach(k => { NONIDX[k] = UNIT[k].index ? UNIT[k].toNonIndexed() : UNIT[k]; });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Matrix3();
class Bake {
  constructor() { this.p = []; this.n = []; this.c = []; }
  add(kind, x, y, z, sx, sy, sz, color, ry = 0) {
    const g = NONIDX[kind];
    _m.compose(_v.set(x, y, z), _q.setFromAxisAngle(UP, ry), _s.set(sx, sy, sz));
    _n.getNormalMatrix(_m);
    const pa = g.attributes.position.array, na = g.attributes.normal.array, c = col(color);
    const e = _m.elements, ne = _n.elements;
    for (let i = 0; i < pa.length; i += 3) {
      const px = pa[i], py = pa[i + 1], pz = pa[i + 2];
      this.p.push(e[0] * px + e[4] * py + e[8] * pz + e[12], e[1] * px + e[5] * py + e[9] * pz + e[13], e[2] * px + e[6] * py + e[10] * pz + e[14]);
      const nx = na[i], ny = na[i + 1], nz = na[i + 2];
      let ox = ne[0] * nx + ne[3] * ny + ne[6] * nz, oy = ne[1] * nx + ne[4] * ny + ne[7] * nz, oz = ne[2] * nx + ne[5] * ny + ne[8] * nz;
      const L = Math.hypot(ox, oy, oz) || 1;
      this.n.push(ox / L, oy / L, oz / L);
      this.c.push(c.r, c.g, c.b);
    }
  }
  box(x, y, z, w, h, d, color, ry = 0) { this.add('box', x, y, z, w, h, d, color, ry); }
  cyl(x, y, z, r, h, color) { this.add('cyl', x, y, z, r, h, r, color); }
  ball(x, y, z, r, color) { this.add('ball', x, y, z, r, r, r, color); }
  lump(x, y, z, r, color) { this.add('lump', x, y, z, r, r * 0.9, r, color); }
  cone(x, y, z, r, h, color) { this.add('cone', x, y, z, r, h, r, color); }
  mesh(material, shadows) {
    if (!this.p.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material);
    if (shadows) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }
}
const MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
const LIT = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
const GLASS = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: 0x8899aa });   // the HQ tower catches the sun
const PICK = new THREE.MeshBasicMaterial({ visible: false });

function disposeTree(obj) {
  obj.traverse(o => { if (o.geometry && !Object.values(UNIT).includes(o.geometry)) o.geometry.dispose(); });
}

/* ---------- state ---------- */
let prefs = loadPrefs();
let root, canvas, renderer, scene, camera, hemi, sun, tagLayer, feedEl, panelEl, chipsEl, hudValue, hudLevel, hudClock, loadingEl;
let world = null;
let opened = false, raf = 0, lastT = 0, frameFlip = false, quality = 'pretty', night = false;
let openKey = null, focusAfterBuild = null;
const actors = [];
const bubbles = [];
const cam = { tx: 0, ty: 0.8, tz: 0, az: Math.PI / 4, pol: 0.92, dist: 60 };
const goal = { tx: 0, ty: 0.8, tz: 0, az: Math.PI / 4, pol: 0.92, dist: 60 };
const BASE_FOV = 32;
const GAP = 0.7;   // how far the floors spread apart when a building is opened
const raycaster = new THREE.Raycaster();
let clockTimer = 0;

/* ---------- what is in the city ---------- */
const keyOfAccount = id => `a:${id}`;
const keyOfGoal = id => `g:${id}`;
function entityKeyFromTx(id) { if (!id) return null; return String(id).startsWith('goal:') ? keyOfGoal(String(id).slice(5)) : keyOfAccount(id); }

function entityList() {
  const accs = state.accounts || [];
  const hq = accs.find(a => !isCashflow(a) && /save/i.test(a.name || '')) || accs.find(a => !isCashflow(a)) || accs[0];
  const list = [];
  if (hq) list.push({ key: keyOfAccount(hq.id), kind: 'hq', ent: hq });
  accs.forEach(a => { if (a !== hq) list.push({ key: keyOfAccount(a.id), kind: 'sub', ent: a }); });
  const maxPockets = typeof MAX_POCKETS === 'number' ? MAX_POCKETS : 4;
  const lots = Math.max(0, Math.min(2, maxPockets - accs.length));
  for (let k = 0; k < lots; k++) list.push({ key: `lot:${k}`, kind: 'lot', ent: null });
  (state.goals || []).forEach(g => list.push({ key: keyOfGoal(g.id), kind: 'goal', ent: g }));
  return list;
}
function valueTHB(item) {
  if (!item.ent) return 0;
  return item.kind === 'goal' ? Number(item.ent.balance) || 0 : (Number(item.ent.balance) || 0) * rate(item.ent.currency);
}
function entityColor(item) {
  if (item.kind === 'goal') return safeColor(item.ent.color, '#a987ff');
  if (item.kind === 'lot') return new THREE.Color('#c9b48a');
  return safeColor(item.ent.badgeColor, '#4f8cff');
}
const capAcc = L => (L <= 0 ? 0 : 3 + 6 * (L - 1));
function statsFor(item, peak, value) {
  if (item.kind === 'goal') {
    const target = Number(item.ent.target) || 0;
    const pct = target > 0 ? peak / target : 0;
    const stage = pct <= 0 ? 0 : pct < 0.3 ? 1 : pct < 0.7 ? 2 : pct < 1 ? 3 : 4;
    const floors = stage <= 1 ? 1 : stage === 2 ? 2 : 3;
    const cap = 1 + 3 * (floors - 1);
    let staff = Math.min(cap, Math.ceil(cap * clamp(pct)));
    if (peak > 0) staff = Math.max(1, staff);
    const steps = [0.3, 0.7, 1];
    const nextAt = stage < 4 ? target * steps[Math.max(0, stage - 1)] : null;
    const prevAt = stage <= 1 ? 0 : target * steps[stage - 2];
    const crates = target > 0 ? Math.round(6 * clamp(value / target)) : 0;
    return { level: stage, floors, staff, cap, nextAt, prevAt, crates, cratesMax: 6, pct, done: stage === 4 };
  }
  let L = 1;
  for (let i = 1; i < ACC_T.length; i++) if (peak >= ACC_T[i]) L = i + 1;
  const lo = ACC_T[L - 1], hi = ACC_T[L] != null ? ACC_T[L] : ACC_T[L - 1] * 2.5;
  const frac = clamp((peak - lo) / (hi - lo));
  const capPrev = L > 1 ? capAcc(L - 1) : 0;
  let staff = Math.min(capAcc(L), capPrev + Math.ceil((capAcc(L) - capPrev) * frac));
  if (peak > 0) staff = Math.max(1, staff);
  const crates = peak > 0 ? Math.round(24 * clamp(value / Math.max(peak, ACC_T[L - 1] || 1))) : 0;
  const floors = item.kind === 'hq' ? L + 1 : L;          // the HQ has an extra top floor for the boardroom
  return { level: L, floors, staff, cap: capAcc(L), nextAt: ACC_T[L] != null ? ACC_T[L] : null, prevAt: lo, crates, cratesMax: 24 };
}

/* ---------- layout ---------- */
function planLayout(list) {
  const placed = [];
  let s = 0;
  list.forEach(item => {
    if (item.kind === 'hq') placed.push({ item, i: 0, j: 0, q: -1 });
  });
  list.filter(it => it.kind === 'sub' || it.kind === 'lot').forEach(item => {
    const [i, j] = SPIRAL[s++] || [s, 3]; placed.push({ item, i, j, q: -1 });
  });
  const goals = list.filter(it => it.kind === 'goal');
  for (let g = 0; g < goals.length; g += 4) {
    const [i, j] = SPIRAL[s++] || [s, 3];
    goals.slice(g, g + 4).forEach((item, q) => placed.push({ item, i, j, q }));
  }
  if (!placed.some(p => p.i === 0 && p.j === 0)) placed.push({ item: { key: 'park:0', kind: 'park' }, i: 0, j: 0, q: -1 });
  return placed;
}
const layoutSig = list => list.map(it => it.key + ':' + it.kind).join('|');

/* ---------- people & props ---------- */
function person(b, x, y, z, seed, seated = true) {
  const r = rng(seed);
  const shirt = SHIRTS[Math.floor(r() * SHIRTS.length)], skin = SKIN[Math.floor(r() * SKIN.length)];
  if (!seated) { b.box(x - 0.07, y + 0.17, z, 0.1, 0.34, 0.12, 0x2b3038); b.box(x + 0.07, y + 0.17, z, 0.1, 0.34, 0.12, 0x2b3038); y += 0.3; }
  b.cyl(x, y + 0.28, z, 0.15, 0.4, shirt);
  b.ball(x, y + 0.6, z, 0.13, skin);
  b.box(x, y + 0.71, z - 0.02, 0.24, 0.07, 0.24, r() > 0.5 ? 0x2a211c : 0x5a3b28);
}
function desk(b, x, y, z, staffed, seed, monitorLit) {
  b.box(x, y + 0.43, z, 0.95, 0.06, 0.52, 0xf4efe6);
  b.box(x, y + 0.2, z - 0.05, 0.88, 0.4, 0.4, 0xd9d2c4);
  b.box(x, y + 0.62, z - 0.13, 0.42, 0.28, 0.04, 0x2b2f36);
  if (monitorLit) monitorLit.box(x, y + 0.62, z - 0.105, 0.36, 0.22, 0.01, 0x9fd3ff);
  b.box(x, y + 0.24, z + 0.5, 0.34, 0.06, 0.34, 0x3a3f48);
  b.box(x, y + 0.44, z + 0.66, 0.34, 0.36, 0.05, 0x3a3f48);
  if (staffed) person(b, x, y + 0.02, z + 0.48, seed);
}

/* ---------- one building ---------- */
function buildBuilding(B) {
  if (B.group) { scene.remove(B.group); disposeTree(B.group); }
  const g = new THREE.Group();
  B.group = g; B.floors = []; B.roof = null; B._dirty = true;
  const shadows = quality === 'pretty';
  const { kind } = B;
  if (kind === 'lot' || kind === 'park') { buildLot(B, g); scene.add(g); return; }
  const D = DIMS[kind === 'goal' ? 'goal' : kind], st = B.stats;
  const w = D.w, d = D.d, fh = D.fh;
  const ec = entityColor(B.item);
  const wall = kind === 'hq' ? new THREE.Color(0x2c4f5f) : kind === 'goal' ? new THREE.Color(0xfbf4e8) : tint(ec, 0.58, 0xf6f7f4);
  const trim = kind === 'hq' ? new THREE.Color(0x1d3540) : kind === 'goal' ? tint(ec, 0.15, 0x000000) : tint(ec, 0.25, 0x223038);
  const glass = kind === 'hq' ? 0x7cc4d6 : 0x9cc3d8;
  const cash = isCashflow(B.item.ent || {});
  const seedBase = hash(B.key);

  // building group sits on its plot and faces the road (front = local +z)
  g.position.set(B.bx, BASE_Y, B.bz);
  g.rotation.y = B.f > 0 ? 0 : Math.PI;

  for (let fi = 0; fi < st.floors; fi++) {
    const fg = new THREE.Group();
    const inner = new Bake(), shell = new Bake(), lit = new Bake(), screens = new Bake();
    const isTop = kind === 'hq' && fi === st.floors - 1;
    // slab + low rim (the rim stays when the walls are hidden, like a cut-away model)
    inner.box(0, 0.06, 0, w, 0.12, d, fi === 0 ? 0xe9e4da : 0xefeae1);
    const rimH = 0.32, t = 0.12;
    inner.box(0, 0.12 + rimH / 2, -d / 2 + t / 2, w, rimH, t, wall);
    inner.box(-w / 2 + t / 2, 0.12 + rimH / 2, 0, t, rimH, d, wall);
    inner.box(w / 2 - t / 2, 0.12 + rimH / 2, 0, t, rimH, d, wall);
    inner.box(-w / 2 + 0.6, 0.12 + rimH / 2, d / 2 - t / 2, 1.0, rimH, t, wall);
    inner.box(w / 2 - 0.6, 0.12 + rimH / 2, d / 2 - t / 2, 1.0, rimH, t, wall);

    let staffLeft = Math.max(0, st.staff - floorStaffBefore(kind, fi));
    if (fi === 0) {
      // lobby: counter (right), queue chairs (front), back row of desks
      const cx = w / 2 - (kind === 'goal' ? 0.75 : 1.3), cz = kind === 'goal' ? 0.45 : 0.35;
      const cw = kind === 'goal' ? 1.0 : 1.7;
      inner.box(cx, 0.42, cz, cw, 0.6, 0.42, tint(ec, 0.35, 0xffffff));
      inner.box(cx, 0.74, cz, cw + 0.06, 0.05, 0.48, 0xf4efe6);
      person(inner, cx, 0.12, cz - 0.5, seedBase + 7, false);                 // the counter clerk
      const chairs = kind === 'goal' ? 2 : 5;
      const qx0 = kind === 'goal' ? -1.1 : -1.2, qz = d / 2 - (kind === 'goal' ? 0.45 : 0.75);
      for (let k = 0; k < chairs; k++) {
        const x = qx0 + k * 0.52;
        inner.box(x, 0.32, qz, 0.36, 0.06, 0.34, 0x5b6370);
        inner.box(x, 0.5, qz + 0.15, 0.36, 0.32, 0.05, 0x5b6370);
        if (k < B.queue) person(inner, x, 0.14, qz, seedBase + 101 + k);
      }
      B.queueSpot = { x: qx0, z: qz, counterX: cx, counterZ: cz + 0.42 };
      if (cash) {
        // cash counting table
        const tx = -w / 2 + 1.3, tz = -0.2;
        inner.box(tx, 0.45, tz, 1.4, 0.06, 0.8, 0xf4efe6);
        inner.box(tx, 0.22, tz, 1.3, 0.42, 0.7, 0xc9c1b2);
        for (let k = 0; k < 4; k++) inner.box(tx - 0.45 + k * 0.3, 0.52 + (k % 2) * 0.03, tz - 0.1, 0.22, 0.08 + (k % 2) * 0.06, 0.12, 0x6fbf73);
        person(inner, tx, 0.14, tz + 0.55, seedBase + 13);
        B.cashTable = { x: tx, z: tz };
      } else if (kind !== 'goal') {
        inner.box(-w / 2 + 0.8, 0.3, -0.1, 0.9, 0.36, 0.5, tint(ec, 0.2, 0x334455));    // sofa
        inner.cone(-w / 2 + 0.45, 0.55, 0.75, 0.22, 0.7, 0x3f9d5a);                      // plant
      }
      const backZ = -d / 2 + (kind === 'goal' ? 0.6 : 1.1);
      const deskXs = kind === 'goal' ? [-0.7] : [-1.9, -0.2, 1.5].map(x => x * (w / 6.4));
      deskXs.slice(0, kind === 'goal' ? 1 : (cash ? 2 : 3)).forEach((x, k) => {
        const on = staffLeft > 0; if (on) staffLeft--;
        desk(inner, cash ? x + 1.0 : x, 0.12, backZ, on, seedBase + 200 + k, screens);
      });
    } else if (isTop) {
      // HQ boardroom
      inner.box(0, 0.45, 0, w * 0.55, 0.06, 1.1, 0x8a6a4c);
      inner.box(0, 0.22, 0, w * 0.5, 0.4, 0.9, 0x6e5440);
      for (let k = 0; k < 4; k++) {
        const x = -w * 0.2 + k * (w * 0.4 / 3);
        inner.box(x, 0.3, -0.85, 0.34, 0.06, 0.34, 0x22262c); inner.box(x, 0.3, 0.85, 0.34, 0.06, 0.34, 0x22262c);
      }
      inner.box(0, 0.75, -d / 2 + 0.2, 1.6, 0.8, 0.06, 0x23272e);
      screens.box(0, 0.75, -d / 2 + 0.24, 1.45, 0.66, 0.01, 0x8fe3c0);
    } else {
      const xs = kind === 'goal' ? [-1.0, 0, 1.0] : [-1.9, 0, 1.9].map(x => x * (w / 6.4));
      const zs = kind === 'goal' ? [-0.35] : [-d / 2 + 1.15, 0.55];
      zs.forEach((z, r) => xs.forEach((x, c) => {
        const on = staffLeft > 0; if (on) staffLeft--;
        desk(inner, x, 0.12, z, on, seedBase + fi * 31 + r * 7 + c, screens);
      }));
    }

    // outer walls with windows (hidden when the building is opened)
    const wallH = fh - 0.12;
    const yMid = 0.12 + wallH / 2;
    shell.box(0, yMid, -d / 2 + t / 2, w, wallH, t, wall);
    shell.box(-w / 2 + t / 2, yMid, 0, t, wallH, d, wall);
    shell.box(w / 2 - t / 2, yMid, 0, t, wallH, d, wall);
    shell.box(0, yMid, d / 2 - t / 2, w, wallH, t, wall);
    shell.box(0, fh - 0.04, 0, w + 0.06, 0.08, d + 0.06, trim);
    const r = rng(seedBase + fi * 97);
    const winH = fh * 0.46, winY = 0.12 + wallH * 0.55;
    const windowsOn = (len, place) => {
      const n = Math.max(1, Math.floor((len - 0.5) / 0.95));
      const step = len / n;
      for (let k = 0; k < n; k++) {
        const o = -len / 2 + step * (k + 0.5);
        if (fi === 0 && place === 'front' && Math.abs(o) < 0.75) continue;      // door
        const ww = Math.min(0.62, step * 0.66);
        const put = (bk, dy, color) => {
          if (place === 'front') bk.box(o, winY + dy, d / 2 + 0.005, ww, winH, 0.04, color);
          else if (place === 'back') bk.box(o, winY + dy, -d / 2 - 0.005, ww, winH, 0.04, color);
          else if (place === 'left') bk.box(-w / 2 - 0.005, winY + dy, o, 0.04, winH, ww, color);
          else bk.box(w / 2 + 0.005, winY + dy, o, 0.04, winH, ww, color);
        };
        put(shell, 0, glass);
        if (r() < 0.62) put(lit, 0, r() < 0.25 ? 0xfff1c4 : 0xffd98a);
      }
    };
    windowsOn(w, 'front'); windowsOn(w, 'back'); windowsOn(d, 'left'); windowsOn(d, 'right');
    if (fi === 0) {
      shell.box(0, 0.12 + 0.55, d / 2 + 0.01, 1.0, 1.1, 0.05, 0x39404a);                 // door
      lit.box(0, 0.12 + 0.62, d / 2 + 0.04, 0.8, 0.85, 0.01, 0xffe3a3);
      shell.box(0, fh - 0.22, d / 2 + 0.06, Math.min(w - 0.6, 2.6), 0.22, 0.06, ec);      // sign band
      if (kind === 'goal') {
        // striped awning
        for (let k = 0; k < 6; k++) shell.box(-1.25 + k * 0.5, 1.05, d / 2 + 0.32, 0.5, 0.06, 0.6, k % 2 ? 0xffffff : ec);
      }
    }

    const mIn = inner.mesh(MAT, shadows), mShell = shell.mesh(kind === 'hq' ? GLASS : MAT, shadows), mLit = lit.mesh(LIT, false), mScreens = screens.mesh(LIT, false);
    if (mIn) fg.add(mIn);
    if (mScreens) fg.add(mScreens);
    if (mShell) fg.add(mShell);
    if (mLit) fg.add(mLit);
    fg.position.y = fi * fh;
    g.add(fg);
    B.floors.push({ g: fg, shell: mShell, lit: mLit });
  }

  // roof
  const roof = new Bake();
  const ry = 0;
  roof.box(0, ry + 0.09, 0, w + 0.14, 0.18, d + 0.14, trim);
  roof.box(0, ry + 0.3, -d / 2, w + 0.14, 0.26, 0.1, trim);
  roof.box(0, ry + 0.3, d / 2, w + 0.14, 0.26, 0.1, trim);
  roof.box(-w / 2, ry + 0.3, 0, 0.1, 0.26, d + 0.14, trim);
  roof.box(w / 2, ry + 0.3, 0, 0.1, 0.26, d + 0.14, trim);
  if (kind === 'hq') {
    roof.cyl(0.4, ry + 0.22, 0.2, 1.5, 0.06, 0xe9ecef);
    roof.cyl(0.4, ry + 0.26, 0.2, 1.1, 0.03, ec);
    roof.box(-w / 2 + 0.6, ry + 1.1, -d / 2 + 0.6, 0.08, 1.8, 0.08, 0xb8bec6);
    roof.ball(-w / 2 + 0.6, ry + 2.05, -d / 2 + 0.6, 0.12, 0xff5a4f);
  } else if (kind === 'goal') {
    if (st.done) {
      roof.box(0.9, ry + 0.75, 0, 0.05, 1.3, 0.05, 0xd0d4d8);
      roof.box(1.2, ry + 1.2, 0, 0.55, 0.36, 0.03, ec);
      roof.cone(-0.6, ry + 0.55, 0, 0.32, 0.6, 0xffc93c);
    }
  } else {
    roof.box(-w / 4, ry + 0.38, -d / 5, 0.9, 0.42, 0.7, 0xc8ced4);
    roof.box(w / 5, ry + 0.38, -d / 5, 0.9, 0.42, 0.7, 0xc8ced4);
    roof.cyl(w / 2 - 0.9, ry + 0.6, d / 2 - 1.0, 0.45, 0.9, 0x9aa3ad);
  }
  const roofMesh = roof.mesh(MAT, shadows);
  const roofGroup = new THREE.Group();
  if (roofMesh) roofGroup.add(roofMesh);
  roofGroup.position.y = st.floors * fh;
  g.add(roofGroup);
  B.roof = roofGroup;
  B.fh = fh;

  // pick box (invisible), covers the whole building
  const pick = new THREE.Mesh(UNIT.box, PICK);
  pick.scale.set(w + 0.3, st.floors * fh + 0.6, d + 0.3);
  pick.position.y = (st.floors * fh + 0.6) / 2;
  pick.userData.key = B.key;
  g.add(pick);
  B.pick = pick;
  const contact = new THREE.Mesh(UNIT.plane || (UNIT.plane = new THREE.PlaneGeometry(1, 1)), contactMaterial());
  contact.rotation.x = -Math.PI / 2; contact.scale.set(w + 1.6, d + 1.6, 1); contact.position.y = 0.012; contact.renderOrder = 1;
  g.add(contact);
  scene.add(g);

  buildYard(B);
}
function floorStaffBefore(kind, fi) {
  if (fi === 0) return 0;
  if (kind === 'goal') return 1 + 3 * (fi - 1);
  return 3 + 6 * (fi - 1);
}

/* yard crates = the money there right now */
function buildYard(B) {
  if (B.yard) { scene.remove(B.yard); disposeTree(B.yard); B.yard = null; }
  const st = B.stats, b = new Bake();
  const cash = B.item.ent && isCashflow(B.item.ent);
  let cashCrates = 0;
  if (cash) {
    const tot = Math.max(0, Number(B.item.ent.cashBalance) || 0) + Math.max(0, Number(B.item.ent.bankBalance) || 0);
    cashCrates = tot > 0 ? Math.round(st.crates * (Math.max(0, Number(B.item.ent.cashBalance) || 0) / tot)) : 0;
  }
  if (B.kind === 'goal') {
    const yx = B.yardX, yz = B.yardZ;
    b.box(yx, BASE_Y + 0.02, yz, 1.24, 0.04, 1.6, 0xd6d9d3);
    for (let k = 0; k < 6; k++) {
      const x = yx - 0.32 + (k % 2) * 0.64, z = yz - 0.5 + Math.floor(k / 2) * 0.5;
      b.box(x, BASE_Y + 0.08, z, 0.56, 0.08, 0.42, 0x8d96a3);
      if (k < st.crates) b.box(x, BASE_Y + 0.33, z, 0.48, 0.42, 0.38, 0xd9a066);
    }
  } else {
    const yx = B.yardX, yz = B.yardZ;
    b.box(yx, BASE_Y + 0.02, yz, 2.4, 0.04, 7.4, 0xd6d9d3);
    for (let k = 0; k < 12; k++) {
      const x = yx - 0.55 + (k % 2) * 1.1, z = yz - 2.9 + Math.floor(k / 2) * 1.05;
      b.box(x, BASE_Y + 0.08, z, 0.86, 0.08, 0.86, 0x8d96a3);
    }
    for (let k = 0; k < st.crates; k++) {
      const slot = k % 12, layer = Math.floor(k / 12);
      const x = yx - 0.55 + (slot % 2) * 1.1, z = yz - 2.9 + Math.floor(slot / 2) * 1.05;
      const color = cash ? (k < cashCrates ? 0x6fbf73 : 0x6ea8ff) : 0xd9a066;
      b.box(x, BASE_Y + 0.47 + layer * 0.74, z, 0.74, 0.7, 0.74, color);
      b.box(x, BASE_Y + 0.47 + layer * 0.74, z, 0.76, 0.1, 0.2, 0xf3e1c2);
    }
  }
  const m = b.mesh(MAT, quality === 'pretty');
  const grp = new THREE.Group(); if (m) grp.add(m);
  B.yard = grp; scene.add(grp);
}

function buildLot(B, g) {
  const b = new Bake();
  if (B.kind === 'park') {
    b.box(0, BASE_Y + 0.02, 0, 9.6, 0.04, 9.6, 0x9fd48a);
  } else {
    b.box(0, BASE_Y + 0.02, 0, 8.6, 0.04, 8.2, 0xcdb48c);
    for (let k = 0; k < 4; k++) b.cone(-3.6 + k * 2.4, BASE_Y + 0.3, 3.8, 0.18, 0.5, k % 2 ? 0xffffff : 0xf08a3c);
    b.box(0, BASE_Y + 0.8, 3.2, 0.08, 1.6, 0.08, 0x8a8f96);
    b.box(0, BASE_Y + 1.5, 3.25, 1.8, 0.7, 0.06, 0xffffff);
    b.box(0, BASE_Y + 1.5, 3.29, 1.6, 0.5, 0.01, 0xf2a93b);
  }
  const m = b.mesh(MAT, quality === 'pretty'); if (m) g.add(m);
  g.position.set(B.cx, 0, B.cz);
  B.floors = []; B.roof = null;
  const pick = new THREE.Mesh(UNIT.box, PICK); pick.scale.set(8, 2, 8); pick.position.y = 1; pick.userData.key = B.key; g.add(pick); B.pick = pick;
}

/* ---------- land: the town sits in a valley — fields and rice paddies, a river to the east with a bridge,
   hills around and a ring of mountains on the horizon (Loei style), so the town never floats in the air ---------- */
function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const h = (a, b) => { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = h(xi, zi), b = h(xi + 1, zi), c = h(xi, zi + 1), d = h(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) { let s = 0, a = 0.5, f = 1; for (let o = 0; o < 4; o++) { s += a * noise2(x * f, z * f); f *= 2.03; a *= 0.5; } return s / 0.9375; }
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function makeLand(g) {
  // g: { cx, cz, flatR, riverX(z), hz, x1 }
  const height = (x, z) => {
    const r = Math.hypot(x - g.cx, z - g.cz);
    let h = 0;
    const t = smooth(g.flatR, g.flatR + 70, r);
    h += (fbm(x * 0.011 + 3, z * 0.011 - 7) - 0.35) * 22 * t;
    h += smooth(230, 380, r) * (35 + fbm(x * 0.006 + 11, z * 0.006 + 2) * 95);
    const dr = Math.abs(x - g.riverX(z));
    h *= smooth(6, 26, dr);                                                // the river valley is flat
    if (x > g.x1 - 4) h *= smooth(5, 16, Math.abs(z - g.hz));              // the highway cuts a pass east
    h = Math.max(h, 0) - 0.03;
    if (dr < 9) h = h * smooth(4.5, 9, dr) + (-1.5) * (1 - smooth(4.5, 9, dr));
    return h;
  };
  const SIZE = 1100, SEG = quality === 'eco' ? 110 : 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  geo.translate(g.cx, 0, g.cz);
  const pos = geo.attributes.position, colors = [];
  const c = new THREE.Color(), grass = new THREE.Color(0xa6d78c), grass2 = new THREE.Color(0x8cc779), forest = new THREE.Color(0x5f9a5c), rock = new THREE.Color(0x7d8b80), sand = new THREE.Color(0xdccb98), bed = new THREE.Color(0x6f8f8c);
  const paddy = [0x9fd05a, 0xbdd96a, 0xd9cf72, 0x8fc65a].map(v => new THREE.Color(v));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    const r = Math.hypot(x - g.cx, z - g.cz), dr = Math.abs(x - g.riverX(z));
    c.copy(grass).lerp(grass2, fbm(x * 0.05, z * 0.05));
    // rice paddies on the flat land between the town and the hills
    if (r > g.flatR + 8 && r < 200 && h < 3 && dr > 12 && Math.abs(z - g.hz) > 6) {
      const cell = noise2(Math.floor(x / 14) * 1.7, Math.floor(z / 14) * 1.3);
      if (cell > 0.52) c.copy(paddy[Math.floor(noise2(Math.floor(x / 14) + 9, Math.floor(z / 14)) * 4) % 4]);
    }
    if (h > 6) c.lerp(forest, smooth(6, 22, h));
    if (h > 55) c.lerp(rock, smooth(55, 110, h) * 0.8);
    if (dr < 11) c.lerp(sand, 1 - smooth(7, 11, dr));
    if (dr < 7) c.copy(bed);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, MAT);
  land.receiveShadow = quality === 'pretty';
  // river water: a strip that follows the river's curve
  const wp = [], wi = [];
  let n = 0;
  for (let z = g.cz - SIZE / 2; z <= g.cz + SIZE / 2; z += 6) {
    const xr = g.riverX(z);
    wp.push(xr - 6.2, -0.45, z, xr + 6.2, -0.45, z);
    if (n) wi.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n);
    n++;
  }
  const wgeo = new THREE.BufferGeometry();
  wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  wgeo.setIndex(wi); wgeo.computeVertexNormals();
  const water = new THREE.Mesh(wgeo, new THREE.MeshPhongMaterial({ color: 0x4f9fcf, shininess: 90, specular: 0xffffff, side: THREE.DoubleSide }));
  water.receiveShadow = quality === 'pretty';
  return { land, water, height };
}

/* trees: rounder canopies made of a few overlapping lumps, layered pines, bushes and coconut palms */
function tree(b, x, z, r, y = 0, kind) {
  const greens = [0x5fb35a, 0x4ea353, 0x6cc067, 0x3f9455, 0x79c45e];
  const pick = () => tint(greens[Math.floor(r() * greens.length)], (r() - 0.5) * 0.12, r() > 0.5 ? 0xffffff : 0x1a3020);
  const s = 0.8 + r() * 0.6;
  kind = kind || (r() < 0.3 ? 'pine' : r() < 0.15 ? 'bush' : 'round');
  if (kind === 'pine') {
    b.cyl(x, y + 0.35 * s, z, 0.11 * s, 0.7 * s, 0x7a5a40);
    const c = pick();
    b.cone(x, y + 1.0 * s, z, 0.75 * s, 1.1 * s, c);
    b.cone(x, y + 1.55 * s, z, 0.58 * s, 0.95 * s, tint(c, 0.06));
    b.cone(x, y + 2.05 * s, z, 0.38 * s, 0.8 * s, tint(c, 0.12));
  } else if (kind === 'bush') {
    const c = pick();
    b.lump(x, y + 0.28 * s, z, 0.42 * s, c);
    b.lump(x + 0.3 * s, y + 0.22 * s, z + 0.15 * s, 0.3 * s, tint(c, 0.08));
  } else if (kind === 'palm') {
    let px = x, pz = z; const lean = r() * Math.PI * 2;
    for (let k = 0; k < 6; k++) { px += Math.cos(lean) * 0.05 * k; pz += Math.sin(lean) * 0.05 * k; b.cyl(px, y + 0.3 + k * 0.5, pz, 0.11, 0.55, k % 2 ? 0x9c7a55 : 0x8a6a48); }
    const top = y + 3.2;
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + r(); b.box(px + Math.cos(a) * 0.75, top - 0.15, pz + Math.sin(a) * 0.75, 1.6, 0.06, 0.32, 0x4f9e48, -a); }
    b.lump(px, top, pz, 0.22, 0x6b8f3a);
  } else {
    const h = (0.7 + r() * 0.4) * s;
    b.cyl(x, y + h / 2, z, 0.13 * s, h, 0x7a5a40);
    const c = pick();
    b.lump(x, y + h + 0.55 * s, z, 0.7 * s, c);
    b.lump(x + 0.38 * s, y + h + 0.4 * s, z + 0.12 * s, 0.48 * s, tint(c, 0.07));
    b.lump(x - 0.3 * s, y + h + 0.45 * s, z - 0.22 * s, 0.5 * s, tint(c, -0.02, 0x10301a));
    b.lump(x + 0.05 * s, y + h + 0.95 * s, z - 0.05 * s, 0.42 * s, tint(c, 0.12));
  }
}

/* ---------- ground, roads, trees, lamps ---------- */
function buildGround(ext, usedBlocks) {
  const grp = new THREE.Group();
  const b = new Bake(), lamps = new Bake(), tb = new Bake();
  const lampSpots = [];
  const x0 = (ext.imin - 0.5) * P, x1 = (ext.imax + 0.5) * P, z0 = (ext.jmin - 0.5) * P, z1 = (ext.jmax + 0.5) * P;
  const spanX = x1 - x0, spanZ = z1 - z0;
  const gateX = x1 + 10;
  const cx0 = (x0 + x1) / 2, cz0 = (z0 + z1) / 2, R = Math.hypot(spanX, spanZ) / 2;
  const hz = P / 2;
  const riverX = z => x1 + 34 + Math.sin(z * 0.028) * 7 + Math.sin(z * 0.011 + 1.3) * 10;
  const land = makeLand({ cx: cx0, cz: cz0, flatR: R + 16, riverX, hz, x1 });
  grp.add(land.land); grp.add(land.water);
  for (let i = ext.imin; i <= ext.imax; i++) for (let j = ext.jmin; j <= ext.jmax; j++) {
    b.box(i * P, 0.06, j * P, HALF * 2, 0.12, HALF * 2, 0xeef0ea);
    if (!usedBlocks.has(`${i},${j}`)) {
      // a park: lawn, crossing paths, a round pond, benches and trees
      const px = i * P, pz = j * P, r = rng(hash(`park${i},${j}`));
      b.box(px, BASE_Y + 0.02, pz, 9.4, 0.04, 9.4, 0x9fd48a);
      b.box(px, BASE_Y + 0.045, pz, 9.4, 0.02, 1.1, 0xe3d6b4);
      b.box(px, BASE_Y + 0.046, pz, 1.1, 0.02, 9.4, 0xe3d6b4);
      b.cyl(px, BASE_Y + 0.06, pz, 1.9, 0.06, 0xd9cdb0);
      b.cyl(px, BASE_Y + 0.08, pz, 1.6, 0.06, 0x5aa7d6);
      b.cyl(px, BASE_Y + 0.3, pz, 0.18, 0.5, 0xe9ecef);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        for (let k = 0; k < 2; k++) tree(tb, px + sx * (2.6 + r() * 1.6), pz + sz * (2.6 + r() * 1.6), r, BASE_Y);
        b.box(px + sx * 1.6, BASE_Y + 0.25, pz + sz * 2.6, 1.0, 0.08, 0.36, 0x8a6a4c);
      });
    }
  }
  // roads
  const road = 0x5d6572, dash = 0xf2f1ea;
  for (let i = ext.imin - 1; i <= ext.imax; i++) {
    const x = (i + 0.5) * P;
    b.box(x, 0.03, (z0 + z1) / 2, ROADW, 0.06, spanZ + ROADW, road);
    for (let z = z0 + 1; z < z1 - 0.5; z += 2.2) b.box(x, 0.065, z, 0.12, 0.01, 1.0, dash);
  }
  for (let j = ext.jmin - 1; j <= ext.jmax; j++) {
    const z = (j + 0.5) * P;
    b.box((x0 + x1) / 2, 0.031, z, spanX + ROADW, 0.06, ROADW, road);
    for (let x = x0 + 1; x < x1 - 0.5; x += 2.2) b.box(x, 0.066, z, 1.0, 0.01, 0.12, dash);
  }
  // highway out of town (east) through the hills, over the river
  b.box(x1 + 200, 0.03, hz, 400, 0.06, ROADW + 0.6, road);
  for (let x = x1 + 2; x < x1 + 160; x += 2.2) b.box(x, 0.066, hz, 1.0, 0.01, 0.12, dash);
  const bx = riverX(hz);
  b.box(bx, 0.12, hz, 16, 0.14, ROADW + 1.4, 0xc9ced4);
  b.box(bx, 0.5, hz - ROADW / 2 - 0.6, 16, 0.08, 0.12, 0xe9ecef);
  b.box(bx, 0.5, hz + ROADW / 2 + 0.6, 16, 0.08, 0.12, 0xe9ecef);
  for (let k = -7; k <= 7; k += 1.75) { b.box(bx + k, 0.33, hz - ROADW / 2 - 0.6, 0.08, 0.36, 0.08, 0xe9ecef); b.box(bx + k, 0.33, hz + ROADW / 2 + 0.6, 0.08, 0.36, 0.08, 0xe9ecef); }
  [-4, 0, 4].forEach(k => b.box(bx + k, -0.7, hz, 0.7, 1.4, ROADW, 0xaab1b8));
  // gate arch
  b.box(gateX, 1.7, hz - 2.6, 0.35, 3.4, 0.35, 0x1d3540);
  b.box(gateX, 1.7, hz + 2.6, 0.35, 3.4, 0.35, 0x1d3540);
  b.box(gateX, 3.45, hz, 0.5, 0.5, 5.6, 0x1d3540);
  b.box(gateX + 0.26, 3.45, hz, 0.02, 0.32, 4.6, 0x52e884);
  // countryside trees: groves on the land, coconut palms along the river
  const r = rng(777);
  const nTrees = quality === 'eco' ? 110 : 220;
  for (let k = 0, tries = 0; k < nTrees && tries < nTrees * 6; tries++) {
    const ang = r() * Math.PI * 2, rad = R + 6 + Math.pow(r(), 1.4) * 150;
    const x = cx0 + Math.cos(ang) * rad, z = cz0 + Math.sin(ang) * rad;
    if (Math.abs(z - hz) < 4.5 && x > x0) continue;                       // keep the highway clear
    if (Math.abs(x - riverX(z)) < 10) continue;
    if (x > x0 - 3 && x < x1 + 3 && z > z0 - 3 && z < z1 + 3) continue;   // not in town
    const y = land.height(x, z);
    if (y < 0 || y > 40) continue;
    // keep the paddies open: fewer trees on the flat land
    if (y < 2 && rad < 200 && noise2(Math.floor(x / 14) * 1.7, Math.floor(z / 14) * 1.3) > 0.52) continue;
    tree(tb, x, z, r, y);
    k++;
  }
  for (let z = cz0 - 120; z < cz0 + 120; z += 7 + r() * 6) {
    if (Math.abs(z - hz) < 9) continue;
    const side = r() > 0.5 ? 1 : -1, x = riverX(z) + side * (8.5 + r() * 3);
    tree(tb, x, z, r, Math.max(0, land.height(x, z)), 'palm');
  }
  // street lamps at the crossings
  for (let i = ext.imin - 1; i <= ext.imax; i++) for (let j = ext.jmin - 1; j <= ext.jmax; j++) {
    const x = (i + 0.5) * P + 2.4, z = (j + 0.5) * P + 2.4;
    b.box(x, 1.1, z, 0.08, 2.2, 0.08, 0x6b7380);
    b.box(x - 0.25, 2.2, z, 0.6, 0.08, 0.14, 0x6b7380);
    lamps.box(x - 0.45, 2.12, z, 0.26, 0.06, 0.16, 0xfff0b8);
    lampSpots.push([x - 0.45, 2.0, z]);
  }
  const m = b.mesh(MAT, false); if (m) { m.receiveShadow = quality === 'pretty'; grp.add(m); }
  const tm = tb.mesh(MAT, quality === 'pretty'); if (tm) grp.add(tm);
  const lm = lamps.mesh(LIT, false); if (lm) { lm.userData.nightOnly = true; grp.add(lm); }
  // warm glow around each street lamp (shown at night)
  const glows = new THREE.Group();
  lampSpots.forEach(([x, y, z]) => { const sp = new THREE.Sprite(glowMaterial()); sp.position.set(x, y, z); sp.scale.set(2.6, 2.6, 1); glows.add(sp); });
  grp.add(glows);
  // clouds drifting over the hills
  const clouds = new THREE.Group(), cr = rng(4242);
  const n = quality === 'eco' ? 7 : 16;
  for (let k = 0; k < n; k++) {
    const sp = new THREE.Sprite(cloudMaterial());
    const ang = cr() * Math.PI * 2, rad = 140 + cr() * 140;
    sp.position.set(cx0 + Math.cos(ang) * rad, 34 + cr() * 40, cz0 + Math.sin(ang) * rad);
    const sc = 60 + cr() * 60; sp.scale.set(sc, sc * 0.38, 1);
    sp.userData.ang = ang; sp.userData.rad = rad;
    sp.userData.speed = 0.4 + cr() * 0.6;
    clouds.add(sp);
  }
  grp.add(clouds);
  return { grp, gateX, farX: x1 + 75, hz, x0, x1, z0, z1, lamps: lm, glows, clouds, cx: cx0, cz: cz0, R };
}

/* ---------- world build ---------- */
function buildWorld() {
  if (world) {
    world.buildings.forEach(B => { if (B.group) { scene.remove(B.group); disposeTree(B.group); } if (B.yard) { scene.remove(B.yard); disposeTree(B.yard); } B.tagEl?.remove(); });
    scene.remove(world.ground.grp); disposeTree(world.ground.grp);
  }
  const list = entityList();
  const placed = planLayout(list);
  const ext = { imin: 0, imax: 0, jmin: 0, jmax: 0 };
  const used = new Set();
  placed.forEach(p => { ext.imin = Math.min(ext.imin, p.i); ext.imax = Math.max(ext.imax, p.i); ext.jmin = Math.min(ext.jmin, p.j); ext.jmax = Math.max(ext.jmax, p.j); used.add(`${p.i},${p.j}`); });
  // keep the town at least 3 × 2 blocks so it reads as a town
  if (ext.imax - ext.imin < 2) { ext.imin = Math.min(ext.imin, -1); ext.imax = Math.max(ext.imax, 1); }
  if (ext.jmax - ext.jmin < 1) { ext.jmax = Math.max(ext.jmax, 1); }
  const ground = buildGround(ext, used);
  scene.add(ground.grp);
  const buildings = new Map();
  placed.forEach(p => {
    const item = p.item;
    const cx = p.i * P, cz = p.j * P;
    const B = { key: item.key, kind: item.kind, item, i: p.i, j: p.j, cx, cz, f: 1, open: 0, openGoal: 0, queue: 0 };
    if (item.kind === 'goal') {
      const qx = p.q % 2 === 0 ? -2.6 : 2.6, qz = p.q < 2 ? 2.6 : -2.6;
      B.f = qz > 0 ? 1 : -1;
      B.bx = cx + qx - 0.55; B.bz = cz + qz - 0.25 * B.f;
      B.yardX = cx + qx + 1.75; B.yardZ = cz + qz;
      B.dock = { x: cx + qx + 1.75, z: cz + B.f * (HALF - 0.4) };
    } else if (item.kind === 'hq' || item.kind === 'sub') {
      B.bx = cx - 1.5; B.bz = cz - 0.2;
      B.yardX = cx + 3.45; B.yardZ = cz - 0.6;
      B.dock = { x: cx + 3.45, z: cz + HALF - 0.4 };
    } else { B.bx = cx; B.bz = cz; B.dock = { x: cx, z: cz + HALF - 0.4 }; }
    B.zr = cz + B.f * P / 2;
    B.xv = cx + P / 2;
    B.door = local2world(B, 0, (DIMS[item.kind === 'goal' ? 'goal' : item.kind === 'hq' ? 'hq' : 'sub'] || DIMS.sub).d / 2 + 0.3);
    B.side = { x: B.door.x, z: cz + B.f * (HALF - 0.3) };
    refreshStats(B);
    buildings.set(B.key, B);
  });
  world = { sig: layoutSig(list), buildings, ground, ext };
  buildings.forEach(B => { if (B.kind !== 'park') { buildBuilding(B); B.vsig = visualSig(B); makeTag(B); } else buildBuilding(B); });
  makeGateTag();
  renderChips();
  startAmbient();
  applyLight();
}
function local2world(B, lx, lz) {
  const s = B.f > 0 ? 1 : -1;
  return { x: B.bx + lx * s, z: B.bz + lz * s };
}

function refreshStats(B) {
  if (B.kind === 'lot' || B.kind === 'park') { B.stats = { level: 0, floors: 0, staff: 0, cap: 0, crates: 0 }; return; }
  const value = valueTHB(B.item);
  const peak = Math.max(prefs.peaks[B.key] || 0, value);
  if (peak !== prefs.peaks[B.key]) { prefs.peaks[B.key] = peak; savePrefs(); }
  B.value = value; B.peak = peak;
  B.stats = statsFor(B.item, peak, value);
  B.queue = pendingFor(B).length;
}
function pendingFor(B) {
  if (!B.item.ent) return [];
  const type = B.kind === 'goal' ? 'goal' : 'account';
  return (state.scheduledDeposits || []).filter(s => s.status === 'pending' && s.destinationType === type && s.destinationId === B.item.ent.id)
    .sort((a, b) => new Date(a.runAt) - new Date(b.runAt));
}
function visualSig(B) {
  const s = B.stats; const cash = B.item.ent && isCashflow(B.item.ent);
  const cashPart = cash ? Math.round(8 * (Number(B.item.ent.cashBalance) || 0) / Math.max(1, B.value || 1)) : 0;
  return [s.floors, s.staff, s.crates, Math.min(5, B.queue), s.done ? 1 : 0, cashPart, entityColor(B.item).getHex()].join(',');
}

/* ---------- labels ---------- */
function kindLabel(B) { return B.kind === 'hq' ? 'สำนักงานใหญ่' : B.kind === 'sub' ? 'บริษัทในเครือ' : B.kind === 'goal' ? 'ธุรกิจเป้าหมาย' : B.kind === 'lot' ? 'ที่ดินว่าง' : ''; }
function makeTag(B) {
  B.tagEl?.remove();
  const el = document.createElement('button');
  el.type = 'button'; el.className = `mpc-tag mpc-tag-${B.kind}`; el.dataset.key = B.key;
  tagLayer.appendChild(el);
  B.tagEl = el; fillTag(B);
}
function fillTag(B) {
  if (!B.tagEl) return;
  B.tagEl._w = 0;
  const c = '#' + entityColor(B.item).getHexString();
  if (B.kind === 'lot') { B.tagEl.innerHTML = `<i style="background:${c}"></i><b>ที่ดินว่าง</b><small>เพิ่มการ์ดใหม่เพื่อเปิดบริษัท</small>`; return; }
  const lvl = B.kind === 'goal' ? (B.stats.done ? 'สำเร็จ' : `ขั้น ${B.stats.level}`) : `Lv.${B.stats.level}`;
  const q = B.queue ? `<em>${svg('calendar')}คิว ${B.queue}</em>` : '';
  B.tagEl.innerHTML = `<i style="background:${c}"></i><b>${escH(B.item.ent.name)}</b><small>${lvl}</small>${q}`;
  B.tagEl.setAttribute('aria-label', `${kindLabel(B)} ${B.item.ent.name}`);
}
function makeGateTag() {
  world.gateTag?.remove();
  const el = document.createElement('div');
  el.className = 'mpc-tag mpc-tag-gate'; el.innerHTML = `<b>ทางเข้า–ออกเมือง</b>`;
  tagLayer.appendChild(el); world.gateTag = el;
}
function bubble(B, text, tone, at) {
  if (!B || !tagLayer) return;
  const el = document.createElement('div');
  el.className = `mpc-bubble ${tone || ''}`; el.textContent = text;
  tagLayer.appendChild(el);
  bubbles.push({ el, B, t: 0, at });
}
const xrayOn = () => Boolean(state.settings && state.settings.cityXray);
function feed(iconName, text, tone) {
  if (!feedEl) return;
  const el = document.createElement('div');
  el.className = `mpc-feed-item ${tone || ''}`;
  el.innerHTML = `${svg(iconName)}<span>${escH(text)}</span>`;
  feedEl.prepend(el);
  while (feedEl.children.length > 3) feedEl.lastChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 5200);
}

/* ---------- actors: trucks and walkers ---------- */
const truckGeo = {};
function truckGeometry(kind) {
  if (truckGeo[kind]) return truckGeo[kind];
  const b = new Bake();
  const stripe = kind === 'in' ? 0x2fa877 : kind === 'out' ? 0xf08a3c : 0x3d6fd8;
  b.box(0, 0.32, 0, 0.9, 0.18, 2.2, 0x2b3038);
  b.box(0, 0.85, -0.25, 1.0, 0.95, 1.55, 0xfafafa);
  b.box(0, 0.85, -0.25, 1.02, 0.22, 1.2, stripe);
  b.box(0, 0.72, 0.8, 0.96, 0.7, 0.6, stripe);
  b.box(0, 0.86, 1.1, 0.86, 0.32, 0.03, 0x2d3b4a);
  [[-0.47, 0.75], [0.47, 0.75], [-0.47, -0.65], [0.47, -0.65]].forEach(([x, z]) => b.box(x, 0.2, z, 0.18, 0.4, 0.4, 0x1c1f24));
  return (truckGeo[kind] = b.mesh(MAT, false).geometry);
}
function dedupe(pts) { const out = []; pts.forEach(p => { const l = out[out.length - 1]; if (!l || Math.hypot(l.x - p.x, l.z - p.z) > 0.01) out.push(p); }); return out; }
function lanePath(pts, lane) {
  pts = dedupe(pts);
  const nrm = (p, q) => { const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz) || 1; return { x: dz / L, z: -dx / L }; };
  return pts.map((b, k) => {
    const a = pts[k - 1], c = pts[k + 1];
    const n1 = a ? nrm(a, b) : null, n2 = c ? nrm(b, c) : null;
    let ox, oz;
    if (n1 && n2) { if (Math.abs(n1.x - n2.x) < 1e-6 && Math.abs(n1.z - n2.z) < 1e-6) { ox = n1.x; oz = n1.z; } else { ox = n1.x + n2.x; oz = n1.z + n2.z; } }
    else { const m = n1 || n2; ox = m.x; oz = m.z; }
    return { x: b.x + ox * lane, z: b.z + oz * lane };
  });
}
function roadRoute(a, b) {
  if (Math.abs(a.zr - b.zr) < 0.01) return [{ x: a.x, z: a.zr }, { x: b.x, z: b.zr }];
  return [{ x: a.x, z: a.zr }, { x: a.xv, z: a.zr }, { x: a.xv, z: b.zr }, { x: b.x, z: b.zr }];
}
function dockNode(B) { return { x: B.dock.x, zr: B.zr, xv: B.xv }; }
function gateNode() { return { x: world.ground.farX, zr: world.ground.hz, xv: world.ground.farX }; }
function routeBetween(A, B) {
  const a = dockNode(A), b = dockNode(B);
  return [{ x: A.dock.x, z: A.dock.z }, ...roadRoute(a, b), { x: B.dock.x, z: B.dock.z }];
}
function routeToGate(A) {
  const a = dockNode(A), g = gateNode();
  const pts = [{ x: A.dock.x, z: A.dock.z }, { x: a.x, z: a.zr }];
  if (Math.abs(a.zr - g.zr) > 0.01) { pts.push({ x: a.xv, z: a.zr }, { x: a.xv, z: g.zr }); }
  pts.push({ x: g.x, z: g.zr });
  return pts;
}
function pathInfo(pts) {
  const segs = []; let total = 0;
  for (let k = 1; k < pts.length; k++) { const L = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z); segs.push(L); total += L; }
  return { pts, segs, total };
}
function pointAt(info, d) {
  let k = 0;
  while (k < info.segs.length - 1 && d > info.segs[k]) { d -= info.segs[k]; k++; }
  const a = info.pts[k], b = info.pts[k + 1] || a, L = info.segs[k] || 1, t = clamp(d / L);
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, dx: b.x - a.x, dz: b.z - a.z };
}
const CAR_COLORS = [0xe8608f, 0x3fbf6a, 0xf2c94c, 0xf4f4f2, 0x3a6fd8, 0xd64545, 0x2d3440, 0xb0b8c4];   // pink and green-yellow = Thai taxis
const carGeo = {};
function carGeometry(color) {
  if (carGeo[color]) return carGeo[color];
  const b = new Bake();
  b.box(0, 0.3, 0, 0.92, 0.32, 1.8, color);
  b.box(0, 0.58, -0.08, 0.8, 0.28, 0.95, tint(color, 0.15));
  b.box(0, 0.58, 0.41, 0.76, 0.22, 0.02, 0x2d3b4a);
  b.box(0, 0.58, -0.56, 0.76, 0.22, 0.02, 0x2d3b4a);
  b.box(0.41, 0.58, -0.08, 0.02, 0.2, 0.8, 0x2d3b4a); b.box(-0.41, 0.58, -0.08, 0.02, 0.2, 0.8, 0x2d3b4a);
  b.box(0.3, 0.33, 0.91, 0.18, 0.08, 0.02, 0xfff3c4); b.box(-0.3, 0.33, 0.91, 0.18, 0.08, 0.02, 0xfff3c4);
  [[-0.46, 0.55], [0.46, 0.55], [-0.46, -0.55], [0.46, -0.55]].forEach(([x, z]) => b.box(x, 0.16, z, 0.14, 0.32, 0.32, 0x1c1f24));
  return (carGeo[color] = b.mesh(MAT, false).geometry);
}
function carMesh(seed) {
  const m = new THREE.Mesh(carGeometry(CAR_COLORS[Math.abs(seed) % CAR_COLORS.length]), MAT);
  if (quality === 'pretty') m.castShadow = true;
  return m;
}
function walkerMesh(seed) {
  const b = new Bake();
  person(b, 0, 0, 0, seed, false);
  return b.mesh(MAT, false);
}
function addActor(a) { a.d = a.d || 0; a.life = 0; actors.push(a); return a; }
function wait(sec, fn) { actors.push({ kind: 'wait', t: sec, life: 0, onDone: fn }); }
function spawnTruck(pts, kind, label, onDone) {
  const mesh = new THREE.Mesh(truckGeometry(kind), MAT);
  if (quality === 'pretty') mesh.castShadow = true;
  scene.add(mesh);
  let tag = null;
  if (label) { tag = document.createElement('div'); tag.className = `mpc-truck-tag ${kind}`; tag.textContent = label; tagLayer.appendChild(tag); }
  addActor({ kind: 'truck', mesh, info: pathInfo(lanePath(pts, 0.85)), speed: 7.5, tag, onDone, fadeIn: true, fadeOut: true });
}
// a person walking a path; keep = stay in the scene at the end (they carry on with another walk or get into a car)
function spawnWalker(pts, seed, onDone, mesh, keep) {
  mesh = mesh || walkerMesh(seed);
  scene.add(mesh);
  addActor({ kind: 'walker', mesh, info: pathInfo(dedupe(pts)), speed: 1.5, onDone, keep, own: true });
}
function drive(mesh, pts, onDone, opts = {}) {
  scene.add(mesh);
  addActor({ kind: 'car', mesh, info: pathInfo(dedupe(pts)), speed: opts.speed || 6.5, onDone, keep: opts.keep, fadeIn: opts.fadeIn, fadeOut: opts.fadeOut });
}
function stepActors(dt) {
  for (let k = actors.length - 1; k >= 0; k--) {
    const a = actors[k];
    if (a.kind === 'wait') { a.life += dt; if (a.life >= a.t) { actors.splice(k, 1); a.onDone && a.onDone(); } continue; }
    a.d += a.speed * dt; a.life += dt;
    const total = a.info.total;
    const d = a.loop ? a.d % total : Math.min(a.d, total);
    const p = pointAt(a.info, d);
    const walking = a.kind === 'walker';
    a.mesh.position.set(p.x, walking ? BASE_Y + Math.abs(Math.sin(a.life * 9)) * 0.05 : 0.04, p.z);
    if (Math.hypot(p.dx, p.dz) > 0.001) {
      const target = Math.atan2(p.dx, p.dz);
      let diff = target - a.mesh.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      a.mesh.rotation.y += diff * Math.min(1, dt * (walking ? 12 : 8));
    }
    // vehicles grow / shrink only at the far end of the highway (out of sight); people never sink
    let sc = 1;
    if (a.fadeIn) sc = Math.min(sc, clamp(a.d / 1.2, 0.05, 1));
    if (a.fadeOut) sc = Math.min(sc, clamp((total - a.d) / 1.2, 0.05, 1));
    a.mesh.scale.setScalar(sc);
    if (a.tag) placeEl(a.tag, p.x, 2.0, p.z);
    if (!a.loop && a.d >= total) {
      if (!a.keep) { scene.remove(a.mesh); if (a.own) a.mesh.geometry.dispose(); }
      a.tag?.remove(); actors.splice(k, 1); a.onDone && a.onDone(a);
    }
  }
}

/* a customer's visit: a car drives in from outside town and parks at the kerb, the customer gets out,
   walks in to the counter, the money pops up while they are served, then they walk back, get in and drive away */
function curbOf(B) { return { x: B.side.x + 1.4, z: B.zr - B.f * 0.95 }; }
function visit(B, onCounter, fromSeat) {
  if (!B || !B.queueSpot || !world) { onCounter && onCounter(null); return; }
  const seed = (Math.random() * 1e9) | 0;
  const curb = curbOf(B);
  const counter = local2world(B, B.queueSpot.counterX, B.queueSpot.counterZ + 0.3);
  // the car drives in along the street from the nearer edge of town, and carries on out the other side
  const g = world.ground, fromEast = Math.abs(g.x1 - curb.x) < Math.abs(curb.x - g.x0);
  const startX = fromEast ? g.x1 + 6 : g.x0 - 6, endX = fromEast ? g.x0 - 6 : g.x1 + 6;
  const arrivePts = [...lanePath([{ x: startX, z: B.zr }, { x: curb.x, z: B.zr }], 0.85), curb];
  const leavePts = [curb, ...lanePath([{ x: curb.x, z: B.zr }, { x: endX, z: B.zr }], 0.85)];
  const car = carMesh(seed), person = walkerMesh(seed);
  let carHere = false, personBack = false;
  const tryLeave = () => {
    if (!carHere || !personBack) return;
    scene.remove(person); person.geometry.dispose();                    // gets into the car
    wait(0.4, () => drive(car, leavePts, null, { fadeOut: true, speed: 8 }));
  };
  const goBack = () => spawnWalker([counter, B.door, B.side, curb], 0, () => { personBack = true; tryLeave(); }, person, true);
  const atCounter = () => wait(1.0, () => { onCounter && onCounter(counter); wait(1.1, goBack); });
  if (fromSeat) {
    const seat = local2world(B, B.queueSpot.x, B.queueSpot.z);
    drive(car, arrivePts, () => { carHere = true; tryLeave(); }, { fadeIn: true, keep: true, speed: 8 });
    spawnWalker([seat, counter], 0, atCounter, person, true);
  } else {
    drive(car, arrivePts, () => wait(0.4, () => spawnWalker([curb, B.side, B.door, counter], 0, atCounter, person, true)), { fadeIn: true, keep: true, speed: 8 });
  }
}

/* everyday life: cars circling the blocks and people strolling on the sidewalks */
function loopLane(pts, lane) {
  const n = pts.length, out = [];
  const nrm = (p, q) => { const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz) || 1; return { x: dz / L, z: -dx / L }; };
  for (let k = 0; k < n; k++) {
    const a = pts[(k - 1 + n) % n], b = pts[k], c = pts[(k + 1) % n];
    const n1 = nrm(a, b), n2 = nrm(b, c);
    out.push({ x: b.x + (n1.x + n2.x) * lane, z: b.z + (n1.z + n2.z) * lane });
  }
  out.push({ ...out[0] });
  return out;
}
function startAmbient() {
  for (let k = actors.length - 1; k >= 0; k--) if (actors[k].ambient) { scene.remove(actors[k].mesh); actors.splice(k, 1); }
  const e = world.ext, r = rng((Date.now() / 1000) | 0);
  const nCars = quality === 'eco' ? 5 : 10, nPeds = quality === 'eco' ? 8 : 18;
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  for (let k = 0; k < nCars; k++) {
    const i0 = ri(e.imin - 1, e.imax - 1), i1 = ri(i0 + 1, e.imax), j0 = ri(e.jmin - 1, e.jmax - 1), j1 = ri(j0 + 1, e.jmax);
    const xa = (i0 + 0.5) * P, xb = (i1 + 0.5) * P, za = (j0 + 0.5) * P, zb = (j1 + 0.5) * P;
    let pts = [{ x: xa, z: za }, { x: xb, z: za }, { x: xb, z: zb }, { x: xa, z: zb }];
    if (r() > 0.5) pts.reverse();
    const mesh = carMesh(k * 7 + 3); scene.add(mesh);
    const info = pathInfo(loopLane(pts, 0.85));
    addActor({ kind: 'car', mesh, info, speed: 3.2 + r() * 2.5, loop: true, ambient: true, d: r() * info.total });
  }
  const blocks = [];
  for (let i = e.imin; i <= e.imax; i++) for (let j = e.jmin; j <= e.jmax; j++) blocks.push([i, j]);
  for (let k = 0; k < nPeds; k++) {
    const [i, j] = blocks[Math.floor(r() * blocks.length)], o = 4.95;
    let pts = [{ x: i * P - o, z: j * P - o }, { x: i * P + o, z: j * P - o }, { x: i * P + o, z: j * P + o }, { x: i * P - o, z: j * P + o }];
    if (r() > 0.5) pts.reverse();
    pts.push({ ...pts[0] });
    const mesh = walkerMesh(1000 + k * 13); scene.add(mesh);
    const info = pathInfo(pts);
    addActor({ kind: 'walker', mesh, info, speed: 0.7 + r() * 0.6, loop: true, ambient: true, own: true, d: r() * info.total });
  }
}

/* ---------- events: what just happened in the app ---------- */
function txList() { return [...(state.transactions || [])]; }
function txTime(tx) { return new Date(tx.recordedAt || tx.date || 0).getTime(); }
function nameOf(B) { return B && B.item.ent ? B.item.ent.name : ''; }
function bld(key) { return key && world ? world.buildings.get(key) : null; }

function playTx(tx) {
  const money2 = (v, cur) => hidden() ? '••••' : formatAmount(Math.abs(v), cur || 'THB');
  const amountTxt = money2(tx.amount, tx.currency);
  const auto = tx.auto ? 'อัตโนมัติ · ' : '';
  const seat = Boolean(tx.auto);                       // auto deposits / withdrawals come from the lobby queue
  if (tx.type === 'income') {
    const B = bld(entityKeyFromTx(tx.account)); if (!B) return;
    spawnTruck(routeToGate(B).reverse(), 'in', `+${amountTxt}`);
    visit(B, at => bubble(B, `+${amountTxt}`, 'in', at), seat);
    feed('deposit', `${auto}รถส่งของเข้า ${nameOf(B)} · +${amountTxt}`, 'in');
  } else if (tx.type === 'expense') {
    const B = bld(entityKeyFromTx(tx.account)); if (!B) return;
    visit(B, at => { bubble(B, `−${amountTxt}`, 'out', at); spawnTruck(routeToGate(B), 'out', `−${amountTxt}`); }, seat);
    feed('withdraw', `${auto}${nameOf(B)} ส่งออเดอร์ออกนอกเมือง · ${amountTxt}`, 'out');
  } else if (tx.type === 'transfer') {
    const A = bld(keyOfAccount(tx.from));
    const B = tx.toType === 'goal' ? bld(keyOfGoal(tx.to)) : tx.toType === 'account' ? bld(keyOfAccount(tx.to)) : null;
    if (A && B) {
      const got = money2(tx.received ?? tx.amount, tx.receivedCurrency || tx.currency);
      visit(A, at => {
        bubble(A, `−${amountTxt}`, 'out', at);
        spawnTruck(routeBetween(A, B), 'move', amountTxt, () => bubble(B, `+${got}`, 'in'));
      });
      feed('transfer', `${nameOf(A)} → ${nameOf(B)} · ${amountTxt}`, 'move');
    } else if (A) {
      visit(A, at => { bubble(A, `−${amountTxt}`, 'out', at); spawnTruck(routeToGate(A), 'out', `−${amountTxt}`); });
      feed('transfer', `${nameOf(A)} ส่งของออกนอกเมือง · ${amountTxt}`, 'out');
    }
  } else if (tx.type === 'internal_transfer') {
    const B = bld(keyOfAccount(tx.account)); if (!B) return;
    const toBank = tx.destination === 'bank';
    visit(B, at => bubble(B, `${toBank ? 'เงินสด → ธนาคาร' : 'ธนาคาร → เงินสด'} ${amountTxt}`, 'move', at));
    feed('exchange', `${nameOf(B)}: ย้าย${toBank ? 'เงินสดเข้าธนาคาร' : 'เงินจากธนาคารมาเป็นเงินสด'} · ${amountTxt}`, 'move');
  } else if (tx.type === 'cash_reconciliation' || tx.type === 'bank_reconciliation') {
    const B = bld(keyOfAccount(tx.account)); if (!B) return;
    const cashCheck = tx.type === 'cash_reconciliation';
    const delta = Number(cashCheck ? tx.cashDelta : tx.bankDelta);
    const sign = Number.isFinite(delta) && delta !== 0 ? (delta > 0 ? '+' : '−') : '';
    visit(B, at => bubble(B, `${cashCheck ? 'นับเงินสด' : 'ตรวจยอดธนาคาร'} · ปรับ ${sign}${amountTxt}`, sign === '−' ? 'out' : 'in', at));
    feed('check', `${nameOf(B)}: ${cashCheck ? 'ห้องนับเงินตรวจนับเงินสดแล้ว' : 'เคาน์เตอร์ตรวจยอดธนาคารแล้ว'} · ปรับ ${sign}${amountTxt}`, 'move');
  } else if (tx.type === 'adjust') {
    const B = bld(entityKeyFromTx(tx.account)); if (!B) return;
    visit(B, at => bubble(B, `ปรับยอด ${tx.direction === 'out' ? '−' : '+'}${amountTxt}`, tx.direction === 'out' ? 'out' : 'in', at));
  }
}
function markSeen() {
  prefs.seen = txList().sort((a, b) => txTime(b) - txTime(a)).slice(0, 300).map(t => t.id).filter(Boolean);
  savePrefs();
}
function newTransactions() {
  if (!prefs.seen.length) return [];
  const seen = new Set(prefs.seen);
  return txList().filter(t => t.id && !seen.has(t.id)).sort((a, b) => txTime(a) - txTime(b)).slice(-6);
}
function playNew(delay = 0) {
  const fresh = newTransactions();
  markSeen();
  fresh.forEach((tx, k) => setTimeout(() => { if (opened) playTx(tx); }, delay + k * 900));
  return fresh.length;
}

/* ---------- sync with the app ---------- */
function sync() {
  if (!world) return;
  night = document.documentElement.getAttribute('data-theme') === 'dark';
  const list = entityList();
  if (layoutSig(list) !== world.sig) { buildWorld(); if (opened) playNew(400); updateHud(); return; }
  world.buildings.forEach(B => {
    if (B.kind === 'park') return;
    const item = list.find(it => it.key === B.key); if (item) B.item = item;
    refreshStats(B);
    const vs = visualSig(B);
    if (vs !== B.vsig) {
      const oldFloors = B.floors.length;
      buildBuilding(B); B.vsig = vs;
      if (B.kind !== 'lot' && B.stats.floors > oldFloors && oldFloors > 0 && opened) { bubble(B, `ขยายเป็น ${B.stats.floors} ชั้น`, 'up'); feed('up', `${nameOf(B)} ขยายตึกเป็น ${B.stats.floors} ชั้น`, 'up'); }
      applyLight();
    }
    fillTag(B);
  });
  if (opened) playNew(0);
  updateHud(); syncXrayButton();
  if (openKey) renderPanel();
}

/* ---------- HUD, chips, panel ---------- */
function cityLevel() { let n = 0; world.buildings.forEach(B => { if (B.stats && B.kind !== 'lot' && B.kind !== 'park') n += B.stats.level || 0; }); return n; }
function updateHud() {
  if (!hudValue || !world) return;
  const total = typeof totalTHB === 'function' ? totalTHB() : 0;
  hudValue.textContent = hidden() ? '••••' : formatAmount(total, 'THB');
  hudLevel.textContent = `Lv.${cityLevel()}`;
}
function syncXrayButton() { const b = root && root.querySelector('#mpcXray'); if (b) b.setAttribute('aria-pressed', String(xrayOn())); }
function updateClock() {
  if (!hudClock) return;
  const d = new Date();
  hudClock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function renderChips() {
  if (!chipsEl || !world) return;
  const items = [...world.buildings.values()].filter(B => B.kind !== 'park' && B.kind !== 'lot');
  chipsEl.innerHTML = items.map(B => `<button type="button" class="mpc-chip${B.key === openKey ? ' on' : ''}" data-key="${escH(B.key)}"><i style="background:#${entityColor(B.item).getHexString()}"></i>${escH(B.item.ent.name)}</button>`).join('');
}
function scheduleText(s) {
  const d = new Date(s.runAt);
  const when = `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `<li><span>${svg(s.kind === 'withdraw' ? 'withdraw' : 'deposit')}${s.kind === 'withdraw' ? 'ถอนอัตโนมัติ' : 'ฝากอัตโนมัติ'}</span><small>${when}</small><b>${money(s.amount, s.currency || 'THB')}</b></li>`;
}
function recentFor(B) {
  const id = B.item.ent.id, goalId = `goal:${id}`;
  return txList().filter(t => B.kind === 'goal'
    ? t.account === goalId || (t.toType === 'goal' && t.to === id)
    : t.account === id || t.from === id || (t.toType === 'account' && t.to === id))
    .sort((a, b) => txTime(b) - txTime(a)).slice(0, 3);
}
function txLine(t, B) {
  const id = B.item.ent.id;
  const recon = t.type === 'cash_reconciliation' || t.type === 'bank_reconciliation';
  const rd = recon ? Number(t.totalDelta ?? ((Number(t.cashDelta) || 0) + (Number(t.bankDelta) || 0))) : 0;
  const incoming = t.type === 'income' || (t.type === 'transfer' && t.to === id) || (t.type === 'adjust' && t.direction !== 'out') || rd > 0;
  const outgoing = t.type === 'expense' || (t.type === 'transfer' && t.from === id) || (t.type === 'adjust' && t.direction === 'out') || rd < 0;
  const label = t.note || (t.type === 'cash_reconciliation' ? 'ตรวจนับเงินสด' : t.type === 'bank_reconciliation' ? 'ตรวจยอดธนาคาร' : t.type === 'internal_transfer' ? 'ย้ายเงินสด ↔ ธนาคาร' : incoming ? 'เงินเข้า' : outgoing ? 'เงินออก' : 'รายการ');
  const amount = t.type === 'transfer' && t.to === id ? (t.received ?? t.amount) : t.amount;
  const cur = t.type === 'transfer' && t.to === id ? (t.receivedCurrency || t.currency) : t.currency;
  const sign = incoming ? '+' : outgoing ? '−' : '';
  return `<li class="${incoming ? 'in' : outgoing ? 'out' : ''}"><span>${escH(label)}</span><b>${sign}${money(amount, cur || 'THB')}</b></li>`;
}
function renderPanel() {
  const B = bld(openKey);
  if (!B || !panelEl) { panelEl && (panelEl.hidden = true); return; }
  const c = '#' + entityColor(B.item).getHexString();
  if (B.kind === 'lot') {
    panelEl.innerHTML = `<header class="mpc-p-head"><span class="mpc-swatch" style="background:${c}"></span><div><small>ที่ดินว่าง</small><h2>รอสร้างบริษัทใหม่</h2></div><button type="button" class="mpc-x" data-mpc="panel-close" aria-label="ปิด">${svg('x')}</button></header>
      <p class="mpc-p-note">เพิ่ม Pocket ใหม่ในหน้าบัญชี บริษัทใหม่จะมาเปิดบนที่ดินแปลงนี้</p>`;
    panelEl.hidden = false; layoutPanel(); return;
  }
  const s = B.stats, ent = B.item.ent;
  const cur = B.kind === 'goal' ? 'THB' : ent.currency;
  const rows = [];
  rows.push(['พนักงาน', `${s.staff}/${s.cap} คน`]);
  rows.push([B.kind === 'goal' ? 'ของในโกดัง (ยอดในกล่อง)' : 'ของในโกดัง (ยอดตอนนี้)', money(ent.balance, cur)]);
  if (isCashflow(ent)) { rows.push(['ห้องนับเงิน · เงินสดในมือ', money(ent.cashBalance, 'THB')]); rows.push(['เคาน์เตอร์ · บัญชีธนาคาร', money(ent.bankBalance, 'THB')]); }
  if (B.kind === 'goal') rows.push(['เป้าหมาย', `${money(ent.target, 'THB')} · ${Math.min(100, Math.round((Number(ent.balance) || 0) / Math.max(1, Number(ent.target) || 1) * 100))}%`]);
  rows.push(['ยอดสูงสุดที่เคยมี', money(B.peak, 'THB')]);
  let grow = '';
  if (s.nextAt != null) {
    const pct = Math.round(clamp((B.peak - (s.prevAt || 0)) / Math.max(1, s.nextAt - (s.prevAt || 0))) * 100);
    const what = B.kind === 'goal' ? `โตเป็นขั้น ${s.level + 1}` : `ขยายเป็น ${s.floors + 1} ชั้น`;
    grow = `<div class="mpc-grow"><div><span>${what} เมื่อยอดสูงสุดถึง</span><b>${money(s.nextAt, 'THB')}</b></div><i><u style="width:${pct}%"></u></i></div>`;
  } else if (B.kind === 'goal' && s.done) grow = `<div class="mpc-grow done"><div><span>ธุรกิจนี้ถึงเป้าแล้ว ปักธงบนดาดฟ้า</span><b>${svg('check')}</b></div></div>`;
  else grow = `<div class="mpc-grow done"><div><span>ตึกนี้สูงสุดแล้ว</span><b>${svg('star')}</b></div></div>`;
  const pend = pendingFor(B);
  const queue = pend.length ? `<ul class="mpc-list">${pend.slice(0, 3).map(scheduleText).join('')}</ul>${pend.length > 3 ? `<p class="mpc-p-note">และอีก ${pend.length - 3} คิว</p>` : ''}` : `<p class="mpc-p-note">ไม่มีคิว เคาน์เตอร์ว่าง</p>`;
  const recent = recentFor(B);
  const act = recent.length ? `<ul class="mpc-list">${recent.map(t => txLine(t, B)).join('')}</ul>` : `<p class="mpc-p-note">ยังไม่มีรายการ</p>`;
  const action = B.kind === 'goal'
    ? `<button type="button" class="mpc-btn" data-mpc="goal" data-id="${escH(ent.id)}">${svg('deposit')}ฝากเข้ากล่องนี้</button>`
    : `<button type="button" class="mpc-btn" data-mpc="account" data-id="${escH(ent.id)}">${svg('wallet')}เปิดบัญชีนี้</button>`;
  panelEl.innerHTML = `<header class="mpc-p-head"><span class="mpc-swatch" style="background:${c}"></span><div><small>${kindLabel(B)}</small><h2>${escH(ent.name)}</h2><p>${B.kind === 'goal' ? (s.done ? 'ถึงเป้าแล้ว' : `ขั้น ${s.level}`) : `Lv.${s.level}`} · ${s.floors} ชั้น</p></div><button type="button" class="mpc-x" data-mpc="panel-close" aria-label="ปิดตึก">${svg('x')}</button></header>
    <dl class="mpc-rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    ${grow}
    <h3>คิวรอทำรายการ</h3>${queue}
    <h3>ล่าสุด</h3>${act}
    <div class="mpc-actions">${action}</div>`;
  panelEl.hidden = false;
  layoutPanel();
}
/* the 3D view only uses the space the panel leaves free (no overlap = the building stays in the middle of what you see) */
function layoutPanel() {
  if (!root || !panelEl) return;
  const wide = root.clientWidth >= 860, open = !panelEl.hidden;
  root.style.setProperty('--mpc-ph', open && !wide ? `${panelEl.offsetHeight}px` : '0px');
  root.style.setProperty('--mpc-pw', open && wide ? `${panelEl.offsetWidth + 32}px` : '0px');
}

/* ---------- open / close a building ---------- */
function openBuilding(key, fly = true) {
  const B = bld(key); if (!B) return;
  openKey = key;
  world.buildings.forEach(o => { o.openGoal = o.key === key && o.kind !== 'lot' && o.kind !== 'park' ? 1 : 0; o.tagEl?.classList.toggle('dim', o.key !== key); });
  if (fly) {
    const tall = B.floors && B.floors.length ? B.floors.length * B.fh * (1 + GAP) + 1.5 : 2;
    goal.tx = B.kind === 'lot' ? B.cx : B.bx; goal.tz = B.kind === 'lot' ? B.cz : B.bz;
    goal.ty = tall * 0.5;
    goal.dist = clamp(tall * 2.6 + 8, 16, 70);
  }
  renderPanel(); renderChips();
  root.classList.add('has-panel');
}
function closeBuilding() {
  openKey = null; goal.ty = 0.8;
  world && world.buildings.forEach(o => { o.openGoal = 0; o.tagEl?.classList.remove('dim'); });
  if (panelEl) panelEl.hidden = true;
  root && root.classList.remove('has-panel');
  layoutPanel();
  renderChips();
}
function stepBuildings(dt) {
  world.buildings.forEach(B => {
    if (!B.floors || !B.floors.length) return;
    const target = B.openGoal || (xrayOn() && B.kind !== 'lot' && B.kind !== 'park') ? 1 : 0;
    if (Math.abs(B.open - target) < 0.001 && !B._dirty) return;
    B.open += (target - B.open) * Math.min(1, dt * 6);
    if (Math.abs(B.open - target) < 0.002) B.open = target;
    B._dirty = B.open !== target;
    const gap = 1 + GAP * B.open;
    B.floors.forEach((f, i) => {
      f.g.position.y = i * B.fh * gap;
      const show = target === 0 && B.open < 0.06;
      if (f.shell) f.shell.visible = show;
      if (f.lit) f.lit.visible = show && night;
    });
    if (B.roof) { B.roof.position.y = B.floors.length * B.fh * gap + B.open * 1.5; B.roof.visible = target === 0 && B.open < 0.06; }
  });
}

/* ---------- light: follows the real clock (or the app theme, set in การตั้งค่า) ----------
   dawn 06:00–08:00 · day · golden light 16:30–18:30 · night with windows and street lamps on */
const LOOKS = {
  night:  { top: 0x060b1a, hor: 0x1d2944, sun: 0x9fb4ff, sunI: 0.2,  hemiS: 0x8195c8, hemiG: 0x161d2c, hemiI: 0.4,  elev: 52, exp: 1.0,  near: 1.5, far: 3.9, cloud: 0x2b3756, cloudO: 0.35, lit: 1,   glow: 0.25 },
  dawn:   { top: 0x6788c2, hor: 0xf5b9a2, sun: 0xffc4a2, sunI: 0.62, hemiS: 0xe6dcf2, hemiG: 0x9a9a86, hemiI: 0.52, elev: 11, exp: 1.12, near: 0.9, far: 3.2, cloud: 0xffd6c6, cloudO: 0.8,  lit: 0.3, glow: 0.8 },
  day:    { top: 0x5d9de0, hor: 0xd9e9f5, sun: 0xfff3df, sunI: 0.56, hemiS: 0xffffff, hemiG: 0x9fb39a, hemiI: 0.62, elev: 58, exp: 1.0,  near: 1.4, far: 3.7, cloud: 0xffffff, cloudO: 0.9,  lit: 0,   glow: 0.35 },
  golden: { top: 0x6a86b9, hor: 0xffcd8a, sun: 0xffb45e, sunI: 0.9,  hemiS: 0xffe9cc, hemiG: 0xa89a7a, hemiI: 0.56, elev: 13, exp: 1.08, near: 0.8, far: 3.0, cloud: 0xffdaa2, cloudO: 0.85, lit: 0,   glow: 1 },
  sunset: { top: 0x3a4979, hor: 0xff9b5c, sun: 0xff8846, sunI: 0.72, hemiS: 0xf2bca4, hemiG: 0x6a5652, hemiI: 0.44, elev: 4,  exp: 1.08, near: 0.7, far: 2.8, cloud: 0xffa07a, cloudO: 0.8,  lit: 0.6, glow: 1 }
};
const LIGHT_KEYS = [[0, 'night'], [5.4, 'night'], [6.4, 'dawn'], [8, 'day'], [16.3, 'day'], [17.4, 'golden'], [18.25, 'sunset'], [19.1, 'night'], [24, 'night']];
let look = null, lightTimer = 0;
const _ca = new THREE.Color(), _cb = new THREE.Color();
function mixLook(a, b, t) {
  const out = {};
  Object.keys(a).forEach(k => {
    if (['top', 'hor', 'sun', 'hemiS', 'hemiG', 'cloud'].includes(k)) out[k] = _ca.set(a[k]).lerp(_cb.set(b[k]), t).getHex();
    else out[k] = a[k] + (b[k] - a[k]) * t;
  });
  return out;
}
function lookForHour(h) {
  for (let i = 1; i < LIGHT_KEYS.length; i++) {
    const [h1, k1] = LIGHT_KEYS[i], [h0, k0] = LIGHT_KEYS[i - 1];
    if (h <= h1) { const t = h1 === h0 ? 0 : (h - h0) / (h1 - h0); return mixLook(LOOKS[k0], LOOKS[k1], t * t * (3 - 2 * t)); }
  }
  return { ...LOOKS.night };
}
function currentLook() {
  const mode = (state.settings && state.settings.cityLight) === 'theme' ? 'theme' : 'clock';
  if (mode === 'theme') return { look: { ...LOOKS[document.documentElement.getAttribute('data-theme') === 'dark' ? 'night' : 'day'] }, hour: 12 };
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  return { look: lookForHour(h), hour: h };
}
function sunDirection(hour, elevDeg, isNight) {
  const e = elevDeg * Math.PI / 180;
  if (isNight) return new THREE.Vector3(0.35, Math.sin(e), 0.55).normalize();         // moonlight
  const t = clamp((hour - 6) / 12);                                                       // east in the morning → west in the evening
  // the sun stays on the camera's side of town, so the facades you look at catch the light
  return new THREE.Vector3(0.8 * Math.cos(Math.PI * t) * Math.cos(e), Math.sin(e), 0.7 * Math.cos(e) + 0.1).normalize();
}
function applyLight() {
  if (!scene) return;
  const { look: L, hour } = currentLook();
  look = L;
  night = L.lit > 0.45;
  const dir = sunDirection(hour, L.elev, L.lit > 0.9);
  scene.background = new THREE.Color(L.hor);
  if (root) root.style.background = `#${new THREE.Color(L.hor).getHexString()}`;
  scene.fog.color.set(L.hor);
  hemi.color.set(L.hemiS); hemi.groundColor.set(L.hemiG); hemi.intensity = L.hemiI;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  if (sky) {
    const u = sky.material.uniforms;
    u.top.value.set(L.top); u.hor.value.set(L.hor); u.sunCol.value.set(L.sun);
    u.sunDir.value.copy(dir); u.glow.value = L.glow; u.disc.value = L.lit > 0.9 ? 0.35 : 1;
  }
  if (world) {
    const g = world.ground;
    sun.target.position.set(g.cx, 0, g.cz);
    sun.position.set(g.cx + dir.x * 120, dir.y * 120, g.cz + dir.z * 120);
    const R = g.R + 14;
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 300 });
    sun.shadow.camera.updateProjectionMatrix();
    if (g.lamps) g.lamps.visible = night;
    if (g.glows) g.glows.visible = night;
    if (g.clouds) g.clouds.children.forEach(c => { c.material.color.set(L.cloud); c.userData.base = L.cloudO; });
    world.buildings.forEach(B => { B._dirty = true; (B.floors || []).forEach(f => { if (f.lit) f.lit.visible = night && B.openGoal === 0 && !xrayOn() && B.open < 0.06; }); });
  }
}

/* sky dome: colour from the horizon up, with the sun (or moon) and its glow */
let sky = null;
function buildSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, glow: { value: 0.4 }, disc: { value: 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = gl_Position.w * 0.9999; }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 sunCol; uniform vec3 sunDir; uniform float glow; uniform float disc; varying vec3 vDir;' +
      'void main(){ vec3 d = normalize(vDir); float h = d.y; vec3 c = mix(hor, top, pow(clamp(h, 0.0, 1.0), 0.5));' +
      ' float s = max(dot(d, normalize(sunDir)), 0.0);' +
      ' c += sunCol * (smoothstep(0.9993, 0.9997, s) * disc + pow(s, 12.0) * 0.45 * glow + pow(s, 3.0) * 0.18 * glow);' +
      ' c = mix(c, hor, smoothstep(0.02, -0.08, h)); gl_FragColor = vec4(c, 1.0); }',
    side: THREE.BackSide, depthWrite: false, fog: false
  });
  sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
}
function stepSky(dt) {
  if (sky) sky.position.copy(camera.position);
  if (!world || !world.ground.clouds) return;
  const g = world.ground;
  // clouds drift around the town; the ones on the camera's side fade out so they never cover the view
  const camAng = Math.atan2(camera.position.z - g.cz, camera.position.x - g.cx);
  g.clouds.children.forEach(c => {
    c.userData.ang += c.userData.speed * dt * 0.004;
    c.position.x = g.cx + Math.cos(c.userData.ang) * c.userData.rad; c.position.z = g.cz + Math.sin(c.userData.ang) * c.userData.rad;
    let diff = c.userData.ang - camAng; diff = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
    c.material.opacity = (c.userData.base || 0) * clamp((diff - 1.75) / 0.6);
    c.visible = c.material.opacity > 0.01;
  });
}

/* soft textures drawn once on a canvas: lamp glow, cloud puffs, contact shadow */
const texCache = {};
function canvasTexture(key, w, h, draw) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  return (texCache[key] = t);
}
function glowMaterial() {
  const map = canvasTexture('glow', 64, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,236,180,0.9)'); g.addColorStop(0.35, 'rgba(255,214,140,0.35)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  return texCache.glowMat || (texCache.glowMat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }));
}
function cloudMaterial() {
  const map = canvasTexture('cloud', 256, 128, (x, w, h) => {
    const r = rng(99);
    for (let k = 0; k < 16; k++) {
      const cx = w * (0.18 + r() * 0.64), cy = h * (0.45 + r() * 0.2), rad = h * (0.18 + r() * 0.22);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
  });
  return new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false });
}
function contactMaterial() {
  const map = canvasTexture('contact', 64, 64, (x, w, h) => {
    // stacked see-through rectangles = a soft-edged shadow (canvas blur is missing on older iPhones)
    for (let i = 0; i < 12; i++) { const m = 2 + i * 2.2; x.fillStyle = 'rgba(10,16,28,0.085)'; x.fillRect(m, m, w - m * 2, h - m * 2); }
  });
  return texCache.contactMat || (texCache.contactMat = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.38, depthWrite: false, toneMapped: false }));
}

/* ---------- camera ---------- */
function fitCity() {
  const gnd = world.ground;
  const cx = (gnd.x0 + gnd.x1) / 2 + 2, cz = (gnd.z0 + gnd.z1) / 2;
  const R = Math.hypot(gnd.x1 - gnd.x0, gnd.z1 - gnd.z0) / 2 + 4;
  const aspect = Math.max(0.3, canvas.clientWidth / Math.max(1, canvas.clientHeight));
  const fov = BASE_FOV * Math.PI / 180;
  const dist = (R / Math.tan(fov / 2)) / Math.min(1, aspect) * (aspect < 1 ? 0.5 : 0.62);
  goal.tx = cx; goal.tz = cz; goal.ty = 0.8; goal.dist = clamp(dist, 18, 150); goal.az = Math.PI / 4; goal.pol = 1.0;
}
function stepCamera(dt) {
  const k = Math.min(1, dt * 7);
  ['tx', 'ty', 'tz', 'dist', 'pol'].forEach(p => { cam[p] += (goal[p] - cam[p]) * k; });
  let d = goal.az - cam.az; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.az += d * k;
  // closer in, the camera tilts towards the horizon (like a city game), so the hills and mountains come into view
  const pol = clamp(cam.pol + clamp((70 - cam.dist) / 55) * 0.28, 0.45, 1.32);
  const sp = Math.sin(pol);
  camera.position.set(cam.tx + sp * Math.sin(cam.az) * cam.dist, cam.ty + Math.cos(pol) * cam.dist, cam.tz + sp * Math.cos(cam.az) * cam.dist);
  camera.lookAt(cam.tx, cam.ty, cam.tz);
  scene.fog.near = Math.max(60, cam.dist * (look ? look.near : 1.4)); scene.fog.far = Math.max(380, cam.dist * (look ? look.far : 3.6));
}
function placeEl(el, x, y, z) {
  _v.set(x, y, z).project(camera);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  const visible = _v.z < 1 && _v.x > -1.2 && _v.x < 1.2 && _v.y > -1.2 && _v.y < 1.2;
  const sx = (_v.x + 1) / 2 * W, sy = (1 - _v.y) / 2 * H;
  el.style.visibility = visible ? 'visible' : 'hidden';
  if (visible) el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
  return visible ? { x: sx, y: sy } : null;
}
/* building names must not sit on top of each other: important ones first, the rest step up or wait */
const TAG_RANK = { hq: 0, sub: 1, goal: 2, lot: 3 };
function declutter(entries) {
  entries.sort((a, b) => (b.B.key === openKey) - (a.B.key === openKey) || TAG_RANK[a.B.kind] - TAG_RANK[b.B.kind] || a.p.y - b.p.y);
  const placed = [];
  entries.forEach(({ B, p }) => {
    const el = B.tagEl;
    if (!el._w) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
    const w = el._w, h = el._h;
    let done = false;
    for (let step = 0; step < 3 && !done; step++) {
      const y = p.y - step * (h + 4);
      const r = { l: p.x - w / 2 - 3, r: p.x + w / 2 + 3, t: y - h - 2, b: y + 2 };
      if (!placed.some(q => r.l < q.r && r.r > q.l && r.t < q.b && r.b > q.t)) {
        placed.push(r); done = true;
        if (step) el.style.transform = `translate(${p.x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    }
    if (!done) el.style.visibility = 'hidden';
  });
}
function stepTags(dt) {
  const entries = [];
  world.buildings.forEach(B => {
    if (!B.tagEl) return;
    const h = B.floors && B.floors.length ? B.floors.length * B.fh * (1 + GAP * B.open) + 0.9 + B.open * 1.5 : 2.4;
    const p = placeEl(B.tagEl, B.kind === 'lot' ? B.cx : B.bx, BASE_Y + h, B.kind === 'lot' ? B.cz : B.bz);
    if (p) entries.push({ B, p });
  });
  declutter(entries);
  if (world.gateTag) placeEl(world.gateTag, world.ground.gateX, 4.4, world.ground.hz);
  for (let k = bubbles.length - 1; k >= 0; k--) {
    const b = bubbles[k]; b.t += dt;
    const B = b.B;
    if (b.at && B.open > 0.5) placeEl(b.el, b.at.x, BASE_Y + 1.6 + b.t * 0.6, b.at.z);      // over the counter when the building is open
    else {
      const h = B.floors && B.floors.length ? B.floors.length * B.fh * (1 + GAP * B.open) + 2.2 : 3.4;
      placeEl(b.el, B.kind === 'lot' ? B.cx : B.bx, BASE_Y + h + b.t * 0.8, B.kind === 'lot' ? B.cz : B.bz);
    }
    b.el.style.opacity = String(clamp(b.t < 0.25 ? b.t / 0.25 : 1 - (b.t - 2.2) / 0.6));
    if (b.t > 2.8) { b.el.remove(); bubbles.splice(k, 1); }
  }
}

/* ---------- input: touch, mouse, keyboard ---------- */
const pointers = new Map();
let pinch = null;
function localPoint(e) {
  const r = canvas.getBoundingClientRect();
  const rot = typeof appRotation === 'function' ? appRotation() : '';
  if (rot === 'ccw') return { x: r.bottom - e.clientY, y: e.clientX - r.left };
  if (rot === 'cw') return { x: e.clientY - r.top, y: r.right - e.clientX };
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function worldPerPixel() { return 2 * cam.dist * Math.tan(BASE_FOV * Math.PI / 360) / Math.max(1, canvas.clientHeight); }
function panBy(dx, dy) {
  const k = worldPerPixel();
  const rx = Math.cos(cam.az), rz = -Math.sin(cam.az);
  const fx = -Math.sin(cam.az), fz = -Math.cos(cam.az);
  goal.tx += (-rx * dx + fx * dy / Math.cos(cam.pol * 0.7)) * k;
  goal.tz += (-rz * dx + fz * dy / Math.cos(cam.pol * 0.7)) * k;
  const g = world.ground;
  goal.tx = clamp(goal.tx, g.x0 - 10, g.x1 + 40); goal.tz = clamp(goal.tz, g.z0 - 10, g.z1 + 10);
  cam.tx = goal.tx; cam.tz = goal.tz;
}
function pickAt(p) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  _v.set((p.x / W) * 2 - 1, -(p.y / H) * 2 + 1, 0.5);
  raycaster.setFromCamera({ x: _v.x, y: _v.y }, camera);
  const picks = []; world.buildings.forEach(B => { if (B.pick) picks.push(B.pick); });
  const hit = raycaster.intersectObjects(picks, false)[0];
  return hit ? hit.object.userData.key : null;
}
function onDown(e) {
  if (e.button === 1) return;
  canvas.setPointerCapture?.(e.pointerId);
  const p = localPoint(e);
  pointers.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, t: performance.now(), rotate: e.button === 2 || e.shiftKey || e.ctrlKey, moved: 0 });
  if (pointers.size === 2) pinch = pinchState();
}
function pinchState() {
  const [a, b] = [...pointers.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
}
function onMove(e) {
  const p = localPoint(e);
  const ptr = pointers.get(e.pointerId);
  if (!ptr) { if (e.pointerType === 'mouse') hover(p); return; }
  const dx = p.x - ptr.x, dy = p.y - ptr.y;
  ptr.x = p.x; ptr.y = p.y; ptr.moved = Math.max(ptr.moved, Math.hypot(p.x - ptr.sx, p.y - ptr.sy));
  if (pointers.size === 1) {
    if (ptr.rotate) { goal.az -= dx * 0.008; goal.pol = clamp(goal.pol - dy * 0.004, 0.45, 1.25); }
    else panBy(dx, dy);
  } else if (pointers.size === 2 && pinch) {
    const now = pinchState();
    if (now.d > 10 && pinch.d > 10) goal.dist = clamp(goal.dist * pinch.d / now.d, 8, 160);
    let da = now.ang - pinch.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
    goal.az -= da;
    panBy(now.mx - pinch.mx, now.my - pinch.my);
    pinch = now;
  }
}
function onUp(e) {
  const ptr = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (!ptr) return;
  if (ptr.moved < 8 && performance.now() - ptr.t < 500 && !ptr.rotate && pointers.size === 0) {
    const key = pickAt(ptr);
    if (key) { if (key === openKey) closeBuilding(); else openBuilding(key); }
    else if (openKey) closeBuilding();
  }
}
let hoverKey = null, hoverT = 0;
function hover(p) {
  const now = performance.now(); if (now - hoverT < 60) return; hoverT = now;
  const key = pickAt(p);
  if (key !== hoverKey) {
    if (hoverKey) bld(hoverKey)?.tagEl?.classList.remove('hover');
    hoverKey = key;
    if (key) bld(key)?.tagEl?.classList.add('hover');
    canvas.style.cursor = key ? 'pointer' : 'grab';
  }
}
function onWheel(e) { e.preventDefault(); goal.dist = clamp(goal.dist * Math.exp(e.deltaY * 0.0012), 8, 160); }
function onKey(e) {
  if (!opened) return;
  if (e.key === 'Escape') { e.preventDefault(); if (openKey) closeBuilding(); else close(); }
  else if (e.key === 'ArrowLeft') goal.az += 0.25;
  else if (e.key === 'ArrowRight') goal.az -= 0.25;
  else if (e.key === '+' || e.key === '=') goal.dist = clamp(goal.dist * 0.82, 8, 160);
  else if (e.key === '-') goal.dist = clamp(goal.dist / 0.82, 8, 160);
}

/* ---------- DOM ---------- */
const CSS = `
.mpc{--mpc-card:#ffffff;--mpc-fg:#15191e;--mpc-muted:#6a737b;--mpc-line:#e4e7e2;--mpc-soft:#f1f3ef;--mpc-in:#1f9d55;--mpc-out:#d4622b;--mpc-move:#3166d6;--mpc-up:#b7870f;--mpc-shadow:0 12px 32px rgba(22,40,58,.16);
  position:fixed;inset:0;z-index:9000;background:#dfe9f1;color:var(--mpc-fg);overflow:hidden;font-family:'Noto Sans Thai',system-ui,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none}
html[data-theme="dark"] .mpc{--mpc-card:#1b1e24;--mpc-fg:#eef0f3;--mpc-muted:#9aa2ab;--mpc-line:#2d3139;--mpc-soft:#252931;--mpc-in:#4fd68b;--mpc-out:#ff9a62;--mpc-move:#7aa2ff;--mpc-up:#ffd35c;--mpc-shadow:0 12px 32px rgba(0,0,0,.5);background:#0e1524}
.mpc canvas{position:absolute;top:0;left:0;right:var(--mpc-pw,0px);bottom:var(--mpc-ph,0px);width:calc(100% - var(--mpc-pw,0px));height:calc(100% - var(--mpc-ph,0px));display:block;cursor:grab;outline:none}
.mpc-ic{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mpc-tags{position:absolute;top:0;left:0;right:var(--mpc-pw,0px);bottom:var(--mpc-ph,0px);pointer-events:none;overflow:hidden}
.mpc-tag{position:absolute;left:0;top:0;display:flex;align-items:center;gap:6px;margin:0;padding:5px 9px 5px 7px;border:0;border-radius:999px;background:var(--mpc-card);color:var(--mpc-fg);box-shadow:0 4px 14px rgba(20,35,50,.18);font:600 11.5px/1.2 'Noto Sans Thai',system-ui,sans-serif;white-space:nowrap;pointer-events:auto;cursor:pointer;translate:-50% -100%;transition:opacity .25s,scale .2s}
.mpc-tag i{width:9px;height:9px;border-radius:50%;flex:none}
.mpc-tag small{font:600 10.5px 'IBM Plex Mono',ui-monospace,monospace;color:var(--mpc-muted)}
.mpc-tag em{display:flex;align-items:center;gap:3px;font-style:normal;font-size:10.5px;color:var(--mpc-up);font-weight:700}
.mpc-tag em .mpc-ic{width:12px;height:12px}
.mpc-tag-hq{padding:7px 12px 7px 9px;font-size:13px}
.mpc-tag-lot{background:color-mix(in srgb,var(--mpc-card) 82%,transparent);flex-direction:column;align-items:flex-start;gap:0;border-radius:12px}
.mpc-tag-lot i{display:none}.mpc-tag-lot small{font-family:inherit;font-weight:500}
.mpc-tag-gate{background:#1d3540;color:#dff7ea;cursor:default;pointer-events:none}
.mpc-tag.dim{opacity:.35;scale:.9}
.mpc-tag.hover{scale:1.08}
.mpc-bubble{position:absolute;left:0;top:0;translate:-50% -100%;padding:4px 10px;border-radius:10px;background:var(--mpc-card);font:700 12px 'IBM Plex Mono','Noto Sans Thai',monospace;box-shadow:var(--mpc-shadow);white-space:nowrap;pointer-events:none}
.mpc-bubble.in{color:var(--mpc-in)}.mpc-bubble.out{color:var(--mpc-out)}.mpc-bubble.move{color:var(--mpc-move)}.mpc-bubble.up{color:var(--mpc-up)}
.mpc-truck-tag{position:absolute;left:0;top:0;translate:-50% -100%;padding:2px 7px;border-radius:7px;background:var(--mpc-card);font:700 10.5px 'IBM Plex Mono',monospace;box-shadow:0 3px 10px rgba(0,0,0,.15);pointer-events:none;white-space:nowrap}
.mpc-truck-tag.in{color:var(--mpc-in)}.mpc-truck-tag.out{color:var(--mpc-out)}.mpc-truck-tag.move{color:var(--mpc-move)}
.mpc-hud{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:calc(10px + var(--sa-top, env(safe-area-inset-top,0px))) max(14px,env(safe-area-inset-right,0px)) 10px max(14px,env(safe-area-inset-left,0px));pointer-events:none}
.mpc-hud>*{pointer-events:auto}
.mpc-round{display:grid;place-items:center;width:42px;height:42px;flex:none;border:0;border-radius:50%;background:var(--mpc-card);color:var(--mpc-fg);box-shadow:var(--mpc-shadow);cursor:pointer}
.mpc-round .mpc-ic{width:20px;height:20px}
.mpc-title{display:flex;flex-direction:column;min-width:0;padding:6px 14px;border-radius:16px;background:var(--mpc-card);box-shadow:var(--mpc-shadow)}
.mpc-title small{font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mpc-muted)}
.mpc-title b{font:700 15px 'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
.mpc-title b span{margin-left:8px;padding:1px 7px;border-radius:999px;background:var(--mpc-soft);font-size:11px;color:var(--mpc-up)}
.mpc-live{margin-left:auto;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:var(--mpc-card);box-shadow:var(--mpc-shadow);font:700 12px 'IBM Plex Mono',monospace}
.mpc-live i{width:8px;height:8px;border-radius:50%;background:#2fd17a;box-shadow:0 0 0 3px rgba(47,209,122,.22);animation:mpc-pulse 1.6s infinite}
@keyframes mpc-pulse{50%{box-shadow:0 0 0 6px rgba(47,209,122,0)}}
.mpc-feed{position:absolute;left:max(14px,env(safe-area-inset-left,0px));top:calc(66px + var(--sa-top, env(safe-area-inset-top,0px)));display:flex;flex-direction:column;gap:6px;width:min(360px,calc(100% - 80px));pointer-events:none}
.mpc-feed-item{display:flex;align-items:flex-start;gap:7px;padding:8px 11px;border-radius:12px;background:var(--mpc-card);box-shadow:var(--mpc-shadow);font-size:12px;font-weight:600;line-height:1.35;animation:mpc-in .3s ease-out;transition:opacity .4s,translate .4s}
.mpc-feed-item .mpc-ic{margin-top:1px}
.mpc-feed-item.in .mpc-ic{color:var(--mpc-in)}.mpc-feed-item.out .mpc-ic{color:var(--mpc-out)}.mpc-feed-item.move .mpc-ic{color:var(--mpc-move)}.mpc-feed-item.up .mpc-ic{color:var(--mpc-up)}
@keyframes mpc-in{from{opacity:0;translate:0 -6px}}
.mpc-tools{position:absolute;right:max(14px,env(safe-area-inset-right,0px));top:50%;translate:0 -50%;display:flex;flex-direction:column;gap:2px;padding:4px;border-radius:16px;background:var(--mpc-card);box-shadow:var(--mpc-shadow)}
.mpc-tools button{display:grid;place-items:center;width:38px;height:38px;border:0;border-radius:12px;background:transparent;color:var(--mpc-fg);font:700 18px/1 system-ui;cursor:pointer}
.mpc-tools button:active{background:var(--mpc-soft)}
.mpc-tools button[aria-pressed="true"]{background:var(--mpc-fg);color:var(--mpc-card)}
.mpc-chips{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;overflow-x:auto;padding:10px max(14px,env(safe-area-inset-right,0px)) calc(12px + var(--sa-bottom, env(safe-area-inset-bottom,0px))) max(14px,env(safe-area-inset-left,0px));scrollbar-width:none}
.mpc-chips::-webkit-scrollbar{display:none}
.mpc-chip{display:flex;align-items:center;gap:6px;flex:none;padding:9px 13px;border:0;border-radius:999px;background:var(--mpc-card);color:var(--mpc-fg);box-shadow:var(--mpc-shadow);font:600 12.5px 'Noto Sans Thai',system-ui,sans-serif;cursor:pointer}
.mpc-chip i{width:9px;height:9px;border-radius:50%}
.mpc-chip.on{background:var(--mpc-fg);color:var(--mpc-card)}
.mpc-panel{position:absolute;left:0;right:0;bottom:0;max-height:52%;overflow-y:auto;padding:16px max(18px,env(safe-area-inset-right,0px)) calc(18px + var(--sa-bottom, env(safe-area-inset-bottom,0px))) max(18px,env(safe-area-inset-left,0px));border-radius:22px 22px 0 0;background:var(--mpc-card);box-shadow:0 -10px 30px rgba(0,0,0,.14);touch-action:pan-y;-webkit-user-select:text;user-select:text}
.mpc.has-panel .mpc-chips{display:none}
.mpc.has-panel .mpc-tools{top:calc((100% - var(--mpc-ph,0px)) / 2)}
.mpc-p-head{display:flex;align-items:flex-start;gap:11px}
.mpc-swatch{width:38px;height:38px;flex:none;border-radius:12px}
.mpc-p-head>div{flex:1;min-width:0}
.mpc-p-head small{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--mpc-muted)}
.mpc-p-head h2{margin:1px 0 0;font-size:19px;line-height:1.25;text-wrap:balance}
.mpc-p-head p{margin:2px 0 0;font:600 12px 'IBM Plex Mono',monospace;color:var(--mpc-muted)}
.mpc-x{display:grid;place-items:center;width:34px;height:34px;flex:none;border:0;border-radius:50%;background:var(--mpc-soft);color:var(--mpc-fg);cursor:pointer}
.mpc-rows{margin:14px 0 0;display:grid;gap:0}
.mpc-rows div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--mpc-line);font-size:13px}
.mpc-rows dt{color:var(--mpc-muted)}
.mpc-rows dd{margin:0;font:600 13px 'IBM Plex Mono','Noto Sans Thai',monospace;font-variant-numeric:tabular-nums;text-align:right}
.mpc-grow{margin-top:12px;padding:11px 12px;border-radius:14px;background:var(--mpc-soft)}
.mpc-grow>div{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12.5px}
.mpc-grow b{font:700 13px 'IBM Plex Mono',monospace;color:var(--mpc-up)}
.mpc-grow i{display:block;height:6px;margin-top:8px;border-radius:999px;background:var(--mpc-line);overflow:hidden}
.mpc-grow u{display:block;height:100%;border-radius:999px;background:var(--mpc-up)}
.mpc-panel h3{margin:16px 0 4px;font-size:12px;letter-spacing:.06em;color:var(--mpc-muted)}
.mpc-list{list-style:none;margin:0;padding:0}
.mpc-list li{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--mpc-line);font-size:13px}
.mpc-list li span{display:flex;align-items:center;gap:6px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpc-list li small{font:600 11px 'IBM Plex Mono',monospace;color:var(--mpc-muted)}
.mpc-list li b{font:700 13px 'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums}
.mpc-list li.in b{color:var(--mpc-in)}.mpc-list li.out b{color:var(--mpc-out)}
.mpc-p-note{margin:6px 0 0;font-size:12.5px;color:var(--mpc-muted)}
.mpc-actions{display:flex;gap:8px;margin-top:16px}
.mpc-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border:0;border-radius:14px;background:var(--mpc-fg);color:var(--mpc-card);font:700 14px 'Noto Sans Thai',system-ui,sans-serif;cursor:pointer}
.mpc-btn .mpc-ic{width:18px;height:18px}
.mpc-loading{position:absolute;inset:0;display:grid;place-items:center;font-size:14px;font-weight:600;color:var(--mpc-muted)}
.mpc :focus-visible{outline:2px solid var(--mpc-move);outline-offset:2px}
@media (min-width:860px){
  .mpc-panel{left:auto;right:16px;top:calc(72px + var(--sa-top, env(safe-area-inset-top,0px)));bottom:16px;width:360px;max-height:none;border-radius:22px;box-shadow:var(--mpc-shadow)}
  .mpc.has-panel .mpc-chips{display:flex}
  .mpc.has-panel .mpc-tools{right:calc(var(--mpc-pw,0px) + 8px)}
  .mpc-chips{flex-wrap:wrap;overflow:visible;right:auto;max-width:70%}
}
@media (prefers-reduced-motion:reduce){.mpc-live i,.mpc-feed-item{animation:none}}
`;
function buildDom() {
  const style = document.createElement('style'); style.id = 'mpcStyle'; style.textContent = CSS; document.head.appendChild(style);
  root = document.createElement('section');
  root.className = 'mpc'; root.id = 'mpCity'; root.hidden = true;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'MePocket City');
  root.innerHTML = `
    <canvas tabindex="0" aria-label="แผนที่เมือง 3 มิติ ลากเพื่อเลื่อน บีบหรือเลื่อนล้อเมาส์เพื่อซูม แตะตึกเพื่อเปิดดูข้างใน"></canvas>
    <div class="mpc-tags"></div>
    <header class="mpc-hud">
      <button type="button" class="mpc-round" data-mpc="close" aria-label="ปิดเมือง">${svg('x')}</button>
      <div class="mpc-title"><small>MePocket City</small><b><output id="mpcValue">฿0</output><span id="mpcLevel">Lv.1</span></b></div>
      <div class="mpc-live" title="เมืองอัปเดตตามรายการในแอปทันที"><i></i>Live <span id="mpcClock">00:00</span></div>
    </header>
    <div class="mpc-feed" aria-live="polite"></div>
    <div class="mpc-tools">
      <button type="button" data-mpc="zoom-in" aria-label="ซูมเข้า">+</button>
      <button type="button" data-mpc="zoom-out" aria-label="ซูมออก">−</button>
      <button type="button" data-mpc="rot-l" aria-label="หมุนซ้าย">${svg('refresh')}</button>
      <button type="button" data-mpc="rot-r" aria-label="หมุนขวา" style="transform:scaleX(-1)">${svg('refresh')}</button>
      <button type="button" data-mpc="home" aria-label="ดูทั้งเมือง">${svg('home')}</button>
      <button type="button" data-mpc="xray" id="mpcXray" aria-label="มองเห็นภายในตึกทุกหลัง" aria-pressed="false"><svg class="mpc-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
    </div>
    <nav class="mpc-chips" aria-label="บริษัทในเมือง"></nav>
    <aside class="mpc-panel" hidden></aside>
    <div class="mpc-loading">กำลังสร้างเมือง…</div>`;
  document.body.appendChild(root);
  canvas = root.querySelector('canvas');
  tagLayer = root.querySelector('.mpc-tags');
  feedEl = root.querySelector('.mpc-feed');
  panelEl = root.querySelector('.mpc-panel');
  chipsEl = root.querySelector('.mpc-chips');
  hudValue = root.querySelector('#mpcValue');
  hudLevel = root.querySelector('#mpcLevel');
  hudClock = root.querySelector('#mpcClock');
  loadingEl = root.querySelector('.mpc-loading');

  root.addEventListener('click', e => {
    const tag = e.target.closest('.mpc-tag[data-key], .mpc-chip[data-key]');
    if (tag) { const key = tag.dataset.key; if (key === openKey && tag.classList.contains('mpc-tag')) closeBuilding(); else openBuilding(key); return; }
    const btn = e.target.closest('[data-mpc]'); if (!btn) return;
    const a = btn.dataset.mpc;
    if (a === 'close') close();
    else if (a === 'panel-close') closeBuilding();
    else if (a === 'zoom-in') goal.dist = clamp(goal.dist * 0.75, 8, 160);
    else if (a === 'zoom-out') goal.dist = clamp(goal.dist / 0.75, 8, 160);
    else if (a === 'rot-l') goal.az += Math.PI / 4;
    else if (a === 'rot-r') goal.az -= Math.PI / 4;
    else if (a === 'home') { closeBuilding(); fitCity(); }
    else if (a === 'xray') { state.settings.cityXray = !xrayOn(); if (typeof saveState === 'function') saveState(); syncXrayButton(); feed('city', xrayOn() ? 'มองเห็นภายในตึกทุกหลัง' : 'ปิดการมองทะลุตึก', 'move'); }
    else if (a === 'account') { const id = btn.dataset.id; close(); if (typeof openDetail === 'function') openDetail(id); }
    else if (a === 'goal') { const id = btn.dataset.id; close(); if (typeof openTransfer === 'function') openTransfer('thb', `goal:${id}`); }
  });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hoverKey) { bld(hoverKey)?.tagEl?.classList.remove('hover'); hoverKey = null; } });
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  panelEl.addEventListener('pointerdown', e => e.stopPropagation());
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => { if (!opened) return; if (document.hidden) stopLoop(); else startLoop(); });
  new ResizeObserver(() => layoutPanel()).observe(root);
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(() => { if (opened) applyLight(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function initRenderer() {
  quality = (state.settings && state.settings.cityQuality) === 'eco' ? 'eco' : 'pretty';
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'pretty', powerPreference: quality === 'eco' ? 'low-power' : 'default' });
  } catch (e) {
    loadingEl.textContent = 'เครื่องนี้เปิดภาพ 3 มิติไม่ได้ (WebGL ถูกปิด)'; return false;
  }
  renderer.setPixelRatio(quality === 'pretty' ? Math.min(2, window.devicePixelRatio || 1) : 1);
  renderer.shadowMap.enabled = quality === 'pretty';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdfe9f1, 60, 200);
  camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 900);
  hemi = new THREE.HemisphereLight(0xffffff, 0x9fb39a, 0.9);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff4e2, 0.75);
  sun.position.set(28, 48, 18);
  sun.target.position.set(0, 0, 0);
  scene.add(sun); scene.add(sun.target);
  sun.castShadow = quality === 'pretty';
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  buildSky();
  return true;
}
function resize() {
  if (!renderer || !canvas) return;
  const W = Math.max(1, canvas.clientWidth), H = Math.max(1, canvas.clientHeight);
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.updateProjectionMatrix();
}

/* ---------- loop ---------- */
function frame(t) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
  if (quality === 'eco') { frameFlip = !frameFlip; if (frameFlip) return; }
  const step = quality === 'eco' ? dt * 2 : dt;
  stepCamera(step);
  stepSky(step);
  stepBuildings(step);
  stepActors(step);
  stepTags(step);
  renderer.render(scene, camera);
}
function startLoop() { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } }
function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

/* ---------- public ---------- */
function open(focusAccountId) {
  if (!root) buildDom();
  root.hidden = false;
  document.body.style.overflow = 'hidden';
  opened = true;
  if (!renderer) {
    if (!initRenderer()) return;
    resize();
    buildWorld();
    loadingEl.remove();
    fitCity(); Object.assign(cam, goal); cam.dist = goal.dist * 1.35;
  } else {
    resize();
    const wantQuality = (state.settings && state.settings.cityQuality) === 'eco' ? 'eco' : 'pretty';
    if (wantQuality !== quality) {
      quality = wantQuality;
      renderer.setPixelRatio(quality === 'pretty' ? Math.min(2, window.devicePixelRatio || 1) : 1);
      renderer.shadowMap.enabled = quality === 'pretty'; sun.castShadow = quality === 'pretty';
      buildWorld();
    } else sync();
  }
  applyLight();
  applyLight(); updateHud(); updateClock(); syncXrayButton();
  clearInterval(clockTimer); clockTimer = setInterval(() => { updateClock(); applyLight(); }, 15000);
  const focusKey = focusAccountId ? keyOfAccount(focusAccountId) : null;
  if (focusKey && bld(focusKey)) { openBuilding(focusKey); cam.dist = goal.dist * 1.6; }
  else if (!openKey) fitCity();
  const replayed = playNew(700);
  if (!replayed && !prefs.seen.length) markSeen();
  startLoop();
  canvas.focus({ preventScroll: true });
}
function close() {
  if (!root) return;
  opened = false;
  stopLoop();
  clearInterval(clockTimer);
  root.hidden = true;
  document.body.style.overflow = '';
  closeBuilding();
  markSeen();
  for (let k = actors.length - 1; k >= 0; k--) { const a = actors[k]; if (a.ambient) continue; if (a.mesh) scene.remove(a.mesh); a.tag?.remove(); actors.splice(k, 1); }
  bubbles.splice(0).forEach(b => b.el.remove());
}

window.MePocketCity = { open, close, sync: () => { if (world) sync(); }, isOpen: () => opened };
})();
