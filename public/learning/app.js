/* DuctStudy: core state, data loading, routing, shell, and the Today, Practice, Learn, Facts, Me and About views.
   Drill and checkpoints live in drill.js, the exam sim in sim.js, games in games.js, the systems lab in lab.js. */
(function () {
  'use strict';
  const V = window.VEL = window.VEL || {};
  const KEY = 'vel-v1';
  const DAY = 864e5;
  const TRACKS = [
    { id: 'ascs', code: 'ASCS', kind: 'Exam prep', name: 'Air Systems Cleaning Specialist' },
    { id: 'cvi', code: 'CVI', kind: 'Exam prep', name: 'Certified Ventilation Inspector' },
    { id: 'dvt', code: 'DVT', kind: 'Certificate prep', name: 'Dryer Vent Technician Certificate' }
  ];
  const TAGS = {
    SHALL: ['Required', 'shall'], SHOULD: ['Should', 'should'], REC: ['Recommended', 'rec'], MAY: ['Permitted', 'may'],
    CAN: ['Possible', 'can'], DEF: ['Definition', 'def'], NOTE: ['Trap', 'note'], CODE: ['Code', 'code'],
    REG: ['Regulation', 'reg'], FACT: ['', 'fact']
  };
  const OBLIG = ['SHALL', 'SHOULD', 'REC', 'MAY', 'CAN'];
  const LEITNER = [0, 1, 3, 7, 16, 35];
  const MODES = [
    ['pass', 'Pass my exam', 'Today’s drill, misses first, then a sim'],
    ['understand', 'Understand the work', 'Read the next lesson, then pass its checkpoint'],
    ['master', 'Lock in the facts', 'Recall cards and lesson checkpoints']
  ];
  // Five tabs. Each tab owns a group of views; the tab is active on any of them.
  const NAV = [['today', 'Today', ['today']], ['learn', 'Learn', ['learn', 'units', 'sources']],
    ['practice', 'Practice', ['practice', 'drill', 'games', 'lab']], ['sim', 'Exam sim', ['sim']], ['progress', 'Me', ['progress']]];
  const VIEW_NAME = { today: 'Today', learn: 'Learn', units: 'Facts', sources: 'About the exam', practice: 'Practice', drill: 'Drill',
    games: 'Games', lab: 'Systems lab', sim: 'Exam sim', progress: 'Me' };
  const ICONS = {
    today: '<path d="M4 7h16v13H4zM4 11h16M9 3v5M15 3v5"/>',
    learn: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
    practice: '<path d="M5 12l4 4 10-10"/><path d="M5 20h14"/>',
    sim: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M10 2h4"/>',
    progress: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'
  };
  const tabOf = view => (NAV.find(n => n[2].includes(view)) || [null])[0];
  const TITLES = {
    ascs: 'Make today’s study count.',
    cvi: 'Inspect it the way the exam asks.',
    dvt: 'Get the dryer vent basics cold.'
  };
  const MINUTES = [10, 15, 20, 30, 45, 60, 90];
  const SEC_PER_Q = 90; // planning pace for drill sizing: about 1.5 minutes per question with review

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);
  const link = (...segs) => '#/' + segs.map(s => encodeURIComponent(String(s))).join('/');
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function fmtDate(ts) { try { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function head(eyebrow, title, sub, aside, cls) {
    return `<div class="page-head${cls ? ' ' + cls : ''}"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${aside ? `<div class="head-aside">${aside}</div>` : ''}</div>`;
  }
  function empty(title, text, actions) {
    return `<div class="panel empty"><h2>${title}</h2>${text ? `<p class="muted">${text}</p>` : ''}${actions ? `<div class="actions center space">${actions}</div>` : ''}</div>`;
  }
  function tagChip(tag) { const t = TAGS[tag]; return t && t[0] ? `<span class="chip chip-${t[1]}">${t[0]}</span>` : ''; }
  const tagLabel = tag => (TAGS[tag] ? TAGS[tag][0] : '') || 'Fact';
  function statusBadge(s) {
    return s === 'known' ? '<span class="badge green">Known</span>' : s === 'shaky' ? '<span class="badge red">Shaky</span>' : '<span class="badge">New</span>';
  }
  const STOP = new Set('about above after again against because before being below between both could does doing down during each from further have having here into itself more most other ought over same should such than that their theirs them then there these they this those through under until very were what when where which while whom with would your yours shall must also only'.split(' '));
  function cloze(text) {
    const parts = String(text).split(/(\s+)/);
    let best = -1, bestScore = 0;
    parts.forEach((p, i) => {
      if (!p.trim()) return;
      const core = p.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%]+$/g, '');
      if (!core) return;
      let score = 0;
      if (/\d/.test(core)) score = 100 + core.length;
      else if (core.length >= 5 && !STOP.has(core.toLowerCase())) score = core.length;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    if (best < 0) return { front: text, answer: '' };
    const p = parts[best];
    const m = p.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9%]*)$/);
    const answer = m[2];
    const front = parts.map((x, i) => (i === best ? esc(m[1]) + '<span class="blank">_____</span>' + esc(m[3]) : esc(x))).join('');
    const back = parts.map((x, i) => (i === best ? esc(m[1]) + '<mark>' + esc(answer) + '</mark>' + esc(m[3]) : esc(x))).join('');
    return { front, back, answer };
  }
  // Front of a recall card: the unit's prompt, or a cloze of its text when there is no prompt.
  function recallFront(u) {
    if (u.prompt && u.prompt.trim()) return { html: esc(u.prompt), kind: 'prompt', back: esc(u.text) };
    const c = cloze(u.text);
    return { html: c.front, kind: 'cloze', back: c.back || esc(u.text) };
  }
  function leitner(uid, knew) {
    const S = T(); const now = Date.now();
    const r = S.rc[uid] || { b: 0, d: 0, m: 0 };
    if (knew) {
      if (!(r.n && r.d > now)) r.b = Math.min(LEITNER.length - 1, (r.b || 0) + 1); // no double promotion before the card is due
      r.m = 0;
    } else { r.b = 0; r.m = 1; }
    r.d = now + LEITNER[r.b] * DAY;
    r.n = (r.n || 0) + 1; r.t = now;
    S.rc[uid] = r; save();
    return r;
  }
  function unitStatus(D, u, S) {
    S = S || T();
    const rc = S.rc[u.id];
    const qs = (D.uq.get(u.id) || []).filter(id => !D.q.get(id).reserved);
    if ((rc && rc.m) || qs.some(id => S.q[id] && S.q[id].m)) return 'shaky';
    if ((rc && rc.b >= 2) || (qs.length && qs.every(id => S.q[id] && S.q[id].r && !S.q[id].m))) return 'known';
    return 'new';
  }
  function lessonStatus(S, l) { const r = S.ls[l.id] || {}; return r.passed ? 'passed' : r.read ? 'read' : 'new'; }
  function lessonBadge(s) { return s === 'passed' ? '<span class="badge green">Checkpoint passed</span>' : s === 'read' ? '<span class="badge blue">Read</span>' : '<span class="badge">New</span>'; }
  const lessonMinutes = l => Math.max(1, Math.ceil(l.units.length * 0.25));
  function unitHTML(D, u, o) {
    o = o || {};
    const S = T();
    const lesson = D.l.get(D.unitLesson.get(u.id));
    const nq = (D.uq.get(u.id) || []).length;
    const bits = [];
    if (u.src) bits.push(`<span>${esc(u.src)}</span>`);
    if (o.meta) {
      bits.push(`<span>${nq ? plural(nq, 'linked question') : 'No linked questions yet'}</span>`);
      if (lesson) bits.push(`<a href="${link(D.id, 'learn', lesson.id)}">${esc(lesson.title)}</a>`);
    }
    return `<article class="unit"><div class="unit-meta">${tagChip(u.tag)}${u.delta ? '<span class="chip chip-delta">Changed in 2025</span>' : ''}${o.status ? statusBadge(unitStatus(D, u, S)) : ''}</div>`
      + `<p class="unit-text">${esc(u.text)}</p>${u.trap ? `<p class="trap"><b>Trap:</b> ${esc(u.trap)}</p>` : ''}`
      + (bits.length ? `<p class="unit-foot">${bits.join('<span aria-hidden="true"> · </span>')}</p>` : '') + '</article>';
  }
  function announce(msg) { const el = $('live'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); }
  // Inline confirmation: replaces a container's content with a question and two buttons. No browser dialogs.
  function confirmInline(box, question, yesLabel, onYes, danger) {
    const prev = box.innerHTML;
    box.innerHTML = `<div class="confirm-inline" role="group" aria-label="Confirm"><p>${question}</p><div class="actions"><button type="button" class="btn${danger ? ' danger-btn' : ''}" data-yes>${yesLabel}</button><button type="button" class="btn secondary" data-no>Cancel</button></div></div>`;
    const no = box.querySelector('[data-no]');
    box.querySelector('[data-yes]').onclick = onYes;
    no.onclick = () => { box.innerHTML = prev; if (box._rebind) box._rebind(); const f = box.querySelector('button, a'); if (f) f.focus(); };
    box.querySelector('[data-yes]').addEventListener('click', () => setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) { const f = document.querySelector('main h1, main h2'); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } } }, 0));
    box.querySelector('[data-yes]').focus();
  }

  /* ---------- storage ---------- */
  let store = { v: 1, last: null, t: {} };
  let canSave = true;
  function freshTrack() { return { plan: { date: '', min: 20 }, mode: 'pass', q: {}, rc: {}, ls: {}, sims: [], exp: {}, sim: null, drill: null, best: {} }; }
  function normTrack(t) {
    const f = freshTrack();
    if (!isObj(t)) return f;
    if (isObj(t.plan)) { f.plan.date = typeof t.plan.date === 'string' ? t.plan.date : ''; f.plan.min = Number(t.plan.min) > 0 ? Number(t.plan.min) : 20; if (t.plan.confirm === true) f.plan.confirm = true; }
    if (isObj(t.day) && typeof t.day.d === 'string') f.day = { d: t.day.d, n: +t.day.n || 0, secs: +t.day.secs || 0, done: !!t.day.done };
    if (MODES.some(m => m[0] === t.mode)) f.mode = t.mode;
    ['q', 'rc', 'ls', 'exp', 'best'].forEach(k => { if (isObj(t[k])) f[k] = t[k]; });
    // Nested records are checked too: one bad record from an old or hand-edited backup must not break a page for good.
    ['q', 'rc', 'ls', 'exp', 'best'].forEach(k => { for (const id of Object.keys(f[k])) if (k === 'exp' ? !Number.isFinite(+f[k][id]) : !isObj(f[k][id]) && typeof f[k][id] !== 'string') delete f[k][id]; });
    if (Array.isArray(t.sims)) f.sims = t.sims.filter(x => isObj(x) && Number.isFinite(+x.pct) && Number.isFinite(+x.total)).map(x => Object.assign({}, x, { pct: +x.pct, total: +x.total, dom: isObj(x.dom) ? x.dom : {}, miss: Array.isArray(x.miss) ? x.miss.filter(Array.isArray) : [] }));
    if (isObj(t.sim) && Array.isArray(t.sim.items)) {
      const items = t.sim.items.filter(i => isObj(i) && typeof i.q === 'string' && Array.isArray(i.o));
      if (items.length && Number.isFinite(+t.sim.end)) f.sim = Object.assign({}, t.sim, { items, cur: Math.min(Math.max(0, +t.sim.cur || 0), items.length - 1), end: +t.sim.end });
    }
    if (isObj(t.drill) && Array.isArray(t.drill.queue)) f.drill = Object.assign({}, t.drill, { queue: t.drill.queue.filter(x => typeof x === 'string') });
    // sync.js stamps: when the study window or mode last changed, and when this track was last reset
    if (Number(t.planAt) > 0) f.planAt = Number(t.planAt);
    if (Number(t.resetAt) > 0) f.resetAt = Number(t.resetAt);
    return f;
  }
  const validStore = s => isObj(s) && s.v === 1 && isObj(s.t);
  function normStore(s) {
    const out = { v: 1, last: isObj(s.last) ? s.last : null, t: {} };
    for (const tr of TRACKS) if (s.t[tr.id]) out.t[tr.id] = normTrack(s.t[tr.id]);
    // where each credential was last left, so switching exams comes back to the same page
    if (isObj(s.lastBy)) { out.lastBy = {}; for (const tr of TRACKS) { const r = s.lastBy[tr.id]; if (typeof r === 'string' && new RegExp('^#/' + tr.id + '/[a-z]+$').test(r)) out.lastBy[tr.id] = r; } }
    if (Number(s.setup) > 0) out.setup = Number(s.setup);
    if (isObj(s.imported)) { out.imported = {}; for (const [k, v] of Object.entries(s.imported)) if (Number(v) > 0) out.imported[k] = Number(v); }
    if (TRACKS.some(t => t.id === s.lastTrack)) out.lastTrack = s.lastTrack;
    return out;
  }
  function initStorage() {
    try { localStorage.setItem('vel-probe', '1'); localStorage.removeItem('vel-probe'); } catch (e) { canSave = false; return; }
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { canSave = false; return; }
    if (raw) {
      let ok = false;
      try { const s = JSON.parse(raw); if (validStore(s)) { store = normStore(s); ok = true; } } catch (e) { /* unreadable */ }
      if (!ok) { try { localStorage.setItem(KEY + '-unreadable-' + Date.now(), raw); } catch (e) { /* keep going */ } } // keep the raw copy instead of silently overwriting it
    }
    // Pick up saves from other tabs. The track this tab is working in is only replaced when no question is on screen.
    window.addEventListener('storage', e => {
      if (e.key !== KEY || !e.newValue) return;
      let s; try { s = JSON.parse(e.newValue); } catch (err) { return; }
      if (!validStore(s)) return;
      const next = normStore(s), busy = !!document.querySelector('.question-panel, .flashcard, .quiz-wrap');
      for (const tr of TRACKS) { if (tr.id === V.cur && busy) continue; if (next.t[tr.id]) store.t[tr.id] = next.t[tr.id]; }
      if (V.cur && !busy && V.rerender) V.rerender();
    });
  }
  // Another tab may have saved since this one loaded. Write only the tracks this tab changed and keep the rest from disk,
  // so two open tabs never wipe each other's progress.
  function mergeDisk(changed) {
    let disk = null;
    try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (validStore(s)) disk = normStore(s); } } catch (e) { /* unreadable: ours wins */ }
    if (!disk) return;
    for (const tr of TRACKS) if (!changed.includes(tr.id) && disk.t[tr.id]) store.t[tr.id] = disk.t[tr.id];
    if (disk.setup && !store.setup) store.setup = disk.setup;
    if (disk.imported) store.imported = Object.assign({}, disk.imported, store.imported);
    if (disk.lastTrack && !store.lastTrack) store.lastTrack = disk.lastTrack;
    if (disk.lastBy) store.lastBy = Object.assign({}, disk.lastBy, store.lastBy);
  }
  let saveFails = 0;
  function save(all) {
    const changed = all === true ? TRACKS.map(t => t.id) : all === 'nav' ? [] : V.cur ? [V.cur] : [];
    if (canSave) {
      mergeDisk(changed.length ? changed : (V.cur ? [V.cur] : []));
      try { localStorage.setItem(KEY, JSON.stringify(store)); saveFails = 0; } catch (e) { if (++saveFails >= 3) { canSave = false; storageNote(); } }
    }
    if (all !== 'nav' && typeof V.onSave === 'function') { try { V.onSave(all === true ? TRACKS.map(t => t.id) : [V.cur]); } catch (e) { /* sync is optional */ } }
  }
  // sync.js: read a track's raw state, or replace it with a server copy (normalized like a restore)
  function getTrack(id) { return store.t[id] || null; }
  function setTrack(id, data) { if (!TRACKS.some(t => t.id === id)) return; store.t[id] = normTrack(data); if (canSave) { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } } }
  // sync.js, when a different seat signs in on this device: swap the whole store (null = start fresh); returns the old one
  function swapStore(next) { const old = store; store = next && validStore(next) ? normStore(next) : { v: 1, last: store.last, t: {} }; if (canSave) { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } } return old; }
  function storageNote() {
    const el = $('storage-alert');
    if (!el) return;
    el.hidden = canSave;
    if (!canSave) el.innerHTML = '<p>Saving is not available in this browser, so progress lasts only until this page closes. Use Progress, Copy backup to keep it.</p>';
  }
  function T(id) { id = id || V.cur; if (!store.t[id]) store.t[id] = freshTrack(); return store.t[id]; }

  /* ---------- data ---------- */
  function prep(b) {
    const tr = b.track || {};
    const doms = (tr.domains || []).map(d => ({ name: d[0], w: Number(d[1]) || 0 }));
    const qs = Array.isArray(b.questions) ? b.questions.filter(q => q && q.id && Array.isArray(q.options) && q.options.length >= 2) : [];
    const units = Array.isArray(b.units) ? b.units.filter(u => u && u.id && u.text) : [];
    const known = new Set(doms.map(d => d.name));
    qs.map(q => q.domain).concat(units.map(u => u.dom), (b.lessons || []).map(l => l && l.dom)).forEach(n => {
      if (n && !known.has(n)) { known.add(n); doms.push({ name: n, w: 0 }); }
    });
    const D = { id: b.id, b, track: tr, doms, qs, units, q: new Map(), u: new Map(), l: new Map(), uq: new Map(), qu: new Map(), unitLesson: new Map(), lessonQs: new Map() };
    D.domIdx = new Map(doms.map((d, i) => [d.name, i]));
    const di = n => (D.domIdx.has(n) ? D.domIdx.get(n) : 999);
    units.forEach(u => D.u.set(u.id, u));
    qs.forEach(q => { D.q.set(q.id, q); D.qu.set(q.id, []); });
    const addLink = (qid, uid) => {
      if (!D.q.has(qid) || !D.u.has(uid)) return;
      const a = D.qu.get(qid); if (!a.includes(uid)) a.push(uid);
      if (!D.uq.has(uid)) D.uq.set(uid, []);
      const b2 = D.uq.get(uid); if (!b2.includes(qid)) b2.push(qid);
    };
    qs.forEach(q => (q.units || []).forEach(uid => addLink(q.id, uid)));
    units.forEach(u => (u.qs || []).forEach(qid => addLink(qid, u.id)));
    D.pool = qs.filter(q => !q.reserved);
    D.lessons = (Array.isArray(b.lessons) ? b.lessons : []).filter(l => l && l.id).map(l => Object.assign({}, l, { units: (l.units || []).filter(id => D.u.has(id)) }))
      .filter(l => l.units.length).sort((a, c) => di(a.dom) - di(c.dom) || (a.order || 0) - (c.order || 0));
    D.lessons.forEach((l, i) => { l.idx = i; D.l.set(l.id, l); l.units.forEach(uid => { if (!D.unitLesson.has(uid)) D.unitLesson.set(uid, l.id); }); });
    units.forEach(u => { if (u.lesson && D.l.has(u.lesson) && !D.unitLesson.has(u.id)) D.unitLesson.set(u.id, u.lesson); });
    D.lessons.forEach(l => {
      const set = new Set();
      l.units.forEach(uid => (D.uq.get(uid) || []).forEach(qid => { if (!D.q.get(qid).reserved) set.add(qid); }));
      D.lessonQs.set(l.id, [...set]);
    });
    D.oblig = units.filter(u => OBLIG.includes(u.tag));
    D.nums = units.filter(u => u.num && u.num.q && u.num.a && Array.isArray(u.num.d) && u.num.d.length);
    D.seqs = (Array.isArray(b.sequences) ? b.sequences : []).filter(s => s && Array.isArray(s.steps) && s.steps.length >= 2);
    const sd = doms.find(d => /mechanical|hvac system/i.test(d.name));
    D.sysDom = sd ? sd.name : null;
    return D;
  }
  V.bundles = {}; V.data = {}; V.views = {};
  const pending = {};
  V.register = function (id, bundle) {
    try { V.bundles[id] = bundle; V.data[id] = prep(bundle); } catch (e) { V.loadError = e; }
  };
  function loadTrack(id) {
    if (V.data[id]) return Promise.resolve();
    if (pending[id]) return pending[id];
    pending[id] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'data/' + id + '.js';
      s.async = true;
      s.onload = () => { delete pending[id]; V.data[id] ? resolve() : (s.remove(), reject(new Error('The data file loaded but did not register.'))); };
      s.onerror = () => { delete pending[id]; s.remove(); reject(new Error('The data file could not be loaded.')); };
      document.head.appendChild(s);
    });
    return pending[id];
  }

  /* ---------- shell and routing ---------- */
  let main;
  const cleanups = [];
  V.onLeave = fn => cleanups.push(fn);
  function runCleanup() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* ignore */ } } }
  function parse() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { track: parts[0], view: parts[1], args: parts.slice(2) };
  }
  function homeTrack() {
    const l = store.lastTrack || (store.last && store.last.track);
    return TRACKS.some(t => t.id === l) ? l : 'ascs';
  }
  V.homeTrack = homeTrack;
  function hasWork(S) { return !!S && (Object.keys(S.q || {}).length || (S.sims || []).length || Object.keys(S.ls || {}).length || Object.keys(S.rc || {}).length || (S.plan && S.plan.date)); }
  const anyWork = () => TRACKS.some(t => hasWork(store.t[t.id]));
  // track: a credential id, or null for the setup page. view: a view name, or 'field' with sub = the field tool.
  function renderShell(track, view, sub) {
    const D = track && V.data[track];
    const base = TRACKS.find(t => t.id === track);
    const meta = base ? (D ? Object.assign({}, base, D.track) : base) : null;
    $('track-picker').innerHTML = TRACKS.map(t => {
      const m = V.data[t.id] ? Object.assign({}, t, V.data[t.id].track) : t;
      return `<button type="button" class="track-button${t.id === track ? ' active' : ''}" data-track="${t.id}" aria-pressed="${t.id === track}"><b>${esc(m.code)}</b><span>${esc(m.kind)}</span></button>`;
    }).join('');
    const nav = $('nav');
    document.body.classList.toggle('no-nav', !meta);
    if (!meta) {
      nav.innerHTML = '';
      $('ctx-name').textContent = 'DuctStudy';
      document.title = 'Get started · DuctStudy';
      document.querySelector('.brand').setAttribute('href', '#/');
      return;
    }
    const tab = view === 'field' ? 'practice' : tabOf(view);
    nav.innerHTML = NAV.map(([id, label]) => `<a href="${link(track, id)}" data-tab="${id}"${id === tab ? ` class="active"${id === view ? ' aria-current="page"' : ''}` : ''}><svg class="tab-ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg><span>${label}</span></a>`).join('');
    $('ctx-name').textContent = view === 'field' ? 'Field training' : meta.name;
    const fieldName = view === 'field' ? (sub ? ((V.field.TOOLS.find(t => t.id === sub) || {}).title || 'Field training') : 'Field training') : '';
    document.title = (view === 'field' ? fieldName + ' · ' : (VIEW_NAME[view] ? VIEW_NAME[view] + ' · ' : '') + meta.code + ' · ') + 'DuctStudy';
    document.querySelector('.brand').setAttribute('href', link(track, 'today'));
  }
  let lastHash = null;
  async function route() {
    if (location.hash.startsWith('#import=')) { await importHash().catch(() => {}); }
    const r = parse();
    if (r.track === 'field' && V.field) {
      runCleanup();
      V.keys = null;
      V.cur = null; // no credential is active, so sync has nothing to reconcile here
      renderShell(homeTrack(), 'field', r.view || '');
      store.last = { track: 'field', route: r.view ? link('field', r.view) : link('field') };
      save('nav');
      const moved = location.hash !== lastHash, initial = lastHash === null;
      lastHash = location.hash;
      try { V.field.render(r.view || ''); } catch (e) { console.error(e); main.innerHTML = empty('Something went wrong on this page.', esc(e.message), `<a class="btn" href="${link('field')}">All field training</a>`); }
      const fw = r.view && main.querySelector('.field-frame-wrap');
      if (fw && moved) { main.focus({ preventScroll: true }); fw.scrollIntoView({ block: 'start' }); } // the job goes edge to edge in the viewport
      else if (moved && !initial) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
      return;
    }
    if (r.track === 'library') {
      runCleanup(); V.keys = null; V.cur = null;
      renderShell(homeTrack(), 'field', '');
      document.title = 'More training · DuctStudy';
      $('ctx-name').textContent = 'More training';
      lastHash = location.hash;
      libraryView();
      window.scrollTo(0, 0);
      return;
    }
    if (r.track === 'setup') {
      runCleanup(); V.keys = null; V.cur = null;
      renderShell(null);
      lastHash = location.hash;
      setupView();
      return;
    }
    const track = TRACKS.some(t => t.id === r.track) ? r.track : null;
    if (!track) {
      if (!store.setup && !store.last && !anyWork()) { location.replace('#/setup'); return; }
      const last = store.last && store.last.route;
      location.replace(last && /^#\/((ascs|cvi|dvt)\/[a-z]+|field(\/[a-z-]+)?)$/.test(last) ? last : '#/ascs/today');
      return;
    }
    const view = V.views[r.view] ? r.view : null;
    if (!view) { location.replace(link(track, 'today')); return; }
    runCleanup();
    V.keys = null;
    V.cur = track;
    renderShell(track, view);
    if (!V.data[track]) {
      main.innerHTML = `<div class="loading" role="status">Loading ${esc(TRACKS.find(t => t.id === track).code)} study data…</div>`;
      try { await loadTrack(track); } catch (e) {
        if (parse().track !== track) return;
        main.innerHTML = empty('The study data did not load.', esc(e.message) + ' Check the connection and try again.', '<button type="button" class="btn" id="retry">Try again</button>');
        $('retry').onclick = route;
        return;
      }
      if (parse().track !== track || parse().view !== r.view) return;
      renderShell(track, view);
    }
    const D = V.data[track];
    if (view === 'lab' && !D.sysDom) { location.replace(link(track, 'today')); return; }
    store.last = { track, route: link(track, view) };
    store.lastTrack = track;
    store.lastBy = Object.assign({}, store.lastBy, { [track]: link(track, view) });
    save('nav');
    const moved = location.hash !== lastHash, initial = lastHash === null;
    lastHash = location.hash;
    try { V.views[view](D, r.args); } catch (e) {
      console.error(e);
      main.innerHTML = empty('Something went wrong on this page.', esc(e.message), `<a class="btn" href="${link(track, 'today')}">Back to Today</a>`);
    }
    if (moved && !initial) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); } // first load keeps focus at the top so the skip link is the first tab stop
  }
  V.rerender = function () { const r = parse(); const D = V.data[V.cur]; if (D && V.views[r.view]) { runCleanup(); V.keys = null; V.views[r.view](D, r.args); } };
  V.go = function (...segs) { location.hash = link(...segs); };

  /* ---------- shared study math ---------- */
  function poolStats(D, S, filter) {
    let n = 0, retired = 0, miss = 0, unseen = 0, seen = 0, c = 0, w = 0;
    for (const q of D.pool) {
      if (filter && !filter(q)) continue;
      n++;
      const r = S.q[q.id];
      if (r && r.r) retired++;
      if (r && r.m) miss++;
      if (!r || !r.n) unseen++; else seen++;
      if (r) { c += r.c || 0; w += r.w || 0; }
    }
    return { n, retired, miss, unseen, seen, c, w, left: n - retired };
  }
  function daysLeft(S) {
    if (!S.plan.date) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(S.plan.date);
    if (!m) return null;
    const exam = new Date(+m[1], +m[2] - 1, +m[3]);
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((exam - today) / DAY);
  }
  V.drillSize = min => Math.max(5, Math.round((min * 60) / SEC_PER_Q));
  function simLengths(D) { const s = (D.track.sims || []).filter(x => Array.isArray(x) && Number(x[0]) > 0); return s.length ? s : [[Math.min(30, D.qs.length || 30), 'Quick check']]; }
  function fullLength(D) { const s = simLengths(D); const e = D.track.exam || {}; return (s.find(x => Number(x[0]) === Number(e.questions)) || s.find(x => /full/i.test(x[1])) || s[s.length - 1]); }
  function readiness(D, S) {
    const quick = Number(simLengths(D)[0][0]);
    const full = Number(fullLength(D)[0]);
    const cut = Number((D.track.exam || {}).cut) || 0;
    let run = 0, stepOne = false, stepTwo = false, bestRun = 0;
    for (const s of S.sims) {
      if (s.total === quick && quick !== full) { run = s.pct >= 85 ? run + 1 : 0; bestRun = Math.max(bestRun, run); if (run >= 2) stepOne = true; }
      if (s.total === full && stepOne && s.pct >= cut) stepTwo = true;
      if (quick === full && s.total === full) { run = s.pct >= 85 ? run + 1 : 0; bestRun = Math.max(bestRun, run); if (run >= 2) stepOne = true; }
    }
    return { quick, full, cut, run, stepOne, stepTwo, bestRun: Math.min(2, bestRun) };
  }
  function readyHTML(D, S) {
    const r = readiness(D, S), one = r.quick === r.full;
    const steps = [
      [r.stepOne, `Two ${r.quick}-question sims in a row at 85% or better`, r.stepOne ? '' : `${r.run} of 2 so far`],
      [r.stepTwo, one ? `The second one also at ${r.cut}% or better` : `Then one ${r.full}-question sim at ${r.cut}% or better`, '']
    ];
    return `<section class="panel ready-panel" id="ready"><div class="row-between"><h2>When you’re ready</h2><a class="small" href="${link(D.id, 'sim')}">Exam sims</a></div>`
      + `<ol class="checklist">${steps.map(([ok, t, n]) => `<li class="${ok ? 'ok' : ''}"><span class="ck" aria-hidden="true">${ok ? '✓' : ''}</span><span>${t}${n ? ` <small class="muted">${n}</small>` : ''}<span class="sr">${ok ? '. Done.' : '. Not done yet.'}</span></span></li>`).join('')}</ol>`
      + (r.stepTwo ? '<p class="small space-sm"><b class="ok">You met the bar. Book the exam.</b></p>' : '<p class="small muted space-sm">Sims use questions the drill never shows you, so a pass here means something.</p>') + '</section>';
  }

  /* ---------- Today ---------- */
  V.views.today = function (D) {
    const S = T(), tr = D.track, id = D.id;
    const ps = poolStats(D, S);
    const last = S.sims[S.sims.length - 1];
    const dl = daysLeft(S);
    const cut = Number((tr.exam || {}).cut) || 0;
    const planL = link(id, 'progress', 'plan');
    const bits = [
      dl == null ? `<a href="${planL}">Set your exam date</a>` : dl < 0 ? `<a href="${planL}">Exam date passed. Set the next one</a>` : dl === 0 ? '<b>Exam day</b>' : `<b>${plural(dl, 'day')}</b> to the exam`,
      `<b>${ps.retired}</b> of ${ps.n} mastered`,
      last ? `last sim <b class="${last.pct >= cut ? 'ok' : 'bad'}">${last.pct}%</b>` : 'no sim yet',
      `<a href="${planL}">${S.plan.min} min a day</a>`
    ];
    const status = `<span class="status-line">${bits.join('<span class="dot" aria-hidden="true"> · </span>')}</span>`;
    const welcome = !store.setup && !hasWork(S) ? `<div class="note blue space-b welcome"><p><b>New here?</b> Pick your exam, date, and minutes a day. It takes 30 seconds and sizes every drill.</p><div class="actions space-sm"><a class="btn small" href="#/setup">Set up my plan</a></div></div>` : '';
    const modeTabs = `<div class="mode-switch" role="group" aria-label="Study mode">${MODES.map(([m, t, s]) => `<button type="button" data-mode="${m}" class="${S.mode === m ? 'active' : ''}" aria-pressed="${S.mode === m}"><b>${t}</b><span>${s}</span></button>`).join('')}</div>`;
    const pairs = V.field ? V.field.TOOLS.filter(t => t.pairs[0] === id) : [];
    const ft = pairs[0];
    const field = ft ? `<section class="panel field-callout space-lg"><div><p class="eyebrow">Field training · ${esc(ft.kind)}</p><h2>${esc(ft.title)}</h2><p class="muted">${esc(ft.blurb)}</p></div><div class="actions"><a class="btn secondary" href="${link('field', ft.id)}">Open ${esc(ft.title)}</a><a class="btn text" href="${link(id, 'practice')}">More in Practice</a></div></section>` : '';
    const note = V.importNote; V.importNote = '';
    main.innerHTML = head(`${esc(tr.code)} / Today`, esc(TITLES[id] || 'Make today’s study count.'), status, '', 'today-head')
      + (note ? `<div class="note blue space-b" role="status"><p>${esc(note)}</p></div>` : '') + welcome + modeTabs
      + `<section class="panel hero-panel" id="hero">${heroHTML(D, S, ps, dl)}</section>`
      + readyHTML(D, S) + field + '<div id="save-nudge"></div>';
    main.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; S.planAt = Date.now(); save(); V.rerender(); const f = main.querySelector(`[data-mode="${S.mode}"]`); if (f) f.focus(); });
    // Once there is something worth keeping and no account, offer one line to sign in. Never before the first answer.
    if (V.account && !V.account.signedIn() && hasWork(S)) V.account.ready().then(() => {
      const box = $('save-nudge');
      if (!box || !V.account.canSignIn() || V.account.signedIn()) return;
      box.innerHTML = `<section class="panel field-callout space-lg save-nudge"><div><p class="eyebrow">Save your progress</p><h2>Keep this on every device.</h2><p class="muted">It saves in this browser now. Sign in and it saves to your account too, and everything you have done comes with you.</p></div><a class="btn" href="${esc(V.account.href())}">Sign in with Google</a></section>`;
    });
    const sz = $('size-up');
    if (sz) sz.onclick = () => { S.plan.min = Number(sz.dataset.min); S.planAt = Date.now(); save(); V.rerender(); const h = $('hero'); if (h) { h.tabIndex = -1; h.focus(); } announce(`Plan set to ${S.plan.min} minutes a day.`); };
  };
  function heroHTML(D, S, ps, dl) {
    const id = D.id, tr = D.track;
    const btn = (href, label) => `<a class="btn primary" href="${href}">${label}</a>`;
    if (S.mode === 'understand') {
      if (!D.lessons.length) return `<p class="eyebrow">Lessons</p><h2>Lessons are on the way.</h2><p>The ${esc(tr.code)} lessons are still being written. Every question already has an explanation, so the drill teaches as you go.</p>${btn(link(id, 'drill'), 'Open the drill')}`;
      const next = D.lessons.find(l => lessonStatus(S, l) === 'new');
      if (next) return `<p class="eyebrow">Next lesson · ${esc(next.dom)}</p><h2>${esc(next.title)}</h2><p>${esc(next.intro || `${plural(next.units.length, 'fact')} from ${next.dom}.`)} About ${lessonMinutes(next)} min.</p>${btn(link(id, 'learn', next.id), 'Read the lesson')}`;
      const chk = D.lessons.find(l => lessonStatus(S, l) === 'read');
      if (chk) return `<p class="eyebrow">All lessons read</p><h2>Pass the checkpoint for ${esc(chk.title)}.</h2><p>You have read every lesson. Checkpoints confirm you can use what you read.</p>${btn(link(id, 'learn', chk.id, 'check'), 'Start checkpoint')}`;
      return `<p class="eyebrow">Course complete</p><h2>Every checkpoint passed.</h2><p>Keep it fresh with recall cards and a sim.</p>${btn(link(id, 'games', 'recall'), 'Recall cards')}`;
    }
    if (S.mode === 'master') {
      if (!D.units.length) return `<p class="eyebrow">Recall cards</p><h2>Facts are on the way.</h2><p>Recall cards and checkpoints are built from ${esc(tr.code)} facts, which are still being written. Drill the question bank for now.</p>${btn(link(id, 'drill'), 'Open the drill')}`;
      const now = Date.now();
      const due = D.units.filter(u => S.rc[u.id] && S.rc[u.id].d <= now).length;
      const fresh = D.units.filter(u => !S.rc[u.id]).length;
      if (due) return `<p class="eyebrow">Recall cards</p><h2>${plural(due, 'recall card')} due.</h2><p>Say the answer before you flip. Knew it moves a card to a longer interval; missed it brings it back today.</p>${btn(link(id, 'games', 'recall'), 'Review due cards')}`;
      const chk = D.lessons.find(l => lessonStatus(S, l) === 'read') || D.lessons.find(l => lessonStatus(S, l) === 'new');
      if (chk) return `<p class="eyebrow">Next checkpoint</p><h2>${esc(chk.title)}</h2><p>No cards are due. Pass this lesson’s checkpoint to lock in its ${plural(chk.units.length, 'fact')}.</p><div class="actions">${btn(link(id, 'learn', chk.id, 'check'), 'Start checkpoint')}${fresh ? `<a class="btn light-text" href="${link(id, 'games', 'recall')}">Recall cards (${fresh} new)</a>` : ''}</div>`;
      return `<p class="eyebrow">Recall cards</p><h2>Nothing due right now.</h2><p>${fresh ? `${plural(fresh, 'fact')} not yet carded.` : 'Every fact is on a schedule.'}</p>${btn(link(id, 'games', 'recall'), 'Recall cards')}`;
    }
    if (!ps.n) return `<p class="eyebrow">Practice</p><h2>No practice questions yet.</h2><p>There are no practice questions for this credential.</p>`;
    const sims = simLengths(D);
    if (S.drill && !S.drill.done && S.drill.queue && S.drill.queue.length) {
      const d = S.drill;
      return `<p class="eyebrow">Drill in progress</p><h2>${esc(d.label || 'Your drill')}: ${d.n} of ${d.total} answered.</h2><p>Pick up where you left off.</p><div class="actions">${btn(link(id, 'drill'), 'Resume the drill')}<a class="btn text" href="${link(id, 'drill', 'today')}">Start today’s drill instead</a></div>`;
    }
    // Right after a sim, its misses are the best use of the next ten minutes.
    const li = S.sims.length - 1, last = S.sims[li];
    if (last && (last.miss || []).length && Date.now() - (+last.ts || 0) < 3 * DAY) {
      const since = Object.values(S.q).some(r => r && +r.t > +last.ts);
      if (!since) return `<p class="eyebrow">After your sim</p><h2>Drill what you missed: ${plural(last.miss.length, 'question')}.</h2><p>You scored ${last.pct}% on ${last.total} questions. The drill pulls practice questions on the same facts, so the sim stays fresh.</p><div class="actions">${btn(link(id, 'drill', 'sim', li), 'Drill my sim misses')}<a class="btn text" href="${link(id, 'sim', 'report', li)}">See the sim report</a></div>`;
    }
    const dy = S.day && S.day.d === todayISO() ? S.day : null;
    if (dy && dy.done) {
      const mins = Math.max(1, Math.round((+dy.secs || 0) / 60));
      return `<p class="eyebrow">Done for today</p><h2>${plural(+dy.n || 0, 'question')} in ${plural(mins, 'minute')}. That’s the day.</h2><p>Misses you have not fixed come back tomorrow. Want more? A sim or a game round does not touch tomorrow’s drill.</p><div class="actions">${btn(link(id, 'sim'), `Take a ${sims[0][0]}-question sim`)}<a class="btn secondary" href="${link(id, 'games')}">Play a game</a></div>`;
    }
    if (ps.retired / ps.n >= 0.8 || ps.left === 0) {
      return `<p class="eyebrow">Ready to check</p><h2>Take a ${sims[0][0]}-question sim.</h2><p>You have mastered ${pct(ps.retired, ps.n)}% of the drill questions. A sim uses questions the drill never shows and scores you against the ${esc(String((tr.exam || {}).cut || ''))}% line.</p><div class="actions">${btn(link(id, 'sim'), 'Start a sim')}${ps.miss ? `<a class="btn text" href="${link(id, 'drill', 'misses')}">Drill ${plural(ps.miss, 'miss', 'misses')}</a>` : ''}</div>`;
    }
    const plan = V.todayPlan(D);
    const title = plan.miss.length ? `${plan.fresh.length} new + ${plural(plan.miss.length, 'miss', 'misses')}.` : `${plural(plan.fresh.length, 'new question')}.`;
    let size = '';
    if (dl != null && dl > 0) {
      const need = Math.ceil(ps.left / dl), cap = V.drillSize(S.plan.min);
      if (need > cap) {
        const m = MINUTES.find(x => x > S.plan.min && V.drillSize(x) >= need);
        size = `<div class="size-offer"><p>To get through the bank by your exam you need about <b>${need} a day</b>. ${S.plan.min} minutes covers about ${cap}.</p>${m ? `<button type="button" class="btn secondary small" id="size-up" data-min="${m}">Switch to ${m} min a day</button>` : '<p class="small muted">Lean on misses and sims to close the gap.</p>'}</div>`;
      }
    }
    return `<p class="eyebrow">Today’s drill · about ${S.plan.min} min</p><h2>${title}</h2><p>Right on first sight masters a question. A miss comes back until you get it twice in a row.</p>${btn(link(id, 'drill', 'today'), 'Start today’s drill')}<p class="under-note">${ps.left} of ${ps.n} questions left to master.</p>${size}`;
  }
  const wPub = D => ((D.track || {}).exam || {}).weightsPublished !== false;
  const ePub = D => ((D.track || {}).exam || {}).published !== false;
  function todayISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function windowOut(D, S) {
    const ps = poolStats(D, S), dl = daysLeft(S), cap = V.drillSize(S.plan.min);
    if (dl == null) return `Add an exam date to get a daily target. At ${S.plan.min} minutes a day you cover about ${cap} questions.`;
    if (dl < 0) return 'That date has passed. Set your next exam date.';
    if (dl === 0) return '<b>Exam day.</b> Keep it light: one short drill of your misses, then go take it.';
    const need = Math.ceil(ps.left / Math.max(1, dl));
    return `<b>${plural(dl, 'day')} left.</b> Master about <b>${need} a day</b> to clear the ${ps.left} questions left. At ${S.plan.min} minutes a day you cover about ${cap}.` + (need > cap ? ' Add minutes or lean on misses and sims.' : '');
  }
  function windowHTML(D, S) {
    return `<section class="panel window" id="plan"><h2>Your plan</h2><div class="field space"><label for="exam-date">Exam date <span class="muted">(optional)</span></label><input type="date" id="exam-date" min="${todayISO()}" value="${esc(S.plan.date)}"></div><div class="field space"><label for="exam-min">Minutes per day</label><select id="exam-min">${MINUTES.concat(MINUTES.includes(S.plan.min) ? [] : [S.plan.min]).sort((a, b) => a - b).map(m => `<option value="${m}"${m === S.plan.min ? ' selected' : ''}>${m} minutes</option>`).join('')}</select></div><p class="window-out" id="window-out" aria-live="polite">${windowOut(D, S)}</p><p class="under-note">Saved as you change it.</p></section>`;
  }
  function bindWindow(D, S) {
    const date = $('exam-date'), mins = $('exam-min');
    if (!date) return;
    const out = () => { const o = $('window-out'); if (o) o.innerHTML = windowOut(D, S); };
    // Chrome fires change on a partial year while typing, so a year before 2000 is ignored until it is whole.
    date.onchange = () => { const y = /^(\d{4})-\d{2}-\d{2}$/.exec(date.value); if (date.value && (!y || +y[1] < 2000)) return; S.plan.date = date.value; S.planAt = Date.now(); save(); out(); };
    date.onkeydown = e => { if (e.key === 'Enter') date.blur(); };
    mins.onchange = () => { S.plan.min = Number(mins.value) || 20; S.planAt = Date.now(); save(); out(); };
  }

  /* ---------- Practice ---------- */
  V.views.practice = function (D) {
    const S = T(), id = D.id, tr = D.track;
    const ps = poolStats(D, S);
    const open = S.drill && !S.drill.done && S.drill.queue && S.drill.queue.length;
    const now = Date.now(), due = D.units.filter(u => S.rc[u.id] && S.rc[u.id].d <= now).length;
    const drill = `<section class="panel practice-drill"><p class="eyebrow">Drill</p><h2>${open ? `${esc(S.drill.label || 'Your drill')}: ${S.drill.n} of ${S.drill.total} answered.` : 'Drill the question bank.'}</h2><p class="muted">${ps.retired} of ${ps.n} mastered${ps.miss ? ` · ${plural(ps.miss, 'open miss', 'open misses')}` : ''}.</p>`
      + `<div class="actions space">${open ? `<a class="btn" href="${link(id, 'drill')}">Resume the drill</a>` : `<a class="btn" href="${link(id, 'drill', 'today')}">Today’s drill</a>`}${ps.miss ? `<a class="btn secondary" href="${link(id, 'drill', 'misses')}">Misses only</a>` : ''}<a class="btn text" href="${link(id, 'drill', 'pick')}">Choose a drill…</a></div></section>`;
    const domRows = D.doms.filter(d => D.pool.some(q => q.domain === d.name)).map(d => {
      const st = poolStats(D, S, q => q.domain === d.name), p = pct(st.retired, st.n);
      return `<a class="domain-row" href="${link(id, 'drill', 'dom', d.name)}" aria-label="Drill ${esc(d.name)}, ${p}% mastered"><div class="row-between"><span class="title">${esc(d.name)}</span><span class="small num">${p}%</span></div><div class="bar"><i style="width:${p}%"></i></div><small>${st.retired} of ${st.n} mastered${d.w && wPub(D) ? ` · ${d.w}% of exam` : ''}${st.miss ? ` · ${plural(st.miss, 'miss', 'misses')}` : ''}</small></a>`;
    }).join('');
    const games = [['recall', 'Recall cards', due ? `${due} due` : 'Flip and rate'], ['oblig', 'Required or recommended', 'Obligation levels'], ['numbers', 'Numbers', 'Sizes, limits, counts'], ['order', 'Put it in order', 'Procedures']];
    const gamesP = `<section class="panel"><div class="row-between"><h2>Games</h2><a class="small" href="${link(id, 'games')}">All games</a></div><div class="tile-links">${games.map(([k, t, sub]) => `<a class="tile-link" href="${link(id, 'games', k)}"><b>${t}</b><small>${sub}</small></a>`).join('')}${D.sysDom ? `<a class="tile-link" href="${link(id, 'lab')}"><b>Systems lab</b><small>VAV, CAV, outdoor air</small></a>` : ''}</div></section>`;
    const tools = V.field ? V.field.TOOLS.filter(t => t.pairs.includes(id)) : [];
    const fieldP = tools.length ? `<section class="space-lg"><div class="section-heading"><h2>Field training for ${esc(tr.code)}</h2><a class="small" href="${link('field')}">All field training</a></div><div class="game-grid field-grid">${tools.map(t => `<a class="panel tool-card" href="${link('field', t.id)}"><p class="eyebrow">${esc(t.kind)}</p><h3>${esc(t.title)}</h3><p class="muted small">${esc(t.blurb)}</p><p class="small space-sm">${esc(V.field.scoreLine(t))}</p></a>`).join('')}</div></section>` : '';
    main.innerHTML = head(`${esc(tr.code)} / Practice`, 'Practice until it sticks.', 'Drill the bank, play short rounds on the facts, and run the job the exam describes.')
      + `<div class="grid top">${drill}<section class="panel"><div class="row-between"><h2>Drill one domain</h2><span class="small muted hint">Weakest first is a good habit</span></div><div class="domain-list">${domRows || '<p class="muted">No practice questions yet.</p>'}</div></section></div>`
      + `<div class="space-lg">${gamesP}</div>` + fieldP
      + `<section class="panel field-callout space-lg"><div><p class="eyebrow">More training</p><h2>EPA 608, forklift, the crew field guide, pricing.</h2><p class="muted">The rest of the CQA training shelf lives here too.</p></div><a class="btn secondary" href="#/library">Open more training</a></section>`;
  };

  /* ---------- First run ---------- */
  const SETUP_NOTE = { ascs: 'The core credential. Most people start here.', cvi: 'You need an active ASCS to sit the CVI. Study both here if you do not have it yet.', dvt: 'The dryer vent certificate. Shorter bank, heavy on code calls.' };
  function setupView() {
    const cur = homeTrack(), S0 = store.t[cur];
    const min0 = S0 && S0.plan && MINUTES.includes(S0.plan.min) ? S0.plan.min : 20;
    main.innerHTML = head('Get started', 'Set up your study plan.', 'Three picks and you are drilling. Change any of them later under Me.', '', 'setup-head')
      + `<form id="su" class="panel setup-form" novalidate>`
      + `<fieldset><legend><span class="step" aria-hidden="true">1</span>Which exam?</legend><div class="su-tracks">${TRACKS.map(t => `<label class="su-track"><input type="radio" name="su-track" value="${t.id}"${t.id === cur ? ' checked' : ''}><span><b>${t.code}</b><small>${esc(t.name)}</small></span></label>`).join('')}</div><p class="small muted space-sm" id="su-note" aria-live="polite"></p></fieldset>`
      + `<fieldset><legend><span class="step" aria-hidden="true">2</span>When is it?</legend><div class="field"><label for="su-date">Exam date <span class="muted">(leave blank if it is not booked)</span></label><input type="date" id="su-date" min="${todayISO()}" value="${esc(S0 && S0.plan ? S0.plan.date : '')}"></div></fieldset>`
      + `<fieldset><legend><span class="step" aria-hidden="true">3</span>How long a day?</legend><div class="su-mins">${MINUTES.filter(m => m <= 60).map(m => `<label class="chip-radio"><input type="radio" name="su-min" value="${m}"${m === min0 ? ' checked' : ''}><span>${m} min</span></label>`).join('')}</div><p class="small space-sm" id="su-out" aria-live="polite"></p></fieldset>`
      + `<div class="actions"><button type="submit" class="btn primary">Start my first drill</button><button type="button" class="btn text" id="su-skip">Skip, look around first</button></div><p class="small muted space" id="su-signin" hidden>Studied here on another device? <a href="#">Sign in with Google</a> and your progress comes back.</p></form>`;
    if (V.account) V.account.ready().then(() => { const p = $('su-signin'); if (p && V.account.canSignIn() && !V.account.signedIn()) { p.querySelector('a').href = V.account.href(); p.hidden = false; } });
    const f = $('su');
    const pick = () => ({ t: (f.querySelector('input[name=su-track]:checked') || {}).value || cur, min: Number((f.querySelector('input[name=su-min]:checked') || {}).value) || 20, date: $('su-date').value });
    const upd = () => {
      const p = pick();
      $('su-note').textContent = SETUP_NOTE[p.t] || '';
      const D = V.data[p.t], per = V.drillSize(p.min);
      if (!D) { $('su-out').textContent = `About ${per} questions a day.`; loadTrack(p.t).then(() => { if (parse().track === 'setup') upd(); }, () => {}); return; }
      const left = D.pool.length, days = Math.ceil(left / per);
      let out = `About ${per} questions a day. The ${D.track.code} bank has ${left} practice questions, so one pass takes about ${plural(days, 'day')}.`;
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.date);
      if (m) {
        const dl = Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - new Date(new Date().toDateString())) / DAY);
        if (dl > 0 && days > dl) {
          const need = MINUTES.find(x => V.drillSize(x) * dl >= left);
          out += need ? ` That runs past your exam. ${need} minutes a day gets through it in time.` : ' That runs past your exam, so lean on misses and sims.';
        } else if (dl > 0) out += ` That leaves ${plural(dl - days, 'day')} for sims and review before the exam.`;
      }
      $('su-out').textContent = out;
    };
    f.addEventListener('change', upd);
    $('su-date').addEventListener('input', upd);
    const commit = p => {
      const S = T(p.t);
      if (p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date)) S.plan.date = p.date;
      S.plan.min = p.min; S.planAt = Date.now();
      store.setup = Date.now(); store.lastTrack = p.t;
      V.cur = p.t; save();
    };
    f.onsubmit = e => { e.preventDefault(); const p = pick(); commit(p); V.ev('setup', p.t); location.hash = link(p.t, 'drill', 'today'); };
    $('su-skip').onclick = () => { const p = pick(); store.setup = Date.now(); store.lastTrack = p.t; save('nav'); location.hash = link(p.t, 'today'); };
    upd();
  }

  /* ---------- Learn ---------- */
  function subtabs(D, cur) {
    const tabs = [['learn', 'Lessons'], ['units', 'Facts'], ['sources', 'About the exam']];
    return `<nav class="subtabs" aria-label="Learn sections">${tabs.map(([v, t]) => `<a href="${link(D.id, v)}"${v === cur ? ' class="active" aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  }
  V.views.learn = function (D, args) {
    if (args[0] && args[1] === 'check') return V.checkpoint(D, args[0]);
    if (args[0]) return lessonPage(D, args[0]);
    const S = T(), id = D.id;
    const hd = head(`${esc(D.track.code)} / Learn`, 'Learn it once, properly.', 'Short lessons in exam order. Read one, then pass its checkpoint to lock it in.') + subtabs(D, 'learn');
    if (!D.lessons.length) {
      main.innerHTML = hd + empty(`No ${esc(D.track.code)} lessons yet.`, 'Lessons are being written from the standards and codes. The question bank is ready now, and every answer comes with an explanation.', `<a class="btn" href="${link(id, 'drill')}">Start drilling</a><a class="btn secondary" href="${link(id, 'sources')}">See the sources</a>`);
      return;
    }
    const groups = D.doms.map(d => ({ d, ls: D.lessons.filter(l => l.dom === d.name) })).filter(g => g.ls.length);
    const done = D.lessons.filter(l => lessonStatus(S, l) !== 'new').length, passed = D.lessons.filter(l => lessonStatus(S, l) === 'passed').length;
    main.innerHTML = hd
      + `<div class="panel learn-summary"><div><b>${done} of ${D.lessons.length}</b> lessons read · <b>${passed}</b> checkpoints passed</div><div class="bar"><i style="width:${pct(done, D.lessons.length)}%"></i></div><div class="field search-field space"><label for="ls-q">Find a topic</label><input type="search" id="ls-q" placeholder="Try: access door, filters, 4 feet" autocomplete="off"></div><p class="small" id="ls-count" role="status"></p>${groups.length > 1 ? `<div class="jump" aria-label="Jump to a domain">${groups.map(g => `<a href="javascript:void 0" data-jump="dom-${g.d.name.replace(/[^a-z0-9]+/gi, '-')}">${esc(g.d.name)}</a>`).join('')}</div>` : ''}</div>`
      + groups.map(g => `<section class="dom-section" id="dom-${g.d.name.replace(/[^a-z0-9]+/gi, '-')}"><div class="section-heading"><h2>${esc(g.d.name)}</h2><span class="small muted">${g.d.w && wPub(D) ? g.d.w + '% of exam · ' : ''}${plural(g.ls.length, 'lesson')}</span></div><div class="lesson-grid">${g.ls.map(l => { const st = lessonStatus(S, l); return `<a class="lesson-card st-${st}" data-lid="${esc(l.id)}" href="${link(id, 'learn', l.id)}"><span class="lc-top">${lessonBadge(st)}<small>${lessonMinutes(l)} min</small></span><h3>${esc(l.title)}</h3><small class="lc-meta">${plural(l.units.length, 'fact')}${(D.lessonQs.get(l.id) || []).length ? ' · ' + plural(D.lessonQs.get(l.id).length, 'question') : ''}</small></a>`; }).join('')}</div></section>`).join('');
    // Topic search: a lesson matches on its title, intro, or any of its facts. Facts that match are one tap away.
    const hay = new Map(D.lessons.map(l => [l.id, [l.title, l.intro || '', l.dom].concat(l.units.map(u => { const x = D.u.get(u); return x ? x.text + ' ' + (x.prompt || '') : ''; })).join(' ').toLowerCase()]));
    let tm;
    $('ls-q').oninput = e => { clearTimeout(tm); tm = setTimeout(() => {
      const q = e.target.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
      const hit = h => words.every(w => h.includes(w));
      let n = 0;
      main.querySelectorAll('.lesson-card').forEach(c => { const ok = !words.length || hit(hay.get(c.dataset.lid) || ''); c.hidden = !ok; if (ok) n++; });
      main.querySelectorAll('.dom-section').forEach(sec => { sec.hidden = !sec.querySelector('.lesson-card:not([hidden])'); });
      const jump = main.querySelector('.jump'); if (jump) jump.hidden = !!words.length;
      const facts = words.length ? D.units.filter(u => hit((u.text + ' ' + (u.prompt || '') + ' ' + (u.src || '')).toLowerCase())).length : 0;
      $('ls-count').innerHTML = !words.length ? '' : `${plural(n, 'lesson')} match${n === 1 ? 'es' : ''}.${facts ? ` <a href="${link(id, 'units')}" id="ls-facts">${plural(facts, 'fact')} match${facts === 1 ? 'es' : ''}. See them in Facts</a>` : ''}`;
      const lf = $('ls-facts'); if (lf) lf.onclick = () => { uf.track = id; uf.q = e.target.value.trim(); uf.dom = uf.lesson = uf.tag = uf.status = ''; uf.limit = 25; };
    }, 120); };
  };
  function lessonPage(D, lid) {
    const S = T(), id = D.id, l = D.l.get(lid);
    if (!l) { main.innerHTML = empty('That lesson is not here.', 'It may have been renamed. Pick one from the list.', `<a class="btn" href="${link(id, 'learn')}">All lessons</a>`); return; }
    const prev = D.lessons[l.idx - 1], next = D.lessons[l.idx + 1];
    const nq = (D.lessonQs.get(l.id) || []).length;
    const st = lessonStatus(S, l);
    const units = l.units.map(u => D.u.get(u)).filter(Boolean);
    const markRead = () => { if (!S.ls[l.id] || !S.ls[l.id].read) { S.ls[l.id] = Object.assign({}, S.ls[l.id], { read: Date.now() }); save(); V.ev('lesson_read'); const b = $('lesson-status'); if (b) b.innerHTML = lessonBadge(lessonStatus(S, l)); const m = $('mark-read'); if (m) m.remove(); } };
    const pn = `<nav class="lesson-pn" aria-label="Lesson navigation">${prev ? `<a class="btn secondary" href="${link(id, 'learn', prev.id)}"><span class="small muted">Previous</span>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn secondary next" href="${link(id, 'learn', next.id)}"><span class="small muted">Next</span>${esc(next.title)}</a>` : ''}</nav>`;
    main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(id, 'learn')}">Learn</a> / ${esc(l.dom)}`, esc(l.title), esc(l.intro || `${plural(units.length, 'fact')} from ${l.dom}. Read each one with its condition, then take the checkpoint.`), `<div class="actions"><a class="btn small" href="${link(id, 'learn', l.id, 'check')}">Checkpoint</a>${nq ? `<a class="btn secondary small" href="${link(id, 'drill', 'lesson', l.id)}">Drill this lesson</a>` : ''}</div>`, 'lesson-head')
      + `<div class="lesson-layout"><div class="lesson-main">${l.mnemonic ? `<div class="mnemonic"><p class="eyebrow">Memory hook</p><p>${esc(l.mnemonic)}</p></div>` : ''}<section class="panel unit-list" aria-label="Facts">${units.map(u => unitHTML(D, u)).join('')}</section><div id="read-sentinel"></div>`
      + `<section class="panel checkpoint-cta"><p class="eyebrow">Checkpoint</p><h2>${nq ? `Answer ${Math.min(6, nq)} linked ${nq === 1 ? 'question' : 'questions'}.` : `Recall ${plural(units.length, 'card')}.`}</h2><p class="muted">${nq ? 'You see the answer and the explanation right after each one. Get them all right to pass.' : 'No questions are linked to this lesson yet, so the checkpoint uses recall cards of its units. Mark every card Knew it to pass.'}</p><div class="actions space"><a class="btn" href="${link(id, 'learn', l.id, 'check')}">Start checkpoint</a></div></section>${pn}</div>`
      + `<aside class="lesson-aside"><div class="panel"><p class="eyebrow">This lesson</p><div id="lesson-status" class="space-sm">${lessonBadge(st)}</div><ul class="facts"><li><b>${units.length}</b> facts</li><li><b>${lessonMinutes(l)}</b> min read</li><li><b>${nq}</b> linked questions</li></ul><div class="actions stack"><a class="btn" href="${link(id, 'learn', l.id, 'check')}">Start checkpoint</a>${nq ? `<a class="btn secondary" href="${link(id, 'drill', 'lesson', l.id)}">Drill this lesson</a>` : ''}${st === 'new' ? '<button type="button" class="btn text" id="mark-read">Mark as read</button>' : ''}</div></div></aside></div>`;
    const mr = $('mark-read'); if (mr) mr.onclick = markRead;
    const sent = $('read-sentinel');
    if (st === 'new' && sent && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(ents => { if (ents.some(e => e.isIntersecting) && window.scrollY > 0) { markRead(); io.disconnect(); } });
      io.observe(sent); V.onLeave(() => io.disconnect());
    }
  }

  /* ---------- Units (knowledge base) ---------- */
  const uf = { track: null, q: '', dom: '', lesson: '', tag: '', status: '', limit: 60 };
  V.views.units = function (D) {
    const id = D.id;
    if (uf.track !== id) Object.assign(uf, { track: id, q: '', dom: '', lesson: '', tag: '', status: '', limit: 25 });
    const hd = head(`${esc(D.track.code)} / Learn / Facts`, 'Every fact, one place.', 'Each fact with how strong the rule is, its source, and the common trap. A fact counts as known once you have recalled it twice in a row, or mastered every question on it.') + subtabs(D, 'units');
    if (!D.units.length) { main.innerHTML = hd + empty(`No ${esc(D.track.code)} facts yet.`, 'Facts are the small rules behind lessons, recall cards, and games. They are being written now. The question bank works today.', `<a class="btn" href="${link(id, 'drill')}">Start drilling</a>`); return; }
    const tagsPresent = Object.keys(TAGS).filter(t => D.units.some(u => u.tag === t));
    const domsPresent = D.doms.filter(d => D.units.some(u => u.dom === d.name));
    main.innerHTML = hd + `<div class="panel toolbar"><div class="field search-field"><label for="uf-q">Search</label><input type="search" id="uf-q" placeholder="Text, prompt, or source" value="${esc(uf.q)}"></div>`
      + `<div class="field"><label for="uf-dom">Domain</label><select id="uf-dom"><option value="">All domains</option>${domsPresent.map(d => `<option${uf.dom === d.name ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="uf-lesson">Lesson</label><select id="uf-lesson"><option value="">All lessons</option>${D.lessons.map(l => `<option value="${esc(l.id)}"${uf.lesson === l.id ? ' selected' : ''}>${esc(l.title)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="uf-tag">Tag</label><select id="uf-tag"><option value="">All tags</option>${tagsPresent.map(t => `<option value="${t}"${uf.tag === t ? ' selected' : ''}>${tagLabel(t)}</option>`).join('')}</select></div>`
      + `<div class="field"><label for="uf-status">Status</label><select id="uf-status"><option value="">Any status</option>${['known', 'shaky', 'new'].map(s => `<option value="${s}"${uf.status === s ? ' selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></div></div>`
      + '<div id="unit-results"></div>';
    const S = T();
    const draw = () => {
      const q = uf.q.trim().toLowerCase();
      const rows = D.units.filter(u => (!uf.dom || u.dom === uf.dom) && (!uf.lesson || D.unitLesson.get(u.id) === uf.lesson) && (!uf.tag || u.tag === uf.tag)
        && (!q || (u.text + ' ' + (u.prompt || '') + ' ' + (u.src || '')).toLowerCase().includes(q)) && (!uf.status || unitStatus(D, u, S) === uf.status));
      const counts = { known: 0, shaky: 0 };
      D.units.forEach(u => { const s = unitStatus(D, u, S); if (counts[s] != null) counts[s]++; });
      $('unit-results').innerHTML = `<p class="result-count" role="status">${plural(rows.length, 'fact')} shown of ${D.units.length} · ${counts.known} known · ${counts.shaky} shaky</p>`
        + (rows.length ? `<div class="panel unit-list">${rows.slice(0, uf.limit).map(u => unitHTML(D, u, { status: true, meta: true })).join('')}</div>` : '<div class="panel empty"><p class="muted">No units match. Clear a filter or change the search.</p></div>')
        + (rows.length > uf.limit ? `<div class="actions center space"><button type="button" class="btn secondary" id="uf-more">Show ${Math.min(25, rows.length - uf.limit)} more</button></div>` : '');
      const more = $('uf-more'); if (more) more.onclick = () => { uf.limit += 25; draw(); const n = $('uf-more'); if (n) n.focus(); };
    };
    let tm;
    $('uf-q').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { uf.q = e.target.value; uf.limit = 25; draw(); }, 140); };
    [['uf-dom', 'dom'], ['uf-lesson', 'lesson'], ['uf-tag', 'tag'], ['uf-status', 'status']].forEach(([el, k]) => { $(el).onchange = e => { uf[k] = e.target.value; uf.limit = 25; draw(); }; });
    draw();
  };

  /* ---------- Progress ---------- */
  V.views.progress = function (D, args) {
    const S = T(), id = D.id, tr = D.track;
    const ps = poolStats(D, S);
    const known = D.units.filter(u => unitStatus(D, u, S) === 'known').length;
    const passed = D.lessons.filter(l => lessonStatus(S, l) === 'passed').length;
    const acc = ps.c + ps.w ? pct(ps.c, ps.c + ps.w) + '%' : '<span class="nil">No answers</span>';
    const domRows = D.doms.filter(d => D.pool.some(q => q.domain === d.name)).map(d => {
      const st = poolStats(D, S, q => q.domain === d.name);
      const a = st.c + st.w ? pct(st.c, st.c + st.w) : null;
      return `<div class="domain-row static"><div class="row-between"><span class="title">${esc(d.name)}</span><span class="small muted">${d.w && wPub(D) ? d.w + '% of exam' : ''}</span></div><div class="two-bars"><div><small>Accuracy ${a == null ? 'not started' : a + '%'}</small><div class="bar green"><i style="width:${a || 0}%"></i></div></div><div><small>Mastered ${pct(st.retired, st.n)}% (${st.retired}/${st.n})</small><div class="bar"><i style="width:${pct(st.retired, st.n)}%"></i></div></div></div></div>`;
    }).join('');
    main.innerHTML = head(`${esc(tr.code)} / Me`, 'Your plan and progress.', 'Accuracy counts every answer. Mastered counts questions you no longer need to see. Sims are the honest check.')
      + `<div class="metrics four"><div class="metric"><b>${ps.retired}<span> / ${ps.n}</span></b><span>Questions mastered</span></div><div class="metric"><b>${acc}</b><span>Drill accuracy</span></div><div class="metric"><b>${D.units.length ? `${known}<span> / ${D.units.length}</span>` : '<span class="nil">None yet</span>'}</b><span>Facts known</span></div><div class="metric"><b>${D.lessons.length ? `${passed}<span> / ${D.lessons.length}</span>` : '<span class="nil">None yet</span>'}</b><span>Lessons passed</span></div></div>`
      + '<div id="sync-slot"></div>'
      + `<div class="grid top space-lg">${windowHTML(D, S)}<div class="stack-col">${readyHTML(D, S)}<section class="panel" id="share-panel"><h2>Share my progress</h2><p class="muted small space-sm">A plain summary for a boss or trainer. Nothing leaves this page until you paste or send it.</p><div class="actions space"><button type="button" class="btn secondary" id="sh-copy">Copy summary</button>${navigator.share ? '<button type="button" class="btn text" id="sh-send">Send…</button>' : ''}</div><label class="sr" for="sh-out">Progress summary</label><textarea id="sh-out" rows="9" readonly hidden class="space"></textarea><p class="backup-status" id="sh-status" role="status"></p></section></div></div>`
      + `<div class="grid top space-lg"><section class="panel"><h2>By domain</h2>${ps.c + ps.w ? `<div class="domain-list">${domRows || '<p class="muted">No questions yet.</p>'}</div>` : `<p class="muted space">Nothing answered yet. Accuracy and mastered counts for each domain show here once you drill.</p><div class="actions space"><a class="btn" href="${link(id, 'drill', 'today')}">Start today’s drill</a></div>`}</section>`
      + `<section class="panel"><div class="row-between"><h2>Sim history</h2><a class="small" href="${link(id, 'sim')}">Take a sim</a></div>${simChart(D, S)}${S.sims.length ? `<div class="history">${S.sims.slice().reverse().slice(0, 8).map((s, i) => `<a class="history-row" href="${link(id, 'sim', 'report', S.sims.length - 1 - i)}"><span>${fmtDate(s.ts)} · ${esc(s.label || '')} ${s.total}q</span><b class="${s.pct >= (Number((tr.exam || {}).cut) || 0) ? 'ok' : 'bad'}">${s.pct}%</b></a>`).join('')}</div>` : ''}</section></div>`
      + `<details class="advanced space-lg"${args && args[0] === 'backup' ? ' open' : ''}><summary>Backup, restore, and reset</summary><div class="grid even space"><section class="panel" id="backup-panel"><h2>Backup</h2><p class="muted small space-sm">Progress saves in this browser, and to your account if you sign in. A backup is a copy you keep yourself, covering all three credentials.</p><div class="actions space"><button type="button" class="btn" id="bk-copy">Copy backup</button></div><label class="sr" for="bk-out">Backup text</label><textarea id="bk-out" rows="4" readonly placeholder="Your backup appears here." class="space"></textarea><p class="backup-status" id="bk-status" role="status"></p>`
      + `<h3 class="space-lg">Restore</h3><label for="bk-in" class="small muted">Paste a backup, then press Restore.</label><textarea id="bk-in" rows="4" class="space-sm"></textarea><div class="actions space" id="bk-restore-box"><button type="button" class="btn secondary" id="bk-restore">Restore</button></div><p class="backup-status" id="bk-rstatus" role="status"></p></section>`
      + `<section class="panel" id="reset-panel"><h2>Reset ${esc(tr.code)}</h2><p class="muted small space-sm">Clears ${esc(tr.code)} drill records, recall cards, lessons, sims, and your plan in this browser. Other credentials stay as they are.</p><div class="actions space" id="reset-box"><button type="button" class="btn secondary danger" id="reset">Reset ${esc(tr.code)} progress</button></div><p class="backup-status" id="reset-status" role="status"></p></section></div></details>`;
    bindWindow(D, S);
    if (args && args[0] === 'plan') { const pl = $('plan'); if (pl) { pl.scrollIntoView({ block: 'start' }); const d = $('exam-date'); if (d) d.focus({ preventScroll: true }); } }
    const summary = () => shareText(D, S);
    $('sh-copy').onclick = () => {
      V.ev('share');
      const txt = summary(), out = $('sh-out'); out.hidden = false; out.value = txt; out.select();
      const done = ok => { $('sh-status').textContent = ok ? 'Copied. Paste it into a text or email.' : 'The browser blocked the clipboard. Select the text above and copy it.'; };
      try { navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    };
    const sn = $('sh-send'); if (sn) sn.onclick = () => { navigator.share({ title: `${tr.code} study progress`, text: summary() }).catch(() => {}); };
    $('bk-copy').onclick = () => {
      const txt = JSON.stringify({ app: 'ductstudy', v: 1, exported: new Date().toISOString(), data: store });
      const out = $('bk-out'); out.value = txt; out.select();
      const done = ok => { $('bk-status').textContent = ok ? 'Copied to the clipboard. It is also in the box above.' : 'The browser blocked the clipboard. Select the text in the box above and copy it.'; };
      try { navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    };
    const rbox = $('bk-restore-box');
    const bindRestore = () => {
      $('bk-restore').onclick = () => {
        const st = $('bk-rstatus'); st.textContent = '';
        let obj;
        try { obj = JSON.parse($('bk-in').value.trim()); } catch (e) { st.textContent = 'That is not a DuctStudy backup. Paste the full text from Copy backup.'; return; }
        const data = obj && (obj.app === 'ductstudy' || obj.app === 'vent-exam-lab') ? obj.data : obj;
        if (!validStore(data)) { st.textContent = 'That is not a DuctStudy backup. Paste the full text from Copy backup.'; return; }
        const ids = Object.keys(data.t).filter(k => TRACKS.some(t => t.id === k));
        if (!ids.length) { st.textContent = 'That backup has no ASCS, CVI, or DVT progress in it. Nothing to restore.'; return; }
        const names = ids.map(k => TRACKS.find(t => t.id === k).code).join(', ');
        confirmInline(rbox, `Replace your ${names} progress in this browser with this backup? Credentials not in the backup stay as they are.`, 'Replace progress', () => {
          const next = normStore(data); ids.forEach(k => { store.t[k] = Object.assign(next.t[k], { planAt: Date.now() }); }); save(true);
          V.rerender();
          const s2 = $('bk-rstatus'); if (s2) s2.textContent = 'Backup restored.';
        });
      };
    };
    rbox._rebind = bindRestore; bindRestore();
    const rb = $('reset-box');
    const bindReset = () => {
      $('reset').onclick = () => confirmInline(rb, `Reset all ${esc(tr.code)} progress? This cannot be undone.`, `Reset ${esc(tr.code)}`, () => {
        store.t[id] = Object.assign(freshTrack(), { resetAt: Date.now() }); save(); V.rerender();
        const s2 = $('reset-status'); if (s2) s2.textContent = `${tr.code} progress cleared.`;
      }, true);
    };
    rb._rebind = bindReset; bindReset();
  };
  function shareText(D, S) {
    const tr = D.track, ps = poolStats(D, S), dl = daysLeft(S), cut = Number((tr.exam || {}).cut) || 0, r = readiness(D, S);
    const passed = D.lessons.filter(l => lessonStatus(S, l) === 'passed').length;
    const lines = [`${tr.code} study progress (${tr.name || ''})`, `As of ${fmtDate(Date.now())}`];
    if (S.plan.date && dl != null) lines.push(`Exam date: ${fmtDate(new Date(S.plan.date + 'T12:00:00'))}${dl > 0 ? ` (${plural(dl, 'day')} out)` : dl === 0 ? ' (today)' : ' (passed)'}`);
    lines.push(`Practice questions mastered: ${ps.retired} of ${ps.n} (${pct(ps.retired, ps.n)}%)`);
    if (ps.c + ps.w) lines.push(`Drill accuracy: ${pct(ps.c, ps.c + ps.w)}% over ${plural(ps.c + ps.w, 'answer')}`);
    if (D.lessons.length) lines.push(`Lessons passed: ${passed} of ${D.lessons.length}`);
    if (S.sims.length) {
      const last = S.sims[S.sims.length - 1], best = Math.max(...S.sims.map(x => x.pct));
      lines.push(`Exam sims: ${S.sims.length} taken. Last ${last.pct}% on ${last.total} questions, best ${best}%. Working cut ${cut}%.`);
    } else lines.push('Exam sims: none yet');
    const weak = D.doms.map(d => { const st = poolStats(D, S, q => q.domain === d.name); return [d.name, st.c + st.w >= 10 ? pct(st.c, st.c + st.w) : null]; }).filter(x => x[1] != null).sort((a, b) => a[1] - b[1]);
    if (weak.length > 1) lines.push(`Weakest area: ${weak[0][0]} (${weak[0][1]}% accuracy)`);
    lines.push(`Ready check: ${r.stepTwo ? 'met. Ready to book the exam.' : r.stepOne ? 'step 1 of 2 done. Needs one full-length sim at the cut.' : `${r.run} of 2 short sims at 85% in a row.`}`);
    lines.push('', 'From DuctStudy, independent exam prep.');
    return lines.join('\n');
  }
  function simChart(D, S) {
    const sims = S.sims.slice(-20);
    if (!sims.length) return '<p class="muted space">No sims yet. Your scores will chart here with the cut line.</p>';
    if (sims.length === 1) return `<p class="space">One sim so far: <b class="${sims[0].pct >= (Number((D.track.exam || {}).cut) || 0) ? 'ok' : 'bad'}">${sims[0].pct}%</b> on ${sims[0].total} questions. Take another and the trend charts here against the cut.</p>`;
    const cut = Number((D.track.exam || {}).cut) || 0;
    const W = 420, H = 190, L = 34, R = 10, Tp = 14, B = 26;
    const x = i => (sims.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (sims.length - 1));
    const y = v => Tp + (1 - v / 100) * (H - Tp - B);
    const pts = sims.map((s, i) => `${x(i).toFixed(1)},${y(s.pct).toFixed(1)}`).join(' ');
    const grid = [0, 50, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid-l"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sim scores: ${sims.map(s => s.pct + '%').join(', ')}. Cut line at ${cut}%.">${grid}<line x1="${L}" x2="${W - R}" y1="${y(cut)}" y2="${y(cut)}" class="cut-l"/><text x="${W - R}" y="${y(cut) - 6}" text-anchor="end" class="cut-t">Cut ${cut}%</text>${sims.length > 1 ? `<polyline points="${pts}" class="line"/>` : ''}${sims.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.pct)}" r="4.5" class="${s.pct >= cut ? 'pt ok' : 'pt bad'}"><title>${fmtDate(s.ts)}: ${s.pct}% on ${s.total}</title></circle>`).join('')}<text x="${L}" y="${H - 6}">Oldest</text><text x="${W - R}" y="${H - 6}" text-anchor="end">Latest</text></svg>`;
  }

  /* ---------- Sources ---------- */
  V.views.sources = function (D) {
    const tr = D.track, e = tr.exam || {};
    const facts = (tr.facts || []).filter(Boolean), srcs = (tr.sources || []).filter(s => Array.isArray(s) && s[0]);
    main.innerHTML = head(`${esc(tr.code)} / Learn / About the exam`, 'Know the exam and its sources.', `About the ${esc(tr.org || 'NADCA')} ${esc(tr.name || '')} and the documents this bank is built from.`) + subtabs(D, 'sources')
      + `<div class="grid"><section class="panel"><h2>The ${esc(tr.code)} at a glance</h2>${facts.length ? `<ul class="plain-list">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : '<p class="muted space">No published facts yet.</p>'}${e.questions ? `<div class="metrics three space-lg"><div class="metric"><b>${e.questions}</b><span>${e.published === false ? 'Practice questions' : 'Questions'}</span></div><div class="metric"><b>${e.minutes}</b><span>${e.published === false ? 'Practice minutes' : 'Minutes'}</span></div><div class="metric"><b>${e.cut}%</b><span>Working cut</span></div></div>` : ''}${e.cutNote ? `<p class="note">${esc(e.cutNote)}</p>` : ''}${e.note ? `<p class="small muted space-sm">${esc(e.note)}</p>` : ''}</section>`
      + `<section class="panel"><h2>Sources</h2>${srcs.length ? srcs.map(s => `<div class="source"><a href="${esc(s[1] || '#')}" target="_blank" rel="noopener noreferrer">${esc(s[0])}</a>${s[1] ? `<p>${esc(s[1].replace(/^https?:\/\//, '').split('/')[0])}</p>` : ''}</div>`).join('') : '<p class="muted space">No sources listed yet.</p>'}</section></div>`
      + `<section class="panel space-lg"><h2>About this site</h2><p class="space-sm">DuctStudy is independent exam preparation. It is not affiliated with, endorsed by, or sponsored by NADCA. The practice questions are original. Standards and codes are paraphrased in plain words with citations so you can look up the source. There are no actual exam items here.</p><p class="small muted space-sm">Study data built ${esc(D.b.built || 'recently')}. ${plural(D.qs.length, 'question')}${D.units.length ? `, ${plural(D.units.length, 'fact')}` : ''}${D.lessons.length ? `, ${plural(D.lessons.length, 'lesson')}` : ''}.</p></section>`;
  };

  /* ---------- progress from the older study pages ---------- */
  // ascs.html, cvi.html and dryer.html, and the first DuctStudy app, kept one record per question by its place in the
  // same three banks, so position i there is question <track>-000i here. A record this site already has always wins.
  const OLD = [['ascs', 'ascs_share_v1'], ['cvi', 'cvi_v1'], ['dvt', 'dryer_v1']];
  function importCards(tr, arr, tag) {
    if (!Array.isArray(arr) || !TRACKS.some(t => t.id === tr)) return 0;
    const S = T(tr), at = Date.now();
    let n = 0;
    arr.forEach((st, i) => {
      if (!isObj(st) || !st.seen) return;
      const id = tr + '-' + String(i).padStart(4, '0');
      if (S.q[id]) return;
      const l = Array.isArray(st.lta) ? st.lta : [];
      const rec = { n: Math.max(1, l.length), c: l.filter(x => x === 1).length, w: l.filter(x => x === 0).length, t: at };
      if ((+st.c || 0) >= 2 || (Number(st.due) > at && !(+st.ms))) rec.r = 1;
      else if (+st.ms || l[0] === 0) rec.m = 1;
      S.q[id] = rec; n++;
    });
    store.imported = Object.assign({}, store.imported, { [tag]: at });
    if (n && !store.setup) store.setup = at;
    return n;
  }
  function importOld() {
    if (!canSave) return;
    const got = [];
    let tried = false;
    for (const [tr, key] of OLD) {
      if (store.imported && store.imported[key]) continue;
      let arr = null;
      try { arr = JSON.parse(localStorage.getItem(key)); } catch (e) { arr = null; }
      if (!Array.isArray(arr)) continue;
      tried = true;
      const n = importCards(tr, arr, key);
      if (n) got.push([tr, n]);
    }
    if (!tried) return;
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* the next save tries again */ }
    if (got.length) V.importNote = `Brought over your progress from the old study pages: ${got.map(([t, n]) => `${plural(n, 'question')} in ${t.toUpperCase()}`).join(', ')}.`;
  }
  // A move from another address (the old ductstudy.workers.dev copy) arrives as #import=<gzip, base64url of the store>.
  async function importHash() {
    const m = /^#import=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return;
    let data = null;
    try {
      const bin = Uint8Array.from(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      data = JSON.parse(txt);
    } catch (e) { data = null; }
    history.replaceState(null, '', location.pathname + location.search + '#/');
    if (!validStore(data)) return;
    const inc = normStore(data);
    let moved = 0;
    for (const tr of TRACKS) {
      const a = inc.t[tr.id]; if (!a) continue;
      const b = store.t[tr.id];
      if (!hasWork(b)) { store.t[tr.id] = a; moved++; continue; }
      for (const [id, r] of Object.entries(a.q)) if (!b.q[id]) b.q[id] = r;
      const seen = new Set(b.sims.map(x => +x.ts));
      b.sims = b.sims.concat(a.sims.filter(x => !seen.has(+x.ts))).sort((x, y) => x.ts - y.ts);
      moved++;
    }
    if (inc.setup && !store.setup) store.setup = inc.setup;
    if (!store.last && inc.last) store.last = inc.last;
    if (moved) { save(true); V.importNote = 'Your progress moved over from the old address.'; }
  }
  V.importCards = importCards;

  /* ---------- usage counts ---------- */
  // Anonymous counts only (what was used, never who or what they answered), and only on the real sites.
  const API = ((document.querySelector('meta[name="vel-api"]') || {}).content || '').replace(/\/$/, '');
  const LIVE = /(^|\.)carolinaqualityair\.xyz$|\.workers\.dev$/.test(location.hostname);
  const evOnce = new Set();
  V.ev = function (e, t, once) {
    if (!LIVE || !API || !navigator.sendBeacon) return;
    const k = e + ':' + (t || '') + ':' + (once || '');
    if (once && evOnce.has(k)) return;
    evOnce.add(k);
    try { navigator.sendBeacon(API + '/api/ev', JSON.stringify({ e, t: t || V.cur || '' })); } catch (x) { /* counts are optional */ }
  };

  /* ---------- More training ---------- */
  const SITE = 'https://carolinaqualityair.xyz/learning/';
  const LIBRARY = [
    ['On the job', [['field-guide/', 'Crew field guide', 'How CQA runs a job, from the truck to the closeout.']]],
    ['Other certifications', [['epa608.html', 'EPA 608', 'Hub, mastery drill, and mock exam for refrigerant handling.'], ['epa609-drill.html', 'EPA 609', 'Motor vehicle air conditioning drill.'], ['forklift-drill.html', 'Forklift operator', 'Operator rules drill for the card.']]],
    ['Pricing and sales', [['walk-the-job.html', 'Walk the Job', 'The CQA pricing game. Walk a job and price it.'], ['estimator.html', 'Job estimator trainer', 'Price duct jobs the way the office does.'], ['pricing-doctrine.html', 'Pricing doctrine', 'How CQA prices work, written down.']]]
  ];
  function libraryView() {
    const tr = homeTrack();
    main.innerHTML = head(`<a href="${link(tr, 'practice')}">Practice</a> / More training`, 'More training.', 'The rest of the CQA training shelf: other certifications, the crew field guide, and pricing.')
      + LIBRARY.map(([h, items]) => `<section class="space-lg"><div class="section-heading"><h2>${h}</h2></div><div class="tile-links wide">${items.map(([href, t, sub]) => `<a class="tile-link" href="${SITE + href}"><b>${t}</b><small>${sub}</small></a>`).join('')}</div></section>`).join('');
  }

  /* ---------- boot ---------- */
  Object.assign(V, { wPub, ePub, TRACKS, TAGS, OBLIG, LEITNER, DAY, T, save, getTrack, setTrack, swapStore, poolStats, simLengths, fullLength, readiness, lessonStatus, unitStatus });
  V.u = { esc, $, link, shuffle, pct, plural, fmtDate, head, empty, tagChip, tagLabel, statusBadge, cloze, recallFront, leitner, unitHTML, lessonBadge, lessonMinutes, announce, confirmInline, isObj };
  function boot() {
    main = $('main');
    // In-page jump links (Learn domains) scroll without touching the router's hash.
    main.addEventListener('click', e => { const j = e.target.closest('[data-jump]'); if (!j) return; e.preventDefault(); const t = document.getElementById(j.dataset.jump); if (t) { t.scrollIntoView({ block: 'start' }); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } });
    V.main = main;
    initStorage();
    importOld();
    storageNote();
    // The skip link must not touch the hash, which is the router's.
    document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); main.scrollIntoView(); });
    $('track-picker').addEventListener('click', e => {
      const b = e.target.closest('[data-track]'); if (!b) return;
      const r = parse();
      const t = b.dataset.track;
      if (t === r.track) return;
      if (r.track === 'setup') { const c = document.querySelector(`input[name=su-track][value="${t}"]`); if (c) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } return; }
      location.hash = (store.lastBy && store.lastBy[t]) || link(t, 'today');
    });
    document.addEventListener('keydown', e => {
      if (!V.keys || e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target, tag = tg && tg.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (tg && tg.isContentEditable)) return;
      if ((e.key === ' ' || e.key === 'Enter') && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
      if (V.keys(e) === true) e.preventDefault();
    });
    window.addEventListener('hashchange', route);
    V.ev('open', '', 'load');
    route();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
