'use strict';
/* Overload — progressive overload tracker. Vanilla JS, single state object, full re-render on actions. */

/* ---------- utils ---------- */
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const todayS = () => ymd(new Date());
const dow = s => parseD(s).getDay();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = s => { const d = parseD(s); return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`; };
const fmtShort = s => { const d = parseD(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; };
const num = v => String(+(+v).toFixed(2));
const G = Object.fromEntries(GROUPS.map(g => [g.id, g]));
const M = Object.fromEntries(MUSCLES.map(m => [m.id, m]));
const T = Object.fromEntries(TYPES.map(t => [t.id, t]));
const exColor = ex => G[M[ex.muscle].g].color;

const I = (() => {
  const p = d => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`;
  return {
    gear: p('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    plus: p('<path d="M12 5v14M5 12h14"/>'),
    check: p('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    dots: p('<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>'),
    left: p('<path d="M15 5l-7 7 7 7"/>'),
    right: p('<path d="M9 5l7 7-7 7"/>'),
    up: p('<path d="M6 15l6-6 6 6"/>'),
    down: p('<path d="M6 9l6 6 6-6"/>'),
    x: p('<path d="M6 6l12 12M18 6L6 18"/>'),
    repeat: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    cal: p('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    chart: p('<path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6z"/><path d="M12 8l4 2.4v4.2L12 17l-4-2.4v-4.2z"/>'),
    bolt: p('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    trash: p('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    eyeoff: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a15 15 0 0 1-2.6 3.2M6.5 7.6C4.3 9.2 3 12 3 12s4 6 9 6a8.7 8.7 0 0 0 4-.9"/></svg>',
    bulb: p('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
    sort: p('<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>'),
  };
})();

/* ---------- storage ---------- */
const KEY = 'overload.v1';
let db, ver = 0;

function mkEx(name, muscle, std, cls, custom) {
  const c = CLASSES[cls];
  return { id: uid(), name, muscle, kind: c.kind, std: std || 0, repMin: c.min, repMax: c.max, inc: c.inc, unit: null, notes: '', custom };
}
function freshDb() {
  const d = { v: 1, settings: {}, exercises: {}, recs: {}, workouts: {}, bw: [] };
  for (const [name, muscle, std, cls] of LIBRARY) { const ex = mkEx(name, muscle, std, cls, false); d.exercises[ex.id] = ex; }
  return migrate(d);
}
function migrate(d) {
  d.settings = Object.assign({
    theme: 'system', unit: 'kg', effort: 'RIR', weekStart: 1, ghostWeeks: 4, calView: 'week', radarMode: 'groups',
    hidden: MUSCLES.filter(m => m.hide).map(m => m.id),
  }, d.settings || {});
  d.exercises ||= {}; d.recs ||= {}; d.workouts ||= {}; d.bw ||= [];
  return d;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { /* fall through */ }
  return freshDb();
}
function save() {
  ver++;
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Could not save — storage is full'); }
}
db = load();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ---------- units & formatting ---------- */
const LB = 2.20462;
const unitFor = ex => (ex && ex.unit) || db.settings.unit;
const toU = (kg, u) => u === 'lb' ? Math.round(kg * LB * 10) / 10 : Math.round(kg * 100) / 100;
const fromU = (v, u) => u === 'lb' ? v / LB : v;
const stepFor = (ex, u) => u === 'lb' ? 5 : (ex.inc || 2.5);
function fmtLoad(ex, kg, u = unitFor(ex), withUnit = true) {
  const v = toU(kg || 0, u);
  if (ex.kind === 'bw') return v === 0 ? 'BW' : (v > 0 ? `BW+${num(v)}` : `BW−${num(-v)}`) + (withUnit ? ` ${u}` : '');
  return num(v) + (withUnit ? ` ${u}` : '');
}
function fmtSet(ex, s, u) {
  let t = `${fmtLoad(ex, s.kg, u)} × ${s.reps}`;
  if (s.partials) t += ` +${s.partials}p`;
  for (const d of s.drops || []) t += ` ↘ ${fmtLoad(ex, d.kg, u, false)}×${d.reps}`;
  return t;
}
const shortSets = (ex, sets, u) => sets.map(s => `${fmtLoad(ex, s.kg, u, false)}×${s.reps}${s.partials ? '+' + s.partials + 'p' : ''}${(s.drops || []).length ? '↘' : ''}`).join(' · ');
function fmtVol(kg) {
  const u = db.settings.unit; const v = u === 'lb' ? kg * LB : kg;
  if (v >= 1e6) return num((v / 1e6).toFixed(2)) + 'M ' + u;
  if (v >= 1e4) return num((v / 1e3).toFixed(1)) + 'k ' + u;
  return Math.round(v).toLocaleString() + ' ' + u;
}
function fmtDur(ms) { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${pad(m % 60)}m` : `${m}m`; }
const effVals = () => db.settings.effort === 'RPE' ? [6, 7, 8, 9, 10] : [0, 1, 2, 3, 4];
const effLabel = v => db.settings.effort === 'RPE' ? `RPE ${v}` : `RIR ${v >= 4 ? '4+' : v}`;

/* ---------- derived data ---------- */
function bwAt(date) {
  const b = db.bw; if (!b.length) return null;
  let best = null, first = b[0];
  for (const e of b) { if (e.date <= date && (!best || e.date >= best.date)) best = e; if (e.date < first.date) first = e; }
  return (best || first).kg;
}
const loadKg = (ex, kg, date) => ex.kind === 'bw' ? (bwAt(date) || 0) + kg : kg;
function setVol(ex, s, date) {
  if (s.warm) return 0;
  let v = loadKg(ex, s.kg, date) * (s.reps + 0.5 * (s.partials || 0));
  for (const d of s.drops || []) v += loadKg(ex, d.kg, date) * d.reps;
  return Math.max(0, v);
}
const hasSets = w => w.entries.some(e => e.sets.length);
const hasWork = w => w.entries.some(e => e.sets.some(s => !s.warm));

let _idx = null, _idxVer = -1;
// exId -> [{wid, date, sets, work}] sorted by date, only sessions with working sets
function idx() {
  if (_idx && _idxVer === ver) return _idx;
  const out = {};
  const ws = Object.values(db.workouts).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt || 0) - (b.createdAt || 0));
  for (const w of ws) for (const e of w.entries) {
    const work = e.sets.filter(s => !s.warm);
    if (work.length) (out[e.ex] ||= []).push({ wid: w.id, date: w.date, sets: e.sets, work });
  }
  _idx = out; _idxVer = ver; return out;
}
const sessionsOf = (exId, excludeWid) => (idx()[exId] || []).filter(s => s.wid !== excludeWid);
function lastSession(exId, excludeWid, onOrBefore) {
  const ses = sessionsOf(exId, excludeWid).filter(s => !onOrBefore || s.date <= onOrBefore);
  return ses[ses.length - 1] || null;
}
const beats = (a, b) => a.kg > b.kg + 1e-9 || (Math.abs(a.kg - b.kg) < 1e-9 && a.reps > b.reps);
const topSet = sets => sets.reduce((best, s) => (!best || beats(s, best)) ? s : best, null);
function prOf(exId, excludeWid) {
  const ses = sessionsOf(exId, excludeWid);
  return topSet(ses.flatMap(s => s.work));
}
function suggestion(ex, w) {
  const last = lastSession(ex.id, w && w.id, w && w.date);
  if (!last) return null;
  const u = unitFor(ex);
  const top = Math.max(...last.work.map(s => s.kg));
  const topSets = last.work.filter(s => Math.abs(s.kg - top) < 1e-9);
  const minReps = Math.min(...topSets.map(s => s.reps));
  if (minReps >= ex.repMax) {
    const next = fromU(toU(top, u) + stepFor(ex, u), u);
    return { kg: next, reps: ex.repMin, up: true, top,
      text: `You hit ${ex.repMax}+ reps on every set at ${fmtLoad(ex, top, u)}. Go up to <b>${fmtLoad(ex, next, u)}</b> and aim for ${ex.repMin}+ reps.` };
  }
  const target = Math.min(minReps + 1, ex.repMax);
  return { kg: top, reps: target, up: false, top,
    text: `Stay at <b>${fmtLoad(ex, top, u)}</b> and aim for <b>${target} reps</b> on every set. Move up once all sets hit ${ex.repMax}.` };
}
function pendingDefault(ex, w, e) {
  const last = lastSession(ex.id, w.id, w.date);
  const work = e.sets.filter(s => !s.warm);
  const k = work.length;
  const prev = e.sets[e.sets.length - 1];
  if (last) {
    const sug = suggestion(ex, w);
    const adj = s => ({ kg: sug && sug.up && Math.abs(s.kg - sug.top) < 1e-9 ? sug.kg : s.kg, reps: sug && sug.up ? sug.reps : s.reps });
    const ref = last.work[k];
    if (ref) {
      // If today's previous set already deviates from last time, follow today instead.
      if (k > 0 && last.work[k - 1] && Math.abs(adj(last.work[k - 1]).kg - work[k - 1].kg) > 1e-9) return { kg: prev.kg, reps: prev.reps, warm: false };
      return { ...adj(ref), warm: false };
    }
  }
  if (prev) return { kg: prev.kg, reps: prev.reps, warm: false };
  return { kg: null, reps: null, warm: false };
}
function wPRs(w) {
  const out = [];
  for (const e of w.entries) {
    const ex = db.exercises[e.ex]; if (!ex) continue;
    const work = e.sets.filter(s => !s.warm); if (!work.length) continue;
    const prior = sessionsOf(ex.id, w.id).filter(s => s.date <= w.date);
    if (!prior.length) continue;
    const pb = topSet(prior.flatMap(s => s.work)), tt = topSet(work);
    if (beats(tt, pb)) out.push({ ex, set: tt });
  }
  return out;
}
function duration(w) {
  const ts = w.entries.flatMap(e => e.sets.map(s => s.t)).filter(Boolean);
  if (!ts.length) return 0;
  const start = Math.min(...ts), end = w.finishedAt && w.finishedAt > start ? w.finishedAt : Math.max(...ts);
  return clamp(end - start + 120000, 0, 4 * 3600000);
}
function wSummary(w) {
  let sets = 0, vol = 0;
  for (const e of w.entries) { const ex = db.exercises[e.ex]; if (!ex) continue; for (const s of e.sets) if (!s.warm) { sets++; vol += setVol(ex, s, w.date); } }
  return { sets, vol, dur: duration(w), exn: w.entries.length };
}
function typeMuscles(typeId) {
  const t = T[typeId]; const out = new Set(t.muscles || []);
  for (const m of MUSCLES) if (t.groups.includes(m.g)) out.add(m.id);
  return out;
}

/* ---------- calendar model ---------- */
function weekStartOf(s) { const d = parseD(s); const diff = (d.getDay() - db.settings.weekStart + 7) % 7; d.setDate(d.getDate() - diff); return ymd(d); }
function itemsBetween(a, b) {
  const out = {}; const add = (d, it) => (out[d] ||= []).push(it);
  const taken = new Set();
  for (const w of Object.values(db.workouts)) { if (w.recId) taken.add(w.recId + '|' + w.date); if (w.date >= a && w.date <= b) add(w.date, { w }); }
  for (const r of Object.values(db.recs)) {
    const s = r.start > a ? r.start : a, e = r.end && r.end < b ? r.end : b;
    if (s > e) continue;
    for (let d = addDays(s, (r.weekday - dow(s) + 7) % 7); d <= e; d = addDays(d, 7)) {
      if (!r.skip[d] && !taken.has(r.id + '|' + d)) add(d, { v: true, recId: r.id, date: d, type: r.type });
    }
  }
  for (const k in out) out[k].sort((x, y) => (x.w ? x.w.createdAt || 0 : 0) - (y.w ? y.w.createdAt || 0 : 0));
  return out;
}
const itType = it => it.w ? it.w.type : it.type;
const itDate = it => it.w ? it.w.date : it.date;
const itRec = it => { const id = it.w ? it.w.recId : it.recId; return (id && db.recs[id]) || null; };
function status(it) {
  const t = todayS();
  if (it.w) {
    if (it.w.status === 'skipped') return 'skipped';
    if (hasWork(it.w)) return 'done';
  }
  return itDate(it) < t ? 'missed' : 'planned';
}
function templateEntries(type, recId, date, excludeId) {
  let best = null, key = null;
  for (const w of Object.values(db.workouts)) {
    if (w.id === excludeId || w.type !== type || !w.entries.length || w.date >= date || w.status === 'skipped') continue;
    const k = [recId && w.recId === recId ? 1 : 0, w.date, w.createdAt || 0];
    if (!best || k[0] > key[0] || (k[0] === key[0] && (k[1] > key[1] || (k[1] === key[1] && k[2] > key[2])))) { best = w; key = k; }
  }
  return best ? best.entries.filter(e => db.exercises[e.ex]).map(e => ({ ex: e.ex, sets: [] })) : [];
}
function planCount(it) {
  if (it.w && (it.w.custom || hasSets(it.w))) return it.w.entries.length;
  return templateEntries(itType(it), it.w ? it.w.recId : it.recId, itDate(it), it.w && it.w.id).length;
}
function newWorkout(date, type, recId) {
  const w = { id: uid(), date, type, recId: recId || null, entries: [], status: 'planned', custom: false, createdAt: Date.now() };
  db.workouts[w.id] = w; return w;
}
function materialize(it) {
  if (it.w) return it.w;
  const w = newWorkout(it.date, it.type, it.recId);
  w.entries = templateEntries(w.type, w.recId, w.date, w.id);
  save(); return w;
}
function refreshPlan(w) { if (!hasSets(w) && !w.custom) w.entries = templateEntries(w.type, w.recId, w.date, w.id); }
function splitRec(R, D, ch) {
  if (D <= R.start) { Object.assign(R, ch); return R; }
  const R2 = { ...R, ...ch, id: uid(), start: D, skip: {} };
  for (const k in R.skip) if (k >= D) { R2.skip[k] = true; delete R.skip[k]; }
  R.end = addDays(D, -1);
  db.recs[R2.id] = R2;
  for (const w of Object.values(db.workouts)) if (w.recId === R.id && w.date >= D) w.recId = R2.id;
  return R2;
}
function changeType(it, type, scope) {
  const reset = w => { w.type = type; if (!hasSets(w)) { w.custom = false; w.entries = []; } };
  if (scope === 'one') reset(materialize(it));
  else {
    const D = itDate(it); const R2 = splitRec(itRec(it), D, { type });
    for (const w of Object.values(db.workouts)) if (w.recId === R2.id && w.date >= D && (!hasSets(w) || (it.w && w.id === it.w.id))) reset(w);
  }
  save(); render(); toast(`Changed to ${T[type].name}`);
}
function reschedule(it, nd, scope) {
  const D = itDate(it); if (!nd || nd === D) return;
  if (scope === 'one') {
    const w = materialize(it); const R = itRec(it);
    if (R) R.skip[D] = true;
    w.recId = null; w.date = nd; w.custom = w.custom || w.entries.length > 0;
  } else {
    const R = itRec(it); const s0 = nd < D ? nd : D;
    const R2 = splitRec(R, s0, { weekday: dow(nd) });
    if (nd < R2.start) R2.start = nd;
    for (const w of Object.values(db.workouts)) if (w.recId === R2.id && w.date >= s0) {
      if (it.w && w.id === it.w.id) w.date = nd; else if (!hasSets(w)) delete db.workouts[w.id];
    }
  }
  S.anchor = nd; S.monthSel = nd; save(); render(); toast(`Moved to ${fmtDate(nd)}`);
}
function deleteItem(it, scope) {
  const R = itRec(it), D = itDate(it);
  if (scope === 'one') { if (R) R.skip[D] = true; if (it.w) delete db.workouts[it.w.id]; }
  else {
    R.end = addDays(D, -1);
    for (const w of Object.values(db.workouts)) if (w.recId === R.id && w.date >= D && (!hasSets(w) || (it.w && w.id === it.w.id))) delete db.workouts[w.id];
    if (R.end < R.start) delete db.recs[R.id];
  }
  save();
}
function makeRecurring(it) {
  const w = materialize(it);
  const R = { id: uid(), type: w.type, weekday: dow(w.date), start: w.date, end: null, skip: {} };
  db.recs[R.id] = R; w.recId = R.id; save(); render();
  toast(`Repeats every ${DAYS_LONG[R.weekday]}`);
}

/* ---------- strength scores (hexagons) ---------- */
// Internal only: a rep-normalised strength number so sets of different rep counts compare fairly against standards.
const strength = (load, reps) => load * (1 + Math.min(reps, 15) / 30);
const TIER_R = [0, 0.5, 0.75, 1, 1.3, 1.65];
const TIERS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
function scoreFromRatio(r) {
  if (r >= TIER_R[5]) return 100;
  for (let i = 1; i < TIER_R.length; i++) if (r <= TIER_R[i]) return (i - 1) * 20 + (r - TIER_R[i - 1]) / (TIER_R[i] - TIER_R[i - 1]) * 20;
  return 100;
}
const tierName = s => s == null ? 'No data' : s >= 100 ? 'Elite' : s >= 80 ? 'Advanced' : s >= 60 ? 'Intermediate' : s >= 40 ? 'Novice' : s >= 20 ? 'Beginner' : 'Starting out';
function exScore(ex, until) {
  const ses = (idx()[ex.id] || []).filter(s => s.date <= until);
  if (!ses.length) return null;
  const bestOf = s => Math.max(...s.work.map(x => strength(loadKg(ex, x.kg, s.date), x.reps)));
  const best = Math.max(...ses.map(bestOf));
  if (best <= 0) return null;
  const bw = bwAt(until);
  if (ex.std && bw) return scoreFromRatio(best / (bw * ex.std));
  const first = bestOf(ses[0]);
  return first > 0 ? clamp(40 + 60 * (best / first - 1), 0, 100) : null;
}
function scoresAt(until) {
  const byM = {}, byG = {};
  for (const ex of Object.values(db.exercises)) {
    const v = exScore(ex, until); if (v == null) continue;
    (byM[ex.muscle] ||= []).push(v); (byG[M[ex.muscle].g] ||= []).push(v);
  }
  const avg = a => a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const m = {}, g = {};
  for (const k of MUSCLES) m[k.id] = avg(byM[k.id]);
  for (const k of GROUPS) g[k.id] = avg(byG[k.id]);
  return { m, g };
}
function weeklySets(ws) {
  const we = addDays(ws, 6), out = {};
  for (const w of Object.values(db.workouts)) if (w.date >= ws && w.date <= we) for (const e of w.entries) {
    const ex = db.exercises[e.ex]; if (!ex) continue;
    out[ex.muscle] = (out[ex.muscle] || 0) + e.sets.filter(s => !s.warm).length;
  }
  return out;
}
const groupSets = (wsMap, gid) => MUSCLES.filter(m => m.g === gid).reduce((a, m) => a + (wsMap[m.id] || 0), 0);

function stats() {
  const t = todayS(), ws = Object.values(db.workouts);
  let vol = 0, sets = 0, reps = 0, time = 0, done = 0; const weeks = new Set();
  for (const w of ws) {
    let any = false;
    for (const e of w.entries) {
      const ex = db.exercises[e.ex]; if (!ex) continue;
      for (const s of e.sets) { if (s.warm) continue; any = true; vol += setVol(ex, s, w.date); sets++; reps += s.reps + (s.drops || []).reduce((a, d) => a + d.reps, 0); }
    }
    if (any) { done++; weeks.add(weekStartOf(w.date)); time += duration(w); }
  }
  let streak = 0, wk = weekStartOf(t);
  if (!weeks.has(wk)) wk = addDays(wk, -7);
  while (weeks.has(wk)) { streak++; wk = addDays(wk, -7); }
  const items = itemsBetween(addDays(t, -27), t); let planned = 0, hit = 0;
  for (const d in items) for (const it of items[d]) { const st = status(it); if (d === t && st !== 'done') continue; planned++; if (st === 'done') hit++; }
  const m0 = t.slice(0, 8) + '01'; let prs = 0;
  for (const w of ws) if (w.date >= m0 && w.date <= t) prs += wPRs(w).length;
  let improved = null;
  for (const ex of Object.values(db.exercises)) {
    const ses = sessionsOf(ex.id); const before = ses.filter(s => s.date < m0), during = ses.filter(s => s.date >= m0 && s.date <= t);
    if (!before.length || !during.length) continue;
    const mx = arr => Math.max(...arr.flatMap(s => s.work.map(x => loadKg(ex, x.kg, s.date))));
    const b = mx(before), d = mx(during);
    if (b > 0 && d > b && (!improved || (d - b) / b > improved.pct)) improved = { ex, pct: (d - b) / b };
  }
  return { vol, sets, reps, time, done, streak, planned, hit, prs, improved };
}

/* ---------- duplicate detection ---------- */
const SYN = { db: 'dumbbell', dbs: 'dumbbell', dumbell: 'dumbbell', bb: 'barbell', ohp: 'overhead press', rdl: 'romanian deadlift', bw: 'bodyweight',
  ext: 'extension', triceps: 'tricep', biceps: 'bicep', lats: 'lat', flyes: 'fly', flys: 'fly', flies: 'fly', pushup: 'push up', pullup: 'pull up', chinup: 'chin up' };
const STOP = new Set(['the', 'a', 'an', 'with', 'on', 'of', 'and', 'my']);
const singular = t => t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
function tokens(s) {
  return s.toLowerCase().replace(/[-_/]/g, ' ').replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
    .map(t => SYN[t] || SYN[singular(t)] || singular(t)).join(' ').split(' ').filter(t => t && !STOP.has(t));
}
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function dupCheck(name, excludeId) {
  const ta = tokens(name); if (!ta.length) return { exact: null, near: null };
  const ka = [...ta].sort().join(' '), ca = ta.join('');
  let exact = null, near = null, nearScore = 0;
  for (const ex of Object.values(db.exercises)) {
    if (ex.id === excludeId) continue;
    const tb = tokens(ex.name); const kb = [...tb].sort().join(' '), cb = tb.join('');
    if (ka === kb || ca === cb) { exact = ex; break; }
    const A = new Set(ta), B = new Set(tb); const inter = [...A].filter(x => B.has(x)).length;
    const jac = inter / (A.size + B.size - inter);
    const close = Math.min(ca.length, cb.length) >= 5 && lev(ca, cb) <= 2;
    const sc = close ? 1 : jac;
    if (sc >= 0.66 && sc > nearScore) { near = ex; nearScore = sc; }
  }
  return { exact, near: exact ? null : near };
}

/* ---------- app state & navigation ---------- */
const S = { tab: 'cal', stack: [], sheet: null, sheetFns: [], anchor: todayS(), monthSel: todayS(), pend: {}, editSet: null, reorder: false, chart: 'w', notesEdit: false, rootScroll: {} };
const app = document.getElementById('app');
const topView = () => S.stack[S.stack.length - 1];

function push(v) {
  const cur = topView(); if (cur) cur.scroll = window.scrollY; else S.rootScroll[S.tab] = window.scrollY;
  S.stack.push(v); history.pushState({ d: S.stack.length }, '');
  S.editSet = null; S.reorder = false; S.notesEdit = false;
  render(); window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => {
  if (S.sheet) { S.sheet = null; if (S.stack.length) history.pushState({ d: S.stack.length }, ''); render(); return; }
  if (!S.stack.length) return;
  S.stack.pop(); S.editSet = null; S.reorder = false; S.notesEdit = false;
  render();
  const cur = topView(); window.scrollTo(0, cur ? cur.scroll || 0 : S.rootScroll[S.tab] || 0);
});
function openSheet(sh) { S.sheet = sh; S.sheetFresh = true; render(); }
function closeSheet(noRender) { S.sheet = null; S.sheetFns = []; if (!noRender) render(); }
function openMenu(title, items, sub) {
  S.sheetFns = items.map(i => i[1]);
  openSheet({ k: 'menu', title, sub, items: items.map(i => ({ label: i[0], danger: i[2] === 'danger' })) });
  S.sheetFns = items.map(i => i[1]);
}
function withScope(it, title, fn) {
  if (!itRec(it)) return fn('one');
  openMenu(title, [['This workout only', () => fn('one')], ['This and all future ones', () => fn('future')]], `${T[itType(it)].name} repeats every ${DAYS_LONG[dow(itDate(it))]}`);
}

/* ---------- wake lock, toast, confetti ---------- */
let wl = null, wlBusy = false;
async function wake(on) {
  if (!('wakeLock' in navigator) || wlBusy) return;
  try {
    if (on && !wl && document.visibilityState === 'visible') { wlBusy = true; wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); }
    else if (!on && wl) { wlBusy = true; await wl.release(); wl = null; }
  } catch (e) { wl = null; } finally { wlBusy = false; }
}
document.addEventListener('visibilitychange', () => { const v = topView(); wake(!!v && (v.v === 'w' || (v.v === 'ex' && v.wid))); });
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2400);
}
function confetti() {
  if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; const x = c.getContext('2d'); x.scale(dpr, dpr);
  const cols = GROUPS.map(g => g.color);
  const P = Array.from({ length: 150 }, () => ({ x: W / 2 + (Math.random() - .5) * 60, y: H * .38, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 5, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
  let f = 0;
  (function tick() {
    f++; x.clearRect(0, 0, W, H);
    for (const p of P) { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
    if (f < 120) requestAnimationFrame(tick); else c.remove();
  })();
}

/* ---------- charts ---------- */
function niceTicks(a, b, n = 4) {
  if (a === b) { a -= 1; b += 1; }
  const step0 = (b - a) / (n - 1), mag = 10 ** Math.floor(Math.log10(step0));
  const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
  const out = []; for (let v = Math.floor(a / st) * st; v <= Math.ceil(b / st) * st + st / 2; v += st) out.push(+v.toFixed(6));
  return out.length >= 2 ? out : [a, b];
}
// pts: [{x: 'YYYY-MM-DD', y, lab, tip}]
function lineChart(pts, color, opts = {}) {
  if (!pts.length) return `<div class="empty">No data yet</div>`;
  const W = 340, H = 180, L = 36, R = 14, Tp = 22, B = 24;
  const xs = pts.map(p => parseD(p.x).getTime());
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 3 * 864e5; x1 += 3 * 864e5; }
  const ticks = niceTicks(Math.min(...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = t => L + (t - x0) / (x1 - x0) * (W - L - R), Y = v => Tp + (1 - (v - y0) / (y1 - y0 || 1)) * (H - Tp - B);
  const gid = 'g' + uid();
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" data-pts='${esc(JSON.stringify(pts.map((p, i) => [X(xs[i]), Y(p.y), p.tip])))}'>`;
  s += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`;
  for (const t of ticks) s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${L - 6}" y="${Y(t) + 3}" text-anchor="end">${num(t)}</text>`;
  const P = pts.map((p, i) => [X(xs[i]), Y(p.y)]);
  if (opts.bars) {
    const bw = Math.max(4, Math.min(18, (W - L - R) / pts.length * .6));
    P.forEach(([x, y]) => { s += `<path d="M${x - bw / 2},${Y(y0)} V${y + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${Y(y0)} Z" fill="${color}"/>`; });
  } else {
    const d = P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    if (P.length > 1) s += `<path d="${d}L${P[P.length - 1][0]},${Y(y0)}L${P[0][0]},${Y(y0)}Z" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
    const showAll = pts.length <= 8;
    P.forEach(([x, y], i) => {
      s += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="var(--surface)" stroke-width="2"/>`;
      if ((showAll || i === P.length - 1) && pts[i].lab) s += `<text class="vl" x="${x}" y="${y - 9}" text-anchor="middle">${esc(pts[i].lab)}</text>`;
    });
  }
  const xl = [[xs[0], 'start'], [xs[xs.length - 1], 'end']];
  if (xs.length === 1) xl.length = 1;
  for (const [t, a] of xl) s += `<text x="${X(t)}" y="${H - 6}" text-anchor="${xs.length === 1 ? 'middle' : a}">${fmtShort(ymd(new Date(t)))}</text>`;
  s += `<line class="xh" x1="0" x2="0" y1="${Tp}" y2="${H - B}" stroke="var(--muted)" stroke-dasharray="3 3" style="display:none"/>`;
  return `<div class="chartwrap">${s}</svg><div class="tip"></div></div>`;
}
function sparkline(vals, color) {
  if (vals.length < 2) return '';
  const W = 64, H = 26, lo = Math.min(...vals), hi = Math.max(...vals);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${(i / (vals.length - 1) * (W - 4) + 2).toFixed(1)},${(H - 3 - (hi === lo ? .5 : (v - lo) / (hi - lo)) * (H - 6)).toFixed(1)}`).join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
// axes: [{label, color}], now/ghost: arrays of 0-100 or null
function radar(axes, now, ghost) {
  const n = axes.length;
  if (n < 3) return `<div class="empty">Show at least 3 muscles to draw the shape.</div>`;
  const many = n > 8, W = 360, H = many ? 350 : 320, cx = W / 2, cy = H / 2, R = many ? 100 : 104;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / n;
  const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
  const poly = vals => vals.map((v, i) => pt(i, v || 0).map(c => c.toFixed(1)).join(',')).join(' ');
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Strength profile">`;
  [20, 40, 60, 80, 100].forEach(r => { s += `<polygon points="${poly(Array(n).fill(r))}" fill="none" stroke="var(--line)" stroke-width="1"/>`; });
  for (let i = 0; i < n; i++) { const [x, y] = pt(i, 100); s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`; }
  s += `<polygon points="${poly(ghost)}" fill="var(--ghost)" fill-opacity=".28" stroke="var(--ghost)" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<polygon points="${poly(now)}" fill="var(--accent)" fill-opacity=".55" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  TIERS.forEach((t, i) => { s += `<text x="${cx + 3}" y="${cy - R * (i + 1) * 20 / 100 + 9}" style="font-size:8px">${t}</text>`; });
  axes.forEach((a, i) => {
    const [x, y] = pt(i, many ? 114 : 120), c = Math.cos(ang(i));
    const anchor = Math.abs(c) < .2 ? 'middle' : c > 0 ? 'start' : 'end';
    const yy = y + (Math.sin(ang(i)) > .5 ? 8 : Math.sin(ang(i)) < -.5 ? -8 : 0);
    const v = now[i];
    s += `<text x="${x}" y="${yy - 2}" text-anchor="${anchor}" style="font-size:${many ? 10 : 12}px;font-weight:700;fill:var(--text)">${esc(a.label.toUpperCase())}</text>`;
    s += `<text x="${x}" y="${yy + (many ? 10 : 12)}" text-anchor="${anchor}" style="font-size:${many ? 10 : 12}px;fill:var(--text2)">${v == null ? '–' : Math.round(v)}</text>`;
  });
  return s + '</svg>';
}

/* ---------- shared fragments ---------- */
const topbar = (title, left = '', right = '') => `<header class="top"><div class="tl">${left}</div><h1>${esc(title)}</h1><div class="tr">${right}</div></header>`;
const backBtn = () => `<button class="backbtn" data-a="back">${I.left}Back</button>`;
const seg = (opts, cur, a, extra = '', cls = '') => `<div class="seg ${cls}">${opts.map(([v, l]) => `<button class="${v === cur ? 'on' : ''}" data-a="${a}" data-v="${v}" ${extra}>${l}</button>`).join('')}</div>`;
const tabbar = () => `<nav class="tabbar">
  <button class="${S.tab === 'cal' ? 'on' : ''}" data-a="tab" data-v="cal">${I.cal}<span>Calendar</span></button>
  <button class="todaybtn" data-a="today">${I.bolt}<span>Today</span></button>
  <button class="${S.tab === 'prog' ? 'on' : ''}" data-a="tab" data-v="prog">${I.chart}<span>Progress</span></button></nav>`;
const itemAttrs = it => it.w ? `data-w="${it.w.id}"` : `data-r="${it.recId}" data-d="${it.date}"`;
function itemFrom(ds) {
  if (ds.w) return db.workouts[ds.w] ? { w: db.workouts[ds.w] } : null;
  const r = db.recs[ds.r]; return r ? { v: true, recId: r.id, date: ds.d, type: r.type } : null;
}

/* ---------- calendar view ---------- */
function itemCard(it) {
  const ty = T[itType(it)], st = status(it), rec = itRec(it);
  let sub;
  if (st === 'done') { const s = wSummary(it.w); sub = `✓ ${s.sets} sets · ${fmtVol(s.vol)}`; }
  else if (st === 'skipped') sub = 'Skipped';
  else { const n = planCount(it); sub = n ? `${n} exercise${n > 1 ? 's' : ''}` : 'Tap to add exercises'; if (st === 'missed') sub = 'Missed · ' + sub; }
  return `<div class="item ${st}" style="--c:${ty.color}" data-a="openItem" ${itemAttrs(it)} role="button">
    <div><div class="iname">${ty.name}${rec ? ' ' + I.repeat : ''}</div><div class="isub">${sub}</div></div>
    <button class="dots" data-a="itemMenu" ${itemAttrs(it)} aria-label="Options">${I.dots}</button></div>`;
}
function dayRow(d, list) {
  const dt = parseD(d);
  return `<div class="day ${d === todayS() ? 'today' : ''}">
    <div class="dlabel"><span>${DAYS[dt.getDay()]}</span><b>${dt.getDate()}</b></div>
    <div class="ditems">${list.map(itemCard).join('')}${list.length
      ? `<button class="addmini" data-a="addDay" data-d="${d}">+ Add another</button>`
      : `<button class="plan" data-a="addDay" data-d="${d}">Rest · + Plan workout</button>`}</div></div>`;
}
function viewCal() {
  const mode = db.settings.calView, t = todayS();
  let title, body = '';
  if (mode === 'week') {
    const ws = weekStartOf(S.anchor), we = addDays(ws, 6), items = itemsBetween(ws, we);
    const a = parseD(ws), b = parseD(we);
    title = a.getMonth() === b.getMonth() ? `${MONTHS[a.getMonth()]} ${a.getDate()} – ${b.getDate()}` : `${fmtShort(ws)} – ${fmtShort(we)}`;
    for (let i = 0; i < 7; i++) { const d = addDays(ws, i); body += dayRow(d, items[d] || []); }
  } else {
    const a = parseD(S.anchor), first = ymd(new Date(a.getFullYear(), a.getMonth(), 1)), last = ymd(new Date(a.getFullYear(), a.getMonth() + 1, 0));
    const gs = weekStartOf(first), ge = addDays(weekStartOf(last), 6), items = itemsBetween(gs, ge);
    title = `${MONTHS_LONG[a.getMonth()]} ${a.getFullYear()}`;
    body += '<div class="mgrid">';
    for (let i = 0; i < 7; i++) body += `<div class="wd">${DAYS[(db.settings.weekStart + i) % 7][0]}</div>`;
    for (let d = gs; d <= ge; d = addDays(d, 1)) {
      const list = items[d] || [];
      body += `<button class="mc ${d.slice(0, 7) !== first.slice(0, 7) ? 'o' : ''} ${d === t ? 't' : ''} ${d === S.monthSel ? 's' : ''}" data-a="selDay" data-d="${d}">
        <span>${parseD(d).getDate()}</span>${list.slice(0, 2).map(it => `<div class="lab ${status(it)}" style="background:${T[itType(it)].color}">${T[itType(it)].name}</div>`).join('')}${list.length > 2 ? `<small class="muted">+${list.length - 2}</small>` : ''}</button>`;
    }
    body += '</div>';
    const sel = itemsBetween(S.monthSel, S.monthSel);
    body += `<div class="selday">${dayRow(S.monthSel, sel[S.monthSel] || [])}</div>`;
  }
  return topbar('Calendar', `<button class="iconbtn" data-a="settings" aria-label="Settings">${I.gear}</button>`, `<button class="link" data-a="calToday" style="padding:0 8px">Today</button>`)
    + `<div class="page">${seg([['week', 'Week'], ['month', 'Month']], mode, 'calView')}
    <div class="calhead"><b>${title}</b><div class="nav"><button class="iconbtn" data-a="calNav" data-v="-1" aria-label="Previous">${I.left}</button><button class="iconbtn" data-a="calNav" data-v="1" aria-label="Next">${I.right}</button></div></div>
    ${body}</div>`;
}
function itemMenu(it) {
  if (!it) return;
  const rec = itRec(it), st = status(it), items = [];
  if (!(topView() && topView().v === 'w')) items.push(['Open workout', () => openItem(it)]);
  items.push(['Change workout type', () => openSheet({ k: 'type', mode: 'change', it })]);
  items.push(['Reschedule', () => openSheet({ k: 'resched', it, date: itDate(it) })]);
  if (st === 'skipped') items.push(['Unskip', () => { it.w.status = 'planned'; save(); render(); }]);
  else if (st !== 'done') items.push(['Skip this day', () => { materialize(it).status = 'skipped'; save(); render(); }]);
  if (!rec) items.push([`Repeat every ${DAYS_LONG[dow(itDate(it))]}`, () => makeRecurring(it)]);
  items.push(['Delete', () => withScope(it, 'Delete workout', scope => {
    if (it.w && hasSets(it.w) && !confirm('This workout has logged sets. Delete them too?')) return;
    deleteItem(it, scope); if (topView() && topView().v === 'w') history.back(); else render(); toast('Deleted');
  }), 'danger']);
  openMenu(`${T[itType(it)].name} · ${fmtDate(itDate(it))}`, items, rec ? `Repeats every ${DAYS_LONG[rec.weekday]}` : '');
}
function openItem(it) {
  if (!it) return;
  const w = materialize(it); refreshPlan(w); save();
  push({ v: 'w', id: w.id });
}

/* ---------- workout view ---------- */
function exCard(e, w, i) {
  const ex = db.exercises[e.ex]; if (!ex) return '';
  const u = unitFor(ex), pr = prOf(ex.id, w.id), last = lastSession(ex.id, w.id, w.date);
  const doneN = e.sets.filter(s => !s.warm).length;
  const ctr = S.reorder
    ? `<div class="tr"><button class="dots" data-a="mv" data-ex="${ex.id}" data-v="-1" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${I.up}</button><button class="dots" data-a="mv" data-ex="${ex.id}" data-v="1" ${i === w.entries.length - 1 ? 'disabled style="opacity:.3"' : ''}>${I.down}</button><button class="dots" data-a="rmEx" data-ex="${ex.id}">${I.x}</button></div>`
    : `<div class="tr"><button class="dots" data-a="exMenu" data-ex="${ex.id}" aria-label="Options">${I.dots}</button></div>`;
  return `<div class="exc" style="--c:${exColor(ex)}" data-a="${S.reorder ? '' : 'openEx'}" data-ex="${ex.id}" role="button">
    ${ctr}${doneN && !S.reorder ? `<span class="done">${doneN} set${doneN > 1 ? 's' : ''} ✓</span>` : ''}
    <div class="en">${esc(ex.name)}</div><div class="em">${M[ex.muscle].name}</div>
    ${pr ? `<div class="ed"><span>PR</span><b>${fmtLoad(ex, pr.kg, u)} × ${pr.reps}</b>${last ? `<span>Last</span><b>${shortSets(ex, last.work, u)} <span>${u} · ${fmtShort(last.date)}</span></b>` : ''}</div>` : `<div class="ed"><span>New</span><b>No history yet</b></div>`}
  </div>`;
}
function suggestions(w) {
  const tm = typeMuscles(w.type), inPlan = new Set(w.entries.map(e => e.ex)), ix = idx();
  const cands = Object.values(db.exercises).filter(ex => tm.has(ex.muscle) && !inPlan.has(ex.id));
  const lastDate = ex => { const s = ix[ex.id]; return s ? s[s.length - 1].date : ''; };
  const done = cands.filter(lastDate).sort((a, b) => lastDate(b).localeCompare(lastDate(a))).slice(0, 8);
  let fill = [];
  if (done.length < 6) {
    // one fresh pick per muscle first, so the list covers the whole workout
    const seen = new Set(done.map(e => e.muscle)), rest = cands.filter(e => !lastDate(e));
    for (const ex of rest) if (!seen.has(ex.muscle)) { fill.push(ex); seen.add(ex.muscle); }
    fill = fill.slice(0, 6 - done.length);
  }
  return [...done, ...fill];
}
function sugCard(ex, w) {
  const u = unitFor(ex), pr = prOf(ex.id), last = lastSession(ex.id, w.id);
  return `<div class="exc sug" style="--c:${exColor(ex)}">
    <div class="tr"><button class="dots" data-a="addEx" data-ex="${ex.id}" aria-label="Add to workout">${I.plus}</button></div>
    <div class="en"><i></i>${esc(ex.name)}</div><div class="em">${M[ex.muscle].name}${last ? ` · last done ${fmtShort(last.date)}` : ' · not done yet'}</div>
    ${pr ? `<div class="ed"><span>PR</span><b>${fmtLoad(ex, pr.kg, u)} × ${pr.reps}</b></div>` : ''}
  </div>`;
}
function viewWorkout(v) {
  const w = db.workouts[v.id];
  if (!w) { S.stack.pop(); return render(), ''; }
  if (!w.entries.length) refreshPlan(w);
  const ty = T[w.type], rec = itRec({ w }), sum = wSummary(w), sugg = suggestions(w);
  return topbar(ty.name, backBtn(), `<button class="iconbtn" data-a="wMenu" aria-label="Workout options">${I.dots}</button>`) + `<div class="page">
    <div class="hero" style="--c:${ty.color}">
      <h2>${ty.name}</h2><div class="sub">${fmtDate(w.date)}${rec ? ` · ${I.repeat} every ${DAYS_LONG[rec.weekday]}` : ''}${w.status === 'skipped' ? ' · Skipped' : ''}</div>
      <div class="hstats"><div><b>${sum.exn}</b><span>exercises</span></div><div><b>${sum.sets}</b><span>sets</span></div><div><b>${fmtVol(sum.vol).replace(/ (kg|lb)$/, '')}</b><span>${db.settings.unit} moved</span></div><div><b>${sum.dur ? fmtDur(sum.dur) : '–'}</b><span>time</span></div></div>
    </div>
    <div class="sec"><h2>Exercises</h2>${w.entries.length > 1 ? `<button class="act" data-a="reorder">${S.reorder ? 'Done' : I.sort.replace('class="ic"', 'class="ic sm"') + ' Reorder'}</button>` : ''}</div>
    <div class="excards">${w.entries.length ? w.entries.map((e, i) => exCard(e, w, i)).join('') : `<div class="empty">No exercises yet. Add some from the suggestions below — next ${ty.name} day will start with the same list.</div>`}</div>
    ${sugg.length ? `<div class="sec"><h2 class="muted">Suggested for ${ty.name}</h2></div><div class="excards">${sugg.map(ex => sugCard(ex, w)).join('')}</div>` : ''}
    <div class="btns two"><button class="btn" data-a="browse">Browse all</button><button class="btn" data-a="newEx">${I.plus} New exercise</button></div>
    ${hasWork(w) ? `<div class="btns"><button class="btn primary" data-a="finish">${w.finishedAt ? 'Workout summary' : 'Finish workout'}</button></div>` : ''}
  </div>`;
}

/* ---------- exercise view ---------- */
function pendKey(v) { return v.wid + '|' + v.ex; }
function stepper(label, val, ds, mode) {
  return `<div class="stp"><label>${label}</label><div class="stpi"><button data-a="stp" ${ds} data-v="-1" aria-label="Decrease">−</button><input inputmode="${mode}" value="${val ?? ''}" data-in="stp" ${ds} placeholder="–" enterkeyhint="done"><button data-a="stp" ${ds} data-v="1" aria-label="Increase">+</button></div></div>`;
}
const dispKg = (ex, kg, u) => kg == null ? '' : num(toU(kg, u));
function effChips(s) {
  if (db.settings.effort === 'off') return '';
  return `<div class="effs"><span class="lbl">${db.settings.effort}</span>` + effVals().map(v => `<button class="chip ${s.eff === v ? 'on' : ''}" data-a="seff" data-sid="${s.id}" data-v="${v}">${db.settings.effort === 'RIR' && v === 4 ? '4+' : v}</button>`).join('') + '</div>';
}
function setRow(ex, s, lab, u, isLast) {
  return `<div class="setrow ${s.warm ? 'warm' : ''}">
    <button class="srmain" data-a="editSet" data-sid="${s.id}"><span class="badge">${lab}</span>
      <span class="sv">${fmtLoad(ex, s.kg, u)} <i>×</i> ${s.reps}${s.partials ? ` <em>+${s.partials} partial${s.partials > 1 ? 's' : ''}</em>` : ''}</span>
      ${s.eff != null ? `<span class="eff">${effLabel(s.eff)}</span>` : ''}</button>
    ${(s.drops || []).map(d => `<div class="drop">↘ drop: ${fmtLoad(ex, d.kg, u)} × ${d.reps}</div>`).join('')}
    ${isLast ? `<div class="qc"><button class="chip" data-a="addPartial" data-sid="${s.id}">+ Partials</button><button class="chip" data-a="addDrop" data-sid="${s.id}">+ Drop set</button>${effChips(s)}</div>` : ''}
  </div>`;
}
function setEditor(ex, s, lab, u) {
  const wl = ex.kind === 'bw' ? `Added (${u})` : `Weight (${u})`;
  return `<div class="setrow edit ${s.warm ? 'warm' : ''}">
    <div class="erow"><span class="badge">${lab}</span><b>Edit set</b><button class="chip ${s.warm ? 'on' : ''}" data-a="swarm" data-sid="${s.id}">Warm-up</button><button class="iconbtn" data-a="sdel" data-sid="${s.id}" aria-label="Delete set" style="color:var(--danger)">${I.trash}</button></div>
    <div class="stps">${stepper(wl, dispKg(ex, s.kg, u), `data-t="s" data-sid="${s.id}" data-f="kg"`, 'decimal')}${stepper('Reps', s.reps, `data-t="s" data-sid="${s.id}" data-f="reps"`, 'numeric')}</div>
    <div class="stps" style="margin-top:8px">${stepper('Partial reps', s.partials || 0, `data-t="s" data-sid="${s.id}" data-f="partials"`, 'numeric')}<div></div></div>
    ${(s.drops || []).map((d, i) => `<div class="droped">${stepper(`Drop ${i + 1} (${u})`, dispKg(ex, d.kg, u), `data-t="d" data-sid="${s.id}" data-di="${i}" data-f="kg"`, 'decimal')}${stepper('Reps', d.reps, `data-t="d" data-sid="${s.id}" data-di="${i}" data-f="reps"`, 'numeric')}<button class="iconbtn" data-a="ddel" data-sid="${s.id}" data-di="${i}" aria-label="Remove drop">${I.x}</button></div>`).join('')}
    <div class="qc"><button class="chip" data-a="addDrop" data-sid="${s.id}">+ Drop set</button>${effChips(s)}</div>
    <div class="btns"><button class="btn" data-a="editSet" data-sid="">Done</button></div>
  </div>`;
}
function setsBlock(ex, w, e, v) {
  const u = unitFor(ex); let n = 0;
  const rows = e.sets.map((s, i) => { const lab = s.warm ? 'W' : String(++n); return S.editSet === s.id ? setEditor(ex, s, lab, u) : setRow(ex, s, lab, u, i === e.sets.length - 1 && S.editSet == null); }).join('');
  const key = pendKey(v);
  if (!S.pend[key]) S.pend[key] = pendingDefault(ex, w, e);
  const p = S.pend[key];
  const last = lastSession(ex.id, w.id, w.date), ref = last && last.work[n];
  const wl = ex.kind === 'bw' ? `Added (${u})` : `Weight (${u})`;
  return `<div class="sec"><h2>Sets</h2>${seg([['kg', 'kg'], ['lb', 'lb']], u, 'unit', '', 'sm')}</div>
  <div class="sets">${rows}
    <div class="pending">
      <div class="ptop"><b>${p.warm ? 'Warm-up set' : `Set ${n + 1}`}</b><button class="chip ${p.warm ? 'on' : ''}" data-a="pwarm">Warm-up</button></div>
      <div class="stps">${stepper(wl, dispKg(ex, p.kg, u), 'data-t="p" data-f="kg"', 'decimal')}${stepper('Reps', p.reps, 'data-t="p" data-f="reps"', 'numeric')}</div>
      <button class="logbtn" data-a="logSet">${I.check} Log ${p.warm ? 'warm-up' : 'set ' + (n + 1)}</button>
      ${ref && !p.warm ? `<div class="hint">Last time, set ${n + 1}: ${fmtSet(ex, ref, u)}</div>` : ''}
    </div>
  </div>`;
}
function viewEx(v) {
  const ex = db.exercises[v.ex];
  if (!ex) { S.stack.pop(); return render(), ''; }
  const w = v.wid ? db.workouts[v.wid] : null, e = w && w.entries.find(x => x.ex === ex.id);
  const u = unitFor(ex), color = exColor(ex), pr = prOf(ex.id, w && w.id), last = lastSession(ex.id, w && w.id, w && w.date);
  const sug = suggestion(ex, w);
  const ses = sessionsOf(ex.id);
  const pts = ses.map(s => {
    if (S.chart === 'v') { const vol = s.work.reduce((a, x) => a + setVol(ex, x, s.date), 0); return { x: s.date, y: Math.round(toU(vol, u)), tip: `${fmtShort(s.date)} · ${Math.round(toU(vol, u)).toLocaleString()} ${u}` }; }
    const t = topSet(s.work); return { x: s.date, y: toU(t.kg, u), lab: '×' + t.reps, tip: `${fmtShort(s.date)} · ${fmtSet(ex, t, u)}` };
  });
  const notes = S.notesEdit
    ? `<textarea class="ta" data-in="notes" placeholder="Seat height, grip, cues…">${esc(ex.notes)}</textarea><div class="btns"><button class="btn" data-a="notesDone">Save note</button></div>`
    : `<button class="notes ${ex.notes ? '' : 'empty'}" data-a="notesEdit">${ex.notes ? '📝 ' + esc(ex.notes) : '+ Add a note (seat height, grip, cues…)'}</button>`;
  return topbar(ex.name, backBtn(), `<button class="iconbtn" data-a="exSet" data-ex="${ex.id}" aria-label="Exercise settings">${I.dots}</button>`) + `<div class="page" style="--c:${color}">
    <div class="hero" style="--c:${color}">
      <h2>${esc(ex.name)}</h2><div class="sub">${M[ex.muscle].name} · ${G[M[ex.muscle].g].name} · ${ex.repMin}–${ex.repMax} reps</div>
      <div class="hrow"><div><span>PR</span><b>${pr ? `${fmtLoad(ex, pr.kg, u)} × ${pr.reps}` : '—'}</b></div>
      <div><span>Last time${last ? ' · ' + fmtShort(last.date) : ''}</span><b>${last ? `${last.work.length} sets` : '—'}</b></div></div>
      ${last ? `<div class="sub" style="margin-top:6px">${shortSets(ex, last.work, u)} ${ex.kind === 'bw' ? '' : u}</div>` : ''}
    </div>
    ${sug ? `<div class="banner next">${I.bulb}<div><span class="bt">Next target</span>${sug.text}</div></div>` : ''}
    ${notes}
    ${e ? setsBlock(ex, w, e, v) : ''}
    <div class="sec"><h2>Progress</h2>${seg([['w', 'Top set'], ['v', 'Volume']], S.chart, 'chart', '', 'sm')}</div>
    <div class="panel">${lineChart(pts, color, { bars: S.chart === 'v' })}
      <p class="note">${S.chart === 'w' ? `Heaviest working set each session (${u}), labelled with reps. Tap the chart for details.` : `Total working volume each session (${u}).`}</p></div>
    <div class="sec"><h2>History</h2><span class="act">${ses.length} session${ses.length === 1 ? '' : 's'}</span></div>
    <div class="hist">${ses.length ? ses.slice().reverse().map(s => `<div class="hi"><div class="hd"><span>${fmtDate(s.date)}</span><span>${fmtVol(s.work.reduce((a, x) => a + setVol(ex, x, s.date), 0))}</span></div><div class="hs">${s.sets.map(x => (x.warm ? 'W ' : '') + fmtSet(ex, x, u)).join('<br>')}</div></div>`).join('') : '<div class="empty">Log a set and it will show up here.</div>'}</div>
  </div>`;
}

/* ---------- progress view ---------- */
function viewProg() {
  const st = db.settings, mode = st.radarMode, t = todayS(), weeks = st.ghostWeeks;
  const now = scoresAt(t), ghost = scoresAt(addDays(t, -7 * weeks));
  const wsMap = weeklySets(weekStartOf(t)), bw = bwAt(t);
  let axes, nv, gv;
  if (mode === 'groups') {
    axes = RADAR_ORDER.map(id => ({ label: G[id].name }));
    nv = RADAR_ORDER.map(id => now.g[id]); gv = RADAR_ORDER.map(id => ghost.g[id]);
  } else {
    const vis = RADAR_ORDER.flatMap(gid => MUSCLES.filter(m => m.g === gid && !st.hidden.includes(m.id)));
    axes = vis.map(m => ({ label: m.name })); nv = vis.map(m => now.m[m.id]); gv = vis.map(m => ghost.m[m.id]);
  }
  const card = (k, id, name, color, sc, sets, hidden) => `<button class="mcard ${sc == null ? 'nodata' : ''}" style="--c:${color}" data-a="openM" data-k="${k}" data-id="${id}">
    <div class="mt"><b>${name}</b>${sc != null ? `<span class="sc">${Math.round(sc)}</span>` : ''}</div>
    <div class="mb"><strong>${tierName(sc)}</strong>${sets} set${sets === 1 ? '' : 's'} this week</div>${hidden ? `<span class="hid">${I.eyeoff}</span>` : ''}</button>`;
  const cards = mode === 'groups'
    ? `<div class="grid2">${GROUPS.map(g => card('g', g.id, g.name, g.color, now.g[g.id], groupSets(wsMap, g.id))).join('')}</div>`
    : GROUPS.map(g => `<div class="gh"><i style="background:${g.color}"></i>${g.name}</div><div class="grid2">${MUSCLES.filter(m => m.g === g.id).map(m => card('m', m.id, m.name, g.color, now.m[m.id], wsMap[m.id] || 0, st.hidden.includes(m.id))).join('')}</div>`).join('');
  const s = stats();
  let fun = 'Keep lifting — your first grand piano is coming.';
  for (const [one, many, kg] of THINGS) if (s.vol >= kg) { const n = s.vol / kg; fun = `That's about ${n < 10 ? num(n.toFixed(1)) : Math.round(n).toLocaleString()} ${n < 1.05 ? one : many}.`; }
  const vis = MUSCLES.filter(m => !st.hidden.includes(m.id));
  const maxS = Math.max(25, ...vis.map(m => wsMap[m.id] || 0));
  const bwList = db.bw.slice().sort((a, b) => a.date.localeCompare(b.date));
  const bw30 = bwAt(addDays(t, -30));
  return topbar('Progress', `<button class="iconbtn" data-a="settings" aria-label="Settings">${I.gear}</button>`) + `<div class="page">
    ${seg([['groups', 'Groups'], ['muscles', 'Muscles']], mode, 'radarMode')}
    <div class="panel">
      <div class="ph"><h3>Strength profile</h3>${seg([['4', '4 wk'], ['12', '12 wk']], String(weeks), 'ghost', '', 'sm')}</div>
      ${bw ? '' : `<div class="banner" style="background:var(--bg)"><div>Add your bodyweight to compare your lifts with strength standards. <button class="link" data-a="bw">Add bodyweight</button></div></div>`}
      ${radar(axes, nv, gv)}
      <div class="legend"><span><i class="sw" style="background:var(--accent)"></i>Now</span><span><i class="sw" style="background:var(--ghost);opacity:.6"></i>${weeks} weeks ago</span><span class="grow"></span>${mode === 'muscles' ? `<button class="link" data-a="editMuscles">Show / hide</button>` : ''}</div>
      <p class="note">Each corner is scored 0–100 against typical strength standards for men at your bodyweight (rings: Beginner → Elite). Lifts with no standard are scored on your own progress since you started them.</p>
    </div>
    <div class="sec"><h2>${mode === 'groups' ? 'Muscle groups' : 'Muscles'}</h2></div>
    ${cards}
    <div class="sec"><h2>Stats</h2></div>
    <div class="stats">
      <div class="stat wide"><span>Total weight moved</span><b>${fmtVol(s.vol)}</b><small>${fun}</small></div>
      <div class="stat"><span>Workouts</span><b>${s.done}</b></div>
      <div class="stat"><span>Week streak</span><b>${s.streak} 🔥</b></div>
      <div class="stat"><span>Consistency · 4 wk</span><b>${s.planned ? Math.round(s.hit / s.planned * 100) + '%' : '—'}</b><small>${s.hit} of ${s.planned} planned</small></div>
      <div class="stat"><span>Time trained</span><b>${fmtDur(s.time)}</b></div>
      <div class="stat"><span>Total sets</span><b>${s.sets.toLocaleString()}</b></div>
      <div class="stat"><span>Total reps</span><b>${s.reps.toLocaleString()}</b></div>
      <div class="stat"><span>PRs this month</span><b>${s.prs} 🏆</b></div>
      <div class="stat"><span>Most improved · month</span><b>${s.improved ? '+' + Math.round(s.improved.pct * 100) + '%' : '—'}</b><small>${s.improved ? esc(s.improved.ex.name) : 'Needs last month’s data'}</small></div>
    </div>
    <div class="sec"><h2>Hard sets this week</h2><span class="act">target 10–20</span></div>
    <div class="panel">${vis.map(m => { const n = wsMap[m.id] || 0; return `<div class="wsr"><span>${m.name}</span><div class="bar"><div class="band" style="left:${10 / maxS * 100}%;width:${10 / maxS * 100}%"></div><div class="fill" style="width:${n / maxS * 100}%;background:${G[m.g].color}"></div></div><b>${n}</b></div>`; }).join('')}
      <p class="note">Working sets per muscle (warm-ups excluded). The shaded band is the commonly recommended 10–20 sets a week.</p></div>
    <div class="sec"><h2>Bodyweight</h2><button class="act link" data-a="bw">+ Log</button></div>
    <div class="panel"><div class="ph"><div><b style="font-size:24px">${bw ? fmtLoad({ kind: 'w' }, bw, db.settings.unit) : '—'}</b>${bw && bw30 && bwList.length > 1 ? `<div class="note" style="margin:0">${bw - bw30 >= 0 ? '+' : ''}${num(toU(bw - bw30, db.settings.unit))} ${db.settings.unit} vs 30 days ago</div>` : ''}</div>${sparkline(bwList.map(b => b.kg), 'var(--accent)')}</div></div>
  </div>`;
}
function viewMuscle(v) {
  const isG = v.k === 'g', g = isG ? G[v.id] : G[M[v.id].g], name = isG ? g.name : M[v.id].name;
  const mus = isG ? MUSCLES.filter(m => m.g === g.id).map(m => m.id) : [v.id];
  const t = todayS(), sc = scoresAt(t), score = isG ? sc.g[v.id] : sc.m[v.id];
  const wsMap = weeklySets(weekStartOf(t)), sets = mus.reduce((a, m) => a + (wsMap[m] || 0), 0);
  const ix = idx(), exs = Object.values(db.exercises).filter(e => mus.includes(e.muscle));
  const lastD = e => ix[e.id] ? ix[e.id][ix[e.id].length - 1].date : '';
  const done = exs.filter(lastD).sort((a, b) => lastD(b).localeCompare(lastD(a))), notDone = exs.filter(e => !lastD(e)).sort((a, b) => a.name.localeCompare(b.name));
  const row = ex => {
    const u = unitFor(ex), ses = ix[ex.id] || [], last = ses[ses.length - 1], pr = prOf(ex.id), top = last && topSet(last.work);
    return `<button class="row" data-a="openExD" data-ex="${ex.id}"><span class="dot" style="background:${g.color}"></span><div class="rt"><b>${esc(ex.name)}</b><small>${isG ? M[ex.muscle].name + ' · ' : ''}PR ${fmtLoad(ex, pr.kg, u)} × ${pr.reps}</small></div>${sparkline(ses.slice(-10).map(s => topSet(s.work).kg), g.color)}<div class="rv"><b>${fmtLoad(ex, top.kg, u)}</b><small>× ${top.reps} · ${fmtShort(last.date)}</small></div></button>`;
  };
  return topbar(name, backBtn()) + `<div class="page">
    <div class="hero" style="--c:${g.color}"><h2>${name}</h2><div class="sub">${isG ? 'Muscle group' : g.name}</div>
      <div class="hrow"><div><span>Level</span><b>${tierName(score)}${score != null ? ' · ' + Math.round(score) : ''}</b></div><div><span>This week</span><b>${sets} hard sets</b></div></div></div>
    ${isG ? `<div class="chips" style="margin-top:12px">${mus.map(m => `<button class="chip" data-a="openM" data-k="m" data-id="${m}">${M[m].name}${sc.m[m] != null ? ' · ' + Math.round(sc.m[m]) : ''}</button>`).join('')}</div>` : ''}
    <div class="sec"><h2>Current weights</h2><button class="act link" data-a="newEx" data-m="${mus[0]}">+ New exercise</button></div>
    ${done.length ? `<div class="rows">${done.map(row).join('')}</div>` : '<div class="empty">Nothing logged here yet.</div>'}
    ${notDone.length ? `<div class="sec"><h2 class="muted">Not trained yet</h2></div><div class="rows">${notDone.map(ex => `<button class="row muted" data-a="openExD" data-ex="${ex.id}"><span class="dot" style="background:${g.color};opacity:.4"></span><div class="rt"><b>${esc(ex.name)}</b>${isG ? `<small>${M[ex.muscle].name}</small>` : ''}</div></button>`).join('')}</div>` : ''}
  </div>`;
}

/* ---------- settings view ---------- */
function viewSettings() {
  const st = db.settings, nCustom = Object.values(db.exercises).filter(e => e.custom).length;
  const r = (label, control) => `<div class="field"><label>${label}</label>${control}</div>`;
  return topbar('Settings', backBtn()) + `<div class="page">
    ${r('Appearance', seg([['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], st.theme, 'set', 'data-k="theme"'))}
    ${r('Default unit (each exercise can switch while logging)', seg([['kg', 'kg'], ['lb', 'lb']], st.unit, 'set', 'data-k="unit"'))}
    ${r('Effort tracking', seg([['RIR', 'RIR'], ['RPE', 'RPE'], ['off', 'Off']], st.effort, 'set', 'data-k="effort"'))}
    ${r('Week starts on', seg([['1', 'Monday'], ['0', 'Sunday']], String(st.weekStart), 'set', 'data-k="weekStart"'))}
    <div class="sec"><h2>Your data</h2><span class="act">${Object.keys(db.exercises).length} exercises · ${nCustom} custom</span></div>
    <p class="note" style="margin-top:0">Everything is stored on this phone only. Export a backup now and then (e.g. to Files or iCloud Drive).${st.lastBackup ? ` Last backup: ${fmtDate(ymd(new Date(st.lastBackup)))}.` : ''}</p>
    <div class="btns"><button class="btn" data-a="export">Export backup</button>
      <label class="btn" style="cursor:pointer">Import backup<input type="file" accept="application/json,.json" data-in="import" hidden></label>
      <button class="btn danger" data-a="reset">Erase all data</button></div>
    <div class="sec"><h2>Install on iPhone</h2></div>
    <p class="note" style="margin-top:0">Open this page in Safari → Share → <b>Add to Home Screen</b>. Then always open Overload from the icon (data in the home-screen app is kept separately from Safari). It works offline.</p>
  </div>`;
}

/* ---------- sheets ---------- */
function sheetHtml() {
  const sh = S.sheet; let h = '';
  if (sh.k === 'menu') {
    h = `<h3>${esc(sh.title)}</h3>${sh.sub ? `<div class="shsub">${esc(sh.sub)}</div>` : ''}<div class="menu">${sh.items.map((it, i) => `<button class="${it.danger ? 'danger' : ''}" data-a="menuItem" data-i="${i}">${esc(it.label)}</button>`).join('')}</div><div class="btns"><button class="btn" data-a="closeSheet">Cancel</button></div>`;
  } else if (sh.k === 'type') {
    const cur = sh.it ? itType(sh.it) : null, d = sh.mode === 'new' ? sh.date : itDate(sh.it);
    h = `<h3>${sh.mode === 'new' ? 'Plan a workout' : 'Change workout type'}</h3><div class="shsub">${fmtDate(d)}</div>
      ${sh.mode === 'new' ? `<button class="togrow" data-a="toggleRepeat"><span>Repeat every ${DAYS_LONG[dow(d)]}</span><span class="switch ${sh.repeat ? 'on' : ''}"></span></button>` : ''}
      <div class="tiles">${TYPES.map(ty => `<button class="tile ${ty.id === cur ? 'cur' : ''}" style="--c:${ty.color}" data-a="pickType" data-v="${ty.id}">${ty.name}</button>`).join('')}</div>`;
  } else if (sh.k === 'resched') {
    const D = itDate(sh.it), quick = Array.from({ length: 7 }, (_, i) => addDays(D, i - 3)).filter(x => x !== D);
    h = `<h3>Reschedule</h3><div class="shsub">${T[itType(sh.it)].name} · currently ${fmtDate(D)}</div>
      <div class="chips">${quick.map(x => `<button class="chip ${x === sh.date ? 'on' : ''}" data-a="reschPick" data-d="${x}">${fmtDate(x)}</button>`).join('')}</div>
      <div class="field"><label>Or pick a date</label><input class="inp" type="date" value="${sh.date}" data-in="reschDate"></div>
      <div class="btns"><button class="btn primary" data-a="reschGo">Move to ${fmtDate(sh.date)}</button></div>`;
  } else if (sh.k === 'picker') {
    const w = db.workouts[sh.wid];
    h = `<h3>Add exercises</h3><div class="search"><input class="inp" placeholder="Search exercises" value="${esc(sh.q)}" data-in="pq" type="search" autocomplete="off">
      <div class="chips" style="margin-top:8px">${[['type', T[w.type].name], ['all', 'All'], ...GROUPS.map(g => [g.id, g.name])].map(([v, l]) => `<button class="chip ${sh.f === v ? 'on' : ''}" data-a="pf" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div id="plist">${pickerList()}</div><div class="btns"><button class="btn primary" data-a="closeSheet">Done</button></div>`;
  } else if (sh.k === 'newEx' || sh.k === 'exSet') {
    const edit = sh.k === 'exSet';
    h = `<h3>${edit ? 'Exercise settings' : 'New exercise'}</h3>
      <div class="field"><label>Name</label><input class="inp" value="${esc(sh.name)}" data-in="nxName" placeholder="e.g. Incline Smith Press" autocomplete="off"></div>
      <div id="dupmsg">${dupHtml()}</div>
      <div class="field"><label>Main muscle</label><select class="inp" data-in="nxMuscle">${GROUPS.map(g => `<optgroup label="${g.name}">${MUSCLES.filter(m => m.g === g.id).map(m => `<option value="${m.id}" ${m.id === sh.muscle ? 'selected' : ''}>${m.name}</option>`).join('')}</optgroup>`).join('')}</select></div>
      <div class="field"><label>Load</label>${seg([['w', 'Weights'], ['bw', 'Bodyweight (+/− added)']], sh.kind, 'nxKind')}</div>
      ${edit ? `<div class="stps field">${stepper('Min reps', sh.repMin, 'data-t="x" data-f="repMin"', 'numeric')}${stepper('Max reps', sh.repMax, 'data-t="x" data-f="repMax"', 'numeric')}</div>
      <div class="stps field">${stepper('Increment (kg)', sh.inc, 'data-t="x" data-f="inc"', 'decimal')}<div></div></div>
      <p class="note">The rep range and increment drive the “next target” suggestion: once every set hits the max reps, it suggests adding one increment.</p>` : ''}
      <div class="btns"><button class="btn primary" data-a="nxSave">${edit ? 'Save' : 'Create exercise'}</button>${edit ? `<button class="btn danger" data-a="exDel">Delete exercise</button>` : ''}</div>`;
  } else if (sh.k === 'muscles') {
    h = `<h3>Muscles in the hexagon</h3><div class="shsub">Hidden muscles are still tracked everywhere else.</div>` + GROUPS.map(g => `<div class="gh"><i style="background:${g.color}"></i>${g.name}</div>${MUSCLES.filter(m => m.g === g.id).map(m => `<button class="togrow" data-a="togM" data-v="${m.id}"><span>${m.name}</span><span class="switch ${db.settings.hidden.includes(m.id) ? '' : 'on'}"></span></button>`).join('')}`).join('') + `<div class="btns"><button class="btn primary" data-a="closeSheet">Done</button></div>`;
  } else if (sh.k === 'bw') {
    const u = db.settings.unit, list = db.bw.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    h = `<h3>Log bodyweight</h3><div class="stps field">${stepper(`Bodyweight (${u})`, sh.val == null ? '' : num(toU(sh.val, u)), 'data-t="b" data-f="kg"', 'decimal')}<div class="stp"><label>Date</label><input class="inp" type="date" value="${sh.date}" data-in="bwDate" style="height:50px"></div></div>
      <div class="btns"><button class="btn primary" data-a="bwSave">Save</button></div>
      ${list.length ? `<div class="sec"><h2>Recent</h2></div><div class="rows">${list.map(b => `<div class="row"><div class="rt"><b>${fmtLoad({ kind: 'w' }, b.kg, u)}</b><small>${fmtDate(b.date)}</small></div><button class="iconbtn" data-a="bwDel" data-d="${b.date}" aria-label="Delete">${I.trash}</button></div>`).join('')}</div>` : ''}`;
  } else if (sh.k === 'finish') {
    const w = db.workouts[sh.wid], s = wSummary(w), prs = wPRs(w);
    h = `<h3>${prs.length ? 'Great session 🏆' : 'Workout done 💪'}</h3><div class="shsub">${T[w.type].name} · ${fmtDate(w.date)}</div>
      <div class="stats"><div class="stat"><span>Time</span><b>${fmtDur(s.dur)}</b></div><div class="stat"><span>Sets</span><b>${s.sets}</b></div><div class="stat"><span>Volume</span><b>${fmtVol(s.vol)}</b></div><div class="stat"><span>PRs</span><b>${prs.length}</b></div></div>
      ${prs.length ? `<div class="sec"><h2>New records</h2></div><div class="rows">${prs.map(p => `<div class="row"><span class="dot" style="background:${exColor(p.ex)}"></span><div class="rt"><b>${esc(p.ex.name)}</b></div><div class="rv"><b>${fmtLoad(p.ex, p.set.kg)} × ${p.set.reps}</b></div></div>`).join('')}</div>` : ''}
      <div class="btns"><button class="btn primary" data-a="finishDone">Done</button></div>`;
  }
  const anim = S.sheetFresh ? ' anim' : ''; S.sheetFresh = false;
  return `<div class="sheetwrap${anim}" data-a="sheetBg"><div class="sheet" role="dialog"><div class="grab"></div>${h}</div></div>`;
}
function pickerList() {
  const sh = S.sheet, w = db.workouts[sh.wid], inPlan = new Set(w.entries.map(e => e.ex)), tm = typeMuscles(w.type), ix = idx();
  const q = tokens(sh.q);
  let list = Object.values(db.exercises);
  if (sh.f === 'type') list = list.filter(e => tm.has(e.muscle)); else if (sh.f !== 'all') list = list.filter(e => M[e.muscle].g === sh.f);
  if (q.length) list = list.filter(e => { const et = tokens(e.name).join(' ') + ' ' + M[e.muscle].name.toLowerCase(); return q.every(t => et.includes(t)); });
  const order = Object.fromEntries(MUSCLES.map((m, i) => [m.id, i]));
  list.sort((a, b) => order[a.muscle] - order[b.muscle] || a.name.localeCompare(b.name));
  const rows = list.map(ex => { const s = ix[ex.id], on = inPlan.has(ex.id);
    return `<div class="row"><span class="dot" style="background:${exColor(ex)}"></span><div class="rt"><b>${esc(ex.name)}</b><small>${M[ex.muscle].name}${s ? ' · last ' + fmtShort(s[s.length - 1].date) : ''}</small></div><button class="addbtn ${on ? 'on' : ''}" data-a="pAdd" data-ex="${ex.id}" aria-label="${on ? 'Remove' : 'Add'}">${on ? I.check : I.plus}</button></div>`; }).join('');
  return (rows ? `<div class="rows">${rows}</div>` : `<div class="empty">No matches.</div>`)
    + `<div class="btns"><button class="btn" data-a="newEx" data-name="${esc(sh.q)}">${I.plus} Create ${sh.q.trim() ? `“${esc(sh.q.trim())}”` : 'new exercise'}</button></div>`;
}
function dupHtml() {
  const sh = S.sheet; if (!sh.name || !sh.name.trim()) return '<div class="warn"></div>';
  const { exact, near } = dupCheck(sh.name, sh.exId);
  if (exact) return `<div class="warn bad on">You already have <b>${esc(exact.name)}</b>. Duplicates aren’t allowed — use that one, or pick a more specific name.</div>`;
  if (near) return `<div class="warn meh on">Looks similar to <b>${esc(near.name)}</b>. If it’s a different exercise, tap ${sh.k === 'exSet' ? 'Save' : 'Create'} again to confirm.</div>`;
  return '<div class="warn"></div>';
}

/* ---------- actions ---------- */
const curW = () => { const v = topView(); return v && v.v === 'w' ? db.workouts[v.id] : v && v.v === 'ex' && v.wid ? db.workouts[v.wid] : null; };
const curEntry = () => { const v = topView(), w = curW(); return w && v.v === 'ex' ? w.entries.find(e => e.ex === v.ex) : null; };
const findSet = sid => { const e = curEntry(); return e && e.sets.find(s => s.id === sid); };
function exSheet(base) {
  return Object.assign({ name: '', muscle: 'midchest', kind: 'w', ack: null }, base);
}

const A = {
  tab: ds => { S.rootScroll[S.tab] = window.scrollY; S.tab = ds.v; render(); window.scrollTo(0, S.rootScroll[S.tab] || 0); },
  today: () => {
    const t = todayS(), list = itemsBetween(t, t)[t] || [];
    S.anchor = t; S.monthSel = t;
    if (list.length === 1) return openItem(list[0]);
    S.tab = 'cal'; S.stack = []; render(); window.scrollTo(0, 0);
    if (!list.length) openSheet({ k: 'type', mode: 'new', date: t, repeat: false });
  },
  back: () => history.back(),
  settings: () => push({ v: 'set' }),
  calView: ds => { db.settings.calView = ds.v; S.monthSel = S.anchor; save(); render(); },
  calNav: ds => {
    if (db.settings.calView === 'week') S.anchor = addDays(S.anchor, 7 * ds.v);
    else { const a = parseD(S.anchor); S.anchor = ymd(new Date(a.getFullYear(), a.getMonth() + +ds.v, 1)); S.monthSel = S.anchor; }
    render();
  },
  calToday: () => { S.anchor = S.monthSel = todayS(); render(); },
  selDay: ds => { S.monthSel = ds.d; render(); },
  addDay: ds => openSheet({ k: 'type', mode: 'new', date: ds.d, repeat: false }),
  openItem: ds => openItem(itemFrom(ds)),
  itemMenu: ds => itemMenu(itemFrom(ds)),
  wMenu: () => itemMenu({ w: curW() }),
  toggleRepeat: () => { S.sheet.repeat = !S.sheet.repeat; render(); },
  pickType: ds => {
    const sh = S.sheet, type = ds.v;
    if (sh.mode === 'new') {
      if (sh.repeat) { const R = { id: uid(), type, weekday: dow(sh.date), start: sh.date, end: null, skip: {} }; db.recs[R.id] = R; }
      else newWorkout(sh.date, type, null);
      save(); closeSheet(); toast(sh.repeat ? `${T[type].name} every ${DAYS_LONG[dow(sh.date)]}` : `${T[type].name} planned`);
    } else {
      const it = sh.it; closeSheet(true);
      if (type === itType(it)) return render();
      withScope(it, `Change to ${T[type].name}`, scope => changeType(it, type, scope));
    }
  },
  menuItem: ds => { const f = S.sheetFns[+ds.i]; closeSheet(true); if (f) f(); if (!S.sheet) render(); },
  closeSheet: () => closeSheet(),
  sheetBg: (ds, el, e) => { if (e.target === el) closeSheet(); },
  reschPick: ds => { S.sheet.date = ds.d; render(); },
  reschGo: () => { const { it, date } = S.sheet; closeSheet(true); withScope(it, `Move to ${fmtDate(date)}`, scope => reschedule(it, date, scope)); if (!S.sheet) render(); },

  // workout
  openEx: ds => { const w = curW(); push({ v: 'ex', ex: ds.ex, wid: w.id }); },
  openExD: ds => push({ v: 'ex', ex: ds.ex }),
  addEx: ds => { const w = curW(); if (!w.entries.some(e => e.ex === ds.ex)) w.entries.push({ ex: ds.ex, sets: [] }); w.custom = true; save(); render(); toast(`Added ${db.exercises[ds.ex].name}`); },
  reorder: () => { S.reorder = !S.reorder; render(); },
  mv: ds => { const w = curW(), i = w.entries.findIndex(e => e.ex === ds.ex), j = i + +ds.v; if (j < 0 || j >= w.entries.length) return; [w.entries[i], w.entries[j]] = [w.entries[j], w.entries[i]]; w.custom = true; save(); render(); },
  rmEx: ds => {
    const w = curW(), e = w.entries.find(x => x.ex === ds.ex);
    if (e.sets.length && !confirm('Remove this exercise and its logged sets from the workout?')) return;
    w.entries = w.entries.filter(x => x !== e); w.custom = true; save(); render();
  },
  exMenu: ds => {
    const w = curW(), i = w.entries.findIndex(e => e.ex === ds.ex);
    const items = [];
    if (i > 0) items.push(['Move up', () => A.mv({ ex: ds.ex, v: -1 })]);
    if (i < w.entries.length - 1) items.push(['Move down', () => A.mv({ ex: ds.ex, v: 1 })]);
    items.push(['Exercise settings', () => A.exSet(ds)]);
    items.push(['Remove from workout', () => A.rmEx(ds), 'danger']);
    openMenu(db.exercises[ds.ex].name, items);
  },
  browse: () => openSheet({ k: 'picker', wid: curW().id, q: '', f: 'type' }),
  pf: ds => { S.sheet.f = ds.v; render(); },
  pAdd: ds => {
    const w = db.workouts[S.sheet.wid], e = w.entries.find(x => x.ex === ds.ex);
    if (e) { if (e.sets.length) return toast('Has logged sets — remove it from the workout screen'); w.entries = w.entries.filter(x => x !== e); }
    else w.entries.push({ ex: ds.ex, sets: [] });
    w.custom = true; save(); document.getElementById('plist').innerHTML = pickerList();
  },
  newEx: ds => {
    const v = topView(), w = curW();
    let muscle = ds.m || (v && v.v === 'm' ? (v.k === 'm' ? v.id : MUSCLES.find(m => m.g === v.id).id) : null);
    if (!muscle && w) { const tm = typeMuscles(w.type); muscle = MUSCLES.find(m => tm.has(m.id)).id; }
    const name = ds.name != null ? ds.name : '';
    openSheet(exSheet({ k: 'newEx', name, muscle: muscle || 'midchest', wid: w && w.id }));
  },
  exSet: ds => { const ex = db.exercises[ds.ex]; openSheet(exSheet({ k: 'exSet', exId: ex.id, name: ex.name, muscle: ex.muscle, kind: ex.kind, repMin: ex.repMin, repMax: ex.repMax, inc: ex.inc })); },
  nxKind: ds => { S.sheet.kind = ds.v; render(); },
  nxSave: () => {
    const sh = S.sheet, name = sh.name.trim().replace(/\s+/g, ' ');
    if (!name) return toast('Give it a name');
    const { exact, near } = dupCheck(name, sh.exId);
    if (exact) return toast(`“${exact.name}” already exists`);
    if (near && sh.ack !== near.id) { sh.ack = near.id; document.getElementById('dupmsg').innerHTML = dupHtml(); return; }
    if (sh.k === 'exSet') {
      const ex = db.exercises[sh.exId];
      const rmin = clamp(Math.round(sh.repMin) || 1, 1, 100), rmax = clamp(Math.round(sh.repMax) || rmin, rmin, 100);
      Object.assign(ex, { name, muscle: sh.muscle, kind: sh.kind, repMin: rmin, repMax: rmax, inc: sh.inc > 0 ? sh.inc : 2.5 });
      save(); closeSheet(); toast('Saved');
    } else {
      const ex = mkEx(name, sh.muscle, 0, sh.kind === 'bw' ? 'b' : 'm', true); db.exercises[ex.id] = ex;
      const w = sh.wid && db.workouts[sh.wid];
      if (w) { w.entries.push({ ex: ex.id, sets: [] }); w.custom = true; }
      save(); closeSheet(); toast(w ? `Created and added ${name}` : `Created ${name}`);
    }
  },
  exDel: () => {
    const sh = S.sheet, ex = db.exercises[sh.exId], n = sessionsOf(ex.id).length;
    if (!confirm(n ? `Delete ${ex.name} and its ${n} logged session${n > 1 ? 's' : ''}? This can’t be undone.` : `Delete ${ex.name}?`)) return;
    for (const w of Object.values(db.workouts)) w.entries = w.entries.filter(e => e.ex !== ex.id);
    delete db.exercises[ex.id]; save(); closeSheet(true);
    if (topView() && topView().v === 'ex') history.back(); else render();
  },
  finish: () => {
    const w = curW(), first = !w.finishedAt; w.finishedAt = w.finishedAt || Date.now(); save();
    openSheet({ k: 'finish', wid: w.id });
    if (first && wPRs(w).length) confetti();
  },
  finishDone: () => { closeSheet(true); history.back(); },

  // exercise logging
  unit: ds => { const ex = db.exercises[topView().ex]; ex.unit = ds.v; save(); render(); },
  chart: ds => { S.chart = ds.v; render(); },
  notesEdit: () => { S.notesEdit = true; render(); const ta = document.querySelector('[data-in="notes"]'); if (ta) ta.focus(); },
  notesDone: () => { S.notesEdit = false; save(); render(); },
  pwarm: () => { const p = S.pend[pendKey(topView())]; p.warm = !p.warm; render(); },
  stp: ds => {
    const tg = target(ds); if (!tg) return;
    const { obj, f, ex, u } = tg;
    if (f === 'kg') {
      const cur = obj.kg == null ? 0 : toU(obj.kg, u), step = ds.t === 'b' ? (u === 'lb' ? 1 : 0.5) : stepFor(ex, u);
      let nv = Math.round((cur + ds.v * step) * 100) / 100;
      if (ex.kind !== 'bw') nv = Math.max(0, nv);
      obj.kg = fromU(nv, u);
    } else if (f === 'inc') obj.inc = Math.max(0.25, Math.round(((obj.inc || 0) + ds.v * 0.25) * 100) / 100);
    else obj[f] = Math.max(f === 'reps' && ds.t === 'p' ? 1 : 0, (obj[f] || 0) + +ds.v);
    if (ds.t === 's' || ds.t === 'd') save();
    render();
  },
  logSet: () => {
    const v = topView(), ex = db.exercises[v.ex], w = curW(), e = curEntry(), p = S.pend[pendKey(v)];
    if (p.kg == null && ex.kind !== 'bw') return toast('Enter a weight');
    if (!p.reps) return toast('Enter reps');
    const s = { id: uid(), kg: p.kg || 0, reps: p.reps, partials: 0, drops: [], warm: !!p.warm, eff: null, t: Date.now() };
    const prior = sessionsOf(ex.id, w.id).filter(x => x.date <= w.date);
    const best = topSet([...prior.flatMap(x => x.work), ...e.sets.filter(x => !x.warm)]);
    e.sets.push(s); w.status = 'planned';
    delete S.pend[pendKey(v)]; S.editSet = null; save(); render();
    if (!s.warm && prior.length && best && beats(s, best)) { confetti(); toast(`New PR! ${fmtLoad(ex, s.kg)} × ${s.reps} 🎉`); }
  },
  editSet: ds => { S.editSet = ds.sid || null; render(); },
  swarm: ds => { const s = findSet(ds.sid); s.warm = !s.warm; save(); render(); },
  sdel: ds => { const e = curEntry(); e.sets = e.sets.filter(s => s.id !== ds.sid); S.editSet = null; delete S.pend[pendKey(topView())]; save(); render(); },
  seff: ds => { const s = findSet(ds.sid); s.eff = s.eff === +ds.v ? null : +ds.v; save(); render(); },
  addPartial: ds => { const s = findSet(ds.sid); s.partials = (s.partials || 0) + 1; S.editSet = s.id; save(); render(); },
  addDrop: ds => {
    const s = findSet(ds.sid), ex = db.exercises[topView().ex], u = unitFor(ex), st = stepFor(ex, u);
    const base = (s.drops && s.drops.length ? s.drops[s.drops.length - 1].kg : s.kg);
    const d = Math.round(toU(base, u) * 0.8 / st) * st;
    (s.drops ||= []).push({ kg: fromU(d, u), reps: s.reps }); S.editSet = s.id; save(); render();
  },
  ddel: ds => { const s = findSet(ds.sid); s.drops.splice(+ds.di, 1); save(); render(); },

  // progress
  radarMode: ds => { db.settings.radarMode = ds.v; save(); render(); },
  ghost: ds => { db.settings.ghostWeeks = +ds.v; save(); render(); },
  openM: ds => push({ v: 'm', k: ds.k, id: ds.id }),
  editMuscles: () => openSheet({ k: 'muscles' }),
  togM: ds => {
    const h = db.settings.hidden, i = h.indexOf(ds.v);
    if (i >= 0) h.splice(i, 1); else { if (MUSCLES.length - h.length <= 3) return toast('Keep at least 3 muscles'); h.push(ds.v); }
    save(); render();
  },
  bw: () => openSheet({ k: 'bw', val: bwAt(todayS()), date: todayS() }),
  bwSave: () => {
    const sh = S.sheet; if (!(sh.val > 0)) return toast('Enter your bodyweight');
    db.bw = db.bw.filter(b => b.date !== sh.date); db.bw.push({ date: sh.date, kg: sh.val }); save(); closeSheet(); toast('Bodyweight saved');
  },
  bwDel: ds => { db.bw = db.bw.filter(b => b.date !== ds.d); save(); render(); },

  // settings
  set: ds => { const k = ds.k; db.settings[k] = k === 'weekStart' ? +ds.v : ds.v; save(); render(); },
  export: () => exportData(),
  reset: () => {
    if (!confirm('Erase ALL workouts, exercises and settings on this phone? Export a backup first if unsure.')) return;
    if (!confirm('Really erase everything? This cannot be undone.')) return;
    db = freshDb(); save(); S.stack = []; S.pend = {}; render(); toast('All data erased');
  },
};
function target(ds) {
  const v = topView();
  if (ds.t === 'p') { const ex = db.exercises[v.ex]; return { obj: S.pend[pendKey(v)], f: ds.f, ex, u: unitFor(ex) }; }
  if (ds.t === 's' || ds.t === 'd') { const ex = db.exercises[v.ex], s = findSet(ds.sid); if (!s) return null; return { obj: ds.t === 's' ? s : s.drops[+ds.di], f: ds.f, ex, u: unitFor(ex) }; }
  if (ds.t === 'x') return { obj: S.sheet, f: ds.f, ex: { kind: 'w', inc: 1 }, u: 'kg' };
  if (ds.t === 'b') return { obj: { get kg() { return S.sheet.val; }, set kg(x) { S.sheet.val = x; } }, f: 'kg', ex: { kind: 'w' }, u: db.settings.unit };
  return null;
}
async function exportData() {
  const name = `overload-backup-${todayS()}.json`, text = JSON.stringify(db);
  db.settings.lastBackup = Date.now(); save();
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Overload backup' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- input events ---------- */
const parseNum = s => { const v = parseFloat(String(s).replace(',', '.')); return isNaN(v) ? null : v; };
const IN = {
  stp: el => {
    const tg = target(el.dataset); if (!tg) return;
    const v = parseNum(el.value), f = tg.f;
    if (f === 'kg') tg.obj.kg = v == null ? null : fromU(v, tg.u);
    else if (f === 'inc') tg.obj.inc = v;
    else tg.obj[f] = v == null ? (f === 'partials' ? 0 : null) : Math.max(0, Math.round(v));
    if (el.dataset.t === 's' || el.dataset.t === 'd') { if (tg.obj.kg == null) tg.obj.kg = 0; if (tg.obj.reps == null) tg.obj.reps = 0; save(); }
  },
  notes: el => { db.exercises[topView().ex].notes = el.value; },
  pq: el => { S.sheet.q = el.value; document.getElementById('plist').innerHTML = pickerList(); },
  nxName: el => { S.sheet.name = el.value; S.sheet.ack = null; document.getElementById('dupmsg').innerHTML = dupHtml(); },
  nxMuscle: el => { S.sheet.muscle = el.value; },
  reschDate: el => { if (el.value) { S.sheet.date = el.value; const b = document.querySelector('[data-a="reschGo"]'); if (b) b.textContent = `Move to ${fmtDate(el.value)}`; } },
  bwDate: el => { if (el.value) S.sheet.date = el.value; },
};
const CH = {
  import: async el => {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || typeof d.exercises !== 'object' || typeof d.workouts !== 'object') throw new Error('bad');
      if (!confirm('Replace all data on this phone with this backup?')) return;
      db = migrate(d); save(); S.pend = {}; render(); toast('Backup restored');
    } catch (e) { toast('That file isn’t an Overload backup'); }
    el.value = '';
  },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || !el.dataset.a) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.dataset.a !== 'sheetBg') e.preventDefault();
  fn({ ...el.dataset }, el, e);
});
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.in; if (k && IN[k]) IN[k](e.target, e); });
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.in; if (k && CH[k]) CH[k](e.target, e); });
document.addEventListener('focusin', e => { if (e.target.matches('.stpi input')) setTimeout(() => e.target.select(), 0); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.stpi input')) e.target.blur(); });
// Chart tooltip: nearest point to the finger / cursor
function chartTip(e) {
  const svg = e.target.closest && e.target.closest('svg.chart[data-pts]'); if (!svg) return;
  const pts = JSON.parse(svg.dataset.pts), r = svg.getBoundingClientRect(), sx = r.width / 340;
  const x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / sx;
  let best = pts[0]; for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  const tip = svg.parentNode.querySelector('.tip'), xh = svg.querySelector('.xh');
  tip.textContent = best[2]; tip.style.display = 'block'; tip.style.left = best[0] * sx + 'px'; tip.style.top = svg.offsetTop + best[1] * sx - 8 + 'px';
  xh.setAttribute('x1', best[0]); xh.setAttribute('x2', best[0]); xh.style.display = '';
}
document.addEventListener('pointermove', chartTip);
document.addEventListener('pointerdown', chartTip);

/* ---------- render ---------- */
function applyTheme() {
  const t = db.settings.theme, root = document.documentElement;
  if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
}
function render() {
  applyTheme();
  const v = topView();
  let html;
  if (!v) html = (S.tab === 'cal' ? viewCal() : viewProg()) + tabbar();
  else if (v.v === 'w') html = viewWorkout(v);
  else if (v.v === 'ex') html = viewEx(v);
  else if (v.v === 'm') html = viewMuscle(v);
  else html = viewSettings();
  if (html === '') return; // a view popped itself and re-rendered
  const y = window.scrollY;
  app.innerHTML = html + (S.sheet ? sheetHtml() : '');
  window.scrollTo(0, y);
  document.body.classList.toggle('lock', !!S.sheet);
  wake(!!v && (v.v === 'w' || (v.v === 'ex' && !!v.wid)));
}
history.replaceState({ d: 0 }, '');
render();
