/* Capital Community Print · shared dashboard controller.
 * UI state is transient; API authorization is enforced by the server, not the DOM.
 */
import { nextStatus, buildQuery, escapeHtml } from './Helpers.js';
import { API_BASES, defaultApiMode } from './api-config.js';
export { nextStatus, buildQuery, escapeHtml } from './Helpers.js';

/* ========================================================================== */
/* Configuration and shared application state                                 */
/* ========================================================================== */
const DATA_URL = './Assets/JSON/Data.json';
const USER_KEY = 'printportal-user';
const API_KEY = 'printportal-api-mode';
const FONT_KEY = 'printportal-silly-type';
const $ = (selector) => document.querySelector(selector);
let users = [];
let reference = {};
let detail = null;
let apiOnline = false;
let apiMode = safeGet(API_KEY) || defaultApiMode(location.hostname);
if (!API_BASES[apiMode]) apiMode = defaultApiMode(location.hostname);

/* ========================================================================== */
/* Environment, storage and formatting helpers                                */
/* ========================================================================== */
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
  $('#requests-surface')?.setAttribute('aria-busy', String(Boolean(loading)));
  const refresh = $('#refresh-button');
  if (refresh) refresh.disabled = Boolean(loading);
}
// Keep the topbar, sidebar and diagnostics panel in sync with the last health check.
function connection(online) {
  apiOnline = Boolean(online);
  $('#connection-indicator')?.classList.toggle('offline', !apiOnline);
  const text = $('#connection-text');
  if (text) text.textContent = `${apiMode === 'local' ? 'Local' : 'Cloud'} ${apiOnline ? 'connected' : 'offline'}`;
  const sidebarState = $('#sidebar-api-state');
  if (sidebarState) {
    sidebarState.textContent = apiOnline ? 'Online' : 'Offline';
    sidebarState.classList.toggle('is-offline', !apiOnline);
  }
  updateDiagnostics();
}

// Diagnostics are deliberately read-only and never include credentials or request headers.
function updateDiagnostics() {
  const user = currentUser();
  const provider = $('#diagnostic-provider');
  const health = $('#diagnostic-health');
  const account = $('#diagnostic-account');
  const page = $('#diagnostic-page');
  const endpoint = $('#diagnostic-endpoint');
  if (provider) provider.textContent = apiMode === 'local' ? 'Local Express' : 'Cloudflare Worker';
  if (health) {
    health.textContent = apiOnline ? 'Connected' : 'Offline / not checked';
    health.classList.toggle('is-offline', !apiOnline);
  }
  if (account) account.textContent = user ? `${user.name} · ${user.role}` : 'Unknown';
  if (page) page.textContent = document.body.dataset.page === 'submit' ? 'New request' : new URLSearchParams(location.search).has('id') ? 'Request details' : 'Overview';
  if (endpoint) endpoint.textContent = apiOrigin() || 'Not configured';
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
  const target = $(selector);
  if (!target) throw new Error(`Component mount point ${selector} was not found.`);
  const response = await fetch(`./Assets/Components/${path}`);
  if (!response.ok) throw new Error(`Unable to load ${path} (${response.status}).`);
  target.innerHTML = await response.text();
}

function showDialog(dialog) {
  if (dialog && !dialog.open) dialog.showModal();
}

