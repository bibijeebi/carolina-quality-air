/* Vent Exam Lab: systems lab. A clean port of the one-zone VAV / CAV / multizone teaching model. */
(function () {
  'use strict';
  const V = window.VEL;
  const { esc, $, link, head } = V.u;
  const lab = { system: 'vav', load: 50, fraction: 20, minimum: true };
  const SYSTEMS = [['vav', 'VAV: change airflow'], ['cav', 'CAV: change temperature'], ['multi', 'Traditional multizone: blend decks']];

  // Teaching model. 2,000 cfm design flow, 30% VAV minimum, 55 F cold deck, 95 F hot deck, 400 cfm outdoor-air example target.
  function model(s) {
    const load = Math.min(100, Math.max(20, Number(s.load)));
    const fraction = Math.min(60, Math.max(10, Number(s.fraction))) / 100;
    let flow = 2000, temp = 75 - (20 * load) / 100, cold = null;
    if (s.system === 'vav') { flow = 2000 * Math.max(0.3, load / 100); temp = 55; }
    if (s.system === 'multi') { cold = load / 100; temp = 55 * cold + 95 * (1 - cold); }
    const supplied = s.minimum ? Math.max(fraction, 400 / flow) : fraction;
    const oa = flow * supplied;
    return { flow: Math.round(flow), temp: Math.round(temp * 10) / 10, oa: Math.round(oa), fraction: Math.round(supplied * 1000) / 10, shortfall: Math.max(0, Math.round(400 - oa)), cold };
  }
  V.labModel = model;

  function diagram(v, s) {
    const multi = s.system === 'multi';
    const left = multi
      ? '<rect x="10" y="24" width="140" height="52" rx="6" class="d-cool"/><text x="80" y="56" text-anchor="middle">Cold deck 55°F</text><rect x="10" y="109" width="140" height="52" rx="6" class="d-warm"/><text x="80" y="141" text-anchor="middle">Hot deck 95°F</text><path d="M150 50 H195 V90 H225 M150 135 H195 V90" class="d-flow" marker-end="url(#lab-arrow)"/>'
      : `<rect x="10" y="57" width="140" height="68" rx="6" class="d-cool"/><text x="80" y="85" text-anchor="middle">Air handler</text><text x="80" y="109" text-anchor="middle">${v.temp}°F supply</text><path d="M150 90 H225" class="d-flow" marker-end="url(#lab-arrow)"/>`;
    const mid = multi ? 'Unit mixing' : s.system === 'vav' ? 'VAV terminal' : 'Fixed flow';
    const midVal = multi ? `${s.load}% cold` : `${v.flow.toLocaleString()} cfm`;
    return `<svg class="system-diagram h" viewBox="0 0 520 185" role="img" aria-label="${multi ? 'Hot and cold decks blend at the unit before the zone duct' : 'Air handler feeds a terminal, then the zone'}. Zone air ${v.temp} degrees F."><defs><marker id="lab-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" class="d-head"/></marker></defs>${left}<rect x="230" y="57" width="125" height="68" rx="6" class="d-mid"/><text x="292" y="86" text-anchor="middle" class="d-inv">${mid}</text><text x="292" y="109" text-anchor="middle" class="d-inv2">${midVal}</text><path d="M355 90 H410" class="d-flow" marker-end="url(#lab-arrow)"/><rect x="415" y="57" width="95" height="68" rx="6" class="d-cool"/><text x="462" y="85" text-anchor="middle">Zone</text><text x="462" y="109" text-anchor="middle">${v.temp}°F in</text></svg>`;
  }
  // Stacked version of the same diagram for narrow screens, so labels stay readable.
  function diagramV(v, s) {
    const multi = s.system === 'multi';
    const top = multi
      ? '<rect x="8" y="8" width="134" height="58" rx="6" class="d-cool"/><text x="75" y="32" text-anchor="middle">Cold deck</text><text x="75" y="54" text-anchor="middle">55\u00b0F</text><rect x="158" y="8" width="134" height="58" rx="6" class="d-warm"/><text x="225" y="32" text-anchor="middle">Hot deck</text><text x="225" y="54" text-anchor="middle">95\u00b0F</text><path d="M75 66 V92 H150 V114 M225 66 V92 H150" class="d-flow" marker-end="url(#lab-arrow-v)"/>'
      : `<rect x="60" y="8" width="180" height="62" rx="6" class="d-cool"/><text x="150" y="34" text-anchor="middle">Air handler</text><text x="150" y="57" text-anchor="middle">${v.temp}\u00b0F supply</text><path d="M150 70 V114" class="d-flow" marker-end="url(#lab-arrow-v)"/>`;
    const mid = multi ? 'Unit mixing' : s.system === 'vav' ? 'VAV terminal' : 'Fixed flow';
    const midVal = multi ? `${s.load}% cold` : `${v.flow.toLocaleString()} cfm`;
    return `<svg class="system-diagram v" viewBox="0 0 300 312" role="img" aria-label="${multi ? 'Hot and cold decks blend at the unit before the zone duct' : 'Air handler feeds a terminal, then the zone'}. Zone air ${v.temp} degrees F."><defs><marker id="lab-arrow-v" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" class="d-head"/></marker></defs>${top}<rect x="60" y="122" width="180" height="62" rx="6" class="d-mid"/><text x="150" y="148" text-anchor="middle" class="d-inv">${mid}</text><text x="150" y="171" text-anchor="middle" class="d-inv2">${midVal}</text><path d="M150 184 V228" class="d-flow" marker-end="url(#lab-arrow-v)"/><rect x="60" y="236" width="180" height="62" rx="6" class="d-cool"/><text x="150" y="262" text-anchor="middle">Zone</text><text x="150" y="285" text-anchor="middle">${v.temp}\u00b0F in</text></svg>`;
  }
  function output() {
    const v = model(lab), multi = lab.system === 'multi';
    const why = lab.minimum && v.fraction > lab.fraction ? 'The model raised the outdoor-air fraction to hold 400 cfm.'
      : v.shortfall ? 'A fixed fraction let outdoor-air volume fall with total flow.' : 'This checks only the example target.';
    return `<p class="eyebrow">Follow the controlled variable</p>${diagram(v, lab)}${diagramV(v, lab)}<div class="lab-numbers"><div><b>${v.flow.toLocaleString()}</b><span>Supply cfm</span></div><div><b>${v.temp}°F</b><span>Delivered air</span></div><div><b>${v.oa}</b><span>Outdoor cfm</span></div></div>`
      + `<div class="note ${v.shortfall ? '' : 'blue'} space"><b>${v.shortfall ? v.shortfall + ' cfm below the example target' : 'Example outdoor-air target met'}</b><p>${v.flow.toLocaleString()} cfm × ${v.fraction}% = ${v.oa} cfm outdoor air. ${why}</p></div>`
      + `<p class="small muted space">${multi ? 'Blend temperature assumes equal specific heat and no heat gain, using the selected stream shares.' : 'VAV holds 55°F supply and changes flow down to 30% of design. CAV holds 2,000 cfm and changes supply temperature. Real control sequences are more complex.'}</p>`;
  }
  V.views.lab = function (D) {
    const id = D.id;
    V.main.innerHTML = head(`${esc(D.track.code)} / Systems lab`, 'See what the system changes.', 'A simplified one-zone teaching model. Change the controls and predict the result before you read it.', `<a class="btn secondary" href="${link(id, 'drill', 'dom', D.sysDom)}">Drill ${esc(D.sysDom)} questions</a>`)
      + `<div class="grid lab-grid"><section class="panel"><div class="field"><label for="lab-system">System behavior</label><select id="lab-system">${SYSTEMS.map(([k, n]) => `<option value="${k}"${lab.system === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`
      + `<div class="field space"><label for="lab-load" id="load-label"></label><input id="lab-load" type="range" min="20" max="100" step="5" value="${lab.load}"><output id="load-out" for="lab-load"></output></div>`
      + `<div class="field space"><label for="lab-fraction">Baseline measured outdoor-air fraction</label><input id="lab-fraction" type="range" min="10" max="60" step="5" value="${lab.fraction}"><output id="fraction-out" for="lab-fraction"></output></div>`
      + `<label class="checkbox space"><input id="lab-minimum" type="checkbox"${lab.minimum ? ' checked' : ''}> Hold the example’s 400 cfm outdoor-air target</label>`
      + '<p class="under-note">The target, 2,000 cfm design flow, 30% VAV minimum, and temperatures are exercise values. They are not code limits or equipment recommendations. Fraction means measured air volume, not damper position.</p></section>'
      + '<section class="panel lab-output" id="lab-output"></section></div>'
      + '<div class="grid space-lg"><section class="panel"><h2>The exam distinction</h2><div class="table-scroll"><table class="comparison"><thead><tr><th scope="col">Behavior</th><th scope="col">Primary change</th><th scope="col">Watch for</th></tr></thead><tbody><tr><th scope="row">VAV</th><td>Zone airflow</td><td>Outdoor-air volume at low flow</td></tr><tr><th scope="row">CAV</th><td>Delivered temperature</td><td>Constant flow is not constant temperature</td></tr><tr><th scope="row">Multizone</th><td>Hot and cold blend at the unit</td><td>Where mixing happens, and heating and cooling at the same time</td></tr></tbody></table></div></section>'
      + `<section class="panel"><h2>Energy needs another step.</h2><p class="space-sm">Varying flow can cut fan energy when the controls support it. Reheat, minimum flows, deck temperatures, loads, and schedules still change the total. This model does not calculate annual energy or predict a savings percentage.</p><div class="actions space"><a class="btn" href="${link(id, 'drill', 'dom', D.sysDom)}">Drill ${esc(D.sysDom)}</a></div></section></div>`;
    const draw = () => {
      $('load-label').textContent = lab.system === 'multi' ? 'Cold-deck share in the zone blend' : 'Cooling load in the teaching model';
      $('load-out').textContent = lab.load + '%';
      $('fraction-out').textContent = lab.fraction + '%';
      $('lab-output').innerHTML = output();
    };
    const say = () => { const v = model(lab); V.u.announce(`${v.flow} cfm supply, ${v.temp} degrees delivered, ${v.oa} cfm outdoor air${v.shortfall ? `, ${v.shortfall} below the target` : ''}.`); };
    ['lab-load', 'lab-fraction'].forEach(k => { $(k).onchange = say; });
    $('lab-system').onchange = e => { lab.system = e.target.value; draw(); say(); };
    $('lab-load').oninput = e => { lab.load = Number(e.target.value); draw(); };
    $('lab-fraction').oninput = e => { lab.fraction = Number(e.target.value); draw(); };
    $('lab-minimum').onchange = e => { lab.minimum = e.target.checked; draw(); say(); };
    draw();
  };
})();
