/* ---------- MePocket Sync ----------
   The history still lives on this device first (opens offline, same as before) and is copied to your own
   Supabase database whenever there is internet, so every phone / computer you sign in on shows the same money.
   - A change waits 2 seconds, then only the records that changed are sent (not the whole history).
   - The database keeps a revision number. If another device saved in between, nothing is overwritten:
     the app asks which copy to keep.
   Setup: run supabase-mepocket.sql once in Supabase, then fill in the two values below
   (Supabase → Project Settings → API: Project URL and the anon / publishable key). */
(function () {
'use strict';
const SUPABASE_URL = 'https://srlfkajchadfbqhmxmce.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7gYWVttM7F8j8v5Ij_jN3A_vkNqmxk1';   // publishable key — safe to ship, row-level security keeps each account private

const META_KEY = 'mepocket-sync-v1';
const CHUNK = 300;                       // records per upload, so the first upload of a long history is not one huge request
const configured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

let meta = loadMeta();
let busy = false, again = false, timer = 0, applying = false, pending = null, lastError = '', statusText = '';

function loadMeta() {
  try { const m = JSON.parse(localStorage.getItem(META_KEY)); if (m && typeof m === 'object') return { rev: 0, txh: {}, sh: '', ...m }; } catch (e) {}
  return { rev: 0, txh: {}, sh: '', session: null, lastSync: 0 };
}
function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }
function fnv(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return (h >>> 0).toString(36); }
const txHash = t => fnv(JSON.stringify(t));
const escS = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const when = ts => { if (!ts) return '—'; const d = new Date(ts); return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const deviceName = () => { const u = navigator.userAgent; return /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : 'เบราว์เซอร์'; };
const $s = sel => document.querySelector(sel);

/* ---------- Supabase over plain fetch (no extra library to load) ---------- */
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
  if (auth) { await freshSession(); headers.Authorization = `Bearer ${meta.session.access_token}`; }
  const res = await fetch(SUPABASE_URL.replace(/\/$/, '') + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const msg = (data && (data.msg || data.message || data.error_description || data.error)) || `HTTP ${res.status}`;
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}
const rpc = (name, args) => api(`/rest/v1/rpc/${name}`, { method: 'POST', body: args });
function setSession(d) {
  meta.session = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (Number(d.expires_in) || 3600) * 1000, email: d.user?.email || meta.session?.email || '' };
  saveMeta();
}
async function freshSession() {
  if (!meta.session) throw new Error('not signed in');
  if (meta.session.expires_at - Date.now() > 60000) return;
  const d = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: meta.session.refresh_token }, auth: false });
  setSession(d);
}
function thaiError(e) {
  const m = String(e && e.message || e);
  if (/Invalid login credentials/i.test(m)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (/Email not confirmed/i.test(m)) return 'ยังไม่ได้ยืนยันอีเมล เปิดลิงก์ในอีเมลก่อน แล้วค่อยเข้าสู่ระบบ';
  if (/already registered|already been registered/i.test(m)) return 'อีเมลนี้สมัครไว้แล้ว กด "เข้าสู่ระบบ" ได้เลย';
  if (/Password should be|at least 6/i.test(m)) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว';
  if (/signups not allowed|Signups not allowed/i.test(m)) return 'ปิดรับสมัครใหม่อยู่ ใช้บัญชีเดิมเข้าสู่ระบบ';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'ต่ออินเทอร์เน็ตไม่ได้ ข้อมูลยังอยู่ในเครื่อง จะซิงก์ให้เมื่อออนไลน์';
  return m;
}

/* ---------- what changed since the last sync ---------- */
function splitState() { const { transactions, ...doc } = state; return { doc, txs: Array.isArray(transactions) ? transactions : [] }; }
function diff() {
  const { doc, txs } = splitState();
  const sh = fnv(JSON.stringify(doc)), cur = {}, up = [];
  txs.forEach(t => { if (!t || !t.id) return; const h = txHash(t); cur[t.id] = h; if (meta.txh[t.id] !== h) up.push(t); });
  const del = Object.keys(meta.txh).filter(id => !(id in cur));
  return { doc, sh, cur, up, del, changed: sh !== meta.sh || up.length > 0 || del.length > 0 };
}

/* ---------- push / pull ---------- */
async function pushChanges() {
  const d = diff();
  if (!d.changed) return;
  let ups = d.up, first = true;
  do {
    const part = ups.slice(0, CHUNK); ups = ups.slice(CHUNK);
    let rev;
    try {
      rev = await rpc('mp_push', { base_rev: meta.rev || 0, state_data: d.doc, upserts: part, deletes: first ? d.del : [], p_device: deviceName() });
    } catch (e) {
      if (/conflict/i.test(e.message)) { const r = await rpc('mp_pull', { since_rev: 0 }); askChoice('conflict', r); return; }
      throw e;
    }
    meta.rev = Number(rev);
    part.forEach(t => { meta.txh[t.id] = d.cur[t.id]; });
    if (first) d.del.forEach(id => { delete meta.txh[id]; });
    if (!ups.length) meta.sh = d.sh;
    first = false;
    meta.lastSync = Date.now(); saveMeta();
  } while (ups.length);
}
async function pullChanges() {          // returns true when the user has to choose first
  const r = await rpc('mp_pull', { since_rev: meta.rev || 0 });
  if (Number(r.rev) <= (meta.rev || 0)) return false;
  if (diff().changed) { const full = await rpc('mp_pull', { since_rev: 0 }); askChoice('conflict', full); return true; }
  applyRemote(r, false);
  return false;
}
function applyRemote(r, full) {
  applying = true;
  try {
    let list = full ? [] : [...(state.transactions || [])];
    const at = new Map(list.map((t, i) => [t && t.id, i]));
    (r.tx || []).forEach(row => {
      if (row.deleted) { if (at.has(row.id)) list[at.get(row.id)] = null; return; }
      if (at.has(row.id)) list[at.get(row.id)] = row.data;
      else { at.set(row.id, list.length); list.push(row.data); }
    });
    list = list.filter(Boolean);
    state = { ...state, ...(r.state || {}), transactions: list };     // fields this app version knows but the cloud copy lacks are kept
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    meta.rev = Number(r.rev) || 0;
    meta.txh = {}; list.forEach(t => { if (t.id) meta.txh[t.id] = txHash(t); });
    meta.sh = fnv(JSON.stringify(splitState().doc));
    meta.lastSync = Date.now(); saveMeta();
    if (typeof renderAll === 'function') renderAll();
  } finally { applying = false; }
}

async function syncNow(pullFirst = true) {
  if (!configured() || !meta.session || pending) { render(); return; }
  if (busy) { again = true; return; }
  if (!navigator.onLine) { lastError = ''; statusText = 'ออฟไลน์ · จะซิงก์ให้เมื่อต่อเน็ต'; render(); return; }
  busy = true; statusText = 'กำลังซิงก์…'; render();
  try {
    if (pullFirst && await pullChanges()) return;
    await pushChanges();
    lastError = ''; statusText = '';
  } catch (e) {
    if (e.status === 401 || /refresh token|JWT expired|invalid jwt/i.test(e.message)) { signOut(true); lastError = 'หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง'; }
    else lastError = thaiError(e);
    statusText = '';
  } finally {
    busy = false; render();
    if (again) { again = false; schedule(); }
  }
}
function schedule(ms = 2000) { clearTimeout(timer); timer = setTimeout(() => syncNow(false), ms); }

/* ---------- sign in / first sync ---------- */
async function signIn(email, password, create) {
  if (create) {
    const d = await api('/auth/v1/signup', { method: 'POST', body: { email, password }, auth: false });
    if (!d || !d.access_token) return 'confirm';
    setSession(d);
  } else {
    setSession(await api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password }, auth: false }));
  }
  meta.rev = 0; meta.txh = {}; meta.sh = ''; saveMeta();
  const r = await rpc('mp_pull', { since_rev: 0 });
  if (!Number(r.rev)) { await pushChanges(); return 'uploaded'; }        // empty cloud: this device's history goes up
  askChoice('first', r);
  return 'choose';
}
function signOut(keepError) {
  meta = { rev: 0, txh: {}, sh: '', session: null, lastSync: 0 };
  saveMeta(); pending = null;
  if (!keepError) lastError = '';
  render();
}