function closeOnBackdrop(dialog) {
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function isTypingTarget(target) {
  return Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'));
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
  // Build the demo account menu once; the selected ID remains a local demo preference.
  const userSelect = $('#user-select');
  if (userSelect) {
    userSelect.innerHTML = users
      .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} · ${escapeHtml(user.role)}</option>`)
      .join('');
    userSelect.value = currentUser().id;
    userSelect.addEventListener('change', (event) => {
      safeSet(USER_KEY, event.target.value);
      location.reload();
    });
  }

  // Azure is intentionally a disabled placeholder until its API is implemented.
  const apiSelect = $('#api-environment-select');
  if (apiSelect) {
    apiSelect.value = apiMode;
    apiSelect.addEventListener('change', async (event) => {
      const desired = event.target.value;
      if (desired === apiMode) return;
      if (!API_BASES[desired]) {
        event.target.value = apiMode;
        showMessage('Azure API is planned but is not connected in this version.', true);
        return;
      }

      const previous = apiMode;
      apiMode = desired;
      clearMessage();
      apiSelect.disabled = true;
      try {
        await checkHealth();
        await refreshPage();
        safeSet(API_KEY, apiMode);
        connection(true);
        showMessage(`Switched to the ${apiMode === 'cloud' ? 'Cloudflare Worker' : 'local Express'} API.`);
      } catch (error) {
        apiMode = previous;
        apiSelect.value = previous;
        connection(false);
        showMessage(`Could not connect to ${desired}: ${error.message}`, true);
      } finally {
        apiSelect.disabled = false;
        updateDiagnostics();
      }
    });
  }

  // Apply the optional playful font preference across the full interface.
  const isSilly = safeGet(FONT_KEY) === 'yes';
  document.body.classList.toggle('silly-type', isSilly);
  const fontButton = $('#fun-font-button');
  if (fontButton) {
    fontButton.setAttribute('aria-pressed', String(isSilly));
    $('#font-state').textContent = isSilly ? 'On' : 'Off';
    fontButton.addEventListener('click', () => {
      const active = document.body.classList.toggle('silly-type');
      safeSet(FONT_KEY, active ? 'yes' : 'no');
      fontButton.setAttribute('aria-pressed', String(active));
      $('#font-state').textContent = active ? 'On' : 'Off';
    });
  }

  // Highlight the current page and the selected coordinator queue view.
  const query = new URLSearchParams(location.search);
  const selectedView = query.get('status') === 'Completed' ? 'completed' : query.get('view') || 'active';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const pageMatches = link.dataset.nav === (document.body.dataset.page === 'submit' ? 'submit' : 'requests');
    const viewMatches = !link.dataset.navView || link.dataset.navView === selectedView;
    const active = pageMatches && viewMatches;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const section = $('#topbar-section');
  if (section) section.textContent = document.body.dataset.page === 'submit' ? 'New request' : query.has('id') ? 'Request details' : 'Overview';

  // Mobile navigation is a native dialog, so Escape and focus handling are built in.
  const menu = $('#mobile-menu');
  const toggle = $('#menu-toggle');
  toggle?.addEventListener('click', () => {
    showDialog(menu);
    toggle.setAttribute('aria-expanded', 'true');
  });
  $('#close-mobile-menu')?.addEventListener('click', () => menu?.close());
  menu?.addEventListener('close', () => toggle?.setAttribute('aria-expanded', 'false'));
  closeOnBackdrop(menu);

  // Close the account popover when the user clicks elsewhere on the page.
  document.addEventListener('click', (event) => {
    const settings = $('#settings-menu');
    if (settings?.open && !settings.contains(event.target)) settings.open = false;
  });

  // System status and quick guide are available from both desktop and mobile navigation.
  const statusDialog = $('#system-status-dialog');
  const guideDialog = $('#guide-dialog');
  const openStatus = () => {
    updateDiagnostics();
    showDialog(statusDialog);
  };
  const openGuide = () => showDialog(guideDialog);
  ['#system-status-button', '#mobile-system-status-button', '#connection-indicator'].forEach((selector) => {
    $(selector)?.addEventListener('click', () => {
      menu?.close();
      openStatus();
    });
  });
  ['#guide-button', '#mobile-guide-button'].forEach((selector) => {
    $(selector)?.addEventListener('click', () => {
      menu?.close();
      openGuide();
    });
  });
  ['#close-system-status', '#close-system-status-footer'].forEach((selector) => {
    $(selector)?.addEventListener('click', () => statusDialog?.close());
  });
  $('#close-guide')?.addEventListener('click', () => guideDialog?.close());
  $('#close-guide-footer')?.addEventListener('click', () => guideDialog?.close());
  closeOnBackdrop(statusDialog);
  closeOnBackdrop(guideDialog);

  // A manual health check helps teammates diagnose API connectivity without exposing secrets.
  $('#diagnostic-refresh')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Checking…';
    try {
      await checkHealth();
      connection(true);
    } catch (error) {
      connection(false);
      showMessage(`API health check failed: ${error.message}`, true);
    } finally {
      button.disabled = false;
      button.textContent = 'Check connection ↻';
      updateDiagnostics();
    }
  });
  $('#diagnostic-copy')?.addEventListener('click', async () => {
    const safeSummary = [
      `Provider: ${apiMode === 'local' ? 'Local Express' : 'Cloudflare Worker'}`,
      `Endpoint: ${apiOrigin()}`,
      `Connection: ${apiOnline ? 'Connected' : 'Offline / not checked'}`,
      `Demo account: ${currentUser().name} (${currentUser().role})`,
      `Page: ${document.body.dataset.page}`,
      `Origin: ${location.origin}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(safeSummary);
      showMessage('Safe diagnostics copied. No credentials were included.');
    } catch {
      showMessage('Clipboard access is unavailable in this browser.');
    }
  });

  // Keyboard helpers: ? opens the guide; Alt+Shift+D opens diagnostics.
  document.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) return;
    if (event.key === '?' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      openGuide();
    } else if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      openStatus();
    }
  });

  // The existing credits overlay is initialised on demand and remains independently lazy-loaded.
  let overlayInitPromise;
  async function openCreditsOverlay() {
    menu?.close();
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
  ['#about-button', '#mobile-about-button'].forEach((selector) => {
    $(selector)?.addEventListener('click', openCreditsOverlay);
  });

  // Preserve the existing floating XyberCore badge on both desktop and mobile.
  overlayInitPromise = import('./overlay.js')
    .then(({ initXyberOverlay }) => initXyberOverlay())
    .catch((error) => {
      overlayInitPromise = undefined;
      console.error('Unable to initialise the floating credits badge:', error);
    });

  updateDiagnostics();
  setRoles();
}

