import { initXyberOverlay } from './overlay.js';
import {
    nextStatus,
    buildQuery,
    escapeHtml,
    tourCardPosition
} from './Helpers.js';

export {
    nextStatus,
    buildQuery,
    escapeHtml,
    tourCardPosition
} from './Helpers.js';

async function initPage() {
  initXyberOverlay();
}

/* ============================================================
   Capital Community Print — shared script for all pages
   Loads the shared components and Data.json, then runs the view
   for the page's data-page attribute. All data comes from the API.
   ============================================================ */

/* ── API environment configuration ───────────────────────── */

const API_BASES = {
  cloud: 'https://printportal-worker.rikerhoch.workers.dev',
  local: 'http://localhost:3000',
};

const savedApiMode = localStorage.getItem('printportal-api-mode');

let activeApiMode = API_BASES[savedApiMode] ? savedApiMode : 'cloud';

let API_BASE = API_BASES[activeApiMode];

function updateApiEnvironmentSelector() {
  const selector = document.getElementById('api-environment-select');

  if (selector) {
    selector.value = activeApiMode;
  }
}

// Expose the switcher for the dynamically loaded navigation.
window.switchApiEnvironment = async function (mode) {
  if (!API_BASES[mode] || mode === activeApiMode) return;

  const previousMode = activeApiMode;

  activeApiMode = mode;
  API_BASE = API_BASES[mode];

  localStorage.setItem('printportal-api-mode', mode);

  updateApiEnvironmentSelector();

  console.log(`PrintPortal API: ${activeApiMode}`);
  console.log(`API endpoint: ${API_BASE}`);

  try {
    await refreshCurrentPageData();
    showMessage(`Connected to ${mode === 'cloud' ? 'Cloudflare' : 'Local'} API.`);
  } catch (error) {
    console.error('API environment switch failed:', error);

    // Restore the previous environment if the new one fails.
    activeApiMode = previousMode;
    API_BASE = API_BASES[previousMode];

    localStorage.setItem('printportal-api-mode', previousMode);
    updateApiEnvironmentSelector();

    showMessage(`Could not load data from ${mode} API: ${error.message}`, true);
  }
};

const DATA_URL = './Assets/JSON/Data.json';
const USER_KEY = 'printportal-user';
const TOUR_KEY = 'printportal-tour-seen';

/* ── Pure helpers (unit tested) ────────────────────────────── */
function nextStatus(statuses, status) {
  const i = statuses.indexOf(status);
  return i >= 0 && i < statuses.length - 1 ? statuses[i + 1] : null;
}

// Builds "?status=..&category=.." from a filter object, skipping blanks.
function buildQuery(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : '';
}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => entities[c]);
}

// Places the tour card below the highlighted element, or above it when
// there is no room, always kept inside the viewport.
function tourCardPosition(target, card, viewport, gap = 12) {
  const fitsBelow = target.bottom + gap + card.height <= viewport.height - gap;
  const top = fitsBelow ? target.bottom + gap : target.top - gap - card.height;
  return {
    top: Math.min(Math.max(gap, top), viewport.height - card.height - gap),
    left: Math.min(Math.max(gap, target.left), viewport.width - card.width - gap),
  };
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland', dateStyle: 'medium', timeStyle: 'short' });
}

function statusPill(status) {
  const slug = String(status).toLowerCase().replace(/\s+/g, '-');
  return `<span class="status status-${escapeHtml(slug)}">${escapeHtml(status)}</span>`;
}

/* ── Signed-in synthetic user ──────────────────────────────── */
let users = [];

function currentUser() {
  let id = null;
  try {
    id = localStorage.getItem(USER_KEY);
  } catch (e) {}
  return users.find((u) => u.id === id) || users[0];
}

function setupUserPicker() {
  const select = document.getElementById('user-select');
  select.innerHTML = users.map((u) => `<option value="${u.id}">${escapeHtml(u.name)} (${u.role})</option>`).join('');
  select.value = currentUser().id;
  select.addEventListener('change', () => {
    try {
      localStorage.setItem(USER_KEY, select.value);
    } catch (e) {}
    location.reload();
  });
  // Show role-specific controls and instructions only to that role.
  document.querySelectorAll('[data-role]').forEach((el) => {
    el.hidden = el.dataset.role !== currentUser().role;
  });
}

