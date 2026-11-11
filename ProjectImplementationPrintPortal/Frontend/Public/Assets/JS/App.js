/* Capital Community Print · shared dashboard controller.
 * UI state is transient; API authorization is enforced by the server, not the DOM.
 */
import { nextStatus, buildQuery, escapeHtml } from './Helpers.js';
import { API_BASES, defaultApiMode } from './api-config.js';
export { nextStatus, buildQuery, escapeHtml } from './Helpers.js';

const DATA_URL = './Assets/JSON/Data.json';
const USER_KEY = 'printportal-user';
const API_KEY = 'printportal-api-mode';
const FONT_KEY = 'printportal-silly-type';
const $ = (selector) => document.querySelector(selector);
let users = [];
let reference = {};
let detail = null;
let apiMode = safeGet(API_KEY) || defaultApiMode(location.hostname);
if (!API_BASES[apiMode]) apiMode = defaultApiMode(location.hostname);

function apiOrigin() {
  if (apiMode === 'local' && ['localhost', '127.0.0.1'].includes(location.hostname)) {
    return `${location.protocol}//${location.hostname}:3000`;
  }
  return API_BASES[apiMode];
}
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}
function currentUser() {
  return users.find((u) => u.id === safeGet(USER_KEY)) || users[0];
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
function statusLabel(request) {
  return request.deletedAt ? 'Archived' : request.rejectedAt ? 'Rejected' : request.status;
}
function statusPill(status) {
  return `<span class="status status-${escapeHtml(String(status).toLowerCase().replaceAll(' ', '-'))}">${escapeHtml(status)}</span>`;
}
function showMessage(message, isError = false) {
  const element = $('#message');
  if (!element) return;
  element.textContent = message;
  element.className = `message${isError ? ' error' : ''}`;
  element.hidden = false;
  if (isError) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearMessage() {
  const el = $('#message');
  if (el) el.hidden = true;
}
function setLoading(loading) {
  const el = $('#list-loading');
  if (el) el.hidden = !loading;
}
function connection(online) {
  $('#connection-indicator')?.classList.toggle('offline', !online);
  const text = $('#connection-text');
  if (text) text.textContent = `${apiMode === 'local' ? 'Local' : 'Cloud'} ${online ? 'connected' : 'offline'}`;
}
async function api(path, options = {}) {
  const response = await fetch(`${apiOrigin()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser().id, ...options.headers },
    signal: options.signal || AbortSignal.timeout(12000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.errors?.join(' ') || `Request failed (${response.status}).`);
  return data;
}
async function checkHealth() {
  const response = await fetch(`${apiOrigin()}/api/health`, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`API health check failed (${response.status})`);
}
function populateSelect(element, items, placeholder) {
  if (!element) return;
  element.innerHTML = [...(placeholder === undefined ? [] : [`<option value="">${escapeHtml(placeholder)}</option>`]), ...items.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)].join('');
}
async function loadComponent(selector, path) {
  const response = await fetch(`./Assets/Components/${path}`);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  $(selector).innerHTML = await response.text();
}
function setRoles() {
  const role = currentUser().role;
  document.querySelectorAll('[data-role]').forEach((el) => {
    el.hidden = el.dataset.role !== role;
  });
  const account = $('#settings-name');
  if (account) account.textContent = currentUser().name;
}
function initNavigation() {
  populateSelect(
    $('#user-select'),
    users.map((u) => u.id),
  );
  // User picker shows friendly role and name while retaining the synthetic ID.
  $('#user-select').innerHTML = users.map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} · ${escapeHtml(u.role)}</option>`).join('');
  $('#user-select').value = currentUser().id;
  $('#user-select').addEventListener('change', (event) => {
    safeSet(USER_KEY, event.target.value);
    location.reload();
  });
  $('#api-environment-select').value = apiMode;
  $('#api-environment-select').addEventListener('change', async (event) => {
    const desired = event.target.value;
    if (desired === apiMode) return;
    const previous = apiMode;
    apiMode = desired;
    clearMessage();
    try {
      await checkHealth();
      await refreshPage();
      safeSet(API_KEY, apiMode);
      connection(true);
      showMessage(`Switched to the ${apiMode === 'cloud' ? 'Cloudflare Worker' : 'local Express'} API.`);
    } catch (error) {
      apiMode = previous;
      event.target.value = previous;
      connection(false);
      showMessage(`Could not connect to ${desired}: ${error.message}`, true);
    }
  });
  const isSilly = safeGet(FONT_KEY) === 'yes';
  document.body.classList.toggle('silly-type', isSilly);
  const fontButton = $('#fun-font-button');
  fontButton.setAttribute('aria-pressed', String(isSilly));
  $('#font-state').textContent = isSilly ? 'On' : 'Off';
  fontButton.addEventListener('click', () => {
    const active = document.body.classList.toggle('silly-type');
    safeSet(FONT_KEY, active ? 'yes' : 'no');
    fontButton.setAttribute('aria-pressed', String(active));
    $('#font-state').textContent = active ? 'On' : 'Off';
  });
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const active = link.dataset.nav === (document.body.dataset.page === 'submit' ? 'submit' : 'requests');
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });
  $('#topbar-section').textContent = document.body.dataset.page === 'submit' ? 'New request' : 'Overview';
  const menu = $('#mobile-menu');
  const toggle = $('#menu-toggle');
  toggle.addEventListener('click', () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  $('#close-mobile-menu').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
  menu.addEventListener('click', (event) => {
    if (event.target === menu) menu.close();
  });
  document.addEventListener('click', (event) => {
    const settings = $('#settings-menu');
    if (settings?.open && !settings.contains(event.target)) settings.open = false;
  });
  // Load the credits overlay only when requested. Both navigation layouts can open it.
  let overlayInitPromise;
  async function openCreditsOverlay() {
    // A native dialog renders in the browser's top layer, above ordinary z-index overlays.
    // Close the mobile menu before showing the custom credits modal.
    if (menu?.open) menu.close();
    try {
      if (!$('#xc-trigger')) {
        overlayInitPromise ??= import('./overlay.js')
          .then(({ initXyberOverlay }) => initXyberOverlay())
          .catch((error) => {
            overlayInitPromise = undefined;
            throw error;
          });
        await overlayInitPromise;
      }
      const trigger = $('#xc-trigger');
      if (!trigger) throw new Error('Credits overlay failed to create its trigger.');
      trigger.click();
    } catch (error) {
      console.error('Unable to initialise the credits overlay:', error);
      showMessage(`Credits unavailable: ${error.message}`, true);
    }
  }
  for (const selector of ['#about-button', '#mobile-about-button']) {
    $(selector)?.addEventListener('click', openCreditsOverlay);
  }

  // Automatically initialize the floating badge on every page.
  overlayInitPromise = import('./overlay.js')
    .then(({ initXyberOverlay }) => initXyberOverlay())
    .catch(error => {
      overlayInitPromise = undefined;
      console.error('Unable to initialise the floating credits badge:', error);
    });

  setRoles();
}
function renderStatistics(requests) {
  $('#stat-total').textContent = String(requests.length);
  $('#stat-progress').textContent = String(requests.filter((r) => r.status === 'In Progress' && !r.rejectedAt && !r.deletedAt).length);
  $('#stat-done').textContent = String(requests.filter((r) => r.status === 'Completed').length);
}
function renderList(requests) {
  $('#result-count').textContent = String(requests.length);
  const tbody = $('#request-rows'),
    cards = $('#mobile-request-cards');
  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No requests match these filters. Try clearing them.</td></tr>';
    cards.innerHTML = '<p class="empty">No requests match these filters. Try clearing them.</p>';
    return;
  }
  tbody.innerHTML = requests
    .map(
      (r, index) => `<tr style="--i:${index}">
    <td><a href="index.html?id=${encodeURIComponent(r.id)}"><span class="request-name">${escapeHtml(r.campaignReference)}</span><span class="request-id">#${escapeHtml(r.id)}</span></a></td>
    <td>${escapeHtml(r.category)}</td><td><span class="priority priority-${escapeHtml(r.priority.toLowerCase())}">${escapeHtml(r.priority)}</span></td><td>${statusPill(statusLabel(r))}</td>
    <td>${escapeHtml(r.assignee || 'Unassigned')}</td><td>${escapeHtml(formatDate(r.updatedAt))}</td><td><a class="row-arrow" href="index.html?id=${encodeURIComponent(r.id)}" aria-label="Open request ${escapeHtml(r.id)}">↗</a></td></tr>`,
    )
    .join('');
  cards.innerHTML = requests
    .map(
      (r) =>
        `<a class="request-mobile-card" href="index.html?id=${encodeURIComponent(r.id)}"><div class="mobile-card-top"><strong>${escapeHtml(r.campaignReference)}</strong>${statusPill(statusLabel(r))}</div><div class="mobile-card-meta"><span>#${escapeHtml(r.id)}</span><span>·</span><span>${escapeHtml(r.category)}</span><span>·</span><span class="priority priority-${escapeHtml(r.priority.toLowerCase())}">${escapeHtml(r.priority)}</span></div><div class="mobile-card-bottom"><span>${escapeHtml(r.assignee || 'Not assigned')}</span><span>${escapeHtml(formatDate(r.updatedAt))} ↗</span></div></a>`,
    )
    .join('');
}
async function loadList() {
  const form = $('#filter-form');
  if (!form) return;
  setLoading(true);
  try {
    const selected = Object.fromEntries(new FormData(form));
    const [all, filtered] = await Promise.all([api(`/api/requests${buildQuery({ view: selected.view })}`), api(`/api/requests${buildQuery(selected)}`)]);
    renderStatistics(all);
    renderList(filtered);
    connection(true);
  } catch (error) {
    connection(false);
    showMessage(`Unable to load requests: ${error.message}`, true);
    throw error;
  } finally {
    setLoading(false);
  }
}
async function initList() {
  $('#list-view').hidden = false;
  populateSelect($('#filter-form [name="status"]'), reference.statuses, 'All statuses');
  populateSelect($('#filter-form [name="category"]'), reference.categories, 'All categories');
  populateSelect($('#filter-form [name="priority"]'), reference.priorities, 'All priorities');
  $('#list-intro').textContent = currentUser().role === 'Coordinator' ? 'See every job, prioritise the queue and keep your team moving.' : 'An easier way to keep your community print jobs moving.';
  $('#welcome-note').textContent = currentUser().role === 'Coordinator' ? 'Your team has the whole picture.' : 'Your next community project starts here.';
  $('#filter-form').addEventListener('change', () => {
    clearMessage();
    loadList().catch(() => {});
  });
  $('#clear-filters').addEventListener('click', () => {
    $('#filter-form').reset();
    clearMessage();
    loadList().catch(() => {});
  });
  $('#refresh-button').addEventListener('click', () => {
    clearMessage();
    loadList().catch(() => {});
  });
  await loadList();
}
function statusTrack(request) {
  const position = reference.statuses.indexOf(request.status);
  $('#status-track').innerHTML = reference.statuses.map((step, i) => `<li class="${i < position ? 'passed' : i === position ? 'current' : ''}" ${i === position ? 'aria-current="step"' : ''}>${escapeHtml(step)}</li>`).join('');
}
function renderHistory(history) {
  $('#history-items').innerHTML = history?.length
    ? history
        .map((event) => {
          const label = event.eventType === 'Rejected' ? 'Request rejected' : event.eventType === 'Archived' ? 'Request archived' : event.previousStatus ? `Moved to ${event.newStatus}` : 'Request submitted';
          return `<li class="${escapeHtml(String(event.eventType || '').toLowerCase())}"><div class="timeline-head"><span>${escapeHtml(label)}</span><time>${escapeHtml(formatDate(event.changedAt))}</time></div><p class="timeline-meta">By ${escapeHtml(event.actor)}${event.previousStatus && event.previousStatus !== event.newStatus ? ` · ${escapeHtml(event.previousStatus)} → ${escapeHtml(event.newStatus)}` : ''}</p>${event.note ? `<p class="timeline-note">${escapeHtml(event.note)}</p>` : ''}</li>`;
        })
        .join('')
    : '<li>No history has been recorded yet.</li>';
}
function renderDetails(request) {
  detail = request;
  $('#details-view').hidden = false;
  $('#detail-title').textContent = request.campaignReference;
  $('#detail-subtitle').textContent = `Request #${request.id} · Created ${formatDate(request.createdAt)}`;
  $('#detail-badge').innerHTML = statusPill(statusLabel(request));
  statusTrack(request);
  const fields = [
    ['Request ID', `#${request.id}`],
    ['Customer', request.customerId],
    ['Category', request.category],
    ['Priority', request.priority],
    ['Assignee', request.assignee || 'Not assigned'],
    ['Description', request.description],
    ['Submitted', formatDate(request.createdAt)],
    ['Last updated', formatDate(request.updatedAt)],
    ...(request.rejectedAt
      ? [
          ['Rejected by', request.rejectedBy],
          ['Reason', request.rejectionReason],
        ]
      : []),
    ...(request.deletedAt
      ? [
          ['Archived by', request.deletedBy],
          ['Archived at', formatDate(request.deletedAt)],
        ]
      : []),
  ];
  $('#detail-fields').innerHTML = fields.map(([name, value]) => `<dt>${escapeHtml(name)}</dt><dd>${escapeHtml(value)}</dd>`).join('');
  renderHistory(request.history);
  if (currentUser().role !== 'Coordinator') return;
  const isClosed = Boolean(request.rejectedAt || request.deletedAt);
  $('#update-form').hidden = isClosed;
  const next = nextStatus(reference.statuses, request.status);
  const advance = $('#advance-button');
  advance.hidden = !next;
  advance.textContent = `Move to ${next} →`;
  $('#update-form [name="assignee"]').value = request.assignee || '';
  $('#reject-button').hidden = isClosed || request.status !== 'Submitted';
  $('#delete-button').hidden = isClosed || request.status !== 'Completed';
  $('.danger-zone').hidden = isClosed || (request.status !== 'Submitted' && request.status !== 'Completed');
}
async function getDetails(id) {
  const request = await api(`/api/requests/${encodeURIComponent(id)}`);
  renderDetails(request);
  connection(true);
}
function confirmAction(kind) {
  const dialog = $('#confirm-dialog');
  const isReject = kind === 'reject';
  $('#modal-title').textContent = isReject ? 'Reject this request?' : 'Remove from the active queue?';
  $('#modal-description').textContent = isReject ? 'This marks the request as rejected and notifies viewers through the recorded reason. Its status history remains visible.' : 'Completed requests are moved to the archive, not permanently erased. History remains available for review.';
  $('#reason-label').hidden = !isReject;
  $('#rejection-reason').required = isReject;
  $('#rejection-reason').value = '';
  $('#confirm-action').textContent = isReject ? 'Reject request' : 'Archive request';
  $('#confirm-dialog').dataset.action = kind;
  dialog.showModal();
  if (isReject) $('#rejection-reason').focus();
}
function initDetailActions() {
  populateSelect($('#update-form [name="assignee"]'), reference.staff, 'Choose a staff member');
  $('#update-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter;
    const payload = {};
    const assignee = $('#update-form [name="assignee"]').value;
    if (assignee) payload.assignee = assignee;
    if (button.value === 'advance') payload.status = nextStatus(reference.statuses, detail.status);
    button.disabled = true;
    try {
      renderDetails(await api(`/api/requests/${detail.id}`, { method: 'PATCH', body: JSON.stringify(payload) }));
      showMessage('Request updated successfully.');
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
  $('#reject-button').addEventListener('click', () => confirmAction('reject'));
  $('#delete-button').addEventListener('click', () => confirmAction('archive'));
  $('#cancel-action').addEventListener('click', () => $('#confirm-dialog').close());
  $('#confirm-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const kind = $('#confirm-dialog').dataset.action;
    const button = $('#confirm-action');
    button.disabled = true;
    try {
      const request = kind === 'reject' ? await api(`/api/requests/${detail.id}/reject`, { method: 'POST', body: JSON.stringify({ reason: $('#rejection-reason').value.trim() }) }) : await api(`/api/requests/${detail.id}`, { method: 'DELETE' });
      $('#confirm-dialog').close();
      renderDetails(request);
      showMessage(kind === 'reject' ? 'Request rejected, with an auditable reason.' : 'Completed request archived. Its history is preserved.');
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}
async function initDetail(id) {
  initDetailActions();
  await getDetails(id);
}
function initSubmit() {
  const form = $('#submit-form');
  populateSelect(form.elements.category, reference.categories, 'Select a format');
  populateSelect(form.elements.priority, reference.priorities);
  form.elements.priority.value = 'Normal';
  const description = form.elements.description;
  description.addEventListener('input', () => {
    $('#character-count').textContent = `${description.value.length} / 1000 characters`;
  });
  if (currentUser().role !== 'Customer') {
    form.hidden = true;
    showMessage('Only customers can submit requests. Switch to a customer demo account in the top-right menu.', true);
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const created = await api('/api/requests', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      location.href = `index.html?id=${encodeURIComponent(created.id)}`;
    } catch (error) {
      showMessage(error.message, true);
      button.disabled = false;
    }
  });
}
async function refreshPage() {
  if (document.body.dataset.page !== 'requests') return;
  const id = new URLSearchParams(location.search).get('id');
  if (id) await getDetails(id);
  else await loadList();
}
async function init() {
  try {
    reference = await (await fetch(DATA_URL)).json();
    users = reference.users;
    await Promise.all([loadComponent('#site-nav', 'Navigation.html'), loadComponent('#site-footer', 'Footer.html')]);
    initNavigation();
    if (document.body.dataset.page === 'submit') initSubmit();
    else {
      const id = new URLSearchParams(location.search).get('id');
      if (id) await initDetail(id);
      else await initList();
    }
    // Submission screen also needs connection feedback when API is unreachable.
    if (document.body.dataset.page === 'submit')
      checkHealth()
        .then(() => connection(true))
        .catch(() => connection(false));
  } catch (error) {
    connection(false);
    showMessage(`Unable to initialise portal: ${error.message}`, true);
  }
}
document.addEventListener('DOMContentLoaded', init);
