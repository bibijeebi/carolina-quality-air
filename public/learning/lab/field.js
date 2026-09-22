/* Vent Exam Lab: field training. Hands-on sims and drills that sit beside the three credentials. */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, head, empty, fmtDate } = V.u;
  const KEY = 'vel-field'; // the sims in field/ write their own results here (same origin), so full-screen runs count too
  const TOOLS = [
    { id: 'job-board', file: 'job-board.html', kind: 'Job planner', title: 'Job Board', score: true,
      blurb: 'The whole job on a mechanical plan, one move at a time. Every move shows what the rod reaches and where the dust goes before you commit. Learn mode shows what the lead would flag; Test mode grades you blind against par.',
      pairs: ['ascs', 'cvi'] },
    { id: 'inspection', file: 'inspection.html', kind: 'CVI casework', title: 'Inspection Desk', score: true,
      blurb: 'Five cases, each with a new rule in play. Read the work order, run the pre-inspection steps, open the right components, and write the assessment. Graded clause by clause against ACR 2025.',
      pairs: ['cvi', 'ascs'] },
    { id: 'duct-sim', file: 'duct-sim.html', kind: 'Job sim', title: 'Residential attic job', score: true,
      blurb: 'Walk the system, cut access, run the negative air, whip from the far end toward the machine, wash the grilles, and patch every hole. Scored out of 100 on the rules a lead checks.',
      pairs: ['ascs', 'cvi'] },
    { id: 'crew-sim', file: 'crew-sim.html', kind: 'Job sim', title: 'Crew sim with the lead’s grade', score: true,
      blurb: 'Pick the right tool off the belt for every step. Return before supply, negative air before whipping, the right patch for metal and duct board. The lead grades it out of 100 and times you.',
      pairs: ['ascs'] },
    { id: 'duct-reflex', file: 'duct-reflex.html', kind: 'Speed drill', title: 'Duct Reflex',
      blurb: 'Supply, return, exhaust, or outdoor air, on sight. Real mechanical sheets with hotspots, fast field scenes, and a trace mode until reading a system is boring.',
      pairs: ['ascs', 'cvi'] },
    { id: 'read-the-print', file: 'read-the-print.html', kind: 'Print reading', title: 'Read the Print',
      blurb: 'Every round draws a fresh mechanical sheet. Pull the takeoff off it, from trunk footage to grille counts to the return type, then check it against the crew brief.',
      pairs: ['ascs', 'cvi'] }
  ];
  const byId = id => TOOLS.find(t => t.id === id);
  const NAV = [['', 'All field training']].concat(TOOLS.map(t => [t.id, t.title.split(' with ')[0]]));

  function read() { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } }
  let mem = read();

  function scoreLine(t) {
    if (!t.score) return 'Progress is kept inside the drill';
    const r = mem[t.id];
    return r ? `Best ${r.best} / 100 · last ${r.last} on ${fmtDate(r.at)} · ${r.n} run${r.n === 1 ? '' : 's'}` : 'No runs yet';
  }
  function pairs(t) { return t.pairs.map(tr => `<a class="chip" href="#/${tr}/today">${tr.toUpperCase()}</a>`).join(' '); }

  function hub() {
    mem = read();
    V.main.innerHTML = head('Field / Training', 'Do the job, not just the test.', 'Hands-on sims and drills for the work the exams describe. Scores stay in this browser.')
      + `<div class="game-grid field-grid">${TOOLS.map(t => `<section class="panel game-card field-card"><p class="eyebrow">${esc(t.kind)}</p><h2>${esc(t.title)}</h2><p class="muted">${esc(t.blurb)}</p><p class="small space-sm">${esc(scoreLine(t))}</p><p class="field-pairs small">Pairs with ${pairs(t)}</p><a class="btn space" href="#/field/${t.id}">${t.score ? 'Run the job' : 'Open'}</a></section>`).join('')}</div>`
      + '<div class="note blue space-lg"><b>How this fits the exams</b><p>The credential tracks teach what the standard says. Field training is where you practice doing it in order. Run a sim after the matching lesson, and the rules stick as a sequence of moves instead of a list of facts.</p></div>';
  }

  function tool(t) {
    V.main.innerHTML = head(`<a href="#/field">Field</a> / ${esc(t.kind)}`, esc(t.title), '', `<a class="btn secondary small" href="field/${t.file}" target="_blank" rel="noopener">Open full screen</a>`, 'field-head')
      + `<div class="field-frame-wrap"><iframe class="field-frame" src="field/${t.file}" title="${esc(t.title)}" loading="eager" allow="fullscreen"></iframe></div>`
      + `<p class="small muted space-sm">${esc(scoreLine(t))}. On a phone, full screen gives it more room.</p>`;
    // The frame reports scores when a job is finished; refresh the line under it.
    const onMsg = e => { if (e.origin === location.origin && e.data && e.data.vel === 'field' && e.data.tool === t.id) setTimeout(() => { mem = read(); const p = V.main.querySelector('.field-frame-wrap + p'); if (p) p.textContent = scoreLine(t) + '. On a phone, full screen gives it more room.'; const r = mem[t.id]; if (r) V.u.announce(`Scored ${r.last} out of 100. Best ${r.best}.`); }, 0); };
    window.addEventListener('message', onMsg);
    V.onLeave(() => window.removeEventListener('message', onMsg));
  }

  V.field = {
    TOOLS, NAV,
    render(view) {
      if (!view) return hub();
      const t = byId(view);
      if (!t) { V.main.innerHTML = empty('That field tool is not here.', '', '<a class="btn" href="#/field">All field training</a>'); return; }
      tool(t);
    }
  };
})();