/* ---------- which copy to keep ---------- */
function askChoice(kind, remote) { pending = { kind, remote }; render(); if (typeof showSheet === 'function') showSheet('#syncSheet'); }
async function keepCloud() {
  const { remote } = pending; pending = null;
  applyRemote(remote, true);
  lastError = ''; statusText = ''; render();
  if (typeof notify === 'function') notify('ใช้ข้อมูลจากคลาวด์แล้ว');
}
async function keepDevice() {
  const { remote } = pending; pending = null;
  meta.rev = Number(remote.rev) || 0;
  meta.txh = {}; (remote.tx || []).forEach(row => { if (!row.deleted) meta.txh[row.id] = 'cloud'; });   // every cloud record is replaced or removed
  meta.sh = '';
  saveMeta();
  await syncNow(false);
  if (!lastError && typeof notify === 'function') notify('อัปโหลดข้อมูลเครื่องนี้ขึ้นคลาวด์แล้ว');
}

/* ---------- backup file ---------- */
async function exportBackup() {
  const name = `mepocket-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify({ format: 'mepocket-backup', version: 1, savedAt: new Date().toISOString(), state }, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
let restoreData = null;
function readBackup(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const j = JSON.parse(fr.result);
      const s = j && j.format === 'mepocket-backup' ? j.state : j;
      if (!s || !Array.isArray(s.accounts) || !Array.isArray(s.transactions)) throw new Error('bad');
      restoreData = { state: s, savedAt: j.savedAt };
      pending = { kind: 'restore' }; render();
      if (typeof showSheet === 'function') showSheet('#syncSheet');
    } catch (e) { if (typeof notify === 'function') notify('ไฟล์นี้ไม่ใช่ไฟล์สำรองของ MePocket'); }
  };
  fr.readAsText(file);
}
function applyRestore() {
  if (!restoreData) return;
  state = { ...state, ...restoreData.state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  restoreData = null; pending = null;
  if (typeof closeSheets === 'function') closeSheets();
  if (typeof renderAll === 'function') renderAll();          // signed in: the restored copy is synced up as usual
  if (typeof notify === 'function') notify('กู้คืนข้อมูลจากไฟล์แล้ว');
}

/* ---------- screen ---------- */
function statusLine() {
  if (!configured()) return 'ยังไม่ได้เชื่อม Supabase · ข้อมูลอยู่ในเครื่องนี้เท่านั้น';
  if (!meta.session) return 'ยังไม่ได้เข้าสู่ระบบ · ข้อมูลอยู่ในเครื่องนี้เท่านั้น';
  if (pending) return 'รอเลือกว่าจะใช้ข้อมูลชุดไหน';
  if (lastError) return lastError;
  if (statusText) return statusText;
  if (configured() && diff().changed) return 'มีรายการรอซิงก์';
  return `ซิงก์แล้ว ${when(meta.lastSync)} · ${meta.session.email}`;
}
function render() {
  const st = $s('#syncStatus'); if (st) { st.textContent = statusLine(); st.classList.toggle('sync-warn', Boolean(lastError) || Boolean(pending)); }
  const body = $s('#syncBody'); if (!body) return;
  const localCount = (state.transactions || []).length;
  if (pending && (pending.kind === 'first' || pending.kind === 'conflict')) {
    const r = pending.remote || {};
    body.innerHTML = `<p class="sync-lead">${pending.kind === 'first' ? 'บัญชีนี้มีข้อมูลบนคลาวด์อยู่แล้ว เลือกว่าจะใช้ชุดไหน' : 'มีอีกเครื่องบันทึกข้อมูลไว้ระหว่างนี้ เลือกว่าจะใช้ชุดไหน อีกชุดจะถูกแทนที่'}</p>
      <div class="sync-compare"><div><small>บนคลาวด์</small><b>${Number(r.count || 0).toLocaleString('th-TH')} รายการ</b><span>อัปเดต ${when(r.updated_at)}${r.device ? ` · ${escS(r.device)}` : ''}</span></div>
      <div><small>เครื่องนี้</small><b>${localCount.toLocaleString('th-TH')} รายการ</b><span>${deviceName()}</span></div></div>
      <button type="button" class="primary-button" data-sync="keep-cloud">ใช้ข้อมูลบนคลาวด์</button>
      <button type="button" class="outline-small sync-wide" data-sync="keep-device">ใช้ข้อมูลเครื่องนี้ (แทนที่ข้อมูลบนคลาวด์)</button>`;
    return;
  }
  if (pending && pending.kind === 'restore') {
    const s = restoreData && restoreData.state;
    body.innerHTML = `<p class="sync-lead">กู้คืนจากไฟล์สำรอง${restoreData && restoreData.savedAt ? ` (บันทึกเมื่อ ${when(restoreData.savedAt)})` : ''}? ข้อมูลในเครื่องนี้จะถูกแทนที่ด้วยข้อมูลในไฟล์</p>
      <div class="sync-compare"><div><small>ในไฟล์</small><b>${(s ? s.transactions.length : 0).toLocaleString('th-TH')} รายการ</b><span>${s ? s.accounts.length : 0} Pocket</span></div>
      <div><small>เครื่องนี้ตอนนี้</small><b>${localCount.toLocaleString('th-TH')} รายการ</b><span>${(state.accounts || []).length} Pocket</span></div></div>
      <button type="button" class="primary-button danger-button" data-sync="restore">กู้คืนและแทนที่</button>
      <button type="button" class="outline-small sync-wide" data-sync="cancel">ยกเลิก</button>`;
    return;
  }
  if (!configured()) {
    body.innerHTML = `<p class="sync-lead">ยังไม่ได้ใส่ข้อมูลโปรเจกต์ Supabase ใน sync.js ตอนนี้ประวัติเก็บอยู่ในเครื่องนี้เท่านั้น ใช้ "สำรองเป็นไฟล์" กันข้อมูลหายไปก่อนได้</p>`;
    return;
  }
  if (!meta.session) {
    body.innerHTML = `<p class="sync-lead">เข้าสู่ระบบเพื่อเก็บประวัติไว้บนคลาวด์ ทุกเครื่องที่ใช้บัญชีเดียวกันจะเห็นข้อมูลชุดเดียวกัน และยังใช้ออฟไลน์ได้เหมือนเดิม</p>
      <form id="syncForm" novalidate>
        <label class="field">อีเมล<input id="syncEmail" type="email" autocomplete="username" inputmode="email" required placeholder="you@example.com" /></label>
        <label class="field">รหัสผ่าน<input id="syncPassword" type="password" autocomplete="current-password" minlength="6" required placeholder="อย่างน้อย 6 ตัว" /></label>
        <p class="form-error" id="syncError" role="alert">${escS(lastError)}</p>
        <button type="submit" class="primary-button" data-sync-mode="signin">เข้าสู่ระบบ</button>
        <button type="submit" class="outline-small sync-wide" data-sync-mode="signup">สมัครบัญชีใหม่</button>
      </form>`;
    return;
  }
  body.innerHTML = `<div class="sync-compare one"><div><small>บัญชี</small><b>${escS(meta.session.email)}</b><span>${escS(statusLine())}</span></div></div>
    <button type="button" class="primary-button" data-sync="now">ซิงก์ตอนนี้</button>
    <button type="button" class="outline-small sync-wide" data-sync="signout">ออกจากระบบ (ข้อมูลยังอยู่ในเครื่อง)</button>`;
}
const CSS = `.sync-lead{margin:2px 0 14px;font-size:.86rem;line-height:1.55;color:#5f6468}
.sync-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}
.sync-compare.one{grid-template-columns:1fr}
.sync-compare>div{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:16px;background:#f1f3ef;min-width:0}
.sync-compare small{font-size:.7rem;font-weight:700;color:#7a7f83}
.sync-compare b{font-size:1rem;overflow-wrap:anywhere}
.sync-compare span{font-size:.74rem;color:#7a7f83;overflow-wrap:anywhere}
.sync-wide{display:block;width:100%;min-height:46px;margin-top:10px}
#syncStatus.sync-warn{color:#c2552d}
html[data-theme="dark"] .sync-lead{color:#a6a9ac}
html[data-theme="dark"] .sync-compare>div{background:#232528}`;

/* ---------- wiring ---------- */
function init() {
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  document.addEventListener('click', e => {
    if (e.target.closest('#syncOpen')) { render(); if (typeof showSheet === 'function') showSheet('#syncSheet'); return; }
    if (e.target.closest('#backupExport')) { exportBackup(); return; }
    if (e.target.closest('#backupImport')) { $s('#backupFile')?.click(); return; }
    const b = e.target.closest('[data-sync]'); if (!b) return;
    const a = b.dataset.sync;
    if (a === 'now') syncNow(true);
    else if (a === 'signout') signOut();
    else if (a === 'keep-cloud') { keepCloud(); }
    else if (a === 'keep-device') { keepDevice(); }
    else if (a === 'restore') applyRestore();
    else if (a === 'cancel') { restoreData = null; pending = null; render(); if (typeof closeSheets === 'function') closeSheets(); }
  });
  let mode = 'signin';
  document.addEventListener('click', e => { const m = e.target.closest('[data-sync-mode]'); if (m) mode = m.dataset.syncMode; }, true);
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'syncForm') return;
    e.preventDefault();
    const email = $s('#syncEmail').value.trim(), password = $s('#syncPassword').value;
    const err = $s('#syncError');
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'กรอกอีเมลให้ถูกต้อง'; return; }
    if (password.length < 6) { err.textContent = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว'; return; }
    err.textContent = mode === 'signup' ? 'กำลังสมัคร…' : 'กำลังเข้าสู่ระบบ…';
    try {
      const res = await signIn(email, password, mode === 'signup');
      lastError = '';
      if (res === 'confirm') { err.textContent = 'สมัครแล้ว เปิดลิงก์ยืนยันในอีเมล แล้วกลับมากด "เข้าสู่ระบบ"'; return; }
      if (res === 'uploaded' && typeof notify === 'function') notify('เข้าสู่ระบบแล้ว อัปโหลดประวัติขึ้นคลาวด์เรียบร้อย');
      render();
    } catch (ex) { err.textContent = thaiError(ex); }
  });
  $s('#backupFile')?.addEventListener('change', e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) readBackup(f); });
  window.addEventListener('online', () => syncNow(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(true); });
  setInterval(() => { if (!document.hidden) syncNow(true); }, 60000);
  render();
  setTimeout(() => syncNow(true), 1200);
}

window.MePocketSync = {
  changed() { if (applying) return; render(); if (configured() && meta.session && !pending) schedule(); },
  now: () => syncNow(true)
};
init();
})();
