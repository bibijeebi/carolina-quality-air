/* Vent Exam Lab: the drill (mastery loop) and lesson checkpoints (tutor mode). */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, $, link, shuffle, pct, plural, head, empty, announce, confirmInline } = V.u;
  const LETTERS = 'ABCDEFGH';

  /* ---------- mastery records ----------
     record: n answers, c correct, w wrong, st correct-in-a-row since the last miss, r retired (shown as mastered), m open miss,
             x misses since last retired, sd study card pending, t last answer time */
  function markMiss(r) { r.w = (r.w || 0) + 1; r.r = 0; r.st = 0; r.m = 1; r.x = (r.x || 0) + 1; if (r.x >= 2) r.sd = 1; }
  V.markMiss = markMiss;
  V.answerQ = function (qid, correct, unsure) {
    const S = V.T();
    const r = S.q[qid] || (S.q[qid] = { n: 0, c: 0, w: 0 });
    const first = !r.n;
    r.n++; r.t = Date.now();
    let out;
    if (correct) {
      r.c++;
      if (unsure) out = 'again';
      else if (r.m) { r.st = (r.st || 0) + 1; if (r.st >= 2) { r.r = 1; r.m = 0; r.x = 0; r.st = 0; r.sd = 0; out = 'retired'; } else out = 'again'; }
      else { r.r = 1; out = first ? 'retired' : 'retired'; }
    } else { markMiss(r); out = 'miss'; }
    V.save();
    return out;
  };

  // Domain-weighted random order: each domain's share of the front of the queue follows its exam weight.
  function weightedOrder(D, ids) {
    const cnt = {};
    ids.forEach(id => { const d = D.q.get(id).domain; cnt[d] = (cnt[d] || 0) + 1; });
    const wt = d => { const x = D.doms.find(z => z.name === d); return ((x && x.w) || 1) / cnt[d]; };
    return ids.map(id => [id, Math.pow(Math.random(), 1 / wt(D.q.get(id).domain))]).sort((a, b) => b[1] - a[1]).map(a => a[0]);
  }
  function interleave(a, b) { const out = []; let i = 0, j = 0; while (i < a.length || j < b.length) { if (j < b.length) out.push(b[j++]); if (j < b.length) out.push(b[j++]); if (i < a.length) out.push(a[i++]); } return out; }
  V.todayPlan = function (D) {
    const S = V.T(); const size = V.drillSize(S.plan.min);
    const misses = D.pool.filter(q => { const r = S.q[q.id]; return r && r.m && !r.r; }).sort((a, b) => (S.q[a.id].t || 0) - (S.q[b.id].t || 0)).map(q => q.id);
    const unseen = weightedOrder(D, D.pool.filter(q => !S.q[q.id] || !S.q[q.id].n).map(q => q.id));
    const soft = shuffle(D.pool.filter(q => { const r = S.q[q.id]; return r && r.n && !r.r && !r.m; }).map(q => q.id));
    let m = misses.slice(0, Math.ceil(size / 2));
    let f = unseen.slice(0, size - m.length);
    if (m.length + f.length < size) f = f.concat(soft.slice(0, size - m.length - f.length));
    if (m.length + f.length < size) m = misses.slice(0, size - f.length);
    return { miss: m, fresh: f, size };
  };
  function filterPool(D, type, val) {
    if (type === 'dom') return D.pool.filter(q => q.domain === val);
    if (type === 'lesson') { const set = new Set(D.lessonQs.get(val) || []); return D.pool.filter(q => set.has(q.id)); }
    if (type === 'misses') { const S = V.T(); return D.pool.filter(q => S.q[q.id] && S.q[q.id].m); }
    return D.pool;
  }
  function queueFor(D, type, val) {
    const S = V.T();
    if (type === 'today') { const p = V.todayPlan(D); return interleave(p.miss, p.fresh); }
    if (type === 'sim') {
      const last = S.sims[val !== undefined && val !== '' && !isNaN(+val) ? +val : S.sims.length - 1];
      if (!last) return [];
      const set = new Set();
      (last.miss || []).forEach(([qid]) => {
        const q = D.q.get(qid); if (!q) return;
        if (!q.reserved) set.add(qid);
        else (D.qu.get(qid) || []).forEach(uid => (D.uq.get(uid) || []).forEach(x => { if (!D.q.get(x).reserved) set.add(x); }));
      });
      return [...set];
    }
    const pool = filterPool(D, type, val).filter(q => !(S.q[q.id] && S.q[q.id].r)).map(q => q.id);
    const miss = pool.filter(id => S.q[id] && S.q[id].m);
    const unseen = weightedOrder(D, pool.filter(id => !S.q[id] || !S.q[id].n));
    const soft = shuffle(pool.filter(id => S.q[id] && S.q[id].n && !S.q[id].m));
    return interleave(miss, unseen.concat(soft));
  }
  function filterLabel(D, type, val) {
    if (type === 'today') return 'Today’s drill';
    if (type === 'dom') return val;
    if (type === 'lesson') { const l = D.l.get(val); return l ? 'Lesson: ' + l.title : 'Lesson'; }
    if (type === 'misses') return 'Misses';
    if (type === 'sim') return 'Sim misses';
    return 'All questions';
  }

  /* ---------- shared question card ---------- */
  // card.pick is a tentative choice in tap-then-Check mode; it is not an answer yet.
  V.choicesHTML = function (q, card, mode) {
    return `<div class="choices" role="group" aria-label="Answer choices">${card.order.map((oi, k) => {
      let cls = 'choice', extra = '';
      if (mode === 'sim') { if (card.sel === oi) cls += ' selected'; extra = ` aria-pressed="${card.sel === oi}"`; }
      else if (card.answered) {
        if (oi === 0) cls += ' correct'; else if (oi === card.chosen) cls += ' wrong';
        extra = ' disabled';
      } else if (mode === 'pick') { if (card.pick === oi) cls += ' selected'; extra = ` aria-pressed="${card.pick === oi}"`; }
      const sr = card.answered && mode !== 'sim' ? (oi === 0 ? '<span class="sr"> (correct answer)</span>' : oi === card.chosen ? '<span class="sr"> (your answer)</span>' : '') : '';
      return `<button type="button" class="${cls}" data-oi="${oi}"${extra}><span class="letter" aria-hidden="true">${LETTERS[k]}</span><span class="ctext"><span class="sr">${LETTERS[k]}. </span>${esc(q.options[oi])}${sr}</span></button>`;
    }).join('')}</div>`;
  };
  // The facts behind a question. On a phone it starts folded so the explanation is not said twice before Continue.
  V.testsHTML = function (D, q) {
    const us = (D.qu.get(q.id) || []).map(id => D.u.get(id)).filter(Boolean);
    if (!us.length) return q.ref ? `<p class="small muted ref">Reference: ${esc(q.ref)}</p>` : '';
    const wide = !window.matchMedia || window.matchMedia('(min-width: 651px)').matches;
    return `<details class="tests"${wide ? ' open' : ''}><summary class="eyebrow">The ${us.length === 1 ? 'fact' : 'facts'} behind it</summary><ul>${us.map(u => { const l = D.l.get(D.unitLesson.get(u.id)); return `<li>${V.u.tagChip(u.tag)} ${esc(u.text)}${u.src ? ` <span class="small muted">${esc(u.src)}</span>` : ''}${l ? ` <a href="${link(D.id, 'learn', l.id)}">Lesson: ${esc(l.title)}</a>` : ''}</li>`; }).join('')}</ul></details>${q.ref ? `<p class="small muted ref">Reference: ${esc(q.ref)}</p>` : ''}`;
  };
  function keyIndex(e, n) {
    const k = e.key.toLowerCase();
    if (/^[1-9]$/.test(k) && +k <= n) return +k - 1;
    const i = 'abcdefgh'.indexOf(k);
    return i >= 0 && i < n && k.length === 1 ? i : -1;
  }
  V.keyIndex = keyIndex;

  /* ---------- question-screen helpers shared with sim.js and games.js ---------- */
  // body.in-quiz is on while a question is on screen; the shell hides its nav with it. It comes off on leave.
  let quizHook = false;
  V.quizMode = function (on) {
    document.body.classList.toggle('in-quiz', !!on);
    if (on && !quizHook) { quizHook = true; V.onLeave(() => { quizHook = false; document.body.classList.remove('in-quiz'); }); }
  };
  // Tap to pick, then Check (S.plan.confirm). Off by default.
  V.pickMode = () => { const S = V.T(); return !!(S && S.plan && S.plan.confirm); };
  // Mark one button in a group as the tentative pick without redrawing the page.
  V.markPick = function (root, sel, btn) {
    root.querySelectorAll(sel).forEach(b => { const on = b === btn; b.classList.toggle('selected', on); b.setAttribute('aria-pressed', on); });
  };
  // After an answer on a phone, bring the verdict into view above the bottom bar (no jump when it is already visible).
  V.showVerdict = function () {
    const fb = V.main.querySelector('.feedback');
    if (!fb || !window.matchMedia || !window.matchMedia('(max-width: 650px)').matches) return;
    const bar = V.main.querySelector('.q-bar');
    const room = window.innerHeight - (bar ? bar.offsetHeight : 0) - 72;
    const top = fb.getBoundingClientRect().top;
    if (top > room) window.scrollBy(0, top - window.innerHeight * 0.4);
  };

  /* ---------- today's work (read by the Today screen) ----------
     S.day = { d: 'YYYY-MM-DD' local date, n: questions answered in drills today, secs: active drill seconds today,
               done: true once a drill hit its time cap, today's drill ran out of cards, or secs reached the daily minutes } */
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const capSecs = S => Math.max(1, Number(S.plan && S.plan.min) || 20) * 60;
  function dayRec(S) {
    const d = dayKey();
    if (!S.day || typeof S.day !== 'object' || S.day.d !== d) S.day = { d, n: 0, secs: 0, done: false };
    return S.day;
  }
  V.dayRec = dayRec;
  function dayCheck(S) { const dy = dayRec(S); if (!dy.done && dy.secs >= capSecs(S)) dy.done = true; return dy; }

  // Active time: counts only while a drill card is on screen, the tab is visible, and there was input in the last two minutes.
  const IDLE_MS = 120000;
  let ticker = null, lastAct = Date.now();
  ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastAct = Date.now(); });
  function stopTicker() { clearInterval(ticker); ticker = null; }
  function startTicker() { if (ticker) return; lastAct = Date.now(); ticker = setInterval(tick, 1000); V.onLeave(stopTicker); }
  function tick() {
    const S = V.T(), s = S && S.drill;
    if (!s || s.done || !V.main.querySelector('.question-panel[data-qid]')) return;
    if (document.hidden || Date.now() - lastAct > IDLE_MS) return;
    s.secs = (s.secs || 0) + 1;
    const dy = dayRec(S); dy.secs++; dayCheck(S);
    if (!s.capHit && s.secs >= s.cap) { s.capHit = true; announce('Time is up. Finish this card.'); }
    paintMeta(S, s);
    if (s.secs % 15 === 0) V.save('nav');
  }
  const missDue = (S, s) => new Set(s.queue.filter(id => S.q[id] && S.q[id].m)).size;
  function metaText(S, s) {
    const m = missDue(S, s);
    const parts = [m ? plural(m, 'miss', 'misses') + ' due' : 'No misses due'];
    if (s.capHit) parts.push('Time is up. Finish this card.');
    else { const left = Math.max(1, Math.ceil((s.cap - (s.secs || 0)) / 60)); parts.push(`about ${left} min left`); }
    return parts.join(' · ');
  }
  function paintMeta(S, s) { const el = $('d-meta'); if (el) { const t = metaText(S, s); if (el.textContent !== t) el.textContent = t; el.classList.toggle('low', !!s.capHit); } }
  // Older saved drills counted every answer in n; keep n honest (distinct planned cards answered, never above total).
  function migrate(s) {
    if (!Array.isArray(s.seen)) { s.tries = s.n || 0; s.seen = []; s.n = Math.min(s.n || 0, s.total || 0); }
    if (!(s.cap > 0)) s.cap = capSecs(V.T());
    if (!(s.secs >= 0)) s.secs = 0;
  }
  // A drill resumed on a new day gets a fresh time box.
  function rollDay(S, s) { const d = dayKey(); if (s.day !== d) { s.day = d; s.secs = 0; s.cap = capSecs(S); s.capHit = false; } }

  /* ---------- drill view ---------- */
  let flash = '', focusNext = false;
  const active = s => !!(s && !s.done && (s.queue.length || s.card));
  function newDrill(D, type, val, q) {
    const S = V.T();
    S.drill = { track: D.id, type, val: val || '', label: filterLabel(D, type, val), queue: q, total: q.length, n: 0, tries: 0, right: 0, retired: 0, miss: 0, seen: [], secs: 0, cap: capSecs(S), day: dayKey(), done: false, end: null, card: null };
  }
  V.views.drill = function (D, args) {
    const S = V.T();
    if (args[0] === 'pick') { if (S.drill) migrate(S.drill); return renderSetup(D); } // the chooser, reachable even with a drill open
    if (args[0]) {
      const type = ['today', 'dom', 'lesson', 'misses', 'all', 'sim'].includes(args[0]) ? args[0] : 'all';
      const q = queueFor(D, type, args[1]);
      if (q.length && active(S.drill)) return confirmReplace(D, type, args[1], q);
      if (q.length) newDrill(D, type, args[1], q);
      else if (active(S.drill)) V.u.announce(`Nothing to drill in ${filterLabel(D, type, args[1])}. Your current drill is still open.`);
      else flash = `Nothing to drill in ${esc(filterLabel(D, type, args[1]))}. ${type === 'misses' ? 'You have no open misses.' : type === 'sim' ? 'Those questions are saved for sims, and no practice questions cover them yet.' : 'Every question there is mastered.'}`;
      V.save();
      location.replace(link(D.id, 'drill'));
      return;
    }
    if (S.drill) migrate(S.drill);
    if (active(S.drill)) return renderCard(D);
    if (S.drill && S.drill.done) return renderSummary(D);
    renderSetup(D);
  };
  // Starting a drill from a link while another is open: ask first, never replace it silently.
  function confirmReplace(D, type, val, q) {
    const S = V.T(), s = S.drill, id = D.id;
    migrate(s);
    V.quizMode(false);
    const next = filterLabel(D, type, val);
    V.main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(D.id, 'practice')}">Practice</a> / Drill`, 'You have a drill open.', `${esc(s.label)}: ${s.n} of ${s.total} answered.`)
      + `<section class="panel resume" id="replace-box"><div class="actions"><a class="btn" href="${link(id, 'drill')}">Resume ${esc(s.label)}</a><button type="button" class="btn secondary" id="replace">Start ${esc(next)} instead</button></div></section>`;
    const box = $('replace-box');
    const ask = () => confirmInline(box, `Start ${esc(next)}? The drill you have open ends here. Its misses stay due.`, 'Start new drill', () => { newDrill(D, type, val, q); V.save(); location.replace(link(id, 'drill')); });
    box._rebind = () => { $('replace').onclick = ask; };
    ask();
  }
  function renderSetup(D) {
    const S = V.T(), id = D.id;
    V.quizMode(false); stopTicker();
    const hd = head(`${esc(D.track.code)} / <a href="${link(D.id, 'practice')}">Practice</a> / Drill`, 'Drill until it sticks.', 'One question at a time. Right on first sight masters it. A miss comes back three cards later and needs two right in a row.');
    if (!D.pool.length) { V.main.innerHTML = hd + empty('No practice questions yet.', 'Every question here is saved for exam sims.'); return; }
    const ps = V.poolStats(D, S);
    const doms = D.doms.filter(d => D.pool.some(q => q.domain === d.name));
    const lessonsQ = D.lessons.filter(l => (D.lessonQs.get(l.id) || []).length);
    const left = (type, val) => filterPool(D, type, val).filter(q => !(S.q[q.id] && S.q[q.id].r)).length;
    V.main.innerHTML = hd + (flash ? `<div class="note space-b" role="status">${flash}</div>` : '')
      + (active(S.drill) ? `<div class="note blue space-b"><p>You have a drill open: <b>${esc(S.drill.label)}</b>, ${S.drill.n} of ${S.drill.total} answered. <a href="${link(id, 'drill')}">Resume it</a>, or pick a new one below.</p></div>` : '')
      + `<div class="grid"><section class="panel"><h2>Choose what to drill</h2><fieldset class="filter-set"><legend class="sr">Drill filter</legend>`
      + `<label class="radio"><input type="radio" name="df" value="all" checked> <span><b>All questions</b><small>${left('all')} not mastered yet</small></span></label>`
      + `<label class="radio"><input type="radio" name="df" value="dom"> <span><b>One domain</b><small>Pick below</small></span></label><div class="field sub"><label class="sr" for="df-dom">Domain</label><select id="df-dom">${doms.map(d => `<option value="${esc(d.name)}">${esc(d.name)} (${left('dom', d.name)} to go)</option>`).join('')}</select></div>`
      + (lessonsQ.length ? `<label class="radio"><input type="radio" name="df" value="lesson"> <span><b>One lesson</b><small>Questions on a lesson’s facts</small></span></label><div class="field sub"><label class="sr" for="df-lesson">Lesson</label><select id="df-lesson">${lessonsQ.map(l => `<option value="${esc(l.id)}">${esc(l.title)} (${left('lesson', l.id)} to go)</option>`).join('')}</select></div>`
        : `<p class="radio-off small muted">${D.lessons.length ? 'Lesson filter: no questions are linked to lessons yet.' : 'Lesson filter: lessons are on the way.'}</p>`)
      + `<label class="radio"><input type="radio" name="df" value="misses"${ps.miss ? '' : ' disabled'}> <span><b>Misses only</b><small>${ps.miss ? plural(ps.miss, 'open miss', 'open misses') : 'No open misses'}</small></span></label>`
      + `</fieldset><label class="radio check-mode"><input type="checkbox" id="df-confirm"${S.plan.confirm ? ' checked' : ''}> <span><b>Tap to pick, then Check</b><small>For gloves or a bumpy ride. The first tap only picks an answer.</small></span></label>`
      + `<div class="actions space"><button type="button" class="btn" id="df-start">Start drill</button><span class="small muted" id="df-count" role="status"></span></div></section>`
      + `<section class="panel"><h2>Where you stand</h2><div class="metrics three compact"><div class="metric"><b>${ps.retired}</b><span>Mastered</span></div><div class="metric"><b>${ps.miss}</b><span>Open misses</span></div><div class="metric"><b>${ps.unseen}</b><span>Unseen</span></div></div><h3 class="space">How it works</h3><ul class="plain-list small"><li>Right on first sight masters a question.</li><li>A miss shows the answer and why, then comes back three cards later. Two right in a row masters it.</li><li>Miss it twice and it comes back as a study card first.</li><li>Guessing? Turn on Not sure before you answer. A right guess then comes back instead of counting as mastered.</li><li>The drill stops at your ${S.plan.min} minutes a day. Misses you have not fixed stay due for tomorrow.</li><li>Sim-only questions never appear here, so sims stay fresh.</li></ul><p class="keys-hint">Keys: <kbd>1</kbd>-<kbd>4</kbd> or <kbd>A</kbd>-<kbd>D</kbd> answer, <kbd>0</kbd> I don’t know, <kbd>N</kbd> not sure, <kbd>Space</kbd> continue.</p></section></div>`;
    flash = '';
    const upd = () => {
      const v = (V.main.querySelector('input[name=df]:checked') || {}).value;
      const val = v === 'dom' ? $('df-dom').value : v === 'lesson' && $('df-lesson') ? $('df-lesson').value : '';
      const n = v === 'misses' ? ps.miss : left(v, val);
      $('df-count').textContent = plural(n, 'question') + ' in this drill';
      return [v, val];
    };
    V.main.querySelectorAll('input[name=df]').forEach(r => r.onchange = upd);
    $('df-dom').onchange = () => { V.main.querySelector('input[value=dom]').checked = true; upd(); };
    if ($('df-lesson')) $('df-lesson').onchange = () => { V.main.querySelector('input[value=lesson]').checked = true; upd(); };
    $('df-confirm').onchange = e => { S.plan.confirm = !!e.target.checked; S.planAt = Date.now(); V.save(); };
    $('df-start').onclick = () => { const [v, val] = upd(); location.replace(val ? link(id, 'drill', v, val) : link(id, 'drill', v)); };
    upd();
  }
  function renderCard(D) {
    const S = V.T(), s = S.drill;
    rollDay(S, s);
    let card = s.card;
    if (card && !D.q.get(card.qid)) card = s.card = null;
    if (!card) {
      const qid = s.queue[0];
      const q = D.q.get(qid);
      if (!q || q.reserved) { s.queue.shift(); V.save(); return s.queue.length ? renderCard(D) : finish(D, 'queue'); }
      const r = S.q[qid];
      const study = !!(r && r.sd);
      // The shuffled order lives on the saved card, so a resume or redraw shows the same A-D.
      card = s.card = { qid, order: shuffle(q.options.map((_, i) => i)), answered: false, chosen: null, pick: null, unsure: false, study, outcome: null,
        status: study ? 'Study card' : !r || !r.n ? 'New question' : r.m ? `Missed before · ${r.st || 0} of 2 in a row` : r.r ? 'Mastered, back for review' : 'Seen before' };
      V.save('nav');
    }
    V.quizMode(true);
    startTicker();
    const q = D.q.get(card.qid);
    const pick = V.pickMode() && !card.answered && !card.study;
    const done = s.total ? Math.min(100, pct(s.n, s.total)) : 0;
    let body;
    if (card.study) {
      body = `<div class="study-card"><p class="note">You missed this twice. Read the answer now. It comes back as a question in three cards.</p><h2 class="quiz-title" id="q-stem">${esc(q.stem)}</h2><div class="choices"><div class="choice correct static"><span class="letter" aria-hidden="true">✓</span><span class="ctext">${esc(q.options[0])}</span></div></div><div class="feedback"><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom q-bar"><span class="small muted keys-hint">Space to continue</span><button type="button" class="btn" id="next">Continue</button></div></div>`;
    } else {
      body = `<h2 class="quiz-title" id="q-stem">${esc(q.stem)}</h2>${V.choicesHTML(q, card, pick ? 'pick' : undefined)}`
        + (card.answered ? feedbackHTML(D, q, card)
          : `<div class="q-tools"><button type="button" class="btn secondary small" id="idk">I don’t know, show me</button><button type="button" class="toggle" id="unsure" aria-pressed="${card.unsure}" aria-describedby="unsure-help"><span class="knob" aria-hidden="true"></span>Not sure</button></div><p class="small muted tool-help" id="unsure-help">Guessing? Turn on Not sure before you answer. A right guess comes back later instead of counting as mastered.</p>`
          + (pick ? `<div class="quiz-bottom q-bar"><span class="small muted">${card.pick == null ? 'Tap an answer, then Check.' : 'Check it, or tap another answer.'}</span><button type="button" class="btn" id="check"${card.pick == null ? ' disabled' : ''}>Check</button></div>` : ''));
    }
    V.main.innerHTML = `<div class="quiz-wrap"><div class="quiz-top"><button type="button" class="btn text small" id="end">End drill</button><span class="qlabel">${esc(s.label)}</span><strong id="d-count" aria-label="${s.n} of ${s.total} planned questions answered">${s.n} / ${s.total} answered</strong></div><div class="progress" aria-hidden="true"><i style="width:${done}%"></i></div><p class="drill-meta small muted" id="d-meta">${metaText(S, s)}</p>`
      + `<section class="panel question-panel" data-qid="${esc(card.qid)}"><div class="row-between"><p class="eyebrow">${card.status}</p><span class="badge">${esc(q.domain)}</span></div>${body}</section></div>`;
    $('end').onclick = () => finish(D, 'manual');
    const next = $('next');
    if (next) next.onclick = advance;
    if (!card.answered && !card.study) {
      V.main.querySelectorAll('.choice[data-oi]').forEach(b => b.onclick = () => (pick ? choose(+b.dataset.oi, b) : answer(D, +b.dataset.oi)));
      $('idk').onclick = () => answer(D, -1);
      $('unsure').onclick = () => { card.unsure = !card.unsure; $('unsure').setAttribute('aria-pressed', card.unsure); };
      if (pick) $('check').onclick = () => { if (card.pick != null) answer(D, card.pick); };
    }
    function choose(oi, btn) {
      card.pick = oi;
      V.markPick(V.main, '.choice[data-oi]', btn || V.main.querySelector(`.choice[data-oi="${oi}"]`));
      const ck = $('check'); ck.disabled = false;
      ck.previousElementSibling.textContent = 'Check it, or tap another answer.';
    }
    if (next && focusNext) { next.focus({ preventScroll: true }); focusNext = false; }
    V.keys = e => {
      if (card.answered || card.study) { if (e.key === ' ' || e.key === 'Enter') { advance(); return true; } return false; }
      if (e.key === '0' || e.key === '?') { answer(D, -1); return true; }
      if (e.key.toLowerCase() === 'n') { $('unsure').click(); return true; }
      if (pick && (e.key === 'Enter' || e.key === ' ')) { if (card.pick != null) answer(D, card.pick); return true; }
      const i = keyIndex(e, card.order.length);
      if (i >= 0) { if (pick) choose(card.order[i]); else answer(D, card.order[i]); return true; }
      return false;
    };
  }
  function feedbackHTML(D, q, card) {
    const ok = card.chosen === 0;
    const letter = LETTERS[card.order.indexOf(0)];
    let msg;
    if (ok) msg = card.outcome === 'retired' ? 'Correct. Mastered.' : card.unsure ? 'Correct, but you marked it not sure. It comes back.' : 'Correct. One more in a row masters it.';
    else msg = (card.chosen === -1 ? 'Counted as a miss.' : 'Not quite.') + ` The answer is ${letter}.`;
    const after = card.outcome === 'retired' ? '' : card.outcome === 'miss' ? 'Comes back in 3 cards.' : 'Comes back in a few cards.';
    return `<div class="feedback${ok ? '' : ' wrong'}"><b>${msg}</b><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom q-bar"><span class="small muted">${after}</span><button type="button" class="btn" id="next">Continue</button></div>`;
  }
  function requeue(queue, qid, gap) { const at = Math.min(gap, queue.length); queue.splice(at, 0, qid); }
  function answer(D, oi) {
    const S = V.T(), s = S.drill, card = s.card;
    if (!card || card.answered) return;
    const q = D.q.get(card.qid);
    const correct = oi === 0;
    card.answered = true; card.chosen = oi; card.pick = null;
    card.outcome = V.answerQ(card.qid, correct, card.unsure);
    s.queue.shift();
    s.tries = (s.tries || 0) + 1;
    const dy = dayRec(S);
    if (!s.seen.includes(card.qid)) { s.seen.push(card.qid); if (s.n < s.total) s.n++; dy.n++; }
    if (correct) s.right++;
    if (card.outcome === 'retired') s.retired++;
    if (card.outcome === 'miss') { s.miss++; requeue(s.queue, card.qid, 3); }
    if (card.outcome === 'again') requeue(s.queue, card.qid, 5);
    dayCheck(S);
    V.save();
    focusNext = true;
    renderCard(D);
    V.showVerdict();
    announce(correct ? (card.outcome === 'retired' ? 'Correct. Mastered.' : 'Correct.') : `Incorrect. The answer is ${LETTERS[card.order.indexOf(0)]}: ${q.options[0]}`);
  }
  function advance() {
    const D = V.data[V.cur], S = V.T(), s = S.drill, card = s.card;
    if (card && card.study) {
      const r = S.q[card.qid]; if (r) r.sd = 0;
      s.queue.shift(); requeue(s.queue, card.qid, 3);
    }
    s.card = null;
    V.save();
    if (!s.queue.length) return finish(D, 'queue');
    if (s.capHit || s.secs >= s.cap) return finish(D, 'cap');
    renderCard(D);
    window.scrollTo(0, 0);
    // Focus the question, not choice A, so a second Enter from Continue can't answer it.
    const st = document.querySelector('.question-panel'); if (st) { st.setAttribute('tabindex', '-1'); st.focus({ preventScroll: true }); }
  }
  // why: 'queue' ran out of cards, 'cap' hit the time box, 'manual' End drill
  function finish(D, why) {
    const S = V.T(), s = S.drill;
    s.done = true; s.end = why; s.card = null;
    const dy = dayRec(S);
    if (why === 'cap' || s.capHit || (why === 'queue' && s.type === 'today')) dy.done = true;
    dayCheck(S);
    V.save();
    renderSummary(D);
    window.scrollTo(0, 0);
  }
  function renderSummary(D) {
    const S = V.T(), s = S.drill, id = D.id;
    V.keys = null;
    V.quizMode(false); stopTicker();
    migrate(s);
    const ps = V.poolStats(D, S);
    const mine = s.seen.filter(qid => S.q[qid] && S.q[qid].m).length;
    const capEnd = s.end === 'cap' && s.queue.length > 0;
    const mins = Math.max(1, Math.round((s.secs || 0) / 60));
    const title = capEnd ? (s.kept ? `That’s ${plural(mins, 'minute')}.` : `That’s your ${plural(S.plan.min, 'minute')}.`) : s.queue.length ? 'Drill ended.' : 'Drill complete.';
    const carried = ps.miss ? `${plural(ps.miss, 'miss', 'misses')} carried to tomorrow${mine && mine < ps.miss ? ` (${mine} from this drill)` : ''}.` : 'No misses to carry over.';
    const lead = capEnd ? carried : esc(s.label);
    const acts = capEnd
      ? `<button type="button" class="btn" id="keep-going">Keep going</button><a class="btn secondary" id="done" href="${link(id, 'today')}">Done</a>${ps.miss ? `<a class="btn text" href="${link(id, 'drill', 'misses')}">Drill ${plural(ps.miss, 'miss', 'misses')}</a>` : ''}`
      : `${ps.miss ? `<a class="btn" href="${link(id, 'drill', 'misses')}">Drill ${plural(ps.miss, 'miss', 'misses')}</a>` : ''}<button type="button" class="btn secondary" id="new-drill">New drill</button><a class="btn text" href="${link(id, 'today')}">Back to Today</a>`;
    V.main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(D.id, 'practice')}">Practice</a> / Drill`, title, lead)
      + `<div class="grid"><section class="panel"><div class="metrics three compact"><div class="metric"><b>${s.n}<span>/${s.total}</span></b><span>Answered</span></div><div class="metric"><b>${s.retired}</b><span>Mastered</span></div><div class="metric"><b>${ps.miss}</b><span>Misses due</span></div></div>`
      + `<p class="space">${s.tries ? `${pct(s.right, s.tries)}% right on ${plural(s.tries, 'answer')}, repeats included. ` : 'No answers this time. '}${capEnd ? `${plural(s.queue.length, 'card')} left in this drill.` : !s.queue.length ? '' : `${plural(s.queue.length, 'card')} not reached.`} ${ps.left} of ${ps.n} questions not mastered yet.</p>`
      + `${!capEnd && ps.miss ? `<p class="small muted space-sm">${carried}</p>` : ''}<div class="actions space">${acts}</div></section>`
      + `<section class="panel"><h2>Next step</h2><p class="muted space-sm">${ps.retired / Math.max(1, ps.n) >= 0.8 ? 'Most of the pool is mastered. A sim shows where you stand.' : 'Short daily drills beat one long one. Come back tomorrow for new questions and due misses.'}</p><div class="actions space"><a class="btn secondary" href="${link(id, 'sim')}">Exam sim</a><a class="btn secondary" href="${link(id, 'games')}">Games</a></div></section></div>`;
    const nd = $('new-drill'); if (nd) nd.onclick = () => { S.drill = null; V.save(); renderSetup(D); };
    const kg = $('keep-going');
    if (kg) {
      kg.onclick = () => { s.done = false; s.end = null; s.capHit = false; s.cap = (s.secs || 0) + capSecs(S); s.kept = (s.kept || 0) + 1; V.save(); renderCard(D); window.scrollTo(0, 0); };
      kg.focus({ preventScroll: true });
    }
  }

  /* ---------- lesson checkpoint ---------- */
  let cp = null;
  V.checkpoint = function (D, lid) {
    const S = V.T(), id = D.id, l = D.l.get(lid);
    if (!l) { V.main.innerHTML = empty('That lesson is not here.', '', `<a class="btn" href="${link(id, 'learn')}">All lessons</a>`); return; }
    if (!cp || cp.track !== id || cp.lid !== lid || cp.finished) {
      const qs = D.lessonQs.get(lid) || [];
      const units = l.units.filter(u => D.u.has(u));
      cp = qs.length ? { track: id, lid, kind: 'q', items: shuffle(qs).slice(0, 6), i: 0, right: 0, misses: [], card: null }
        : { track: id, lid, kind: 'recall', items: units.slice(), i: 0, right: 0, misses: [], shown: false };
      S.ls[lid] = Object.assign({}, S.ls[lid], { read: (S.ls[lid] && S.ls[lid].read) || Date.now() });
      V.save();
    }
    drawCheckpoint(D, l);
  };
  function drawCheckpoint(D, l) {
    const S = V.T(), id = D.id;
    const top = `<div class="quiz-top"><a class="btn text small" href="${link(id, 'learn', l.id)}">Back to lesson</a><span class="qlabel">Checkpoint: ${esc(l.title)}</span><strong>${Math.min(cp.i + 1, cp.items.length)} / ${cp.items.length}</strong></div><div class="progress" aria-hidden="true"><i style="width:${pct(cp.i, cp.items.length)}%"></i></div>`;
    if (cp.i >= cp.items.length) {
      const all = cp.right === cp.items.length;
      if (all) { S.ls[l.id] = Object.assign({}, S.ls[l.id], { passed: Date.now() }); V.save(); }
      cp.finished = true;
      V.keys = null;
      V.quizMode(false);
      const next = D.lessons[l.idx + 1];
      V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="panel question-panel"><p class="eyebrow">Checkpoint result</p><div class="result-top"><div class="result-score">${cp.right}/${cp.items.length}</div><div><h2>${all ? 'Passed.' : 'Not yet.'}</h2><p class="muted">${all ? 'Every answer right. This lesson is marked checkpoint passed.' : 'Get every item right to pass. Review the misses below, then retry.'}</p></div></div>`
        + (cp.misses.length ? `<h3>Review</h3>${cp.misses.map(m => `<div class="review-item">${m}</div>`).join('')}` : '')
        + `<div class="actions space"><button type="button" class="btn${all ? ' secondary' : ''}" id="cp-retry">Retry checkpoint</button><a class="btn secondary" href="${link(id, 'learn', l.id)}">Back to lesson</a>${next ? `<a class="btn${all ? '' : ' secondary'}" href="${link(id, 'learn', next.id)}">Next lesson</a>` : ''}</div></section></div>`;
      $('cp-retry').onclick = () => { cp = null; V.checkpoint(D, l.id); };
      V.u.announce(all ? 'Checkpoint passed.' : `Checkpoint: ${cp.right} of ${cp.items.length}.`);
      return;
    }
    V.quizMode(true);
    if (cp.kind === 'q') {
      const q = D.q.get(cp.items[cp.i]);
      if (!cp.card || cp.card.qid !== q.id) cp.card = { qid: q.id, order: shuffle(q.options.map((_, i) => i)), answered: false, chosen: null, pick: null };
      const c = cp.card;
      const ok = c.chosen === 0;
      const pm = V.pickMode() && !c.answered;
      V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="panel question-panel"><div class="row-between"><p class="eyebrow">Checkpoint</p><span class="badge">${esc(q.domain)}</span></div><h2 class="quiz-title">${esc(q.stem)}</h2>${V.choicesHTML(q, c, pm ? 'pick' : undefined)}`
        + (c.answered ? `<div class="feedback${ok ? '' : ' wrong'}"><b>${ok ? 'Correct.' : `Not quite. The answer is ${LETTERS[c.order.indexOf(0)]}.`}</b><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom q-bar"><span class="small muted keys-hint">Space to continue</span><button type="button" class="btn" id="cp-next">${cp.i + 1 < cp.items.length ? 'Next question' : 'See result'}</button></div>`
          : pm ? `<div class="quiz-bottom q-bar"><span class="small muted">Tap an answer, then Check.</span><button type="button" class="btn" id="cp-check"${c.pick == null ? ' disabled' : ''}>Check</button></div>` : '')
        + '</section></div>';
      const pick = oi => {
        if (c.answered) return;
        c.answered = true; c.chosen = oi;
        V.answerQ(q.id, oi === 0, false);
        if (oi === 0) cp.right++; else cp.misses.push(`<h3>${esc(q.stem)}</h3><p><b>Answer:</b> ${esc(q.options[0])}</p><p class="muted">${esc(q.expl)}</p>`);
        drawCheckpoint(D, l);
        const n = $('cp-next'); if (n) n.focus({ preventScroll: true });
        V.showVerdict();
        V.u.announce(oi === 0 ? 'Correct.' : `Incorrect. The answer is ${q.options[0]}`);
      };
      const nextQ = () => { cp.i++; drawCheckpoint(D, l); window.scrollTo(0, 0); };
      const choose = oi => { c.pick = oi; V.markPick(V.main, '.choice[data-oi]', V.main.querySelector(`.choice[data-oi="${oi}"]`)); $('cp-check').disabled = false; };
      V.main.querySelectorAll('.choice[data-oi]').forEach(b => b.onclick = () => (pm ? choose(+b.dataset.oi) : pick(+b.dataset.oi)));
      const ck = $('cp-check'); if (ck) ck.onclick = () => { if (c.pick != null) pick(c.pick); };
      const n = $('cp-next'); if (n) n.onclick = nextQ;
      V.keys = e => {
        if (c.answered) { if (e.key === ' ' || e.key === 'Enter') { nextQ(); return true; } return false; }
        if (pm && (e.key === 'Enter' || e.key === ' ')) { if (c.pick != null) pick(c.pick); return true; }
        const i = keyIndex(e, c.order.length); if (i >= 0) { (pm ? choose : pick)(c.order[i]); return true; } return false;
      };
      return;
    }
    // recall-card checkpoint
    const u = D.u.get(cp.items[cp.i]);
    const f = V.u.recallFront(u);
    V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="flashcard"><p class="eyebrow">${f.kind === 'prompt' ? 'Recall' : 'Fill the blank'}</p><h2>${f.html}</h2>`
      + (cp.shown ? `<div class="back"><p class="unit-text">${f.back}</p>${u.trap ? `<p class="trap"><b>Trap:</b> ${esc(u.trap)}</p>` : ''}<p class="unit-foot">${esc(u.src || '')}</p></div>` : '')
      + `</section><div class="recall-controls q-bar">${cp.shown ? '<button type="button" class="btn secondary" id="rc-miss">Missed it</button><button type="button" class="btn" id="rc-knew">Knew it</button>' : '<button type="button" class="btn" id="rc-show">Show answer</button>'}</div><p class="keys-hint center">${cp.shown ? 'Keys: <kbd>1</kbd> missed it, <kbd>2</kbd> knew it' : 'Say it out loud, then <kbd>Space</kbd> to flip'}</p></div>`;
    const show = () => { cp.shown = true; drawCheckpoint(D, l); const k = $('rc-knew'); if (k) k.focus({ preventScroll: true }); };
    const rate = knew => { V.u.leitner(u.id, knew); if (knew) cp.right++; else cp.misses.push(`<p>${esc(u.text)}</p><p class="small muted">${esc(u.src || '')}</p>`); cp.i++; cp.shown = false; drawCheckpoint(D, l); const s = $('rc-show'); if (s) s.focus({ preventScroll: true }); };
    if (cp.shown) { $('rc-miss').onclick = () => rate(false); $('rc-knew').onclick = () => rate(true); } else $('rc-show').onclick = show;
    V.keys = e => {
      if (!cp.shown) { if (e.key === ' ' || e.key === 'Enter') { show(); return true; } return false; }
      if (e.key === '1') { rate(false); return true; }
      if (e.key === '2') { rate(true); return true; }
      return false;
    };
  }
})();
