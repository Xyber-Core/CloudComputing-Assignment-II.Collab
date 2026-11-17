/* ========================================================================== */
/* Public API routing: host names determine the provider; secrets never live here. */
/* ========================================================================== */

// Real URLs are provided by Assets/JSON/public-config.json (built from dev.env or CI vars).
const EMPTY_CONFIG = Object.freeze({
  cloudflareSite: '',
  cloudflareApi: '',
  azureSite: '',
  azureClassSite: '',
  deploymentMode: 'auto',
});

export const API_LABELS = Object.freeze({
  local: 'Local Express',
  cloud: 'Cloudflare Worker',
  azure: 'Azure App Service',
  'azure-class': 'Azure · class deployment',
});

let publicConfig = { ...EMPTY_CONFIG };
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const isLocal = (host) => LOCAL_HOSTS.has(host?.toLowerCase());

// Accept URL origins only: reject paths, credentials and unsafe protocols.
function parseOrigin(input) {
  if (typeof input !== 'string' || !input.trim()) return '';
  try {
    const value = new URL(input);
    if ((value.protocol !== 'https:' && !(isLocal(value.hostname) && value.protocol === 'http:')) ||
      value.username || value.password || value.pathname !== '/' || value.search || value.hash) return '';
    return value.origin;
  } catch { return ''; }
}

function hostnameOf(origin) {
  try { return origin ? new URL(origin).hostname.toLowerCase() : ''; }
  catch { return ''; }
}

/* ========================================================================== */
/* Load the environment map before initializing the dashboard                 */
/* ========================================================================== */
export async function loadPublicConfig(fetchImpl = fetch) {
  // Reset before loading: one deployment must never inherit a previous test's map.
  publicConfig = { ...EMPTY_CONFIG };
  try {
    const response = await fetchImpl('./Assets/JSON/public-config.json', { cache: 'no-store' });
    if (response.ok) {
      const values = await response.json();
      if (values && typeof values === 'object' && !Array.isArray(values)) {
        for (const key of ['cloudflareSite', 'cloudflareApi', 'azureSite', 'azureClassSite']) {
          publicConfig[key] = parseOrigin(values[key]);
        }
        if (['auto', 'cloud', 'azure', 'azure-class'].includes(values.deploymentMode)) {
          publicConfig.deploymentMode = values.deploymentMode;
        }
      }
    }
  } catch {
    // A missing config is safer than silently sending requests to the wrong cloud.
  }
  return getPublicConfig();
}

export function getPublicConfig() { return { ...publicConfig }; }

/* ========================================================================== */
/* Choose the API from the ACTUAL website host, not a previously selected mode */
/* ========================================================================== */
export function defaultApiMode(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (isLocal(host)) return 'local'; // Always start local development on Express.

  // Exact host ownership takes priority over deploymentMode in a stale JSON file.
  if (host === hostnameOf(publicConfig.cloudflareSite)) return 'cloud';
  if (publicConfig.azureClassSite && host === hostnameOf(publicConfig.azureClassSite)) return 'azure-class';
  if (publicConfig.azureSite && host === hostnameOf(publicConfig.azureSite)) return 'azure';

  // Support provider preview addresses even when the preview URL is not listed.
  if (host.endsWith('.pages.dev')) return 'cloud';
  if (host.endsWith('.azurewebsites.net')) {
    // A classmate's staging slot may use a different Azure hostname.
    if (publicConfig.deploymentMode === 'azure-class' && publicConfig.azureClassSite) return 'azure-class';
    return 'azure';
  }

  // For custom/preview domains only, CI can set the deployment's fallback mode.
  if (publicConfig.deploymentMode !== 'auto' && canUseMode(publicConfig.deploymentMode, host)) {
    return publicConfig.deploymentMode;
  }
  return ''; // Unknown host: never silently choose Cloudflare or Azure.
}

export function canUseMode(mode, hostname) {
  if (mode === 'local') return isLocal(hostname);
  if (mode === 'cloud') return Boolean(publicConfig.cloudflareSite && publicConfig.cloudflareApi);
  if (mode === 'azure') return Boolean(publicConfig.azureSite);
  if (mode === 'azure-class') return Boolean(publicConfig.azureClassSite);
  return false;
}

export function apiOriginFor(mode, currentOrigin = '') {
  if (mode === 'cloud') return publicConfig.cloudflareApi;
  if (mode === 'azure' || mode === 'azure-class') {
    const site = mode === 'azure' ? publicConfig.azureSite : publicConfig.azureClassSite;
    if (!site) return '';
    // Azure Express serves /api on the SAME host as the frontend.
    // Only use currentOrigin when it really belongs to this Azure app/preview.
    const currentHost = hostnameOf(currentOrigin);
    if (currentOrigin && (currentOrigin === site ||
        currentHost.endsWith('.azurewebsites.net'))) return currentOrigin;
    return site;
  }
  if (mode === 'local') {
    try {
      const current = new URL(currentOrigin);
      if (isLocal(current.hostname)) return `${current.protocol}//${current.hostname}:3000`;
    } catch { /* local port is fixed for the demo server */ }
    return 'http://localhost:3000';
  }
  return '';
}

/* ========================================================================== */
/* Switching providers navigates to its site; never cross-call an Azure API   */
/* ========================================================================== */
export function navigationTarget(mode, currentUrl) {
  const page = new URL(currentUrl);
  if (!canUseMode(mode, page.hostname)) return '';
  const site = mode === 'cloud' ? publicConfig.cloudflareSite
    : mode === 'azure' ? publicConfig.azureSite
    : mode === 'azure-class' ? publicConfig.azureClassSite
    : `${page.protocol}//${page.hostname}:3000`;
  if (!site) return '';
  const target = new URL(site);
  const currentPage = page.pathname.split('/').filter(Boolean).pop();
  target.pathname = currentPage === 'requestSubmission.html' ? '/requestSubmission.html' : '/index.html';

  // Keep queue filters, but not request IDs: different clouds store separate data.
  const allowed = new Set(['view', 'status', 'category', 'priority']);
  for (const [key, value] of page.searchParams) {
    if (allowed.has(key)) target.searchParams.append(key, value);
  }
  return target.href;
}
