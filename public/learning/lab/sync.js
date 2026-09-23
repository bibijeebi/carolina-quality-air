/* Vent Exam Lab: optional sync through DuctStudy seat codes.
   Local-first. With a seat, each credential's progress reconciles with the DuctStudy API: pull first, merge when both
   sides changed, then a compare-and-swap push (the server refuses a write whose base is not its current copy).
   Sims post once each (the server ignores a repeat) so they show on the company's owner dashboard.
   Without a seat, nothing here talks to a server except one check that the sync server exists. */
(function () {
  'use strict';
  const V = window.VEL = window.VEL || {};
  const meta = document.querySelector('meta[name="vel-api"]');
  const metaUrl = ((meta && meta.content) || '').replace(/\/$/, '');
  // The copy published on the CQA site talks to the DuctStudy worker across origins; anywhere else (the worker's own
  // host, a custom domain on it, local dev) the API is same-origin.
  const API = /(^|\.)carolinaqualityair\.xyz$/.test(location.hostname) ? metaUrl : '';
  const FALLBACK_TOTAL = { ascs: 781, cvi: 385, dvt: 274 }; // practice-pool sizes, used only when a track's data is not loaded
  const LOCAL_ONLY = ['sim', 'drill']; // an in-progress sim or drill never leaves the device
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pool = t => 'lab-' + t;
  const tracks = () => (V.TRACKS || []).map(x => x.id);
  const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);

  // The lab keeps its own sign-in (vel-token) so disconnecting here never signs the tech out of the DuctStudy app.
  // On the DuctStudy host it starts from the app's sign-in (ds_token) unless the tech disconnected the lab.
  if (API === '' && !get('vel-token') && get('ds_token') && get('vel-sync-off') !== '1') { put('vel-token', get('ds_token')); put('vel-user', get('ds_user')); }
  let token = get('vel-token'), user = null, status = '', notice = '', offer = '', busy = false, linkShown = '', confirmOut = false;
  try { user = JSON.parse(get('vel-user')); } catch (e) { user = null; }
  // Per-seat bookkeeping, so two techs sharing a device never mix: base = the server copy's `updated` at the last sync
  // (absent = never synced here), dirty = changed here since, sent = sim timestamps the server has confirmed or taken.
  const owner = () => get('vel-owner') || '';
  const k = (kind, t) => `vel-${kind}-${owner()}-${t}`;
  const gen = {}, timers = {}, locks = {}, queued = {};

  // nothing studied on this track (a reset track is blank too, but carries resetAt)
  const blank = S => !isObj(S) || (!Object.keys(S.q || {}).length && !Object.keys(S.rc || {}).length && !Object.keys(S.ls || {}).length && !(S.sims || []).length);
  const lost = S => blank(S) && !(isObj(S) && S.resetAt);  // no study data and no reset: never overwrites saved study data
  const empty = S => lost(S) && !(isObj(S) && S.planAt);   // not even a study window: nothing worth sending

  async function api(path, opt) {
    opt = opt || {};
    const h = { 'content-type': 'application/json' };
    if (token && !opt.anon) h.authorization = 'Bearer ' + token;
    const r = await fetch(API + path, { method: opt.method || 'GET', body: opt.body, headers: h, keepalive: !!opt.keepalive });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
    return j;
  }
  function fail(e) {
    if (e && e.status === 401) { dropToken(); status = 'That sign-in is no longer active on this device. Connect again with a seat code or a fresh sign-in link.'; }
    else status = 'Could not reach the sync server. Progress is saved in this browser and syncs next time.';
    paint();
  }
  function dropToken() { token = null; user = null; put('vel-token', null); put('vel-user', null); }
  function noteUser(u) {
    if (!u) return;
    const was = user && user.name;
    user = u; put('vel-user', JSON.stringify(u));
    if (was !== u.name && document.getElementById('sync-panel')) bind();
  }
  // A different seat signing in on this device: park the current progress under its owner and load the new seat's.
  // Returns false (and changes nothing) when the browser has no room to park it.
  function claimDevice(uid) {
    const cur = owner();
    if (cur === uid) return true;
    if (cur && V.swapStore) {
      const curName = get('vel-owner-name') || 'the previous seat';
      const snapshot = JSON.stringify(V.swapStore(null));
      if (!put('vel-stash-' + cur, snapshot)) { V.swapStore(JSON.parse(snapshot)); notice = 'This browser is out of storage, so it cannot switch seats without losing the current progress. Use Progress, Copy backup first.'; return false; }
      put('vel-stash-name-' + cur, curName);
      let mine = null;
      try { mine = JSON.parse(get('vel-stash-' + uid)); } catch (e) { mine = null; }
      if (mine) { V.swapStore(mine); put('vel-stash-' + uid, null); put('vel-stash-name-' + uid, null); }
      else offer = cur; // may bring the parked progress along, if the new seat turns out to be empty
      if (V.rerender) V.rerender();
    }
    put('vel-owner', uid);
    return true;
  }

  /* ---------- merge: union of both devices' work, newest record wins per question and card ---------- */
  const newer = (a, b) => ((+(b && b.t) || 0) > (+(a && a.t) || 0) || (!(b && b.t) && !(a && a.t) && (+(b && b.n) || 0) > (+(a && a.n) || 0))) ? b : a;
  function since(map, at, stamp) { if (!at) return Object.assign({}, map); const o = {}; for (const [id, r] of Object.entries(map || {})) if (stamp(r) >= at) o[id] = r; return o; }
  function merge(local, server) {
    const L = isObj(local) ? local : {}, R = isObj(server) ? server : {};
    const reset = Math.max(+L.resetAt || 0, +R.resetAt || 0);
    // work older than the latest reset on either device is gone
    const tq = r => +(r && r.t) || 0, tl = r => Math.max(+(r && r.read) || 0, +(r && r.passed) || 0);
    const Lq = since(L.q, reset, tq), Rq = since(R.q, reset, tq), Lrc = since(L.rc, reset, tq), Rrc = since(R.rc, reset, tq);
    const Lls = since(L.ls, reset, tl), Rls = since(R.ls, reset, tl);
    const byKey = (a, b, pick) => { const o = Object.assign({}, a); for (const id of Object.keys(b || {})) o[id] = id in o ? pick(o[id], b[id]) : b[id]; return o; };
    const planFrom = (+R.planAt || 0) > (+L.planAt || 0) ? R : L;
    const out = Object.assign({}, R, L, { plan: planFrom.plan || L.plan, mode: planFrom.mode || L.mode, planAt: planFrom.planAt });
    if (reset) out.resetAt = reset;
    out.q = byKey(Lq, Rq, newer);
    out.rc = byKey(Lrc, Rrc, newer);
    out.ls = byKey(Lls, Rls, (a, b) => ({ read: (a && a.read) || (b && b.read) || undefined, passed: (a && a.passed) || (b && b.passed) || undefined }));
    // exposure counts and game bests carry no timestamps: after a reset only the reset side's values count
    const split = reset && (+L.resetAt || 0) !== (+R.resetAt || 0), resetSide = (+L.resetAt || 0) >= (+R.resetAt || 0) ? L : R;
    out.exp = split ? Object.assign({}, resetSide.exp) : byKey(L.exp, R.exp, (a, b) => Math.max(+a || 0, +b || 0));
    out.best = split ? Object.assign({}, resetSide.best) : byKey(L.best, R.best, (a, b) => ((b && b.n ? b.s / b.n : 0) > (a && a.n ? a.s / a.n : 0) ? b : a));
    const sims = new Map();
    [].concat(R.sims || [], L.sims || []).forEach(s => { if (isObj(s) && s.ts && +s.ts >= reset) sims.set(+s.ts, s); });
    out.sims = [...sims.values()].sort((a, b) => a.ts - b.ts).slice(-60);
    LOCAL_ONLY.forEach(f => { out[f] = L[f] || null; });
    return out;
  }
  // taking the server copy whole still keeps this device's in-progress sim and drill, and its study window if newer
  function adopt(server, local) {
    const L = isObj(local) ? local : {}, out = Object.assign({}, server);
    if ((+L.planAt || 0) > (+server.planAt || 0)) { out.plan = L.plan; out.mode = L.mode; out.planAt = L.planAt; }
    LOCAL_ONLY.forEach(f => { out[f] = L[f] || null; });
    return out;
  }
  const outbound = S => { const o = Object.assign({}, S); LOCAL_ONLY.forEach(f => { o[f] = null; }); return o; };

  function stats(t, S) {
    const D = V.data && V.data[t];
    if (D && V.poolStats) { const ps = V.poolStats(D, S); put('vel-total-' + t, String(ps.n)); return { done: ps.retired, total: ps.n }; }
    return { done: Object.values((S && S.q) || {}).filter(r => r && r.r).length, total: +(get('vel-total-' + t) || 0) || FALLBACK_TOTAL[t] || 0 };
  }
  function sentSet(t) { try { return new Set(JSON.parse(get(k('sent', t))) || []); } catch (e) { return new Set(); } }
  function saveSent(t, set) { put(k('sent', t), JSON.stringify([...set].sort((a, b) => b - a).slice(0, 300))); }
  // Post every sim the server has not confirmed. /api/me lists the latest sims it holds; the server also ignores a
  // repeat of the same sim, so a sim that appears in a synced copy but whose post was lost still gets posted.
  async function sendSims(t, confirmed) {
    const sent = sentSet(t);
    (confirmed || []).forEach(s => { if (s && s.at) sent.add(+s.at); });
    const S = V.getTrack(t);
    for (const s of (S && S.sims) || []) {
      if (!isObj(s) || !s.ts || sent.has(+s.ts)) continue;
      await api('/api/sim?pool=' + pool(t), { method: 'POST', body: JSON.stringify({ n: +s.total || 0, pc: +s.pct || 0, per: s.dom || {}, at: +s.ts }) });
      sent.add(+s.ts); saveSent(t, sent);
    }
    saveSent(t, sent);
  }
  function synced(t, updated, g0) {
    put(k('base', t), String(updated));
    if ((gen[t] || 0) === g0) put(k('dirty', t), null); else schedule(t, 500); // edits made mid-sync go out next
  }

  // One reconcile for one track: pull, decide, maybe merge, compare-and-swap push. Serialized per track, and a
  // reconcile already waiting in line covers any new request for the same track.
  function syncTrack(t) {
    if (!t) return Promise.resolve();
    if (queued[t]) return locks[t];
    queued[t] = true;
    return (locks[t] = (locks[t] || Promise.resolve()).then(() => { queued[t] = false; return reconcile(t, 0); }).catch(() => {}));
  }
  async function reconcile(t, tries) {
    if (!token || !V.getTrack) return;
    const g0 = gen[t] || 0;
    let me;
    try { me = await api('/api/me?pool=' + pool(t)); } catch (e) { fail(e); return; }
    if (me.user && me.user.id && owner() !== me.user.id && !claimDevice(me.user.id)) { paint(); return; } // a sign-in adopted from the DuctStudy app
    noteUser(me.user);
    if ((gen[t] || 0) !== g0 && tries < 3) return reconcile(t, tries + 1); // studied during the fetch: look again
    const remote = +me.updated || 0;
    let data = null;
    if (me.state) { try { data = JSON.parse(me.state); } catch (e) { data = null; } }
    if (!isObj(data)) data = null;
    const baseRaw = get(k('base', t)), base = +(baseRaw || 0), dirty = get(k('dirty', t)) === '1';
    const local = V.getTrack(t);
    let out = null, take = false;
    if (!data) out = empty(local) ? null : local;            // no copy on the server yet: ours goes up if there is any
    else if (baseRaw === null) { if (empty(local)) take = true; else out = merge(local, data); } // first sync on this device: never discard either side
    else if (lost(local) && !blank(data)) { if (dirty) out = merge(local, data); else take = true; } // local study data went missing: keep the server's
    else if (remote === base) { if (dirty) out = local; }    // only we changed (a reset included)
    else if (dirty) out = merge(local, data);                // both changed
    else take = true;                                        // only the server changed (a reset on another device included)
    if (take) {
      V.setTrack(t, adopt(data, local)); synced(t, remote, g0);
      await sendSims(t, me.sims).catch(() => {});
      if (offer) offerBack();
      return done(t, 'Loaded your progress from your account.', true);
    }
    if (!out) { if (data) put(k('base', t), String(remote)); await sendSims(t, me.sims).catch(() => {}); if (offer) offerBack(); return done(t, 'In sync.'); }
    const st = stats(t, out);
    const body = { state: JSON.stringify(outbound(out)), updated: Math.max(Date.now(), remote + 1), v: 1, base: remote, done: st.done, total: st.total };
    let r;
    try { r = await api('/api/state?pool=' + pool(t), { method: 'PUT', body: JSON.stringify(body) }); } catch (e) { fail(e); return; }
    if (r.stale) { if (tries < 3) return reconcile(t, tries + 1); status = 'Another device is saving right now. Tap Sync now in a moment.'; paint(); return; }
    // merged: keep anything studied while the request was out (a reset made meanwhile wins through resetAt)
    if (out !== local) V.setTrack(t, (gen[t] || 0) === g0 ? out : merge(V.getTrack(t), out));
    synced(t, +r.updated || body.updated, g0);
    try { await sendSims(t, me.sims); } catch (e) { fail(e); return; }
    done(t, out !== local ? 'Merged with progress from another device and saved.' : 'Saved to your account.', out !== local);
  }
  // redraw only when this track's data changed under the page, and never mid-question
  // Redraw after a merge, but never under someone typing: a focused field or a pasted backup would be wiped.
  function done(t, msg, changed) { status = msg; paint(); const a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName), bk = document.getElementById('bk-in'); if (changed && V.cur === t && V.rerender && !typing && !(bk && bk.value) && !document.querySelector('.question-panel, .flashcard, .quiz-wrap')) V.rerender(); }
  function schedule(t, ms) { if (!token) return; clearTimeout(timers[t]); timers[t] = setTimeout(() => { delete timers[t]; syncTrack(t); }, ms); }
  // After a seat switch: if the new seat has nothing anywhere, offer to bring the parked progress into it.
  function offerBack() {
    const from = offer;
    if (!from || !get('vel-stash-' + from) || !tracks().every(t => blank(V.getTrack(t)))) return;
    notice = `This seat has no progress yet. The progress on this device belongs to ${get('vel-stash-name-' + from) || 'another seat'}.`;
    if (document.getElementById('sync-panel')) bind();
  }

  V.onSave = function (ts) {
    (ts || []).forEach(t => { if (!t) return; gen[t] = (gen[t] || 0) + 1; put(k('dirty', t), '1'); schedule(t, 3000); });
  };
  // Closing the tab: a best-effort compare-and-swap push of what we have (small states only; keepalive caps at 64 KB).
  // If another device got there first the server refuses it, and the next visit merges. Sims post on the next visit.
  function lastPush(t) {
    const baseRaw = get(k('base', t)), S = V.getTrack && V.getTrack(t);
    if (!token || baseRaw === null || get(k('dirty', t)) !== '1' || !S || lost(S)) return;
    const st = stats(t, S), g0 = gen[t] || 0, updated = Math.max(Date.now(), +baseRaw + 1);
    const body = JSON.stringify({ state: JSON.stringify(outbound(S)), updated, v: 1, base: +baseRaw, done: st.done, total: st.total });
    if (body.length > 60000) return;
    api('/api/state?pool=' + pool(t), { method: 'PUT', body, keepalive: true }).then(r => { if (!r.stale) synced(t, +r.updated || updated, g0); }).catch(() => {});
  }
  let seenTrack = null;
  const follow = () => { if (token && V.cur) { seenTrack = V.cur; syncTrack(V.cur); } };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { Object.keys(timers).forEach(t => { clearTimeout(timers[t]); delete timers[t]; lastPush(t); }); return; }
    follow(); // back on this tab: pull before anything else goes up
  });
  window.addEventListener('pageshow', e => { if (e.persisted) follow(); }); // restored from the back-forward cache
  window.addEventListener('hashchange', () => setTimeout(() => { if (V.cur !== seenTrack) follow(); }, 50)); // track switches only
  window.addEventListener('load', () => setTimeout(follow, 50));

  // A sign-in link from another device: ?l=<code>, good for 15 minutes, removed from the address bar right away.
  (function redeemLink() {
    let code = '';
    try {
      const qs = new URLSearchParams(location.search);
      code = qs.get('l') || '';
      const auth = qs.get('auth');
      if (!code && !qs.get('t') && !auth) return;
      qs.delete('l'); qs.delete('t'); qs.delete('auth');
      if (auth) { history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash); notice = auth === 'cancelled' ? 'Google sign-in was cancelled.' : 'Google sign-in did not go through. Try again.'; return; }
      history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : '') + location.hash);
    } catch (e) { return; }
    if (!/^[A-Z0-9]{6,20}\.\d{10,14}\.[A-Za-z0-9_-]{20,64}$/.test(code)) { notice = 'That sign-in link is not valid. Copy a new one on the connected device.'; return; }
    const uid = code.split('.')[0];
    if (token && user && user.id && user.id !== uid) { notice = `This link is for a different seat, and this device is connected as ${user.name}. Disconnect it first, then open the link again.`; return; }
    busy = true;
    api('/api/redeem', { method: 'POST', body: JSON.stringify({ l: code }), anon: true }).then(j => {
      if (!claimDevice(j.user.id)) return;
      token = j.token; put('vel-token', token); put('vel-sync-off', null); put('vel-owner-name', j.user.name); noteUser(j.user);
      status = j.user.email ? 'Signed in. Syncing…' : 'Signed in on this device. Syncing…'; bind();
      return tracks().reduce((p, t) => p.then(() => syncTrack(t)), Promise.resolve());
    }).catch(e => { notice = e && e.status === 410 ? 'That sign-in link has expired. Copy a new one on the connected device.' : e && e.status ? 'That sign-in link is not valid. Copy a new one on the connected device.' : 'Could not reach the sync server. Open the link again in a minute.'; })
      .then(() => { busy = false; paint(); if (document.getElementById('sync-panel')) bind(); });
  })();

  /* ---------- Progress panel ---------- */
  function panelHTML() {
    const note = notice ? `<p class="sync-notice small space-sm">${esc(notice)}</p>` : '';
    const bring = offer && notice && get('vel-stash-' + offer) ? `<div class="actions space-sm"><button type="button" class="btn secondary" id="sy-bring">Bring it into this seat</button></div>` : '';
    if (token) {
      const who = user ? `<b>${esc(user.name)}</b>${user.email ? ` (${esc(user.email)})` : ''}${user.company ? ', ' + esc(user.company) : ''}` : 'your seat';
      const join = user && user.indie
        ? `<form id="sy-join" class="sync-form space" autocomplete="off"><label class="small" for="sy-jcode">Company seat code</label><input id="sy-jcode" name="code" placeholder="ABCD-EFGH" autocapitalize="characters" spellcheck="false" required><div class="actions space-sm"><button type="submit" class="btn secondary">Join my company</button></div></form><p class="small muted space-sm">Joining puts your progress and sims on your company's dashboard. You keep studying either way.</p>`
        : '';
      return `<h2>Sync across devices</h2>${note}${bring}<p class="small space-sm">Signed in as ${who}. Each credential's progress saves to your account${user && user.indie ? ' and follows you to any device you sign in on' : ", and your sims show on your company's dashboard"}.</p>${join}`
        + `<div class="actions space"><button type="button" class="btn" id="sy-now">Sync now</button><button type="button" class="btn secondary" id="sy-link">Sign in another device</button></div>`
        + (linkShown ? `<label class="small muted space-sm" for="sy-url">Open this on the other device within 15 minutes. Anyone with it can sign in as you until then.</label><input id="sy-url" class="sync-url" readonly value="${esc(linkShown)}">` : '')
        + (confirmOut
          ? `<p class="small space">Disconnecting leaves your progress in this browser but stops syncing here. Your seat code works only once, so to reconnect this device later you will need a sign-in link from a device that is still connected.</p><div class="actions space-sm"><button type="button" class="btn secondary danger" id="sy-out-yes">Disconnect this device</button><button type="button" class="btn text" id="sy-out-no">Keep syncing</button></div>`
          : `<div class="actions space-sm"><button type="button" class="btn text" id="sy-out">Disconnect this device</button></div>`)
        + `<p class="backup-status" id="sy-status" role="status">${esc(status)}</p>`;
    }
    const gbtn = google ? `<div class="actions space"><a class="btn" id="sy-google" href="${esc(API + '/auth/google?next=' + encodeURIComponent(location.href.replace(/[?#].*$/, '') + location.hash))}">Sign in with Google</a></div><p class="small muted space-sm">Free. Your progress saves to your account and follows you to any device. Or use a seat code from your company:</p>` : '';
    return `<h2>Save your progress</h2>${note}${google ? '' : `<p class="muted small space-sm">Got a seat code from your company? Connect it to keep your progress on every device and put your sims on your company's dashboard. Without one, progress stays in this browser.</p>`}${gbtn}`
      + `<form id="sy-form" class="sync-form space" autocomplete="off"><label class="small" for="sy-code">Seat code</label><input id="sy-code" name="code" placeholder="ABCD-EFGH" autocapitalize="characters" spellcheck="false" required>`
      + `<label class="small" for="sy-name">Your name</label><input id="sy-name" name="name" placeholder="First and last" required maxlength="60"><div class="actions space-sm"><button type="submit" class="btn" ${busy ? 'disabled' : ''}>Connect</button></div></form>`
      + `<p class="small muted space-sm">Already connected on another device? Use Sign in another device there and open the link here.</p><p class="backup-status" id="sy-status" role="status">${esc(status)}</p>`;
  }
  function paint() { const el = document.getElementById('sy-status'); if (el) el.textContent = status; }
  function bind() {
    const box = document.getElementById('sync-panel'); if (!box) return;
    box.innerHTML = panelHTML();
    const on = (id, f) => { const el = document.getElementById(id); if (el) el.onclick = f; };
    const f = document.getElementById('sy-form');
    if (f) f.onsubmit = async ev => {
      ev.preventDefault();
      const code = f.code.value.trim().toUpperCase(), name = f.name.value.trim();
      if (!code || !name || busy) return;
      busy = true; notice = ''; status = 'Connecting…'; paint();
      try {
        const j = await api('/api/claim', { method: 'POST', body: JSON.stringify({ code, name }), anon: true });
        token = j.token; user = j.user; put('vel-token', token); put('vel-user', JSON.stringify(user)); put('vel-sync-off', null);
        if (API === '' && !get('ds_token')) { put('ds_token', token); put('ds_user', JSON.stringify(user)); } // the DuctStudy app on this host uses the same seat
        if (!claimDevice(j.user.id)) { status = ''; bind(); return; }
        put('vel-owner-name', j.user.name);
        status = 'Connected. Syncing your progress…'; busy = false; bind();
        for (const t of tracks()) await syncTrack(t);
      } catch (e) {
        busy = false;
        status = e && e.status === 404 ? 'That seat code was not recognized.' : e && e.status === 409 ? 'That seat code is already in use. On a device that is connected, use Sign in another device.' : 'Could not reach the sync server. Try again in a minute.';
        paint();
      }
    };
    const jf = document.getElementById('sy-join');
    if (jf) jf.onsubmit = async ev => {
      ev.preventDefault();
      const code = jf.code.value.trim().toUpperCase();
      if (!code || busy) return;
      busy = true; status = 'Joining…'; paint();
      try { const j = await api('/api/join', { method: 'POST', body: JSON.stringify({ code }) }); noteUser(j.user); status = `You're on ${j.user.company} now. Your progress and sims show on its dashboard.`; bind(); }
      catch (e) { status = e && e.status === 404 ? 'That seat code was not recognized.' : e && e.status === 409 ? (e.message === 'Already on a company.' ? 'You are already on a company.' : 'That seat code is already in use.') : 'Could not reach the sync server. Try again in a minute.'; paint(); }
      busy = false;
    };
    on('sy-now', async () => { status = 'Syncing…'; paint(); for (const t of tracks()) await syncTrack(t); });
    on('sy-link', async () => {
      try {
        const j = await api('/api/link', { method: 'POST', body: '{}' });
        linkShown = location.origin + location.pathname + '?l=' + encodeURIComponent(j.link);
        status = 'Sign-in link ready below.';
        bind();
        try { await navigator.clipboard.writeText(linkShown); status = 'Sign-in link copied. It also shows below.'; paint(); } catch (e) { /* the box below has it */ }
      } catch (e) { fail(e); }
    });
    on('sy-bring', async () => {
      let s = null;
      try { s = JSON.parse(get('vel-stash-' + offer)); } catch (e) { s = null; }
      if (s && V.swapStore) { V.swapStore(s); put('vel-stash-' + offer, null); put('vel-stash-name-' + offer, null); }
      offer = ''; notice = ''; status = 'Bringing your progress into this seat…'; bind();
      V.onSave(tracks());
      for (const t of tracks()) await syncTrack(t);
      if (V.rerender) V.rerender();
    });
    on('sy-out', () => { confirmOut = true; bind(); });
    on('sy-out-no', () => { confirmOut = false; bind(); });
    on('sy-out-yes', () => { confirmOut = false; notice = ''; linkShown = ''; dropToken(); put('vel-sync-off', '1'); status = 'Disconnected. Progress stays in this browser.'; bind(); probe().then(bind); });
  }
  function inject() {
    const anchor = document.getElementById('backup-panel');
    if (!anchor || document.getElementById('sync-panel')) return;
    const sec = document.createElement('section');
    sec.className = 'panel space-lg'; sec.id = 'sync-panel';
    anchor.parentNode.parentNode.insertBefore(sec, anchor.parentNode);
    bind();
  }
  // Show the panel only where the sync server answers, so a copy published before the server supports the lab stays
  // local-only. One check per page load; a failure is retried on the next Progress visit.
  let supported = !!token, probing = null, google = false;
  const probe = () => probing || (probing = fetch(API + '/api/lab').then(r => (r.ok ? r.json() : null))
    .then(j => { supported = !!(j && Array.isArray(j.lab)); google = !!(j && j.google); if (!supported) probing = null; })
    .catch(() => { supported = false; probing = null; }));
  if (V.views && V.views.progress) {
    const base = V.views.progress;
    V.views.progress = function () {
      base.apply(this, arguments);
      if (token) inject();
      else probe().then(() => { if (supported || notice) inject(); });
    };
  }
})();