/* ── API ───────────────────────────────────────────────────── */
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': currentUser().id,
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status}).`);
  }

  return body;
}

/* ── Shared UI ─────────────────────────────────────────────── */
async function loadComponent(id, url) {
  const el = document.getElementById(id);

  if (el) {
    const response = await fetch(`/${url.replace(/^\/+/, '')}`);

    if (!response.ok) {
      throw new Error(`Failed to load component: ${url}`);
    }

    el.innerHTML = await response.text();
  }
}

function showMessage(text, isError = false) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = isError ? 'message error' : 'message success';
  el.hidden = false;
}

function fillSelect(select, values, placeholder) {
  const options = values.map((v) => `<option>${escapeHtml(v)}</option>`);
  if (placeholder) options.unshift(`<option value="">${escapeHtml(placeholder)}</option>`);
  select.innerHTML = options.join('');
}

/* ── Guided tour ───────────────────────────────────────────── */
// Steps whose target is hidden (e.g. coordinator-only controls) are skipped.
const TOURS = {
  list: [
    { target: '#list-help', title: 'Welcome to the print portal', text: 'These instructions stay on every page. Collapse them once you know your way around.' },
    { target: '.user-picker', title: 'Pick a demo account', text: 'Switch between Customer A, Customer B and the Coordinator. Each account only sees what its role allows.' },
    { target: '#filter-form', title: 'Find outstanding work', text: 'Filter by status, category or priority. The list updates as soon as you change a filter.' },
    { target: '#list-view .table-wrap', title: 'Requests', text: "Customers see their own requests; the coordinator sees everyone's. Click an ID to open its details and history." },
    { target: '.nav a[href="requestSubmission.html"]', title: 'Submit a print job', text: 'Start a new poster, flyer or booklet request here.' },
    { target: '#tour-button', title: 'Need a refresher?', text: 'Replay this tour any time from here.' },
  ],
  details: [
    { target: '#detail-fields', title: 'Request details', text: 'What was requested, its current status and who is working on it.' },
    { target: '#update-form', title: 'Assign and update', text: 'Pick a staff member, then move the request one step at a time: Submitted, Assigned, In Progress, Completed.' },
    { target: '#history-wrap', title: 'Status history', text: 'Every status change, when it happened and which account made it.' },
  ],
  submit: [
    { target: 'label:has([name="campaignReference"])', title: 'Campaign reference', text: 'Your event or campaign code, such as WLG-DEMO-001.' },
    { target: 'label:has([name="category"])', title: 'Print category', text: 'Choose Posters, Flyers or Booklets.' },
    { target: 'label:has([name="description"])', title: 'Description', text: 'Quantity, size, paper and anything else the printers need. Artwork is supplied separately, offline.' },
    { target: 'label:has([name="priority"])', title: 'Priority', text: 'How urgent the job is: Low, Normal or High.' },
    { target: '#submit-form button[type="submit"]', title: 'Submit', text: "You'll go straight to the new request's page to follow its progress." },
  ],
};

let tourName = null; // the tour the current view offers
let tour = null; // the running tour: { steps, index, layer }

const isVisible = (el) => Boolean(el && el.getClientRects().length);

function startTour(name) {
  endTour();
  const steps = (TOURS[name] || []).filter((step) => isVisible(document.querySelector(step.target)));
  if (!steps.length) return;

  const layer = document.createElement('div');
  layer.className = 'tour';
  layer.innerHTML = `
    <div class="tour-spotlight"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <p class="tour-step"></p>
      <h3 class="tour-title" id="tour-title"></h3>
      <p class="tour-text"></p>
      <div class="tour-actions">
        <button type="button" class="ghost small" data-tour="skip">Skip</button>
        <button type="button" class="ghost small" data-tour="back">Back</button>
        <button type="button" class="small" data-tour="next">Next</button>
      </div>
    </div>`;
  layer.addEventListener('click', (event) => {
    const action = event.target.dataset.tour;
    if (action === 'next') showTourStep(tour.index + 1);
    if (action === 'back') showTourStep(tour.index - 1);
    if (action === 'skip') endTour();
  });
  document.body.appendChild(layer);
  document.addEventListener('keydown', onTourKey);
  window.addEventListener('resize', positionTour);
  window.addEventListener('scroll', positionTour, { passive: true });

  tour = { steps, index: 0, layer };
  try {
    localStorage.setItem(`${TOUR_KEY}-${name}`, '1');
  } catch (e) {}
  showTourStep(0);
}

// Starts the current view's tour automatically the first time it is seen,
// once the entrance animations have settled.
function autoTour() {
  let seen = false;
  try {
    seen = Boolean(localStorage.getItem(`${TOUR_KEY}-${tourName}`));
  } catch (e) {}
  if (!seen) setTimeout(() => startTour(tourName), 500);
}

function showTourStep(index) {
  if (index >= tour.steps.length) return endTour();
  tour.index = Math.max(0, index);
  const step = tour.steps[tour.index];
  const card = tour.layer.querySelector('.tour-card');
  const next = card.querySelector('[data-tour="next"]');

  card.querySelector('.tour-step').textContent = `Step ${tour.index + 1} of ${tour.steps.length}`;
  card.querySelector('.tour-title').textContent = step.title;
  card.querySelector('.tour-text').textContent = step.text;
  card.querySelector('[data-tour="back"]').hidden = tour.index === 0;
  next.textContent = tour.index === tour.steps.length - 1 ? 'Finish' : 'Next';
  next.focus({ preventScroll: true });

  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector(step.target).scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  positionTour();
}

function positionTour() {
  if (!tour) return;
  const rect = document.querySelector(tour.steps[tour.index].target).getBoundingClientRect();
  const pad = 6;
  Object.assign(tour.layer.querySelector('.tour-spotlight').style, {
    top: `${rect.top - pad}px`,
    left: `${rect.left - pad}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
  });

  const card = tour.layer.querySelector('.tour-card');
  const { top, left } = tourCardPosition({ top: rect.top - pad, bottom: rect.bottom + pad, left: rect.left - pad }, { width: card.offsetWidth, height: card.offsetHeight }, { width: document.documentElement.clientWidth, height: window.innerHeight });
  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
}

