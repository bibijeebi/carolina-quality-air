/* Vent Exam Lab: optional sync through DuctStudy seat codes. Progress stays local-first. With a seat code, each
   credential's progress also saves to the DuctStudy API (last write wins, per credential), and sims show up on the
   company's owner dashboard. Without one, nothing here runs. */
(function () {
  'use strict';
  const V = window.VEL = window.VEL || {};
  const m = document.querySelector('meta[name="vel-api"]');
  const onApiHost = /(^|\.)workers\.dev$/.test(location.hostname) || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API = onApiHost ? '' : ((m && m.content) || '').replace(/\/$/, '');
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pool = t => 'lab-' + t;
  const upd = t => +(get('vel-upd-' + t) || 0);
  let token = get('ds_token'), user = null, status = '', busy = false;
  try { user = JSON.parse(get('ds_user')); } catch (e) { user = null; }
  const pulled = new Set(), timers = {};
  // a track with nothing studied yet never overwrites a saved copy, whatever its timestamp says
  const blank = S => !S || (!Object.keys(S.q || {}).length && !Object.keys(S.rc || {}).length && !Object.keys(S.ls || {}).length && !(S.sims || []).length);

  // a sign-in link from another device: ?t=TOKEN, removed from the address bar right away
  try {
    const qs = new URLSearchParams(location.search), t = qs.get('t');
    if (t && /^[A-Z0-9]{20,64}$/.test(t)) { token = t; put('ds_token', t); qs.delete('t'); history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); }
  } catch (e) { /* old browser */ }

  async function api(path, opt) {
    opt = opt || {};
    const h = { 'content-type': 'application/json' };
    if (token) h.authorization = 'Bearer ' + token;
    const r = await fetch(API + path, { method: opt.method || 'GET', body: opt.body, headers: h });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
    return j;
  }
  function fail(e) {
    if (e && e.status === 401) { signOut(); status = 'That sign-in is no longer active on this device. Connect again with a seat code.'; }
    else status = 'Could not reach the sync server. Progress is saved in this browser and syncs next time.';
  }
  function signOut() { token = null; user = null; put('ds_token', null); put('ds_user', null); pulled.clear(); }
  function stats(t) {
    const D = V.data && V.data[t], S = V.getTrack && V.getTrack(t);
    if (!S) return { done: 0, total: 0 };
    if (D && V.poolStats) { const ps = V.poolStats(D, S); return { done: ps.retired, total: ps.n }; }
    return { done: Object.values(S.q || {}).filter(r => r && r.r).length, total: 0 };
  }
  async function sendSims(t) {
    const S = V.getTrack(t); if (!S) return;
    const list = Array.isArray(S.sims) ? S.sims : [];
    let sent = +(get('vel-simsent-' + t) || 0);
    if (sent > list.length) { sent = list.length; put('vel-simsent-' + t, String(sent)); }
    for (let i = sent; i < list.length; i++) {
      const s = list[i] || {};
      await api('/api/sim?pool=' + pool(t), { method: 'POST', body: JSON.stringify({ n: +s.total || 0, pc: +s.pct || 0, per: s.dom || {}, at: +s.ts || Date.now() }) });
      put('vel-simsent-' + t, String(i + 1));
    }
  }
  async function push(t) {
    if (!token || !V.getTrack) return;
    const S = V.getTrack(t); if (!S) return;
    const st = stats(t);
    try {
      const r = await api('/api/state?pool=' + pool(t), { method: 'PUT', body: JSON.stringify({ state: JSON.stringify(S), updated: upd(t) || Date.now(), v: 1, done: st.done, total: st.total }) });
      if (r.stale) { pulled.delete(t); await pull(t); return; }
      await sendSims(t);
      status = 'Saved to your account.';
    } catch (e) { fail(e); }
    paint();
  }
  async function pull(t) {
    if (!token || !t || pulled.has(t) || !V.getTrack) return;
    pulled.add(t);
    try {
      const me = await api('/api/me?pool=' + pool(t));
      if (me.user) { const was = user && user.name; user = me.user; put('ds_user', JSON.stringify(user)); if (was !== user.name && document.getElementById('sync-panel')) bind(); }
      const local = upd(t), remote = +me.updated || 0;
      let data = null;
      if (me.state) { try { data = JSON.parse(me.state); } catch (e) { data = null; } }
      if (data && typeof data === 'object' && !Array.isArray(data) && (remote > local || (blank(V.getTrack(t)) && !blank(data)))) {
        V.setTrack(t, data); put('vel-upd-' + t, String(remote));
        const S = V.getTrack(t); put('vel-simsent-' + t, String(S && Array.isArray(S.sims) ? S.sims.length : 0));
        status = 'Loaded your saved progress.';
        if (V.cur === t && V.rerender) V.rerender();
      } else if (local > remote && !blank(V.getTrack(t))) { await push(t); return; }
      else status = 'In sync.';
    } catch (e) { pulled.delete(t); fail(e); }
    paint();
  }
  V.onSave = function (ts) {
    const now = Date.now();
    (ts || []).forEach(t => {
      if (!t) return;
      put('vel-upd-' + t, String(now));
      if (!token) return;
      clearTimeout(timers[t]); timers[t] = setTimeout(() => { delete timers[t]; push(t); }, 3000);
    });
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    Object.keys(timers).forEach(t => { clearTimeout(timers[t]); delete timers[t]; push(t); });
  });
  const follow = () => setTimeout(() => { if (token && V.cur) pull(V.cur); }, 50);
  window.addEventListener('hashchange', follow);
  window.addEventListener('load', follow);

  /* ---------- Progress panel ---------- */
  function panelHTML() {
    if (token) {
      const who = user ? `<b>${esc(user.name)}</b>${user.company ? ', ' + esc(user.company) : ''}` : 'your seat';
      return `<h2>Sync across devices</h2><p class="small space-sm">Connected as ${who}. Each credential's progress saves to your account, and your sims show on your company's dashboard.</p>`
        + `<div class="actions space"><button type="button" class="btn" id="sy-now">Sync now</button><button type="button" class="btn secondary" id="sy-link">Copy link for another device</button><button type="button" class="btn text" id="sy-out">Disconnect this device</button></div>`
        + `<p class="small muted space-sm">The link signs another phone or computer in to this seat. Treat it like a password.</p><p class="backup-status" id="sy-status" role="status">${esc(status)}</p>`;
    }
    return `<h2>Sync across devices</h2><p class="muted small space-sm">Got a seat code from your company? Connect it to keep your progress on every device and put your sims on your company's dashboard. Without one, progress stays in this browser.</p>`
      + `<form id="sy-form" class="sync-form space" autocomplete="off"><label class="small" for="sy-code">Seat code</label><input id="sy-code" name="code" placeholder="ABCD-EFGH" autocapitalize="characters" spellcheck="false" required>`
      + `<label class="small" for="sy-name">Your name</label><input id="sy-name" name="name" placeholder="First and last" required maxlength="60"><div class="actions space-sm"><button type="submit" class="btn" ${busy ? 'disabled' : ''}>Connect</button></div></form>`
      + `<p class="backup-status" id="sy-status" role="status">${esc(status)}</p>`;
  }
  function paint() { const el = document.getElementById('sy-status'); if (el) el.textContent = status; }
  function bind() {
    const box = document.getElementById('sync-panel'); if (!box) return;
    box.innerHTML = panelHTML();
    const f = document.getElementById('sy-form');
    if (f) f.onsubmit = async ev => {
      ev.preventDefault();
      const code = f.code.value.trim().toUpperCase(), name = f.name.value.trim();
      if (!code || !name) return;
      busy = true; status = 'Connecting…'; paint();
      try {
        const j = await api('/api/claim', { method: 'POST', body: JSON.stringify({ code, name }) });
        token = j.token; user = j.user; put('ds_token', token); put('ds_user', JSON.stringify(user));
        status = 'Connected. Syncing your progress…'; pulled.clear();
        bind();
        for (const t of (V.TRACKS || []).map(x => x.id)) await pull(t);
      } catch (e) { status = e && e.status === 404 ? 'That seat code was not recognized.' : e && e.status === 409 ? 'That seat code is already in use. On a device that is connected, use Copy link for another device.' : 'Could not reach the sync server. Try again in a minute.'; }
      busy = false; paint();
    };
    const now = document.getElementById('sy-now');
    if (now) now.onclick = async () => { status = 'Syncing…'; paint(); pulled.clear(); for (const t of (V.TRACKS || []).map(x => x.id)) await pull(t); };
    const ln = document.getElementById('sy-link');
    if (ln) ln.onclick = () => {
      const url = location.origin + location.pathname + '?t=' + encodeURIComponent(token);
      const ok = () => { status = 'Sign-in link copied. Open it on the other device.'; paint(); };
      try { navigator.clipboard.writeText(url).then(ok, () => { status = url; paint(); }); } catch (e) { status = url; paint(); }
    };
    const out = document.getElementById('sy-out');
    if (out) out.onclick = () => { signOut(); status = 'Disconnected. Progress stays in this browser.'; bind(); };
  }
  function inject() {
    const anchor = document.getElementById('backup-panel');
    if (!anchor || document.getElementById('sync-panel')) return;
    const sec = document.createElement('section');
    sec.className = 'panel space-lg'; sec.id = 'sync-panel';
    anchor.parentNode.parentNode.insertBefore(sec, anchor.parentNode);
    bind();
  }
  // Show the panel only where the sync server answers (a copy published elsewhere, before the server supports it, stays local-only).
  let supported = token ? true : null, probing = null;
  const probe = () => probing || (probing = fetch(API + '/api/lab').then(r => r.ok ? r.json() : null).then(j => { supported = !!(j && Array.isArray(j.lab)); }).catch(() => { supported = false; }));
  if (V.views && V.views.progress) {
    const base = V.views.progress;
    V.views.progress = function () {
      base.apply(this, arguments);
      if (supported) inject();
      else if (supported === null) probe().then(() => { if (supported) inject(); });
    };
  }
})();
