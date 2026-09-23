/* Vent Exam Lab: field training. Hands-on sims and drills that sit beside the three credentials. */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, head, empty, fmtDate } = V.u;
  const KEY = 'vel-field'; // the sims in field/ write their own results here (same origin), so full-screen runs count too
  const TOOLS = [
    { id: 'attic-job', file: 'attic-job.html', kind: 'Job sim', title: 'Attic Job', nav: 'Attic job', score: true,
      blurb: 'A house attic job in cutaway. Shut down, cut access, set up the vac, clean from the far end back, patch, and close out.',
      pairs: ['ascs', 'cvi'] },
    { id: 'job-board', file: 'job-board.html', kind: 'Job planner', title: 'Job Board', nav: 'Job board', score: true,
      blurb: 'Plan a whole job on a mechanical plan, one move at a time. Learn mode shows what the lead flags. Test mode gives no hints.',
      pairs: ['ascs', 'cvi'] },
    { id: 'inspection', file: 'inspection.html', kind: 'CVI casework', title: 'Inspection Desk', nav: 'Inspection desk', score: true,
      blurb: 'Five inspection cases. Read the work order, do the pre-inspection steps, open the right parts, and write the assessment. Graded against ACR 2025.',
      pairs: ['cvi', 'ascs'] },
    { id: 'vent-call', file: 'vent-call.html', kind: 'Dryer vent casework', title: 'Vent Call', nav: 'Vent call', score: true,
      blurb: 'Five dryer vent jobs. Inspect the run, make the code calls, clean, figure developed length, run the DEDP test, and call pass or fail.',
      pairs: ['dvt'] },
    { id: 'duct-reflex', file: 'duct-reflex.html', kind: 'Speed drill', title: 'Duct Reflex', nav: 'Duct reflex',
      blurb: 'Call supply, return, exhaust, or outdoor air on sight, on real mechanical sheets and field scenes.',
      pairs: ['ascs', 'cvi'] },
    { id: 'read-the-print', file: 'read-the-print.html', kind: 'Print reading', title: 'Read the Print', nav: 'Read the print',
      blurb: 'Each round draws a new mechanical sheet. Count the trunk footage, grilles, and return type, then check your count.',
      pairs: ['ascs', 'cvi'] }
  ];
  const byId = id => TOOLS.find(t => t.id === id);
  const NAV = [['', 'All field training']].concat(TOOLS.map(t => [t.id, t.nav]));
  const MIN_H = 480; // the frame never shrinks below this, so a slow load still has a sensible box

  // Styles for the tool page bar. They live here so the tool page does not depend on style.css changes.
  function css() {
    if (document.getElementById('field-css')) return;
    const s = document.createElement('style');
    s.id = 'field-css';
    s.textContent = [
      'main .field-frame-wrap{background:var(--paper);border:1px solid var(--line);border-radius:3px;overflow:hidden}',
      'main .field-frame{display:block;width:100%;height:760px;min-height:' + MIN_H + 'px;max-height:none;border:0;background:var(--paper)}',
      '.field-bar{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;padding:6px 12px;background:#fff;border-bottom:1px solid var(--line)}',
      '.field-bar .field-back{display:inline-flex;align-items:center;min-height:44px;font-weight:600;text-decoration:none;white-space:nowrap}',
      '.field-bar .field-back:hover{text-decoration:underline}',
      '.field-bar .field-all{font-weight:500;color:var(--muted)}',
      '.field-bar .field-title{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;min-width:0}',
      '.field-bar h1{font-size:1.3rem;letter-spacing:.03em;text-transform:uppercase;color:var(--blue);margin:0}',
      '.field-bar .eyebrow{margin:0}',
      '.field-bar .btn{margin-left:auto}',
      '@media (max-width:650px){.field-bar{padding:4px 12px 10px}.field-bar .field-all{display:none}.field-bar .field-title{order:3;width:100%}.field-bar h1{font-size:1.15rem}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function read() { try { const v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (e) { return {}; } }
  let mem = read();

  function scoreLine(t) {
    if (!t.score) return 'Progress is kept inside the tool';
    const r = mem[t.id];
    if (!r || typeof r !== 'object' || !Number.isFinite(r.best) || !Number.isFinite(r.last)) return 'No runs yet';
    const n = Number.isFinite(r.n) ? r.n : 1;
    return `Best ${r.best} / 100 · last ${r.last}${r.at ? ' on ' + fmtDate(r.at) : ''} · ${n} run${n === 1 ? '' : 's'}`;
  }
  function pairs(t) { return t.pairs.map(tr => `<a class="chip" href="#/${tr}/today">${tr.toUpperCase()}</a>`).join(' '); }

  // Scores written by a full-screen run in another tab show up here without a reload.
  function watchStorage(onChange) {
    const onStore = e => { if (e.key === KEY || e.key === null) { mem = read(); onChange(); } };
    window.addEventListener('storage', onStore);
    V.onLeave(() => window.removeEventListener('storage', onStore));
  }

  function hub() {
    mem = read();
    const tr = V.homeTrack();
    V.main.innerHTML = head(`<a href="#/${tr}/practice">Practice</a> / Field training`, 'Do the job, not just the test.', 'Hands-on sims and drills for the work the exams describe. Scores stay in this browser.')
      + `<div class="game-grid field-grid">${TOOLS.map(t => `<section class="panel game-card field-card" data-tool="${t.id}"><p class="eyebrow">${esc(t.kind)}</p><h2>${esc(t.title)}</h2><p class="muted">${esc(t.blurb)}</p><p class="small space-sm field-score">${esc(scoreLine(t))}</p><p class="field-pairs small">Pairs with ${pairs(t)}</p><a class="btn space" href="#/field/${t.id}">${t.score ? 'Run the job' : 'Open'}</a></section>`).join('')}</div>`
      + '<div class="note blue space-lg"><b>How this fits the exams</b><p>The credential tracks teach what the standard says. Field training is where you practice doing it in order. Run a sim after the matching lesson, and the rules stick as a sequence of moves instead of a list of facts.</p></div>';
    watchStorage(() => V.main.querySelectorAll('.field-card').forEach(c => { const t = byId(c.dataset.tool), p = c.querySelector('.field-score'); if (t && p) p.textContent = scoreLine(t); }));
  }

  function tool(t) {
    css();
    const note = '. On a phone, full screen gives it more room.';
    // One bar owns the title and the way back. The tool hides its own copies when it sees it is framed.
    V.main.innerHTML = `<div class="field-frame-wrap">`
      + `<div class="field-bar"><a class="field-back" href="#/${V.homeTrack()}/practice">&larr; Practice</a><a class="field-back field-all small" href="#/field">All field training</a><div class="field-title"><h1>${esc(t.title)}</h1><p class="eyebrow">${esc(t.kind)}</p></div><a class="btn secondary small" href="field/${t.file}" target="_blank" rel="noopener">Open full screen</a></div>`
      + `<iframe class="field-frame" src="field/${t.file}" title="${esc(t.title)}" loading="eager" allow="fullscreen"></iframe></div>`
      + `<p class="small muted space-sm">${esc(scoreLine(t))}${note}</p>`;
    const fr = V.main.querySelector('iframe.field-frame');
    const line = () => { const p = V.main.querySelector('.field-frame-wrap + p'); if (p) p.textContent = scoreLine(t) + note; };
    // Keyboard shortcuts in the tools work without a click first.
    fr.addEventListener('load', () => { try { if (!document.activeElement || document.activeElement === document.body || document.activeElement === V.main) fr.contentWindow.focus(); } catch (e) { /* not reachable */ } }, { once: true });
    const onMsg = e => {
      if (e.origin !== location.origin || !e.data || e.source !== fr.contentWindow) return;
      const d = e.data;
      if (d.vel === 'field-size') {
        // The frame grows to fit the tool, so the page scrolls instead of a box inside the page.
        const h = Math.round(+d.h);
        if (Number.isFinite(h) && h > 0) fr.style.height = Math.max(MIN_H, Math.min(h, 40000)) + 'px';
      } else if (d.vel === 'field-overlay') {
        // A report opened at the top of a tall frame: bring the top of the frame into view.
        const top = fr.getBoundingClientRect().top;
        if (top < 0 || top > window.innerHeight * 0.4) window.scrollTo({ top: Math.max(0, window.scrollY + top - 8), behavior: 'auto' });
      } else if (d.vel === 'field' && d.tool === t.id) {
        setTimeout(() => { mem = read(); line(); const r = mem[t.id]; if (r && Number.isFinite(r.last)) V.u.announce(`Scored ${r.last} out of 100. Best ${r.best}.`); }, 0);
      }
    };
    window.addEventListener('message', onMsg);
    V.onLeave(() => window.removeEventListener('message', onMsg));
    watchStorage(line);
  }

  V.field = {
    TOOLS, NAV, scoreLine: t => { mem = read(); return scoreLine(t); },
    render(view) {
      if (!view) return hub();
      const t = byId(view);
      if (!t) { V.main.innerHTML = empty('That field tool is not here.', '', '<a class="btn" href="#/field">All field training</a>'); return; }
      tool(t);
    }
  };
})();
