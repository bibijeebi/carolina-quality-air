/* Vent Exam Lab: exam simulation (draw by domain weight, timer, flags, jump grid, score report, history). */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, $, link, shuffle, pct, plural, head, empty, fmtDate, confirmInline } = V.u;
  const LETTERS = 'ABCDEFGH';

  const exposure = (S, qid) => ((S.q[qid] && S.q[qid].n) || 0) + (S.exp[qid] || 0);
  // Largest-remainder quotas from blueprint weights.
  function quotas(n, doms) {
    const tot = doms.reduce((a, d) => a + d.w, 0) || 1;
    const raw = doms.map(d => ({ name: d.name, exact: (n * d.w) / tot }));
    raw.forEach(r => { r.q = Math.floor(r.exact); r.f = r.exact - r.q; });
    let rem = n - raw.reduce((a, r) => a + r.q, 0);
    raw.slice().sort((a, b) => b.f - a.f).forEach(r => { if (rem > 0) { r.q++; rem--; } });
    return raw;
  }
  // Priority within a domain: reserved never used in a sim, then non-reserved non-depth by lowest exposure, then the rest.
  function ranked(D, S, list) {
    const tier = q => (q.reserved && !(S.exp[q.id] > 0) ? 0 : !q.reserved && (q.tier || 0) < 2 ? 1 : q.reserved ? 2 : 3);
    return shuffle(list).map(q => [q, tier(q), exposure(S, q.id)]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(a => a[0]);
  }
  function draw(D, n) {
    const S = V.T();
    const eligible = D.qs.filter(q => q.reserved || (q.tier || 0) < 2);
    n = Math.min(n, eligible.length);
    const doms = D.doms.filter(d => d.w > 0 && eligible.some(q => q.domain === d.name));
    const picked = [], used = new Set();
    quotas(n, doms).forEach(r => {
      ranked(D, S, eligible.filter(q => q.domain === r.name)).slice(0, r.q).forEach(q => { picked.push(q.id); used.add(q.id); });
    });
    if (picked.length < n) ranked(D, S, eligible.filter(q => !used.has(q.id))).slice(0, n - picked.length).forEach(q => picked.push(q.id));
    return shuffle(picked);
  }
  const secsPerQ = D => { const e = D.track.exam || {}; return e.questions && e.minutes ? (e.minutes * 60) / e.questions : 84; };
  const clock = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

  V.views.sim = function (D, args) {
    if (args[0] === 'run') return run(D);
    if (args[0] === 'report') return report(D, args[1]);
    setup(D);
  };
  function setup(D) {
    const S = V.T(), id = D.id, tr = D.track, e = tr.exam || {};
    const hd = head(`${esc(tr.code)} / Exam sim`, 'Practice under exam conditions.', `${V.wPub(D) ? 'Drawn by domain weight' : 'Drawn evenly across the modules'} ${V.ePub(D) ? 'at the exam pace' : 'at a practice pace'}${e.questions ? ` (${e.minutes} minutes for ${e.questions} questions${V.ePub(D) ? '' : ', not a published format'})` : ''}. No feedback until you submit.`);
    if (!D.qs.length) { V.main.innerHTML = hd + empty('No questions yet.', 'Sims need a question bank.'); return; }
    const fresh = D.qs.filter(q => q.reserved && !(S.exp[q.id] > 0)).length;
    const lens = V.simLengths(D);
    const act = S.sim;
    V.main.innerHTML = hd
      + (act ? `<section class="panel resume" id="resume-box"><div><p class="eyebrow">${Date.now() >= act.end ? 'Time ran out' : 'Sim in progress'}</p><h2>${esc(act.label)}: ${act.items.filter(i => i.a != null).length} of ${act.items.length} answered</h2><p class="muted small">${Date.now() >= act.end ? 'The clock ran out while you were away. Score it as it stands, or discard it.' : `${clock((act.end - Date.now()) / 1000)} left on the clock. The clock keeps running while you are away.`}</p></div><div class="actions"><a class="btn" href="${link(id, 'sim', 'run')}">${Date.now() >= act.end ? 'Score it' : 'Resume'}</a><button type="button" class="btn secondary" id="discard">Discard</button></div></section>` : '')
      + `<div class="sim-grid">${lens.map(([n, label]) => { const m = Math.round((n * secsPerQ(D)) / 60); return `<section class="panel sim-card"><p class="eyebrow">${esc(label)}</p><h2>${n} questions</h2><p class="muted">${m} minutes${Number(n) === Number(e.questions) && V.ePub(D) ? ', the real exam length' : ''}.</p><button type="button" class="btn${act ? ' secondary' : ''}" data-len="${n}" data-label="${esc(label)}"${act ? ' disabled' : ''}>Start ${n}-question sim</button></section>`; }).join('')}</div>`
      + `<div class="grid space-lg"><section class="panel"><h2>How questions are drawn</h2><ul class="plain-list small"><li>${V.wPub(D) ? 'Each domain gets its share of the exam weight.' : 'Each module gets an equal share, since NADCA publishes no weights.'}</li><li>Sim-only questions you have not seen in a sim come first. They never appear in the drill or games. ${plural(fresh, 'sim-only question')} ${fresh === 1 ? 'is' : 'are'} still fresh.</li><li>Then practice questions you have seen least. The extra-hard depth questions stay out of sims.</li><li>Flag questions and jump around. Submit when ready, or the clock submits for you.</li></ul>${e.cutNote ? `<p class="note space">${esc(e.cutNote)}</p>` : ''}</section>`
      + `<section class="panel"><h2>Sim history</h2>${S.sims.length ? `<div class="history">${S.sims.slice().reverse().map((s, i) => `<a class="history-row" href="${link(id, 'sim', 'report', S.sims.length - 1 - i)}"><span>${fmtDate(s.ts)} · ${esc(s.label || '')} ${s.total}q</span><b class="${s.pct >= (Number(e.cut) || 0) ? 'ok' : 'bad'}">${s.pct}%</b></a>`).join('')}</div>` : '<p class="muted space">No sims yet.</p>'}</section></div>`;
    V.main.querySelectorAll('[data-len]').forEach(b => b.onclick = () => start(D, +b.dataset.len, b.dataset.label));
    const dc = $('discard');
    if (dc) {
      const box = $('resume-box').querySelector('.actions');
      const bind = () => { $('discard').onclick = () => confirmInline(box, 'Discard this sim? It will not be scored.', 'Discard sim', () => { S.sim = null; V.save(); setup(D); }, true); };
      box._rebind = bind; bind();
    }
  }
  function start(D, n, label) {
    const S = V.T();
    const ids = draw(D, n);
    if (!ids.length) return;
    const now = Date.now();
    S.sim = { label, len: n, items: ids.map(qid => ({ q: qid, o: shuffle(D.q.get(qid).options.map((_, i) => i)), a: null, f: 0 })), cur: 0, start: now, end: now + Math.round(ids.length * secsPerQ(D) * 1000) };
    V.save();
    location.hash = link(D.id, 'sim', 'run');
  }
  let simTimer = null;
  function run(D) {
    const S = V.T(), sim = S.sim, id = D.id;
    if (!sim) { location.replace(link(id, 'sim')); return; }
    if (Date.now() >= sim.end) return finish(D, 'time');
    const it = sim.items[sim.cur], q = D.q.get(it.q);
    if (!q) { sim.items.splice(sim.cur, 1); sim.cur = Math.min(sim.cur, sim.items.length - 1); V.save(); return sim.items.length ? run(D) : (S.sim = null, V.save(), setup(D)); }
    const answered = sim.items.filter(i => i.a != null).length;
    V.main.innerHTML = `<div class="quiz-wrap"><div class="quiz-top"><a class="btn text small" href="${link(id, 'sim')}">Save and leave</a><span class="qlabel">${esc(sim.label)} · ${answered}/${sim.items.length} answered</span><strong id="sim-clock" role="timer" aria-label="Time left">${clock((sim.end - Date.now()) / 1000)}</strong></div><div class="progress" aria-hidden="true"><i style="width:${pct(answered, sim.items.length)}%"></i></div>`
      + `<section class="panel question-panel"><div class="row-between"><p class="eyebrow">Question ${sim.cur + 1} of ${sim.items.length}</p><button type="button" class="toggle flag" id="flag" aria-pressed="${!!it.f}"><span class="knob" aria-hidden="true"></span>Flag</button></div><h2 class="quiz-title">${esc(q.stem)}</h2>${V.choicesHTML(q, { order: it.o, sel: it.a }, 'sim')}`
      + `<div class="quiz-bottom"><button type="button" class="btn secondary" id="prev"${sim.cur ? '' : ' disabled'}>Previous</button><button type="button" class="btn" id="nextq">${sim.cur + 1 < sim.items.length ? 'Next' : 'Review and submit'}</button></div></section>`
      + `<section class="panel"><div class="row-between"><p class="eyebrow">Jump to a question</p><span class="small muted legend"><i class="lg done"></i>answered <i class="lg flag"></i>flagged</span></div><div class="quiz-pagination">${sim.items.map((x, i) => `<button type="button" class="qjump${x.a != null ? ' done' : ''}${x.f ? ' flag' : ''}${i === sim.cur ? ' current' : ''}" data-j="${i}" aria-label="Question ${i + 1}${x.a != null ? ', answered' : ''}${x.f ? ', flagged' : ''}"${i === sim.cur ? ' aria-current="true"' : ''}>${i + 1}</button>`).join('')}</div><div class="submit-zone space" id="submit-zone"><button type="button" class="btn" id="submit">Submit sim</button></div></section></div>`;
    const goto = i => { sim.cur = Math.max(0, Math.min(sim.items.length - 1, i)); V.save(); run(D); window.scrollTo(0, 0); };
    const choose = oi => { it.a = oi; V.save(); run(D); const b = V.main.querySelector(`.choice[data-oi="${oi}"]`); if (b) b.focus({ preventScroll: true }); };
    V.main.querySelectorAll('.choice[data-oi]').forEach(b => b.onclick = () => choose(+b.dataset.oi));
    V.main.querySelectorAll('[data-j]').forEach(b => b.onclick = () => goto(+b.dataset.j));
    $('flag').onclick = () => { it.f = it.f ? 0 : 1; V.save(); run(D); const f = $('flag'); if (f) f.focus({ preventScroll: true }); };
    $('prev').onclick = () => goto(sim.cur - 1);
    $('nextq').onclick = () => { if (sim.cur + 1 < sim.items.length) goto(sim.cur + 1); else { $('submit').click(); $('submit-zone').scrollIntoView({ block: 'center' }); } };
    const zone = $('submit-zone');
    const bindSubmit = () => {
      $('submit').onclick = () => {
        const un = sim.items.filter(i => i.a == null).length, fl = sim.items.filter(i => i.f).length;
        confirmInline(zone, `Submit now?${un ? ` ${plural(un, 'question')} unanswered.` : ' Every question is answered.'}${fl ? ` ${plural(fl, 'flag')} still set.` : ''}`, 'Submit sim', () => finish(D, 'submit'));
      };
    };
    zone._rebind = bindSubmit; bindSubmit();
    const tick = () => {
      const left = (sim.end - Date.now()) / 1000;
      const el = $('sim-clock');
      if (left <= 0) { clearInterval(timer); finish(D, 'time'); return; }
      if (el) { el.textContent = clock(left); el.classList.toggle('low', left < 300); }
    };
    clearInterval(simTimer); // run() redraws on every answer; keep exactly one clock running
    const timer = simTimer = setInterval(tick, 1000);
    V.onLeave(() => clearInterval(timer));
    V.keys = e => {
      const i = V.keyIndex(e, it.o.length);
      if (i >= 0) { choose(it.o[i]); return true; }
      if (e.key === 'ArrowRight') { if (sim.cur + 1 < sim.items.length) goto(sim.cur + 1); return true; }
      if (e.key === 'ArrowLeft') { if (sim.cur) goto(sim.cur - 1); return true; }
      if (e.key.toLowerCase() === 'f') { $('flag').click(); return true; }
      return false;
    };
  }
  function finish(D, how) {
    const S = V.T(), sim = S.sim;
    if (!sim) return;
    const dom = {}, miss = [];
    let right = 0;
    sim.items.forEach(it => {
      const q = D.q.get(it.q); if (!q) return;
      const ok = it.a === 0;
      dom[q.domain] = dom[q.domain] || [0, 0];
      dom[q.domain][1]++;
      if (ok) { right++; dom[q.domain][0]++; } else {
        miss.push([it.q, it.a]);
        if (!q.reserved) { const r = S.q[it.q] || (S.q[it.q] = { n: 0, c: 0, w: 0 }); r.n++; r.t = Date.now(); V.markMiss(r); }
      }
      S.exp[it.q] = (S.exp[it.q] || 0) + 1;
    });
    const total = sim.items.length;
    S.sims.push({ ts: Date.now(), label: sim.label, total, right, pct: pct(right, total), dom, miss, how, secs: Math.round((Math.min(Date.now(), sim.end) - sim.start) / 1000) });
    if (S.sims.length > 60) S.sims.splice(0, S.sims.length - 60);
    S.sim = null;
    V.save();
    location.hash = link(D.id, 'sim', 'report', S.sims.length - 1);
  }
  function report(D, idx) {
    const S = V.T(), id = D.id, tr = D.track;
    const i = idx === 'last' || idx == null ? S.sims.length - 1 : Number(idx);
    const s = S.sims[i];
    if (!s) { V.main.innerHTML = head(`${esc(tr.code)} / Sim report`, 'No report here.') + empty('That sim is not in your history.', '', `<a class="btn" href="${link(id, 'sim')}">Exam sim</a>`); return; }
    const cut = Number((tr.exam || {}).cut) || 0;
    const above = s.pct >= cut;
    const where = s.pct > cut ? 'Above' : s.pct === cut ? 'At' : 'Below';
    const rows = D.doms.filter(d => s.dom[d.name]).concat(Object.keys(s.dom).filter(n => !D.domIdx.has(n)).map(n => ({ name: n, w: 0 }))).map(d => {
      const [r, t] = s.dom[d.name]; const p = pct(r, t);
      return `<div class="domain-row static"><div class="row-between"><span class="title">${esc(d.name)}</span><span class="small num ${p >= cut ? 'ok' : 'bad'}">${r}/${t} · ${p}%</span></div><div class="bar cutbar${p < cut ? ' under' : ''}"><i style="width:${p}%"></i><b class="cut" style="left:${cut}%" title="Cut ${cut}%"></b></div></div>`;
    }).join('');
    const drillable = new Set();
    (s.miss || []).forEach(([qid]) => { const q = D.q.get(qid); if (!q) return; if (!q.reserved) drillable.add(qid); else (D.qu.get(qid) || []).forEach(u => (D.uq.get(u) || []).forEach(x => { if (!D.q.get(x).reserved) drillable.add(x); })); });
    // Each miss folds, so a rough sim doesn't make a page as long as the bank. The first three start open.
    const missHTML = (s.miss || []).map(([qid, a], k) => {
      const q = D.q.get(qid); if (!q) return '';
      return `<details class="review-item"${k < 3 ? ' open' : ''}><summary><span class="status">${a == null ? 'Not answered' : 'Missed'} · ${esc(q.domain)}${q.reserved ? ' · sim only' : ''}</span><span class="rv-stem">${esc(q.stem)}</span></summary>${a != null ? `<p><b>Your answer:</b> ${esc(q.options[a])}</p>` : ''}<p><b>Correct:</b> ${esc(q.options[0])}</p><p class="muted">${esc(q.expl)}</p>${V.testsHTML(D, q)}</details>`;
    }).join('');
    const mins = Math.round((s.secs || 0) / 60);
    const weak = Object.entries(s.dom).map(([n, [r, t]]) => [n, pct(r, t)]).filter(([n, p]) => p < cut && D.pool.some(q => q.domain === n)).sort((a, b) => a[1] - b[1]).slice(0, 3);
    V.main.innerHTML = head(`${esc(tr.code)} / Sim report`, `${s.pct}%. ${where} the ${cut}% line.`, `${esc(s.label || 'Sim')}, ${s.total} questions, ${fmtDate(s.ts)}${mins ? `, ${mins} min used` : ''}${s.how === 'time' ? ', submitted when time ran out' : ''}.`)
      + `<div class="grid"><section class="panel"><div class="result-top"><div class="result-score ${above ? 'ok' : 'bad'}">${s.pct}%</div><div><h2>${s.right} of ${s.total} correct</h2><p class="muted small">${esc((tr.exam || {}).cutNote || '')}</p></div></div><h3 class="space">By domain</h3><p class="small muted">The line on each bar marks the ${cut}% cut.</p><div class="domain-list">${rows}</div></section>`
      + `<section class="panel"><h2>Next move</h2>${s.miss && s.miss.length ? `<p class="space-sm">${plural(s.miss.length, 'item')} missed.${drillable.size ? ` ${plural(drillable.size, 'practice question')} ${drillable.size === 1 ? 'covers' : 'cover'} them.` : ' They are sim-only questions with no practice questions on the same facts yet.'}</p>` : '<p class="space-sm">No misses. Try a longer sim.</p>'}<div class="actions space">${drillable.size ? `<a class="btn" href="${link(id, 'drill', 'sim', i)}">Drill these misses</a>` : ''}<a class="btn secondary" href="${link(id, 'sim')}">Another sim</a><a class="btn text" href="${link(id, 'progress')}">Progress</a></div>${weak.length ? `<h3 class="space-lg">Below the line</h3><p class="small muted">Drill the domains that scored under ${cut}%.</p><div class="actions space-sm">${weak.map(([n, p]) => `<a class="btn secondary small" href="${link(id, 'drill', 'dom', n)}">${esc(n)} (${p}%)</a>`).join('')}</div>` : ''}</section></div>`
      + (missHTML ? `<section class="panel space-lg"><div class="row-between"><h2>Missed items</h2><button type="button" class="btn text small" id="rv-all">Open all</button></div>${missHTML}</section>` : '')
      + `<section class="panel space-lg"><h2>Sim history</h2><div class="history">${S.sims.slice().reverse().map((x, k) => { const j = S.sims.length - 1 - k; return `<a class="history-row${j === i ? ' current' : ''}" href="${link(id, 'sim', 'report', j)}"><span>${fmtDate(x.ts)} · ${esc(x.label || '')} ${x.total}q</span><b class="${x.pct >= cut ? 'ok' : 'bad'}">${x.pct}%</b></a>`; }).join('')}</div></section>`;
    const ra = $('rv-all'); if (ra) ra.onclick = () => { const all = V.main.querySelectorAll('details.review-item'), open = [...all].every(d => d.open); all.forEach(d => { d.open = !open; }); ra.textContent = open ? 'Open all' : 'Close all'; };
  }
})();