function renderStatistics(requests) {
  $('#stat-total').textContent = String(requests.length);
  $('#stat-progress').textContent = String(requests.filter((r) => r.status === 'In Progress' && !r.rejectedAt && !r.deletedAt).length);
  $('#stat-done').textContent = String(requests.filter((r) => r.status === 'Completed').length);
}
/* ========================================================================== */
/* Dashboard list rendering and reusable request templates                    */
/* ========================================================================== */
function applyStatusClass(element, status) {
  if (!element) return;
  const token = String(status).toLowerCase().replaceAll(' ', '-');
  element.className = `status status-${token}`;
  element.textContent = status;
}

function applyPriorityClass(element, priority) {
  if (!element) return;
  element.className = `priority priority-${String(priority).toLowerCase()}`;
  element.textContent = priority;
}

// Clone HTML templates so layout stays in HTML and request values stay in text nodes.
function renderList(requests) {
  $('#result-count').textContent = String(requests.length);
  const tbody = $('#request-rows');
  const cards = $('#mobile-request-cards');
  const rowTemplate = $('#request-row-template');
  const cardTemplate = $('#request-mobile-template');

  if (!requests.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No requests match these filters. Try clearing them.</td></tr>';
    cards.innerHTML = '<p class="empty">No requests match these filters. Try clearing them.</p>';
    return;
  }

  const rowFragment = document.createDocumentFragment();
  const cardFragment = document.createDocumentFragment();
  requests.forEach((request, index) => {
    const url = `index.html?id=${encodeURIComponent(request.id)}`;
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const rowLink = row.querySelector('[data-field="request-link"]');
    const openLink = row.querySelector('[data-field="open-link"]');
    row.style.setProperty('--i', index);
    rowLink.href = url;
    rowLink.querySelector('[data-field="campaign"]').textContent = request.campaignReference;
    rowLink.querySelector('[data-field="request-id"]').textContent = `#${request.id}`;
    row.querySelector('[data-field="category"]').textContent = request.category;
    applyPriorityClass(row.querySelector('[data-field="priority"]'), request.priority);
    applyStatusClass(row.querySelector('[data-field="status"]'), statusLabel(request));
    row.querySelector('[data-field="assignee"]').textContent = request.assignee || 'Unassigned';
    row.querySelector('[data-field="updated"]').textContent = formatDate(request.updatedAt);
    openLink.href = url;
    openLink.setAttribute('aria-label', `Open request ${request.id}`);
    rowFragment.append(row);

    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.href = url;
    card.querySelector('[data-field="campaign"]').textContent = request.campaignReference;
    card.querySelector('[data-field="request-id"]').textContent = `#${request.id}`;
    card.querySelector('[data-field="category"]').textContent = request.category;
    applyPriorityClass(card.querySelector('[data-field="priority"]'), request.priority);
    applyStatusClass(card.querySelector('[data-field="status"]'), statusLabel(request));
    card.querySelector('[data-field="assignee"]').textContent = request.assignee || 'Not assigned';
    card.querySelector('[data-field="updated"]').textContent = `${formatDate(request.updatedAt)} ↗`;
    cardFragment.append(card);
  });

  tbody.replaceChildren(rowFragment);
  cards.replaceChildren(cardFragment);
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

  // Sidebar shortcuts use query parameters to open a pre-filtered coordinator queue.
  const initialFilters = new URLSearchParams(location.search);
  for (const name of ['view', 'status', 'category', 'priority']) {
    const select = $(`#filter-form [name="${name}"]`);
    const requested = initialFilters.get(name);
    if (select && requested && [...select.options].some((option) => option.value === requested)) {
      select.value = requested;
    }
  }

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
/* ========================================================================== */
/* Request details, history and coordinator actions                            */
/* ========================================================================== */
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
/* ========================================================================== */
/* Customer submission and application startup                                 */
/* ========================================================================== */
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
    const referenceResponse = await fetch(DATA_URL);
    if (!referenceResponse.ok) throw new Error(`Unable to load reference data (${referenceResponse.status}).`);
    reference = await referenceResponse.json();
    users = reference.users || [];
    if (!users.length) throw new Error('No demo accounts are configured in Data.json.');
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
