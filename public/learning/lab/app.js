/* Vent Exam Lab: core state, data loading, routing, shell, and the Today, Learn, Units, Progress and Sources views.
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
    ['master', 'Master the standard', 'Recall cards and lesson checkpoints']
  ];
  const NAV = [['today', 'Today'], ['learn', 'Learn'], ['drill', 'Drill'], ['games', 'Games'], ['sim', 'Exam sim'],
    ['units', 'Units'], ['lab', 'Systems lab'], ['progress', 'Progress'], ['sources', 'Sources']];
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
    no.onclick = () => { box.innerHTML = prev; if (box._rebind) box._rebind(); };
    box.querySelector('[data-yes]').focus();
  }

  /* ---------- storage ---------- */
  let store = { v: 1, last: null, t: {} };
  let canSave = true;
  function freshTrack() { return { plan: { date: '', min: 20 }, mode: 'pass', q: {}, rc: {}, ls: {}, sims: [], exp: {}, sim: null, drill: null, best: {} }; }
  function normTrack(t) {
    const f = freshTrack();
    if (!isObj(t)) return f;
    if (isObj(t.plan)) { f.plan.date = typeof t.plan.date === 'string' ? t.plan.date : ''; f.plan.min = Number(t.plan.min) > 0 ? Number(t.plan.min) : 20; }
    if (MODES.some(m => m[0] === t.mode)) f.mode = t.mode;
    ['q', 'rc', 'ls', 'exp', 'best'].forEach(k => { if (isObj(t[k])) f[k] = t[k]; });
    if (Array.isArray(t.sims)) f.sims = t.sims.filter(isObj);
    if (isObj(t.sim) && Array.isArray(t.sim.items)) f.sim = t.sim;
    if (isObj(t.drill) && Array.isArray(t.drill.queue)) f.drill = t.drill;
    // sync.js stamps: when the study window or mode last changed, and when this track was last reset
    if (Number(t.planAt) > 0) f.planAt = Number(t.planAt);
    if (Number(t.resetAt) > 0) f.resetAt = Number(t.resetAt);
    return f;
  }
  const validStore = s => isObj(s) && s.v === 1 && isObj(s.t);
  function normStore(s) {
    const out = { v: 1, last: isObj(s.last) ? s.last : null, t: {} };
    for (const tr of TRACKS) if (s.t[tr.id]) out.t[tr.id] = normTrack(s.t[tr.id]);
    return out;
  }
  function initStorage() {
    try { localStorage.setItem('vel-probe', '1'); localStorage.removeItem('vel-probe'); } catch (e) { canSave = false; return; }
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { canSave = false; return; }
    if (raw) { try { const s = JSON.parse(raw); if (validStore(s)) store = normStore(s); } catch (e) { /* unreadable save: start fresh */ } }
  }
  function save(all) {
    if (canSave) { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { canSave = false; storageNote(); } }
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
  function renderShell(track, view) {
    const D = V.data[track];
    const base = TRACKS.find(t => t.id === track);
    const meta = D ? Object.assign({}, base, D.track) : base;
    $('track-picker').innerHTML = TRACKS.map(t => {
      const m = V.data[t.id] ? Object.assign({}, t, V.data[t.id].track) : t;
      return `<button type="button" class="track-button${t.id === track ? ' active' : ''}" data-track="${t.id}" aria-pressed="${t.id === track}"><b>${esc(m.code)}</b><span>${esc(m.kind)}</span></button>`;
    }).join('') + (V.field ? `<button type="button" class="track-button field-button${track === 'field' ? ' active' : ''}" data-track="field" aria-pressed="${track === 'field'}"><b>FIELD</b><span>Sims and drills</span></button>` : '');
    if (track === 'field') {
      const nav = $('nav');
      nav.innerHTML = V.field.NAV.map(([id, label]) => `<a href="${id ? link('field', id) : link('field')}"${id === (view || '') ? ' class="active" aria-current="page"' : ''}>${esc(label)}</a>`).join('');
      $('ctx-name').textContent = 'Field training';
      return;
    }
    const nav = $('nav');
    nav.innerHTML = NAV.filter(([id]) => id !== 'lab' || (D && D.sysDom))
      .map(([id, label]) => `<a href="${link(track, id)}"${id === view ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('');
    const active = nav.querySelector('.active');
    if (active && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2);
    $('ctx-name').textContent = meta.name;
  }
  let lastHash = null;
  async function route() {
    const r = parse();
    if (r.track === 'field' && V.field) {
      runCleanup();
      V.keys = null;
      V.cur = null; // no credential is active, so sync has nothing to reconcile here
      renderShell('field', r.view || '');
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
    const track = TRACKS.some(t => t.id === r.track) ? r.track : null;
    if (!track) {
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
      if (s.total === full && stepOne && s.pct > cut) stepTwo = true;
      if (quick === full && s.total === full) { run = s.pct >= 85 ? run + 1 : 0; bestRun = Math.max(bestRun, run); if (run >= 2) stepOne = true; }
    }
    return { quick, full, cut, run, stepOne, stepTwo, bestRun: Math.min(2, bestRun) };
  }
  function ruleLine(D, S) {
    const r = readiness(D, S);
    const status = r.stepTwo ? '<b class="ok">Done. You met the readiness rule.</b>'
      : r.stepOne ? `<b>Step 1 done.</b> Next: a ${r.full}-question sim above ${r.cut}%.`
        : `<b>${r.run} of 2</b> ${r.quick}-question sims in a row at 85% or better.`;
    return `<div class="note blue rule"><p><b>Readiness rule:</b> Two ${r.quick}-question sims in a row at 85% or better, then one full-length sim above the cut.</p><p class="small">${status}</p></div>`;
  }

  /* ---------- Today ---------- */
  V.views.today = function (D) {
    const S = T(), tr = D.track, id = D.id;
    const ps = poolStats(D, S);
    const known = D.units.filter(u => unitStatus(D, u, S) === 'known').length;
    const last = S.sims[S.sims.length - 1];
    const dl = daysLeft(S);
    const counts = [plural(D.pool.length, 'practice question')];
    if (D.units.length) counts.push(plural(D.units.length, 'unit'));
    if (D.lessons.length) counts.push(plural(D.lessons.length, 'lesson'));
    const modeTabs = `<div class="mode-switch" role="group" aria-label="Study mode">${MODES.map(([m, t, s]) => `<button type="button" data-mode="${m}" class="${S.mode === m ? 'active' : ''}" aria-pressed="${S.mode === m}"><b>${t}</b><span>${s}</span></button>`).join('')}</div>`;
    const tiles = [
      [D.units.length ? `${known}<span> / ${D.units.length}</span>` : '<span class="nil">None yet</span>', D.units.length ? 'Units known' : 'Units known (units are on the way)'],
      [`${ps.retired}<span> / ${ps.n}</span>`, 'Questions retired'],
      [last ? `${last.pct}%` : '<span class="nil">No sim yet</span>', last ? `Last sim, ${last.total} questions` : 'Last sim score'],
      [dl == null ? '<span class="nil">Set a date</span>' : dl < 0 ? '<span class="nil">Passed</span>' : String(dl), dl == null ? 'Days to exam' : dl === 1 ? 'Day to exam' : 'Days to exam']
    ];
    const metrics = `<div class="metrics four">${tiles.map(([b, s]) => `<div class="metric"><b>${b}</b><span>${s}</span></div>`).join('')}</div>`;
    const domRows = D.doms.filter(d => d.w > 0 || D.pool.some(q => q.domain === d.name)).map(d => {
      const st = poolStats(D, S, q => q.domain === d.name);
      const p = pct(st.retired, st.n);
      const inner = `<div class="row-between"><span class="title">${esc(d.name)}</span><span class="small num">${st.n ? p + '%' : ''}</span></div><div class="bar"><i style="width:${p}%"></i></div><small>${st.n ? `${st.retired} of ${st.n} retired` : 'No practice questions yet'}${d.w ? ` · ${d.w}% of exam` : ''}${st.miss ? ` · ${plural(st.miss, 'miss', 'misses')}` : ''}</small>`;
      return st.n ? `<a class="domain-row" href="${link(id, 'drill', 'dom', d.name)}" aria-label="Drill ${esc(d.name)}, ${p}% retired">${inner}</a>` : `<div class="domain-row">${inner}</div>`;
    }).join('');
    const nextL = D.lessons.filter(l => lessonStatus(S, l) !== 'passed').sort((a, b) => (lessonStatus(S, a) === 'new') - (lessonStatus(S, b) === 'new') || a.idx - b.idx);
    const unread = D.lessons.filter(l => lessonStatus(S, l) === 'new');
    const upcoming = (unread.length ? unread : nextL).slice(0, 4);
    const lessonsPanel = `<section class="panel"><div class="row-between"><h2>Next lessons</h2>${D.lessons.length ? `<a href="${link(id, 'learn')}" class="small">All lessons</a>` : ''}</div>${
      !D.lessons.length ? `<p class="muted space">Lessons for ${esc(tr.code)} are still being written. The question bank, drill, and sims work now.</p><div class="actions space"><a class="btn secondary" href="${link(id, 'drill')}">Open the drill</a></div>`
        : upcoming.length ? upcoming.map(l => `<a class="concept-row" href="${link(id, 'learn', l.id)}"><span><b>${esc(l.title)}</b><small>${esc(l.dom)} · ${plural(l.units.length, 'unit')} · ${lessonMinutes(l)} min</small></span>${lessonBadge(lessonStatus(S, l))}</a>`).join('')
          : '<p class="muted space">Every lesson checkpoint is passed. Keep recall cards current.</p>'}</section>`;
    main.innerHTML = head(`${esc(tr.code)} / Today`, esc(TITLES[id] || 'Make today’s study count.'), esc(tr.code) + ' · ' + counts.join(' · '))
      + modeTabs
      + `<div class="grid top"><section class="panel hero-panel" id="hero">${heroHTML(D, S, ps)}</section>${windowHTML(D, S, ps, dl)}</div>`
      + metrics
      + `<div class="grid"><section class="panel"><div class="row-between"><h2>Domain readiness</h2><span class="small muted hint">Tap a domain to drill it</span></div><div class="domain-list">${domRows || '<p class="muted">No domains in this bundle.</p>'}</div></section>${lessonsPanel}</div>`
      + ruleLine(D, S)
      + (V.field ? (id === 'dvt'
        ? `<section class="panel field-callout space-lg"><div><p class="eyebrow">Field training</p><h2>Run the dryer vent job.</h2><p class="muted">Five jobs: inspect the run, make the code calls, work out developed length, run the DEDP test, and make the pass or fail call.</p></div><a class="btn secondary" href="${link('field', 'vent-call')}">Open Vent Call</a></section>`
        : `<section class="panel field-callout space-lg"><div><p class="eyebrow">Field training</p><h2>Run the job the standard describes.</h2><p class="muted">Job sims graded on return first, negative air, rod reach, and patching every hole. Inspection casework graded against ACR 2025. Print-reading drills for spotting supply and return on sight.</p></div><a class="btn secondary" href="${link('field')}">Open field training</a></section>`) : '');
    main.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { S.mode = b.dataset.mode; S.planAt = Date.now(); save(); V.rerender(); const f = main.querySelector(`[data-mode="${S.mode}"]`); if (f) f.focus(); });
    const date = $('exam-date'), mins = $('exam-min');
    date.onchange = () => { S.plan.date = date.value; S.planAt = Date.now(); save(); V.rerender(); const f = $('exam-date'); if (f) f.focus(); };
    mins.onchange = () => { S.plan.min = Number(mins.value) || 20; S.planAt = Date.now(); save(); V.rerender(); const f = $('exam-min'); if (f) f.focus(); };
  };
  function heroHTML(D, S, ps) {
    const id = D.id, tr = D.track;
    const btn = (href, label) => `<a class="btn primary" href="${href}">${label}</a>`;
    if (S.mode === 'understand') {
      if (!D.lessons.length) return `<p class="eyebrow">Lessons</p><h2>Lessons are on the way.</h2><p>The ${esc(tr.code)} lessons are still being written. Every question already has an explanation, so the drill teaches as you go.</p>${btn(link(id, 'drill'), 'Open the drill')}`;
      const next = D.lessons.find(l => lessonStatus(S, l) === 'new');
      if (next) return `<p class="eyebrow">Next lesson · ${esc(next.dom)}</p><h2>${esc(next.title)}</h2><p>${esc(next.intro || `${plural(next.units.length, 'unit')} from ${next.dom}.`)} About ${lessonMinutes(next)} min.</p>${btn(link(id, 'learn', next.id), 'Read the lesson')}`;
      const chk = D.lessons.find(l => lessonStatus(S, l) === 'read');
      if (chk) return `<p class="eyebrow">All lessons read</p><h2>Pass the checkpoint for ${esc(chk.title)}.</h2><p>You have read every lesson. Checkpoints confirm you can use what you read.</p>${btn(link(id, 'learn', chk.id, 'check'), 'Start checkpoint')}`;
      return `<p class="eyebrow">Course complete</p><h2>Every checkpoint passed.</h2><p>Keep it fresh with recall cards and a sim.</p>${btn(link(id, 'games', 'recall'), 'Recall cards')}`;
    }
    if (S.mode === 'master') {
      if (!D.units.length) return `<p class="eyebrow">Recall cards</p><h2>Units are on the way.</h2><p>Recall cards and checkpoints are built from ${esc(tr.code)} units, which are still being written. Drill the question bank for now.</p>${btn(link(id, 'drill'), 'Open the drill')}`;
      const now = Date.now();
      const due = D.units.filter(u => S.rc[u.id] && S.rc[u.id].d <= now).length;
      const fresh = D.units.filter(u => !S.rc[u.id]).length;
      if (due) return `<p class="eyebrow">Recall cards</p><h2>${plural(due, 'recall card')} due.</h2><p>Say the answer before you flip. Knew it moves a card to a longer interval; missed it brings it back today.</p>${btn(link(id, 'games', 'recall'), 'Review due cards')}`;
      const chk = D.lessons.find(l => lessonStatus(S, l) === 'read') || D.lessons.find(l => lessonStatus(S, l) === 'new');
      if (chk) return `<p class="eyebrow">Next checkpoint</p><h2>${esc(chk.title)}</h2><p>No cards are due. Pass this lesson’s checkpoint to lock in its ${plural(chk.units.length, 'unit')}.</p><div class="actions">${btn(link(id, 'learn', chk.id, 'check'), 'Start checkpoint')}${fresh ? `<a class="btn light-text" href="${link(id, 'games', 'recall')}">Recall cards (${fresh} new)</a>` : ''}</div>`;
      return `<p class="eyebrow">Recall cards</p><h2>Nothing due right now.</h2><p>${fresh ? `${plural(fresh, 'unit')} not yet carded.` : 'Every unit is on a schedule.'}</p>${btn(link(id, 'games', 'recall'), 'Recall cards')}`;
    }
    if (!ps.n) return `<p class="eyebrow">Practice</p><h2>No practice questions yet.</h2><p>This bundle has no drillable questions.</p>`;
    const sims = simLengths(D);
    if (ps.retired / ps.n >= 0.8 || ps.left === 0) {
      return `<p class="eyebrow">Ready to check</p><h2>Take a ${sims[0][0]}-question sim.</h2><p>You have retired ${pct(ps.retired, ps.n)}% of the drill pool. A sim draws fresh reserved questions by domain weight and scores you against the ${esc(String((tr.exam || {}).cut || ''))}% line.</p><div class="actions">${btn(link(id, 'sim'), 'Start a sim')}${ps.miss ? `<a class="btn light-text" href="${link(id, 'drill', 'misses')}">Drill ${plural(ps.miss, 'miss', 'misses')}</a>` : ''}</div>`;
    }
    const plan = V.todayPlan(D);
    const title = plan.miss.length ? `${plan.fresh.length} new + ${plural(plan.miss.length, 'miss', 'misses')}.` : `${plural(plan.fresh.length, 'new question')}.`;
    return `<p class="eyebrow">Today’s drill</p><h2>${title}</h2><p>Sized for ${S.plan.min} minutes a day at about 1.5 minutes per question. Right on first sight retires a question. A miss comes back until you get it twice in a row.</p>${btn(link(id, 'drill', 'today'), 'Start today’s drill')}<p class="under-note">${ps.left} of ${ps.n} questions left in the bank.</p>`;
  }
  function windowHTML(D, S, ps, dl) {
    const cap = V.drillSize(S.plan.min);
    let out;
    if (dl == null) out = `Add an exam date to get a daily target. At ${S.plan.min} minutes a day you cover about ${cap} questions.`;
    else if (dl < 0) out = 'That date has passed. Set your next exam date.';
    else {
      const need = Math.ceil(ps.left / Math.max(1, dl));
      out = `<b>${plural(dl, 'day')} left.</b> Retire about <b>${need} a day</b> to clear the ${ps.left} questions left. At ${S.plan.min} minutes a day you cover about ${cap}.` + (need > cap ? ' Add minutes or lean on misses and sims.' : '');
    }
    return `<section class="panel window"><h2>Your study window</h2><div class="field space"><label for="exam-date">Exam date <span class="muted">(optional)</span></label><input type="date" id="exam-date" value="${esc(S.plan.date)}"></div><div class="field space"><label for="exam-min">Minutes per day</label><select id="exam-min">${MINUTES.concat(MINUTES.includes(S.plan.min) ? [] : [S.plan.min]).sort((a, b) => a - b).map(m => `<option value="${m}"${m === S.plan.min ? ' selected' : ''}>${m} minutes</option>`).join('')}</select></div><p class="window-out" id="window-out">${out}</p><p class="under-note">Saved as you change it.</p></section>`;
  }

  /* ---------- Learn ---------- */
  V.views.learn = function (D, args) {
    if (args[0] && args[1] === 'check') return V.checkpoint(D, args[0]);
    if (args[0]) return lessonPage(D, args[0]);
    const S = T(), id = D.id;
    const hd = head(`${esc(D.track.code)} / Learn`, 'Learn it once, properly.', 'Short lessons in blueprint order. Each unit is one testable fact with its conditions and source. Pass the checkpoint to lock it in.');
    if (!D.lessons.length) {
      main.innerHTML = hd + empty(`No ${esc(D.track.code)} lessons yet.`, 'Lessons are being written from the standards and codes. The question bank is ready now, and every answer comes with an explanation.', `<a class="btn" href="${link(id, 'drill')}">Start drilling</a><a class="btn secondary" href="${link(id, 'sources')}">See the sources</a>`);
      return;
    }
    const groups = D.doms.map(d => ({ d, ls: D.lessons.filter(l => l.dom === d.name) })).filter(g => g.ls.length);
    const done = D.lessons.filter(l => lessonStatus(S, l) !== 'new').length, passed = D.lessons.filter(l => lessonStatus(S, l) === 'passed').length;
    main.innerHTML = hd
      + `<div class="panel learn-summary"><div><b>${done} of ${D.lessons.length}</b> lessons read · <b>${passed}</b> checkpoints passed</div><div class="bar"><i style="width:${pct(done, D.lessons.length)}%"></i></div>${groups.length > 1 ? `<div class="jump" aria-label="Jump to a domain">${groups.map(g => `<a href="#dom-${g.d.name.replace(/[^a-z0-9]+/gi, '-')}" data-jump>${esc(g.d.name)}</a>`).join('')}</div>` : ''}</div>`
      + groups.map(g => `<section class="dom-section" id="dom-${g.d.name.replace(/[^a-z0-9]+/gi, '-')}"><div class="section-heading"><h2>${esc(g.d.name)}</h2><span class="small muted">${g.d.w ? g.d.w + '% of exam · ' : ''}${plural(g.ls.length, 'lesson')}</span></div><div class="lesson-grid">${g.ls.map(l => { const st = lessonStatus(S, l); return `<a class="lesson-card st-${st}" href="${link(id, 'learn', l.id)}"><span class="lc-top">${lessonBadge(st)}<small>${lessonMinutes(l)} min</small></span><h3>${esc(l.title)}</h3><small class="lc-meta">${plural(l.units.length, 'unit')}${(D.lessonQs.get(l.id) || []).length ? ' · ' + plural(D.lessonQs.get(l.id).length, 'question') : ''}</small></a>`; }).join('')}</div></section>`).join('');
    main.querySelectorAll('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const t = document.querySelector(a.getAttribute('href')); if (t) { t.scrollIntoView({ block: 'start' }); const h = t.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } } });
  };
  function lessonPage(D, lid) {
    const S = T(), id = D.id, l = D.l.get(lid);
    if (!l) { main.innerHTML = empty('That lesson is not in this bundle.', 'It may have been renamed. Pick one from the list.', `<a class="btn" href="${link(id, 'learn')}">All lessons</a>`); return; }
    const prev = D.lessons[l.idx - 1], next = D.lessons[l.idx + 1];
    const nq = (D.lessonQs.get(l.id) || []).length;
    const st = lessonStatus(S, l);
    const units = l.units.map(u => D.u.get(u)).filter(Boolean);
    const markRead = () => { if (!S.ls[l.id] || !S.ls[l.id].read) { S.ls[l.id] = Object.assign({}, S.ls[l.id], { read: Date.now() }); save(); const b = $('lesson-status'); if (b) b.innerHTML = lessonBadge(lessonStatus(S, l)); const m = $('mark-read'); if (m) m.remove(); } };
    const pn = `<nav class="lesson-pn" aria-label="Lesson navigation">${prev ? `<a class="btn secondary" href="${link(id, 'learn', prev.id)}"><span class="small muted">Previous</span>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn secondary next" href="${link(id, 'learn', next.id)}"><span class="small muted">Next</span>${esc(next.title)}</a>` : ''}</nav>`;
    main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(id, 'learn')}">Learn</a> / ${esc(l.dom)}`, esc(l.title), esc(l.intro || `${plural(units.length, 'unit')} from ${l.dom}. Read each one with its condition, then take the checkpoint.`), '', 'lesson-head')
      + `<div class="lesson-layout"><div class="lesson-main">${l.mnemonic ? `<div class="mnemonic"><p class="eyebrow">Memory hook</p><p>${esc(l.mnemonic)}</p></div>` : ''}<section class="panel unit-list" aria-label="Units">${units.map(u => unitHTML(D, u)).join('')}</section><div id="read-sentinel"></div>`
      + `<section class="panel checkpoint-cta"><p class="eyebrow">Checkpoint</p><h2>${nq ? `Answer ${Math.min(6, nq)} linked ${nq === 1 ? 'question' : 'questions'}.` : `Recall ${plural(units.length, 'card')}.`}</h2><p class="muted">${nq ? 'Tutor mode: you see the answer and explanation right away. Get them all right to pass.' : 'No questions are linked to this lesson yet, so the checkpoint uses recall cards of its units. Mark every card Knew it to pass.'}</p><div class="actions space"><a class="btn" href="${link(id, 'learn', l.id, 'check')}">Start checkpoint</a></div></section>${pn}</div>`
      + `<aside class="lesson-aside"><div class="panel"><p class="eyebrow">This lesson</p><div id="lesson-status" class="space-sm">${lessonBadge(st)}</div><ul class="facts"><li><b>${units.length}</b> units</li><li><b>${lessonMinutes(l)}</b> min read</li><li><b>${nq}</b> linked questions</li></ul><div class="actions stack"><a class="btn" href="${link(id, 'learn', l.id, 'check')}">Start checkpoint</a>${nq ? `<a class="btn secondary" href="${link(id, 'drill', 'lesson', l.id)}">Drill this lesson</a>` : ''}${st === 'new' ? '<button type="button" class="btn text" id="mark-read">Mark as read</button>' : ''}</div></div></aside></div>`;
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
    if (uf.track !== id) Object.assign(uf, { track: id, q: '', dom: '', lesson: '', tag: '', status: '', limit: 60 });
    const hd = head(`${esc(D.track.code)} / Units`, 'Master the standard.', 'Every testable fact in one place with its tag, source, and trap. Known means recall box 2 or higher, or every linked question retired with no open miss.');
    if (!D.units.length) { main.innerHTML = hd + empty(`No ${esc(D.track.code)} units yet.`, 'Units are the small facts behind lessons, recall cards, and games. They are being written now. The question bank works today.', `<a class="btn" href="${link(id, 'drill')}">Start drilling</a>`); return; }
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
      $('unit-results').innerHTML = `<p class="result-count" role="status">${plural(rows.length, 'unit')} shown of ${D.units.length} · ${counts.known} known · ${counts.shaky} shaky</p>`
        + (rows.length ? `<div class="panel unit-list">${rows.slice(0, uf.limit).map(u => unitHTML(D, u, { status: true, meta: true })).join('')}</div>` : '<div class="panel empty"><p class="muted">No units match. Clear a filter or change the search.</p></div>')
        + (rows.length > uf.limit ? `<div class="actions center space"><button type="button" class="btn secondary" id="uf-more">Show ${Math.min(60, rows.length - uf.limit)} more</button></div>` : '');
      const more = $('uf-more'); if (more) more.onclick = () => { uf.limit += 60; draw(); const n = $('uf-more'); if (n) n.focus(); };
    };
    let tm;
    $('uf-q').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { uf.q = e.target.value; uf.limit = 60; draw(); }, 140); };
    [['uf-dom', 'dom'], ['uf-lesson', 'lesson'], ['uf-tag', 'tag'], ['uf-status', 'status']].forEach(([el, k]) => { $(el).onchange = e => { uf[k] = e.target.value; uf.limit = 60; draw(); }; });
    draw();
  };

  /* ---------- Progress ---------- */
  V.views.progress = function (D) {
    const S = T(), id = D.id, tr = D.track;
    const ps = poolStats(D, S);
    const known = D.units.filter(u => unitStatus(D, u, S) === 'known').length;
    const passed = D.lessons.filter(l => lessonStatus(S, l) === 'passed').length;
    const acc = ps.c + ps.w ? pct(ps.c, ps.c + ps.w) + '%' : '<span class="nil">No answers</span>';
    const domRows = D.doms.filter(d => D.pool.some(q => q.domain === d.name)).map(d => {
      const st = poolStats(D, S, q => q.domain === d.name);
      const a = st.c + st.w ? pct(st.c, st.c + st.w) : null;
      return `<div class="domain-row static"><div class="row-between"><span class="title">${esc(d.name)}</span><span class="small muted">${d.w ? d.w + '% of exam' : ''}</span></div><div class="two-bars"><div><small>Accuracy ${a == null ? 'not started' : a + '%'}</small><div class="bar green"><i style="width:${a || 0}%"></i></div></div><div><small>Retired ${pct(st.retired, st.n)}% (${st.retired}/${st.n})</small><div class="bar"><i style="width:${pct(st.retired, st.n)}%"></i></div></div></div></div>`;
    }).join('');
    main.innerHTML = head(`${esc(tr.code)} / Progress`, 'Coverage before confidence.', 'Accuracy counts every answer. Retired counts questions you no longer need to see. Sims are the honest check.')
      + `<div class="metrics four"><div class="metric"><b>${ps.retired}<span> / ${ps.n}</span></b><span>Questions retired</span></div><div class="metric"><b>${acc}</b><span>Drill accuracy</span></div><div class="metric"><b>${D.units.length ? `${known}<span> / ${D.units.length}</span>` : '<span class="nil">None yet</span>'}</b><span>Units known</span></div><div class="metric"><b>${D.lessons.length ? `${passed}<span> / ${D.lessons.length}</span>` : '<span class="nil">None yet</span>'}</b><span>Lessons passed</span></div></div>`
      + `<div class="grid"><section class="panel"><h2>By domain</h2><div class="domain-list">${domRows || '<p class="muted">No questions yet.</p>'}</div></section>`
      + `<section class="panel"><div class="row-between"><h2>Sim history</h2><a class="small" href="${link(id, 'sim')}">Take a sim</a></div>${simChart(D, S)}${S.sims.length ? `<div class="history">${S.sims.slice().reverse().slice(0, 8).map((s, i) => `<a class="history-row" href="${link(id, 'sim', 'report', S.sims.length - 1 - i)}"><span>${fmtDate(s.ts)} · ${esc(s.label || '')} ${s.total}q</span><b class="${s.pct >= (Number((tr.exam || {}).cut) || 0) ? 'ok' : 'bad'}">${s.pct}%</b></a>`).join('')}</div>` : ''}</section></div>`
      + ruleLine(D, S)
      + `<div class="grid even space-lg"><section class="panel" id="backup-panel"><h2>Backup</h2><p class="muted small space-sm">Progress lives in this browser only. Copy a backup to move it or keep it safe. The backup covers all three credentials.</p><div class="actions space"><button type="button" class="btn" id="bk-copy">Copy backup</button></div><label class="sr" for="bk-out">Backup text</label><textarea id="bk-out" rows="4" readonly placeholder="Your backup appears here." class="space"></textarea><p class="backup-status" id="bk-status" role="status"></p>`
      + `<h3 class="space-lg">Restore</h3><label for="bk-in" class="small muted">Paste a backup, then press Restore.</label><textarea id="bk-in" rows="4" class="space-sm"></textarea><div class="actions space" id="bk-restore-box"><button type="button" class="btn secondary" id="bk-restore">Restore</button></div><p class="backup-status" id="bk-rstatus" role="status"></p></section>`
      + `<section class="panel" id="reset-panel"><h2>Reset ${esc(tr.code)}</h2><p class="muted small space-sm">Clears ${esc(tr.code)} drill records, recall cards, lessons, sims, and your study window in this browser. Other credentials stay as they are.</p><div class="actions space" id="reset-box"><button type="button" class="btn secondary danger" id="reset">Reset ${esc(tr.code)} progress</button></div><p class="backup-status" id="reset-status" role="status"></p></section></div>`;
    $('bk-copy').onclick = () => {
      const txt = JSON.stringify({ app: 'vent-exam-lab', v: 1, exported: new Date().toISOString(), data: store });
      const out = $('bk-out'); out.value = txt; out.select();
      const done = ok => { $('bk-status').textContent = ok ? 'Copied to the clipboard. It is also in the box above.' : 'The browser blocked the clipboard. Select the text in the box above and copy it.'; };
      try { navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); } catch (e) { done(false); }
    };
    const rbox = $('bk-restore-box');
    const bindRestore = () => {
      $('bk-restore').onclick = () => {
        const st = $('bk-rstatus'); st.textContent = '';
        let obj;
        try { obj = JSON.parse($('bk-in').value.trim()); } catch (e) { st.textContent = 'That is not a Vent Exam Lab backup. Paste the full text from Copy backup.'; return; }
        const data = obj && obj.app === 'vent-exam-lab' ? obj.data : obj;
        if (!validStore(data)) { st.textContent = 'That is not a Vent Exam Lab backup. Paste the full text from Copy backup.'; return; }
        const n = Object.keys(data.t).filter(k => TRACKS.some(t => t.id === k)).length;
        confirmInline(rbox, `Replace the progress in this browser with this backup (${plural(n, 'credential')})?`, 'Replace progress', () => {
          store = normStore(data); save(true);
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
  function simChart(D, S) {
    const sims = S.sims.slice(-20);
    if (!sims.length) return '<p class="muted space">No sims yet. Your scores will chart here with the cut line.</p>';
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
    main.innerHTML = head(`${esc(tr.code)} / Sources`, 'Know where it comes from.', `About the ${esc(tr.org || 'NADCA')} ${esc(tr.name || '')} and the documents this bank is built from.`)
      + `<div class="grid"><section class="panel"><h2>The ${esc(tr.code)} at a glance</h2>${facts.length ? `<ul class="plain-list">${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : '<p class="muted space">No published facts yet.</p>'}${e.questions ? `<div class="metrics three space-lg"><div class="metric"><b>${e.questions}</b><span>Questions</span></div><div class="metric"><b>${e.minutes}</b><span>Minutes</span></div><div class="metric"><b>${e.cut}%</b><span>Working cut</span></div></div>` : ''}${e.cutNote ? `<p class="note">${esc(e.cutNote)}</p>` : ''}</section>`
      + `<section class="panel"><h2>Sources</h2>${srcs.length ? srcs.map(s => `<div class="source"><a href="${esc(s[1] || '#')}" target="_blank" rel="noopener noreferrer">${esc(s[0])}</a>${s[1] ? `<p>${esc(s[1].replace(/^https?:\/\//, '').split('/')[0])}</p>` : ''}</div>`).join('') : '<p class="muted space">No sources listed yet.</p>'}</section></div>`
      + `<section class="panel space-lg"><h2>About this site</h2><p class="space-sm">Vent Exam Lab is independent exam preparation. It is not affiliated with, endorsed by, or sponsored by NADCA. The practice questions are original. Standards and codes are paraphrased in plain words with citations so you can look up the source. There are no actual exam items here.</p><p class="small muted space-sm">Study data built ${esc(D.b.built || 'recently')}. ${plural(D.qs.length, 'question')}${D.units.length ? `, ${plural(D.units.length, 'unit')}` : ''}${D.lessons.length ? `, ${plural(D.lessons.length, 'lesson')}` : ''}.</p></section>`;
  };

  /* ---------- boot ---------- */
  Object.assign(V, { TRACKS, TAGS, OBLIG, LEITNER, DAY, T, save, getTrack, setTrack, swapStore, poolStats, simLengths, fullLength, readiness, lessonStatus, unitStatus });
  V.u = { esc, $, link, shuffle, pct, plural, fmtDate, head, empty, tagChip, tagLabel, statusBadge, cloze, recallFront, leitner, unitHTML, lessonBadge, lessonMinutes, announce, confirmInline, isObj };
  function boot() {
    main = $('main');
    V.main = main;
    initStorage();
    storageNote();
    // The skip link must not touch the hash, which is the router's.
    document.querySelector('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); main.scrollIntoView(); });
    $('track-picker').addEventListener('click', e => {
      const b = e.target.closest('[data-track]'); if (!b) return;
      const r = parse();
      if (b.dataset.track === 'field') { if (r.track !== 'field') location.hash = link('field'); return; }
      const view = V.views[r.view] ? r.view : 'today';
      if (b.dataset.track !== r.track) location.hash = link(b.dataset.track, view);
    });
    document.addEventListener('keydown', e => {
      if (!V.keys || e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target, tag = tg && tg.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (tg && tg.isContentEditable)) return;
      if ((e.key === ' ' || e.key === 'Enter') && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
      if (V.keys(e) === true) e.preventDefault();
    });
    window.addEventListener('hashchange', route);
    route();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
