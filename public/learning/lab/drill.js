/* Vent Exam Lab: the drill (mastery loop) and lesson checkpoints (tutor mode). */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, $, link, shuffle, pct, plural, head, empty, announce } = V.u;
  const LETTERS = 'ABCDEFGH';

  /* ---------- mastery records ----------
     record: n answers, c correct, w wrong, st correct-in-a-row since the last miss, r retired, m open miss,
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
  V.choicesHTML = function (q, card, mode) {
    return `<div class="choices" role="group" aria-label="Answer choices">${card.order.map((oi, k) => {
      let cls = 'choice', extra = '';
      if (mode === 'sim') { if (card.sel === oi) cls += ' selected'; extra = ` aria-pressed="${card.sel === oi}"`; }
      else if (card.answered) {
        if (oi === 0) cls += ' correct'; else if (oi === card.chosen) cls += ' wrong';
        extra = ' disabled';
      }
      const sr = card.answered && mode !== 'sim' ? (oi === 0 ? '<span class="sr"> (correct answer)</span>' : oi === card.chosen ? '<span class="sr"> (your answer)</span>' : '') : '';
      return `<button type="button" class="${cls}" data-oi="${oi}"${extra}><span class="letter" aria-hidden="true">${LETTERS[k]}</span><span class="ctext"><span class="sr">${LETTERS[k]}. </span>${esc(q.options[oi])}${sr}</span></button>`;
    }).join('')}</div>`;
  };
  V.testsHTML = function (D, q) {
    const us = (D.qu.get(q.id) || []).map(id => D.u.get(id)).filter(Boolean);
    if (!us.length) return q.ref ? `<p class="small muted ref">Reference: ${esc(q.ref)}</p>` : '';
    return `<div class="tests"><p class="eyebrow">Tests</p><ul>${us.map(u => { const l = D.l.get(D.unitLesson.get(u.id)); return `<li>${V.u.tagChip(u.tag)} ${esc(u.text)}${u.src ? ` <span class="small muted">${esc(u.src)}</span>` : ''}${l ? ` <a href="${link(D.id, 'learn', l.id)}">Lesson: ${esc(l.title)}</a>` : ''}</li>`; }).join('')}</ul></div>${q.ref ? `<p class="small muted ref">Reference: ${esc(q.ref)}</p>` : ''}`;
  };
  function keyIndex(e, n) {
    const k = e.key.toLowerCase();
    if (/^[1-9]$/.test(k) && +k <= n) return +k - 1;
    const i = 'abcdefgh'.indexOf(k);
    return i >= 0 && i < n && k.length === 1 ? i : -1;
  }
  V.keyIndex = keyIndex;

  /* ---------- drill view ---------- */
  let card = null; // on-screen card state for the current track's drill
  let flash = '';
  V.views.drill = function (D, args) {
    const S = V.T();
    if (args[0]) {
      const type = ['today', 'dom', 'lesson', 'misses', 'all', 'sim'].includes(args[0]) ? args[0] : 'all';
      const q = queueFor(D, type, args[1]);
      if (q.length) { S.drill = { track: D.id, type, val: args[1] || '', label: filterLabel(D, type, args[1]), queue: q, total: q.length, n: 0, right: 0, retired: 0, miss: 0, done: false }; card = null; }
      else if (S.drill && !S.drill.done && S.drill.queue.length) V.u.announce(`Nothing to drill in ${filterLabel(D, type, args[1])}. Your current drill is still open.`);
      else flash = `Nothing to drill in ${esc(filterLabel(D, type, args[1]))}. ${type === 'misses' ? 'You have no open misses.' : type === 'sim' ? 'Those questions are saved for sims, and no practice questions cover them yet.' : 'Every question there is retired.'}`;
      V.save();
      location.replace(link(D.id, 'drill'));
      return;
    }
    if (card && card.track !== D.id) card = null;
    if (S.drill && !S.drill.done && (S.drill.queue.length || (card && card.answered))) return renderCard(D);
    if (S.drill && S.drill.done) return renderSummary(D);
    renderSetup(D);
  };
  function renderSetup(D) {
    const S = V.T(), id = D.id;
    const hd = head(`${esc(D.track.code)} / Drill`, 'Drill until it sticks.', 'One question at a time. Right on first sight retires it. A miss comes back three cards later and needs two correct in a row.');
    if (!D.pool.length) { V.main.innerHTML = hd + empty('No practice questions yet.', 'Every question here is saved for exam sims.'); return; }
    const ps = V.poolStats(D, S);
    const doms = D.doms.filter(d => D.pool.some(q => q.domain === d.name));
    const lessonsQ = D.lessons.filter(l => (D.lessonQs.get(l.id) || []).length);
    const left = (type, val) => filterPool(D, type, val).filter(q => !(S.q[q.id] && S.q[q.id].r)).length;
    V.main.innerHTML = hd + (flash ? `<div class="note space-b" role="status">${flash}</div>` : '')
      + `<div class="grid"><section class="panel"><h2>Choose what to drill</h2><fieldset class="filter-set"><legend class="sr">Drill filter</legend>`
      + `<label class="radio"><input type="radio" name="df" value="all" checked> <span><b>All questions</b><small>${left('all')} left</small></span></label>`
      + `<label class="radio"><input type="radio" name="df" value="dom"> <span><b>One domain</b><small>Pick below</small></span></label><div class="field sub"><label class="sr" for="df-dom">Domain</label><select id="df-dom">${doms.map(d => `<option value="${esc(d.name)}">${esc(d.name)} (${left('dom', d.name)} left)</option>`).join('')}</select></div>`
      + (lessonsQ.length ? `<label class="radio"><input type="radio" name="df" value="lesson"> <span><b>One lesson</b><small>Questions linked to a lesson’s units</small></span></label><div class="field sub"><label class="sr" for="df-lesson">Lesson</label><select id="df-lesson">${lessonsQ.map(l => `<option value="${esc(l.id)}">${esc(l.title)} (${left('lesson', l.id)} left)</option>`).join('')}</select></div>`
        : `<p class="radio-off small muted">${D.lessons.length ? 'Lesson filter: no questions are linked to lessons yet.' : 'Lesson filter: lessons are on the way.'}</p>`)
      + `<label class="radio"><input type="radio" name="df" value="misses"${ps.miss ? '' : ' disabled'}> <span><b>Misses only</b><small>${ps.miss ? plural(ps.miss, 'open miss', 'open misses') : 'No open misses'}</small></span></label>`
      + `</fieldset><div class="actions space"><button type="button" class="btn" id="df-start">Start drill</button><span class="small muted" id="df-count" role="status"></span></div></section>`
      + `<section class="panel"><h2>Where you stand</h2><div class="metrics three compact"><div class="metric"><b>${ps.retired}</b><span>Retired</span></div><div class="metric"><b>${ps.miss}</b><span>Open misses</span></div><div class="metric"><b>${ps.unseen}</b><span>Unseen</span></div></div><h3 class="space">How it works</h3><ul class="plain-list small"><li>Right on first sight retires a question.</li><li>A miss shows the answer and explanation, then comes back three cards later. Two correct in a row retires it.</li><li>Miss it twice and it comes back as a study card first.</li><li>Turn on Not sure before you answer and a right answer will not retire it.</li><li>Sim-only questions never appear here, so sims stay fresh.</li></ul><p class="keys-hint">Keys: <kbd>1</kbd>-<kbd>4</kbd> or <kbd>A</kbd>-<kbd>D</kbd> answer, <kbd>0</kbd> I don’t know, <kbd>N</kbd> not sure, <kbd>Space</kbd> continue.</p></section></div>`;
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
    $('df-start').onclick = () => { const [v, val] = upd(); location.replace(val ? link(id, 'drill', v, val) : link(id, 'drill', v)); };
    upd();
  }
  function renderCard(D) {
    const S = V.T(), s = S.drill, id = D.id;
    if (!card || card.done) {
      const qid = s.queue[0];
      const q = D.q.get(qid);
      if (!q || q.reserved) { s.queue.shift(); V.save(); return s.queue.length ? renderCard(D) : finish(D); }
      const r = S.q[qid];
      const study = !!(r && r.sd);
      card = { track: id, qid, order: shuffle(q.options.map((_, i) => i)), answered: false, chosen: null, unsure: false, study, outcome: null,
        status: study ? 'Study card' : !r || !r.n ? 'New question' : r.m ? `Missed before · ${r.st || 0} of 2 in a row` : r.r ? 'Retired, back for review' : 'Seen before' };
    }
    const q = D.q.get(card.qid);
    const left = s.queue.length;
    const status = card.status;
    const done = s.total ? Math.min(100, pct(s.n, s.n + s.queue.length)) : 0;
    let body;
    if (card.study) {
      body = `<div class="study-card"><p class="note">You missed this twice. Read the answer now. It comes back as a question in three cards.</p><h2 class="quiz-title" id="q-stem">${esc(q.stem)}</h2><div class="choices"><div class="choice correct static"><span class="letter" aria-hidden="true">✓</span><span class="ctext">${esc(q.options[0])}</span></div></div><div class="feedback"><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom"><span class="small muted">Space to continue</span><button type="button" class="btn" id="next">Continue</button></div></div>`;
    } else {
      const fb = card.answered ? feedbackHTML(D, q) : '';
      body = `<h2 class="quiz-title" id="q-stem">${esc(q.stem)}</h2>${V.choicesHTML(q, card)}`
        + (card.answered ? fb : `<div class="q-tools"><button type="button" class="btn secondary small" id="idk">I don’t know</button><button type="button" class="toggle" id="unsure" aria-pressed="${card.unsure}"><span class="knob" aria-hidden="true"></span>Not sure</button></div>`);
    }
    V.main.innerHTML = `<div class="quiz-wrap"><div class="quiz-top"><button type="button" class="btn text small" id="end">End drill</button><span class="qlabel">${esc(s.label)}</span><strong>${plural(left, 'left', 'left')}</strong></div><div class="progress" aria-hidden="true"><i style="width:${done}%"></i></div>`
      + `<section class="panel question-panel" data-qid="${esc(card.qid)}"><div class="row-between"><p class="eyebrow">${status}</p><span class="badge">${esc(q.domain)}</span></div>${body}</section></div>`;
    $('end').onclick = () => { s.done = true; card = null; V.save(); renderSummary(D); };
    const next = $('next');
    if (next) next.onclick = advance;
    if (!card.answered && !card.study) {
      V.main.querySelectorAll('.choice[data-oi]').forEach(b => b.onclick = () => answer(D, +b.dataset.oi));
      $('idk').onclick = () => answer(D, -1);
      $('unsure').onclick = () => { card.unsure = !card.unsure; $('unsure').setAttribute('aria-pressed', card.unsure); };
    }
    if (next && card.focusNext) { next.focus({ preventScroll: true }); card.focusNext = false; }
    V.keys = e => {
      if (card.answered || card.study) { if (e.key === ' ' || e.key === 'Enter') { advance(); return true; } return false; }
      if (e.key === '0' || e.key === '?') { answer(D, -1); return true; }
      if (e.key.toLowerCase() === 'n') { $('unsure').click(); return true; }
      const i = keyIndex(e, card.order.length);
      if (i >= 0) { answer(D, card.order[i]); return true; }
      return false;
    };
  }
  function feedbackHTML(D, q) {
    const ok = card.chosen === 0;
    const letter = LETTERS[card.order.indexOf(0)];
    let msg;
    if (ok) msg = card.outcome === 'retired' ? 'Correct. Retired.' : card.unsure ? 'Correct, but you marked it not sure. It comes back.' : 'Correct. One more in a row retires it.';
    else msg = (card.chosen === -1 ? 'Counted as a miss.' : 'Not quite.') + ` The answer is ${letter}.`;
    const after = card.outcome === 'retired' ? '' : card.outcome === 'miss' ? 'Comes back in 3 cards.' : 'Comes back in a few cards.';
    return `<div class="feedback${ok ? '' : ' wrong'}"><b>${msg}</b><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom"><span class="small muted">${after}</span><button type="button" class="btn" id="next">Continue</button></div>`;
  }
  function requeue(queue, qid, gap) { const at = Math.min(gap, queue.length); queue.splice(at, 0, qid); }
  function answer(D, oi) {
    if (card.answered) return;
    const S = V.T(), s = S.drill, q = D.q.get(card.qid);
    const correct = oi === 0;
    card.answered = true; card.chosen = oi;
    card.outcome = V.answerQ(card.qid, correct, card.unsure);
    s.queue.shift();
    s.n++;
    if (correct) s.right++;
    if (card.outcome === 'retired') s.retired++;
    if (card.outcome === 'miss') { s.miss++; requeue(s.queue, card.qid, 3); }
    if (card.outcome === 'again') requeue(s.queue, card.qid, 5);
    V.save();
    card.focusNext = true;
    renderCard(D);
    announce(correct ? (card.outcome === 'retired' ? 'Correct. Retired.' : 'Correct.') : `Incorrect. The answer is ${LETTERS[card.order.indexOf(0)]}: ${q.options[0]}`);
  }
  function advance() {
    const D = V.data[V.cur], S = V.T(), s = S.drill;
    if (card && card.study) {
      const r = S.q[card.qid]; if (r) r.sd = 0;
      s.queue.shift(); requeue(s.queue, card.qid, 3); V.save();
    }
    card = null;
    if (!s.queue.length) return finish(D);
    renderCard(D);
    window.scrollTo(0, 0);
    // Focus the question, not choice A, so a second Enter from Continue can't answer it.
    const st = document.querySelector('.question-panel'); if (st) { st.setAttribute('tabindex', '-1'); st.focus({ preventScroll: true }); }
  }
  function finish(D) { const s = V.T().drill; s.done = true; V.save(); renderSummary(D); }
  function renderSummary(D) {
    const S = V.T(), s = S.drill, id = D.id;
    V.keys = null;
    const ps = V.poolStats(D, S);
    V.main.innerHTML = head(`${esc(D.track.code)} / Drill`, s.queue.length ? 'Drill ended.' : 'Drill complete.', esc(s.label))
      + `<div class="grid"><section class="panel"><div class="metrics three compact"><div class="metric"><b>${s.n}</b><span>Answered</span></div><div class="metric"><b>${s.retired}</b><span>Retired</span></div><div class="metric"><b>${s.miss}</b><span>Misses</span></div></div><p class="space">${s.n ? `${pct(s.right, s.n)}% correct this drill.` : 'No answers this time.'} ${ps.left} of ${ps.n} questions left in the bank.</p><div class="actions space">${ps.miss ? `<a class="btn" href="${link(id, 'drill', 'misses')}">Drill ${plural(ps.miss, 'miss', 'misses')}</a>` : ''}<button type="button" class="btn secondary" id="new-drill">New drill</button><a class="btn text" href="${link(id, 'today')}">Back to Today</a></div></section>`
      + `<section class="panel"><h2>Next step</h2><p class="muted space-sm">${ps.retired / Math.max(1, ps.n) >= 0.8 ? 'Most of the pool is retired. A sim shows where you stand.' : 'Short daily drills beat one long one. Come back tomorrow for new questions and due misses.'}</p><div class="actions space"><a class="btn secondary" href="${link(id, 'sim')}">Exam sim</a><a class="btn secondary" href="${link(id, 'games')}">Games</a></div></section></div>`;
    $('new-drill').onclick = () => { S.drill = null; card = null; V.save(); renderSetup(D); };
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
      const next = D.lessons[l.idx + 1];
      V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="panel question-panel"><p class="eyebrow">Checkpoint result</p><div class="result-top"><div class="result-score">${cp.right}/${cp.items.length}</div><div><h2>${all ? 'Passed.' : 'Not yet.'}</h2><p class="muted">${all ? 'Every answer right. This lesson is marked checkpoint passed.' : 'Get every item right to pass. Review the misses below, then retry.'}</p></div></div>`
        + (cp.misses.length ? `<h3>Review</h3>${cp.misses.map(m => `<div class="review-item">${m}</div>`).join('')}` : '')
        + `<div class="actions space"><button type="button" class="btn${all ? ' secondary' : ''}" id="cp-retry">Retry checkpoint</button><a class="btn secondary" href="${link(id, 'learn', l.id)}">Back to lesson</a>${next ? `<a class="btn${all ? '' : ' secondary'}" href="${link(id, 'learn', next.id)}">Next lesson</a>` : ''}</div></section></div>`;
      $('cp-retry').onclick = () => { cp = null; V.checkpoint(D, l.id); };
      V.u.announce(all ? 'Checkpoint passed.' : `Checkpoint: ${cp.right} of ${cp.items.length}.`);
      return;
    }
    if (cp.kind === 'q') {
      const q = D.q.get(cp.items[cp.i]);
      if (!cp.card || cp.card.qid !== q.id) cp.card = { qid: q.id, order: shuffle(q.options.map((_, i) => i)), answered: false, chosen: null };
      const c = cp.card;
      const ok = c.chosen === 0;
      V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="panel question-panel"><div class="row-between"><p class="eyebrow">Checkpoint</p><span class="badge">${esc(q.domain)}</span></div><h2 class="quiz-title">${esc(q.stem)}</h2>${V.choicesHTML(q, c)}`
        + (c.answered ? `<div class="feedback${ok ? '' : ' wrong'}"><b>${ok ? 'Correct.' : `Not quite. The answer is ${LETTERS[c.order.indexOf(0)]}.`}</b><p>${esc(q.expl)}</p>${V.testsHTML(D, q)}</div><div class="quiz-bottom"><span></span><button type="button" class="btn" id="cp-next">${cp.i + 1 < cp.items.length ? 'Next question' : 'See result'}</button></div>` : '')
        + '</section></div>';
      const pick = oi => {
        if (c.answered) return;
        c.answered = true; c.chosen = oi;
        V.answerQ(q.id, oi === 0, false);
        if (oi === 0) cp.right++; else cp.misses.push(`<h3>${esc(q.stem)}</h3><p><b>Answer:</b> ${esc(q.options[0])}</p><p class="muted">${esc(q.expl)}</p>`);
        drawCheckpoint(D, l);
        const n = $('cp-next'); if (n) n.focus({ preventScroll: true });
        V.u.announce(oi === 0 ? 'Correct.' : `Incorrect. The answer is ${q.options[0]}`);
      };
      const nextQ = () => { cp.i++; drawCheckpoint(D, l); window.scrollTo(0, 0); };
      V.main.querySelectorAll('.choice[data-oi]').forEach(b => b.onclick = () => pick(+b.dataset.oi));
      const n = $('cp-next'); if (n) n.onclick = nextQ;
      V.keys = e => {
        if (c.answered) { if (e.key === ' ' || e.key === 'Enter') { nextQ(); return true; } return false; }
        const i = keyIndex(e, c.order.length); if (i >= 0) { pick(c.order[i]); return true; } return false;
      };
      return;
    }
    // recall-card checkpoint
    const u = D.u.get(cp.items[cp.i]);
    const f = V.u.recallFront(u);
    V.main.innerHTML = `<div class="quiz-wrap">${top}<section class="flashcard"><p class="eyebrow">${f.kind === 'prompt' ? 'Recall' : 'Fill the blank'}</p><h2>${f.html}</h2>`
      + (cp.shown ? `<div class="back"><p class="unit-text">${f.back}</p>${u.trap ? `<p class="trap"><b>Trap:</b> ${esc(u.trap)}</p>` : ''}<p class="unit-foot">${esc(u.src || '')}</p></div>` : '')
      + `</section><div class="recall-controls">${cp.shown ? '<button type="button" class="btn secondary" id="rc-miss">Missed it</button><button type="button" class="btn" id="rc-knew">Knew it</button>' : '<button type="button" class="btn" id="rc-show">Show answer</button>'}</div><p class="keys-hint center">${cp.shown ? 'Keys: <kbd>1</kbd> missed it, <kbd>2</kbd> knew it' : 'Say it out loud, then <kbd>Space</kbd> to flip'}</p></div>`;
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
