/* Vent Exam Lab: games hub and four games (obligation levels, numbers, put it in order, recall cards). */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, $, link, shuffle, pct, plural, head, empty, fmtDate, tagLabel, recallFront, leitner, announce } = V.u;
  const GAMES = {
    oblig: { title: 'Required or recommended', per: 20, blurb: 'Read the rule and its source. Say how strong the obligation is.' },
    numbers: { title: 'Numbers', per: 15, blurb: 'Distances, sizes, counts, and limits. Pick the right number from its neighbors.' },
    order: { title: 'Put it in order', per: 5, blurb: 'Tap the steps of a procedure in the order the source gives.' },
    recall: { title: 'Recall cards', per: 20, blurb: 'Say the answer, flip, and rate yourself. Cards you know come back less often.' }
  };
  const rounds = {}; // in-memory round per track and game

  function avail(D, kind) {
    if (kind === 'oblig') { const lv = levels(D); return lv.length >= 2 ? D.oblig.length : 0; }
    if (kind === 'numbers') return D.nums.length;
    if (kind === 'order') return D.seqs.length;
    return D.units.length;
  }
  const levels = D => V.OBLIG.filter(t => D.oblig.some(u => u.tag === t));
  function emptyReason(D, kind) {
    if (kind === 'oblig') return D.oblig.length ? 'Only one obligation level is tagged so far, so there is nothing to choose between yet.' : 'No facts with obligation tags yet for this credential.';
    if (kind === 'numbers') return 'No number facts yet for this credential.';
    if (kind === 'order') return 'No step sequences yet for this credential.';
    return 'No facts yet for this credential.';
  }

  V.views.games = function (D, args) {
    const kind = args[0];
    if (!kind || !GAMES[kind]) return hub(D);
    if (!avail(D, kind)) {
      V.main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(D.id, 'games')}">Games</a>`, esc(GAMES[kind].title)) + empty('Nothing to play yet.', emptyReason(D, kind), `<a class="btn" href="${link(D.id, 'games')}">All games</a>`);
      return;
    }
    if (kind === 'recall') return recall(D, args);
    const key = D.id + ':' + kind;
    if (!rounds[key] || rounds[key].over) rounds[key] = newRound(D, kind);
    draw(D, rounds[key]);
  };
  function hub(D) {
    const S = V.T(), id = D.id;
    V.quizMode(false);
    const now = Date.now();
    const due = D.units.filter(u => S.rc[u.id] && S.rc[u.id].d <= now).length;
    V.main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(D.id, 'practice')}">Practice</a> / Games`, 'Short rounds, real facts.', 'Short rounds with a score, a streak, and a review of what you missed. Games never use exam-sim questions.')
      + (Object.keys(GAMES).every(k => !avail(D, k)) ? `<div class="note blue space-b"><p>Games are built from facts, and the ${esc(D.track.code)} facts are still being written. The question bank is ready now.</p><div class="actions space-sm"><a class="btn small" href="${link(id, 'drill')}">Open the drill</a><a class="btn secondary small" href="${link(id, 'sim')}">Exam sim</a></div></div>` : '')
      + `<div class="game-grid">${Object.entries(GAMES).map(([k, g]) => {
        const n = avail(D, k), best = S.best[k];
        const count = k === 'oblig' ? plural(n, 'rule') : k === 'numbers' ? plural(n, 'number fact') : k === 'order' ? plural(n, 'sequence') : plural(n, 'card') + (due ? `, ${due} due` : '');
        return `<section class="panel game-card${n ? '' : ' off'}"><p class="eyebrow">${k === 'order' ? `Up to ${g.per} per round` : `${g.per} per round`}</p><h2>${g.title}</h2><p class="muted">${g.blurb}</p><p class="small space-sm">${n ? count + ' in play' : emptyReason(D, k)}${best ? ` · Best ${best.s}/${best.n}` : ''}</p>${n ? `<a class="btn space" href="${link(id, 'games', k)}">Play</a>` : ''}</section>`;
      }).join('')}</div>`;
  }
  function newRound(D, kind) {
    const g = GAMES[kind];
    let items;
    if (kind === 'oblig') items = shuffle(D.oblig).slice(0, g.per).map(u => ({ u, ans: u.tag }));
    else if (kind === 'numbers') items = shuffle(D.nums).slice(0, g.per).map(u => ({ u, opts: shuffle([u.num.a].concat(u.num.d.filter(x => x !== u.num.a).slice(0, 3))) }));
    else items = shuffle(D.seqs).slice(0, g.per).map(s => { const idx = s.steps.map((_, i) => i); let p = shuffle(idx); for (let k = 0; k < 5 && p.every((v, i) => v === i); k++) p = shuffle(idx); return { s, pool: p, picked: [] }; });
    return { kind, items, i: 0, score: 0, streak: 0, best: 0, misses: [], answered: false, over: false };
  }
  function frame(D, R, body) {
    const g = GAMES[R.kind];
    return `<div class="quiz-wrap"><div class="quiz-top"><a class="btn text small" href="${link(D.id, 'games')}">All games</a><span class="qlabel">${g.title}</span><strong>${Math.min(R.i + 1, R.items.length)} / ${R.items.length}</strong></div><div class="progress" aria-hidden="true"><i style="width:${pct(R.i + (R.answered ? 1 : 0), R.items.length)}%"></i></div><div class="game-score" aria-label="Score"><span>Score <b>${R.score}</b></span><span>Streak <b>${R.streak}</b></span><span>Best streak <b>${R.best}</b></span></div>${body}</div>`;
  }
  function score(R, ok, missHTML) {
    if (ok) { R.score++; R.streak++; R.best = Math.max(R.best, R.streak); } else { R.streak = 0; R.misses.push(missHTML); }
  }
  function next(D, R) {
    R.i++; R.answered = false;
    if (R.i >= R.items.length) { R.over = true; saveBest(R); }
    draw(D, R);
    window.scrollTo(0, 0);
    const f = R.over ? $('again') : V.main.querySelector('.question-panel, .game-text, .quiz-wrap'); if (f) { if (!R.over) f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
  }
  function saveBest(R) {
    const S = V.T(), b = S.best[R.kind];
    if (!b || R.score / R.items.length > b.s / b.n) { S.best[R.kind] = { s: R.score, n: R.items.length }; V.save(); }
  }
  function endScreen(D, R, again) {
    V.keys = null;
    V.quizMode(false);
    return frame(D, R, `<section class="panel question-panel"><p class="eyebrow">Round complete</p><div class="result-top"><div class="result-score">${R.score}/${R.items.length}</div><div><h2>${R.score === R.items.length ? 'Clean round.' : pct(R.score, R.items.length) >= 80 ? 'Strong round.' : 'Keep at it.'}</h2><p class="muted">Best streak ${R.best}.</p></div></div>${R.misses.length ? `<h3>Review your misses</h3>${R.misses.map(m => `<div class="review-item">${m}</div>`).join('')}` : ''}<div class="actions space"><button type="button" class="btn" id="again">Play again</button><a class="btn secondary" href="${link(D.id, 'games')}">All games</a></div></section>`);
  }
  function draw(D, R) {
    if (R.over) {
      V.main.innerHTML = endScreen(D, R);
      $('again').onclick = () => { const key = D.id + ':' + R.kind; rounds[key] = newRound(D, R.kind); draw(D, rounds[key]); window.scrollTo(0, 0); };
      return;
    }
    V.quizMode(true);
    if (R.kind === 'order') return drawOrder(D, R);
    const it = R.items[R.i], u = it.u;
    const pm = V.pickMode() && !R.answered;
    let prompt, opts, answer, label;
    if (R.kind === 'oblig') {
      opts = levels(D); answer = it.ans; label = t => tagLabel(t);
      prompt = `<p class="eyebrow">How strong is this rule?</p><blockquote class="game-text">${esc(u.text)}</blockquote>${u.src ? `<p class="unit-foot">${esc(u.src)}</p>` : ''}`;
    } else {
      opts = it.opts; answer = u.num.a; label = x => x;
      prompt = `<p class="eyebrow">Fill in the number</p><h2 class="quiz-title">${esc(u.num.q).replace(/_{2,}/g, '<span class="blank">_____</span>')}</h2>`;
    }
    const fb = R.answered ? `<div class="feedback${R.pick === answer ? '' : ' wrong'}"><b>${R.pick === answer ? 'Correct.' : `Not quite. It is ${esc(label(answer))}.`}</b>${R.kind === 'numbers' ? `<p>${esc(u.text)}</p>` : ''}${u.trap ? `<p class="trap"><b>Trap:</b> ${esc(u.trap)}</p>` : ''}${u.src ? `<p class="small muted">${esc(u.src)}</p>` : ''}</div><div class="quiz-bottom end q-bar"><button type="button" class="btn" id="gnext">${R.i + 1 < R.items.length ? 'Next' : 'See results'}</button></div>`
      : pm ? `<div class="quiz-bottom q-bar"><span class="small muted">Tap an answer, then Check.</span><button type="button" class="btn" id="gcheck"${R.sel == null ? ' disabled' : ''}>Check</button></div>` : '';
    V.main.innerHTML = frame(D, R, `<section class="panel question-panel">${prompt}<div class="opts ${R.kind}">${opts.map((o, k) => {
      let cls = 'opt';
      if (R.answered) { if (o === answer) cls += ' correct'; else if (o === R.pick) cls += ' wrong'; }
      else if (pm && R.sel === k) cls += ' selected';
      return `<button type="button" class="${cls}" data-k="${k}"${R.answered ? ' disabled' : pm ? ` aria-pressed="${R.sel === k}"` : ''}><span class="letter" aria-hidden="true">${k + 1}</span>${esc(label(o))}</button>`;
    }).join('')}</div>${fb}</section>`);
    const pick = k => {
      if (R.answered) return;
      R.answered = true; R.pick = opts[k]; R.sel = null;
      const ok = R.pick === answer;
      score(R, ok, R.kind === 'oblig' ? `<p>${esc(u.text)}</p><p class="small"><b>${esc(label(answer))}</b>, you said ${esc(label(R.pick))}. ${esc(u.src || '')}</p>` : `<p>${esc(u.num.q)}</p><p class="small"><b>${esc(answer)}</b>, you said ${esc(R.pick)}. ${esc(u.src || '')}</p>`);
      draw(D, R);
      const n = $('gnext'); if (n) n.focus({ preventScroll: true });
      V.showVerdict();
      announce(ok ? 'Correct.' : `Not quite. It is ${label(answer)}.`);
    };
    const choose = k => { R.sel = k; V.markPick(V.main, '.opt', V.main.querySelector(`.opt[data-k="${k}"]`)); $('gcheck').disabled = false; };
    V.main.querySelectorAll('.opt').forEach(b => b.onclick = () => (pm ? choose(+b.dataset.k) : pick(+b.dataset.k)));
    const gc = $('gcheck'); if (gc) gc.onclick = () => { if (R.sel != null) pick(R.sel); };
    const n = $('gnext'); if (n) n.onclick = () => next(D, R);
    V.keys = e => {
      if (R.answered) { if (e.key === ' ' || e.key === 'Enter') { next(D, R); return true; } return false; }
      if (pm && (e.key === 'Enter' || e.key === ' ')) { if (R.sel != null) pick(R.sel); return true; }
      const k = /^[1-9]$/.test(e.key) ? +e.key - 1 : -1;
      if (k >= 0 && k < opts.length) { (pm ? choose : pick)(k); return true; }
      return false;
    };
  }
  function drawOrder(D, R) {
    const it = R.items[R.i], s = it.s;
    const placed = it.picked, left = it.pool.filter(i => !placed.includes(i));
    const checked = R.answered;
    const allRight = checked && placed.every((v, k) => v === k);
    V.main.innerHTML = frame(D, R, `<section class="panel question-panel"><p class="eyebrow">Put it in order</p><h2 class="quiz-title">${esc(s.title || 'Order these steps')}</h2>${s.src ? `<p class="unit-foot">${esc(s.src)}</p>` : ''}`
      + `<p class="small muted space-sm">${checked ? '' : 'Tap the steps in order. Tap a placed step to put it back.'}</p>`
      + `<ol class="order-answer" aria-label="Your order">${placed.map((si, k) => `<li><button type="button" class="step placed${checked ? (si === k ? ' right' : ' wrong') : ''}" data-back="${k}"${checked ? ' disabled' : ''}><span class="letter" aria-hidden="true">${k + 1}</span>${esc(s.steps[si])}${checked ? `<span class="sr">${si === k ? ' (right place)' : ' (wrong place)'}</span>` : ''}</button></li>`).join('')}${checked ? '' : s.steps.slice(placed.length).map((_, k) => `<li class="slot" aria-hidden="true"><span class="letter">${placed.length + k + 1}</span></li>`).join('')}</ol>`
      + (checked ? '' : `<div class="order-pool" aria-label="Steps to place">${left.map(si => `<button type="button" class="step" data-si="${si}">${esc(s.steps[si])}</button>`).join('')}</div><div class="quiz-bottom q-bar"><button type="button" class="btn" id="ocheck"${left.length ? ' disabled' : ''}>Check order</button><button type="button" class="btn secondary" id="oclear"${placed.length ? '' : ' disabled'}>Clear</button></div>`)
      + (checked ? `<div class="feedback${allRight ? '' : ' wrong'}"><b>${allRight ? 'Correct order.' : `${placed.filter((v, k) => v === k).length} of ${s.steps.length} in the right place.`}</b>${allRight ? '' : `<p>The correct order:</p><ol class="plain-list">${s.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`}</div><div class="quiz-bottom end q-bar"><button type="button" class="btn" id="gnext">${R.i + 1 < R.items.length ? 'Next' : 'See results'}</button></div>` : '')
      + '</section>');
    const focusFirst = () => { const f = V.main.querySelector('.order-pool .step') || $('ocheck'); if (f) f.focus({ preventScroll: true }); };
    V.main.querySelectorAll('[data-si]').forEach(b => b.onclick = () => { placed.push(+b.dataset.si); drawOrder(D, R); focusFirst(); });
    V.main.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { placed.splice(+b.dataset.back, 1); drawOrder(D, R); focusFirst(); });
    const ck = $('ocheck');
    if (ck) ck.onclick = () => {
      R.answered = true;
      const ok = placed.every((v, k) => v === k);
      score(R, ok, `<p><b>${esc(s.title || '')}</b></p><ol class="plain-list">${s.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`);
      drawOrder(D, R);
      const n = $('gnext'); if (n) n.focus({ preventScroll: true });
      V.showVerdict();
      announce(ok ? 'Correct order.' : 'Not quite. The correct order is shown.');
    };
    const cl = $('oclear'); if (cl) cl.onclick = () => { placed.length = 0; drawOrder(D, R); focusFirst(); };
    const n = $('gnext'); if (n) n.onclick = () => next(D, R);
    V.keys = e => { if (R.answered && (e.key === ' ' || e.key === 'Enter')) { next(D, R); return true; } return false; };
  }

  /* ---------- recall cards ---------- */
  const rf = { track: null, dom: '', lesson: '' };
  function recall(D, args) {
    const key = D.id + ':recall';
    const R = rounds[key];
    if (R && !R.over && R.items.length) return drawRecall(D, R);
    delete rounds[key];
    recallSetup(D);
  }
  function filtered(D) {
    return D.units.filter(u => (!rf.dom || u.dom === rf.dom) && (!rf.lesson || D.unitLesson.get(u.id) === rf.lesson));
  }
  function recallSetup(D) {
    const S = V.T(), id = D.id, now = Date.now();
    V.quizMode(false);
    if (rf.track !== id) Object.assign(rf, { track: id, dom: '', lesson: '' });
    const list = filtered(D);
    const due = list.filter(u => S.rc[u.id] && S.rc[u.id].d <= now);
    const fresh = list.filter(u => !S.rc[u.id]);
    const later = list.filter(u => S.rc[u.id] && S.rc[u.id].d > now).sort((a, b) => S.rc[a.id].d - S.rc[b.id].d);
    const boxes = [0, 0, 0, 0, 0, 0];
    list.forEach(u => { if (S.rc[u.id]) boxes[S.rc[u.id].b || 0]++; });
    const doms = D.doms.filter(d => D.units.some(u => u.dom === d.name));
    const lessons = D.lessons.filter(l => !rf.dom || l.dom === rf.dom);
    V.main.innerHTML = head(`${esc(D.track.code)} / <a href="${link(id, 'games')}">Games</a>`, 'Recall cards.', 'Say the answer out loud before you flip. Knew it moves the card to a longer interval (1, 3, 7, 16, then 35 days). Missed it brings it back today.')
      + `<div class="grid"><section class="panel"><h2>Choose cards</h2><div class="field space"><label for="rf-dom">Domain</label><select id="rf-dom"><option value="">All domains</option>${doms.map(d => `<option${rf.dom === d.name ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div><div class="field space"><label for="rf-lesson">Lesson</label><select id="rf-lesson"><option value="">All lessons</option>${lessons.map(l => `<option value="${esc(l.id)}"${rf.lesson === l.id ? ' selected' : ''}>${esc(l.title)}</option>`).join('')}</select></div>`
      + `<div class="metrics three compact space"><div class="metric"><b>${due.length}</b><span>Due now</span></div><div class="metric"><b>${fresh.length}</b><span>New</span></div><div class="metric"><b>${later.length}</b><span>Scheduled</span></div></div>`
      + `<div class="actions space">${due.length + fresh.length ? `<button type="button" class="btn" id="rc-start">Start round (${Math.min(20, due.length + fresh.length)} cards)</button>` : `<p class="muted">Nothing due in this filter.${later.length ? ` Next card due ${fmtDate(S.rc[later[0].id].d)}.` : ''}</p>`}${list.length ? `<button type="button" class="btn secondary" id="rc-any">Practice anyway</button>` : ''}</div></section>`
      + `<section class="panel"><h2>Card piles</h2><p class="small muted space-sm">Cards move up a pile each time you know them and drop back to pile 1 when you miss. Pile 2 and up counts as known.</p><div class="boxes">${boxes.map((n, b) => `<div class="box"><b>${n}</b><span>Pile ${b}</span></div>`).join('')}</div></section></div>`;
    $('rf-dom').onchange = e => { rf.dom = e.target.value; rf.lesson = ''; recallSetup(D); $('rf-dom').focus(); };
    $('rf-lesson').onchange = e => { rf.lesson = e.target.value; recallSetup(D); $('rf-lesson').focus(); };
    const st = $('rc-start');
    if (st) st.onclick = () => startRecall(D, due.sort((a, b) => S.rc[a.id].d - S.rc[b.id].d).concat(fresh).slice(0, 20));
    const any = $('rc-any');
    if (any) any.onclick = () => startRecall(D, shuffle(list).slice(0, 20));
  }
  function startRecall(D, units) {
    const key = D.id + ':recall';
    rounds[key] = { kind: 'recall', items: units.map(u => ({ u })), i: 0, score: 0, streak: 0, best: 0, misses: [], answered: false, over: false };
    drawRecall(D, rounds[key]);
    window.scrollTo(0, 0);
    const f = $('rc-show'); if (f) f.focus({ preventScroll: true });
  }
  function drawRecall(D, R) {
    if (R.over) {
      V.main.innerHTML = endScreen(D, R).replace('id="again">Play again', 'id="again">Another round');
      $('again').onclick = () => { delete rounds[D.id + ':recall']; recallSetup(D); window.scrollTo(0, 0); };
      return;
    }
    V.quizMode(true);
    const u = R.items[R.i].u, f = recallFront(u), l = D.l.get(D.unitLesson.get(u.id));
    V.main.innerHTML = frame(D, R, `<section class="flashcard"><p class="eyebrow">${l ? esc(l.title) : esc(u.dom || '')}${f.kind === 'cloze' ? ' · fill the blank' : ''}</p><h2>${f.html}</h2>`
      + (R.answered ? `<div class="back">${V.u.tagChip(u.tag)}<p class="unit-text">${f.back}</p>${u.trap ? `<p class="trap"><b>Trap:</b> ${esc(u.trap)}</p>` : ''}${u.src ? `<p class="unit-foot">${esc(u.src)}</p>` : ''}</div>` : '')
      + `</section><div class="recall-controls q-bar">${R.answered ? '<button type="button" class="btn secondary" id="rc-miss">Missed it</button><button type="button" class="btn" id="rc-knew">Knew it</button>' : '<button type="button" class="btn" id="rc-show">Show answer</button>'}</div><p class="keys-hint center">${R.answered ? 'Keys: <kbd>1</kbd> missed it, <kbd>2</kbd> knew it' : 'Say it, then <kbd>Space</kbd> to flip'}</p>`);
    const show = () => { R.answered = true; drawRecall(D, R); const k = $('rc-knew'); if (k) k.focus({ preventScroll: true }); };
    const rate = knew => {
      leitner(u.id, knew);
      score(R, knew, `<p>${esc(u.text)}</p><p class="small muted">${esc(u.src || '')}</p>`);
      R.i++; R.answered = false;
      if (R.i >= R.items.length) { R.over = true; saveBest(R); }
      drawRecall(D, R);
      const n = $('rc-show') || $('again'); if (n) n.focus({ preventScroll: true });
    };
    if (R.answered) { $('rc-miss').onclick = () => rate(false); $('rc-knew').onclick = () => rate(true); } else $('rc-show').onclick = show;
    V.keys = e => {
      if (!R.answered) { if (e.key === ' ' || e.key === 'Enter') { show(); return true; } return false; }
      if (e.key === '1') { rate(false); return true; }
      if (e.key === '2') { rate(true); return true; }
      return false;
    };
  }
})();