function onTourKey(event) {
  if (event.key === 'Escape') endTour();
  else if (event.key === 'ArrowRight') showTourStep(tour.index + 1);
  else if (event.key === 'ArrowLeft') showTourStep(tour.index - 1);
}

function endTour() {
  if (!tour) return;
  tour.layer.remove();
  document.removeEventListener('keydown', onTourKey);
  window.removeEventListener('resize', positionTour);
  window.removeEventListener('scroll', positionTour);
  tour = null;
}

/* ── Requests page: list + filters ─────────────────────────── */
function initRequestsPage(data) {
  const id = new URLSearchParams(location.search).get('id');
  if (id) return initDetails(id, data);

  tourName = 'list';
  const form = document.getElementById('filter-form');
  fillSelect(form.status, data.statuses, 'All');
  fillSelect(form.category, data.categories, 'All');
  fillSelect(form.priority, data.priorities, 'All');
  form.addEventListener('change', () => loadList(form));
  document.getElementById('list-view').hidden = false;
  loadList(form).then(autoTour);
}

async function loadList(form) {
  const rows = document.getElementById('request-rows');
  try {
    const requests = await api(`/api/requests${buildQuery(Object.fromEntries(new FormData(form)))}`);
    rows.innerHTML = requests.length
      ? requests
          .map(
            (r, i) => `
          <tr style="--i:${i}">
            <td><a href="index.html?id=${r.id}">#${r.id}</a></td>
            <td>${escapeHtml(r.campaignReference)}</td>
            <td>${escapeHtml(r.category)}</td>
            <td>${escapeHtml(r.priority)}</td>
            <td>${statusPill(r.status)}</td>
            <td>${escapeHtml(r.assignee || '—')}</td>
            <td>${formatDate(r.updatedAt)}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="7" class="empty">No requests found.</td></tr>`;
  } catch (err) {
    showMessage(err.message, true);
  }
}

/* ── Refresh current page after API environment switch ─── */

async function refreshCurrentPageData() {
  const data = await (await fetch(DATA_URL)).json();

  const page = document.body.dataset.page;

  if (page === 'requests') {
    const id = new URLSearchParams(location.search).get('id');

    if (id) {
      const request = await api(`/api/requests/${encodeURIComponent(id)}`);

      renderDetails(request, data);
    } else {
      const form = document.getElementById('filter-form');
      await loadList(form);
    }
  }

  console.log(`Page data refreshed from ${activeApiMode} API.`);
}

/* ── Requests page: details, history, assign/update ────────── */
async function initDetails(id, data) {
  tourName = 'details';
  const form = document.getElementById('update-form');
  let current = null;

  fillSelect(form.assignee, data.staff, 'Choose a staff member');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = {};
    if (form.assignee.value) body.assignee = form.assignee.value;
    if (event.submitter.value === 'advance') body.status = nextStatus(data.statuses, current.status);
    try {
      current = await api(`/api/requests/${current.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      renderDetails(current, data);
      showMessage('Request updated.');
    } catch (err) {
      showMessage(err.message, true);
    }
  });

  try {
    current = await api(`/api/requests/${encodeURIComponent(id)}`);
    renderDetails(current, data);
    document.getElementById('details-view').hidden = false;
    autoTour();
  } catch (err) {
    showMessage(err.message, true);
  }
}

function renderDetails(r, data) {
  document.getElementById('detail-title').textContent = `Request #${r.id} · ${r.campaignReference}`;

  const fields = [
    ['Status', statusPill(r.status)],
    ['Customer', escapeHtml(r.customerId)],
    ['Category', escapeHtml(r.category)],
    ['Priority', escapeHtml(r.priority)],
    ['Assignee', escapeHtml(r.assignee || 'Not assigned')],
    ['Description', escapeHtml(r.description)],
    ['Submitted', formatDate(r.createdAt)],
    ['Last updated', formatDate(r.updatedAt)],
  ];
  document.getElementById('detail-fields').innerHTML = fields.map(([label, html]) => `<dt>${label}</dt><dd>${html}</dd>`).join('');

  document.getElementById('history-rows').innerHTML = r.history
    .map(
      (h, i) => `
    <tr style="--i:${i}">
      <td>${formatDate(h.changedAt)}</td>
      <td>${h.previousStatus ? statusPill(h.previousStatus) : '—'}</td>
      <td>${statusPill(h.newStatus)}</td>
      <td>${escapeHtml(h.actor)}</td>
    </tr>`,
    )
    .join('');

  const form = document.getElementById('update-form');
  form.assignee.value = r.assignee || '';
  const next = nextStatus(data.statuses, r.status);
  const advance = document.getElementById('advance-button');
  advance.hidden = !next;
  advance.textContent = `Move to ${next}`;
}

/* ── Submit page ───────────────────────────────────────────── */
function initSubmitPage(data) {
  tourName = 'submit';
  const form = document.getElementById('submit-form');
  fillSelect(form.category, data.categories, 'Choose a category');
  fillSelect(form.priority, data.priorities);
  form.priority.value = 'Normal';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const created = await api('/api/requests', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      location.href = `index.html?id=${created.id}`;
    } catch (err) {
      showMessage(err.message, true);
    }
  });
  autoTour();
}

/* ── Boot ──────────────────────────────────────────────────── */
async function init() {
  const data = await (await fetch(DATA_URL)).json();
  users = data.users;
  await Promise.all([loadComponent('site-nav', 'Assets/Components/Navigation.html'), loadComponent('site-footer', 'Assets/Components/Footer.html')]);

  setupUserPicker();

  // Initialise API environment selector after navigation loads.
  const apiSelector = document.getElementById('api-environment-select');

  if (apiSelector) {
    apiSelector.value = activeApiMode;

    apiSelector.addEventListener('change', (event) => {
      window.switchApiEnvironment(event.target.value);
    });
  }
  document.getElementById('tour-button').addEventListener('click', () => startTour(tourName));

  const page = document.body.dataset.page;
  if (page === 'requests') initRequestsPage(data);
  if (page === 'submit') initSubmitPage(data);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    nextStatus,
    buildQuery,
    escapeHtml,
    tourCardPosition,
  };
}

// Export pure helper functions for Node.js unit tests.
export { nextStatus, buildQuery, escapeHtml, tourCardPosition };

// Only run browser code when a browser document exists.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);

  document.addEventListener('DOMContentLoaded', () => {
    initXyberOverlay();
  });
}
