import { initXyberOverlay } from './overlay.js';

async function initPage() {
  initXyberOverlay();
}

(() => {
  'use strict';
  /* ---- Config and reference data ---- */
  const API_BASE = ''; // Real API origin goes here once it exists. The `api` object below is the only mock; swap its methods for fetch(API_BASE + ...).
  const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Completed'];
  const CATEGORIES = ['Posters', 'Flyers', 'Booklets'];
  const PRIORITIES = ['Low', 'Normal', 'High'];
  const STAFF = ['Aroha Ngata', 'Tom Fisher', 'Mere Walker'];
  const USERS = [
    { id: 'cust-a', name: 'Customer A', role: 'Customer' },
    { id: 'cust-b', name: 'Customer B', role: 'Customer' },
    { id: 'coord-1', name: 'Coordinator', role: 'Coordinator' },
  ];
  const KEY = 'ccp-demo-v1';

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (iso) => new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  const nameOf = (id) => (USERS.find((u) => u.id === id) || {}).name || 'Customer';
  const pill = (s) => `<span class="pill s${STATUSES.indexOf(s) + 1}">${esc(s)}</span>`;
  const opts = (list, sel, ph) => (ph !== undefined ? `<option value="">${ph}</option>` : '') + list.map((x) => `<option${x === sel ? ' selected' : ''}>${esc(x)}</option>`).join('');

  /* ---- Mock store (localStorage) ---- */
  function seed() {
    const t = Date.now(),
      h = (n) => new Date(t - n * 36e5).toISOString();
    return {
      next: 3,
      requests: [
        { id: 1, customerId: 'cust-a', campaign: 'WLG-DEMO-001', category: 'Flyers', priority: 'Normal', description: '250 A5 flyers for the Newtown community fair.', assignee: null, status: 'Submitted', createdAt: h(30), updatedAt: h(30) },
        { id: 2, customerId: 'cust-b', campaign: 'WLG-DEMO-002', category: 'Posters', priority: 'High', description: '20 A3 posters for the school fundraiser.', assignee: 'Tom Fisher', status: 'Assigned', createdAt: h(50), updatedAt: h(20) },
      ],
      history: [
        { requestId: 1, from: null, to: 'Submitted', actor: 'Customer A', at: h(30) },
        { requestId: 2, from: null, to: 'Submitted', actor: 'Customer B', at: h(50) },
        { requestId: 2, from: 'Submitted', to: 'Assigned', actor: 'Coordinator', at: h(20) },
      ],
    };
  }
  function load() {
    try {
      const r = localStorage.getItem(KEY);
      if (r) return JSON.parse(r);
    } catch (e) {}
    return seed();
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {}
  }

  let db = load(),
    me = USERS[0],
    simulateFail = false,
    note = '',
    tok = 0;
  const filters = { status: '', category: '', priority: '' };

  /* ---- Mock API: enforces the same rules the real server must ---- */
  const fail = (status, message, errors) => Object.assign(new Error(message), { status, errors });
  async function call(fn) {
    const u = me;
    await new Promise((r) => setTimeout(r, 250));
    if (simulateFail) throw fail(500, 'The server couldn’t be reached. Try again.');
    return fn(u);
  }
  function validate(b) {
    const e = [],
      c = (b.campaign || '').trim(),
      d = (b.description || '').trim();
    if (!c) e.push({ field: 'campaign', msg: 'Enter a campaign reference.' });
    else if (!/^[A-Za-z0-9-]{3,40}$/.test(c)) e.push({ field: 'campaign', msg: 'Use 3–40 letters, numbers or hyphens, for example WLG-DEMO-001.' });
    if (!CATEGORIES.includes(b.category)) e.push({ field: 'category', msg: 'Choose a print category.' });
    if (!PRIORITIES.includes(b.priority)) e.push({ field: 'priority', msg: 'Choose a priority.' });
    if (!d) e.push({ field: 'description', msg: 'Add a short description.' });
    else if (d.length > 300) e.push({ field: 'description', msg: 'Keep the description to 300 characters or fewer.' });
    return e;
  }
  function needCoord(u, id) {
    if (u.role !== 'Coordinator') throw fail(403, 'Only coordinators can assign work or change status.');
    const r = db.requests.find((x) => x.id === id);
    if (!r) throw fail(404, 'Request not found.');
    return r;
  }
  const api = {
    list: (f) =>
      call((u) =>
        db.requests
          .filter((r) => u.role === 'Coordinator' || r.customerId === u.id)
          .filter((r) => (!f.status || r.status === f.status) && (!f.category || r.category === f.category) && (!f.priority || r.priority === f.priority))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    get: (id) =>
      call((u) => {
        const r = db.requests.find((x) => x.id === id);
        if (!r) throw fail(404, 'Request not found.');
        if (u.role === 'Customer' && r.customerId !== u.id) throw fail(403, 'You can only view your own requests.');
        return { request: r, history: db.history.filter((h) => h.requestId === id) };
      }),
    create: (b) =>
      call((u) => {
        if (u.role !== 'Customer') throw fail(403, 'Only customers can submit requests.');
        const errors = validate(b);
        if (errors.length) throw fail(400, 'Check the form.', errors);
        const now = new Date().toISOString();
        const r = { id: db.next++, customerId: u.id, campaign: b.campaign.trim(), category: b.category, priority: b.priority, description: b.description.trim(), assignee: null, status: 'Submitted', createdAt: now, updatedAt: now };
        db.requests.push(r);
        db.history.push({ requestId: r.id, from: null, to: 'Submitted', actor: u.name, at: now });
        save();
        return r;
      }),
    assign: (id, name) =>
      call((u) => {
        const r = needCoord(u, id);
        if (!STAFF.includes(name)) throw fail(400, 'Choose a staff member from the list.');
        if (r.status === 'Completed') throw fail(409, 'Completed requests can’t be reassigned.');
        r.assignee = name;
        r.updatedAt = new Date().toISOString();
        save();
        return r;
      }),
    advance: (id) =>
      call((u) => {
        const r = needCoord(u, id);
        const next = STATUSES[STATUSES.indexOf(r.status) + 1];
        if (!next) throw fail(409, 'This request is already Completed.');
        if (next === 'Assigned' && !r.assignee) throw fail(409, 'Assign a staff member before moving to Assigned.');
        const now = new Date().toISOString();
        db.history.push({ requestId: id, from: r.status, to: next, actor: u.name, at: now });
        r.status = next;
        r.updatedAt = now;
        save();
        return r;
      }),
  };

  /* ---- Views ---- */
  const app = $('#app');
  function setNav(n) {
    for (const k of ['requests', 'new']) {
      const a = $('#n-' + k);
      if (k === n) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    $('#n-new').hidden = me.role !== 'Customer';
  }
  function route() {
    $('#note').innerHTML = note ? `<div class="alert ok" role="status">${esc(note)}</div>` : '';
    note = '';
    const h = location.hash.slice(1) || 'requests',
      m = /^request-(\d+)$/.exec(h);
    if (m) return showDetail(+m[1]);
    if (h === 'new') return showNew();
    return showList();
  }

  function table(rows) {
    const co = me.role === 'Coordinator';
    return `<p class="muted">${rows.length} request${rows.length === 1 ? '' : 's'}</p>
  <div class="scroll"><table><thead><tr><th>Campaign</th>${co ? '<th>Customer</th>' : ''}<th>Category</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Updated</th></tr></thead><tbody>
  ${rows.map((r) => `<tr><td><a href="#request-${r.id}">${esc(r.campaign)}</a></td>${co ? `<td>${esc(nameOf(r.customerId))}</td>` : ''}<td>${esc(r.category)}</td><td>${esc(r.priority)}</td><td>${pill(r.status)}</td><td>${esc(r.assignee || '—')}</td><td><time datetime="${r.updatedAt}">${fmt(r.updatedAt)}</time></td></tr>`).join('')}
  </tbody></table></div>`;
  }

  async function showList() {
    const t = ++tok;
    setNav('requests');
    const f = (k, label, list) => `<label>${label}<select data-f="${k}">${opts(list, filters[k], 'All')}</select></label>`;
    app.innerHTML = `<h1>${me.role === 'Coordinator' ? 'All requests' : 'My requests'}</h1>
    <form class="filters" aria-label="Filter requests" onsubmit="return false">${f('status', 'Status', STATUSES)}${f('category', 'Category', CATEGORIES)}${f('priority', 'Priority', PRIORITIES)}<button type="button" id="clr">Clear filters</button></form>
    <div id="out" aria-live="polite"></div>`;
    const out = $('#out');
    const run = async () => {
      out.innerHTML = '<p class="muted">Loading requests…</p>';
      try {
        const rows = await api.list(filters);
        if (t !== tok) return;
        const any = filters.status || filters.category || filters.priority;
        out.innerHTML = rows.length ? table(rows) : `<div class="empty">${any ? 'No requests match these filters.' : 'No requests yet.'}</div>`;
      } catch (e) {
        if (t !== tok) return;
        out.innerHTML = `<div class="alert err" role="alert">${esc(e.message)} <button type="button" id="retry">Retry</button></div>`;
        $('#retry').onclick = run;
      }
    };
    app.querySelectorAll('[data-f]').forEach(
      (s) =>
        (s.onchange = () => {
          filters[s.dataset.f] = s.value;
          run();
        }),
    );
    $('#clr').onclick = () => {
      filters.status = filters.category = filters.priority = '';
      showList();
    };
    run();
  }

  const field = (id, label, control, hint = '') => `<div class="fld"><label for="${id}">${label}</label>${control}${hint ? `<small class="muted">${hint}</small>` : ''}<small class="fe" id="e-${id}"></small></div>`;
  function showErrs(errs) {
    for (const x of errs) {
      const el = $('#e-' + x.field),
        c = $('#' + x.field);
      if (el) el.textContent = x.msg;
      if (c) c.setAttribute('aria-invalid', 'true');
    }
    const first = errs.find((x) => $('#' + x.field));
    if (first) $('#' + first.field).focus();
  }
  function showNew() {
    tok++;
    setNav('new');
    if (me.role !== 'Customer') {
      app.innerHTML = '<h1>New request</h1><div class="alert warn" role="alert">Only customers can submit requests. Switch to Customer A or Customer B in the demo bar.</div>';
      return;
    }
    app.innerHTML = `<h1>New print request</h1>
  <form id="nf" class="card form" novalidate>
    ${field('campaign', 'Campaign reference', '<input id="campaign" name="campaign" autocomplete="off" placeholder="WLG-DEMO-001" aria-describedby="e-campaign">')}
    ${field('category', 'Print category', `<select id="category" name="category" aria-describedby="e-category">${opts(CATEGORIES, '', 'Choose a category')}</select>`)}
    ${field('priority', 'Priority', `<select id="priority" name="priority" aria-describedby="e-priority">${opts(PRIORITIES, 'Normal')}</select>`)}
    ${field('description', 'Short description', '<textarea id="description" name="description" rows="4" aria-describedby="e-description"></textarea>', 'Include quantity, size and any other production details here.')}
    <div id="fmsg" role="alert"></div>
    <div><button class="primary" id="sub">Submit request</button></div>
  </form>`;
    $('#nf').onsubmit = async (ev) => {
      ev.preventDefault();
      const btn = $('#sub');
      if (btn.disabled) return;
      app.querySelectorAll('.fe').forEach((e) => (e.textContent = ''));
      app.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
      $('#fmsg').innerHTML = '';
      const b = Object.fromEntries(new FormData(ev.target));
      const errs = validate(b);
      if (errs.length) return showErrs(errs);
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      try {
        const r = await api.create(b);
        note = 'Request submitted.';
        location.hash = 'request-' + r.id;
      } catch (e) {
        if (e.errors) showErrs(e.errors);
        else $('#fmsg').innerHTML = `<div class="alert err">${esc(e.message)}</div>`;
        btn.disabled = false;
        btn.textContent = 'Submit request';
      }
    };
  }

  async function act(fn, msg) {
    const btns = [...app.querySelectorAll('button')],
      was = btns.map((b) => b.disabled);
    btns.forEach((b) => (b.disabled = true));
    try {
      await fn();
      note = msg;
      route();
    } catch (e) {
      btns.forEach((b, i) => (b.disabled = was[i]));
      $('#cmsg').innerHTML = `<div class="alert err" role="alert">${esc(e.message)}</div>`;
    }
  }
  async function showDetail(id) {
    const t = ++tok;
    setNav('requests');
    app.innerHTML = '<p class="muted">Loading request…</p>';
    try {
      const { request: r, history } = await api.get(id);
      if (t !== tok) return;
      const cur = STATUSES.indexOf(r.status),
        next = STATUSES[cur + 1],
        coord = me.role === 'Coordinator';
      const blocked = next === 'Assigned' && !r.assignee;
      app.innerHTML = `<p><a href="#requests">← All requests</a></p>
    <h1>${esc(r.campaign)} ${pill(r.status)}</h1>
    <ol class="steps" aria-label="Progress">${STATUSES.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'cur' : ''}"${i === cur ? ' aria-current="step"' : ''}>${s}</li>`).join('')}</ol>
    <div class="card"><dl class="facts">
      <div><dt>Customer</dt><dd>${esc(nameOf(r.customerId))}</dd></div>
      <div><dt>Category</dt><dd>${esc(r.category)}</dd></div>
      <div><dt>Priority</dt><dd>${esc(r.priority)}</dd></div>
      <div><dt>Assignee</dt><dd>${esc(r.assignee || 'Not assigned yet')}</dd></div>
      <div><dt>Submitted</dt><dd>${fmt(r.createdAt)}</dd></div>
    </dl><h2>Description</h2><p style="margin:0">${esc(r.description)}</p></div>
    ${
      coord
        ? `<section class="card"><h2>Coordinator actions</h2>
      <div class="row"><label>Assignee<select id="as">${opts(STAFF, r.assignee, 'Unassigned')}</select></label><button type="button" id="sv">Save assignee</button></div>
      ${next ? `<button type="button" class="primary" id="adv"${blocked ? ' disabled' : ''}>Move to ${esc(next)}</button>${blocked ? '<p class="muted">Assign a staff member before moving to Assigned.</p>' : ''}` : '<p class="muted">This request is Completed and stays available for viewing.</p>'}
      <div id="cmsg"></div></section>`
        : ''
    }
    <h2>Status history</h2>
    <ol class="hist card">${history.map((h) => `<li><b>${h.from ? esc(h.from) + ' → ' : 'Submitted: '}${h.from ? esc(h.to) : 'request created'}</b> by ${esc(h.actor)}<time datetime="${h.at}">${fmt(h.at)}</time></li>`).join('')}</ol>`;
      if (coord) {
        $('#sv').onclick = () => act(() => api.assign(id, $('#as').value), 'Assignee saved.');
        if (next) $('#adv').onclick = () => act(() => api.advance(id), `Status moved to ${next}.`);
      }
    } catch (e) {
      if (t !== tok) return;
      const denied = e.status === 403 || e.status === 404;
      app.innerHTML = `<p><a href="#requests">← All requests</a></p>
      <div class="alert ${denied ? 'warn' : 'err'}" role="alert"><b>${e.status === 403 ? 'Access denied' : e.status === 404 ? 'Not found' : 'Something went wrong'}</b><br>${esc(e.message)}</div>
      ${denied ? '' : '<button type="button" id="retry">Retry</button>'}`;
      if (!denied) $('#retry').onclick = () => showDetail(id);
    }
  }

  /* ---- Demo bar and start-up ---- */
  $('#who').innerHTML = USERS.map((u) => `<option value="${u.id}">${esc(u.name)} (${u.role})</option>`).join('');
  $('#who').onchange = (e) => {
    me = USERS.find((u) => u.id === e.target.value);
    route();
  };
  $('#fail').onchange = (e) => {
    simulateFail = e.target.checked;
  };
  $('#rst').onclick = () => {
    db = seed();
    save();
    note = 'Demo data reset.';
    if ((location.hash.slice(1) || 'requests') === 'requests') route();
    else location.hash = 'requests';
  };
  addEventListener('hashchange', route);
  route();
})();

document.addEventListener('DOMContentLoaded', () => {
    initXyberOverlay();
});