/* Routing tests: never call production cloud services or expose credentials. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const apiPromise = import('../../Public/Assets/JS/api-config.js');
const map = {
  cloudflareSite: 'https://cloudcomputing-printportal.pages.dev',
  cloudflareApi: 'https://printportal-worker.rikerhoch.workers.dev',
  azureSite: 'https://wellingtionprint-dxhudcabe8hdhmee.japaneast-01.azurewebsites.net',
  azureClassSite: '',
  deploymentMode: 'auto',
};
const setConfig = async (overrides = {}) => {
  const api = await apiPromise;
  await api.loadPublicConfig(async () => ({ ok: true, json: async () => ({ ...map, ...overrides }) }));
  return api;
};

test('localhost always starts with Local Express, even if old JSON pins Azure', async () => {
  const api = await setConfig({ deploymentMode: 'azure-class', azureClassSite: 'https://class-print.azurewebsites.net' });
  assert.equal(api.defaultApiMode('localhost'), 'local');
  assert.equal(api.defaultApiMode('127.0.0.1'), 'local');
  assert.equal(api.apiOriginFor('local', 'http://localhost:5173'), 'http://localhost:3000');
});

test('real Cloudflare and Azure hostnames override a stale deploymentMode', async () => {
  const api = await setConfig({ deploymentMode: 'azure-class', azureClassSite: 'https://class-print.azurewebsites.net' });
  assert.equal(api.defaultApiMode('cloudcomputing-printportal.pages.dev'), 'cloud');
  assert.equal(api.apiOriginFor('cloud', map.cloudflareSite), map.cloudflareApi);
  assert.equal(api.defaultApiMode('wellingtionprint-dxhudcabe8hdhmee.japaneast-01.azurewebsites.net'), 'azure');
  assert.equal(api.apiOriginFor('azure', map.azureSite), map.azureSite);
  assert.equal(api.defaultApiMode('class-print.azurewebsites.net'), 'azure-class');
  assert.equal(api.apiOriginFor('azure-class', 'https://class-print.azurewebsites.net'), 'https://class-print.azurewebsites.net');
});

test('site switch navigates to correct host, preserving filters but not cross-cloud IDs', async () => {
  const api = await setConfig();
  assert.equal(api.navigationTarget('azure', `${map.cloudflareSite}/index.html?view=all&status=Completed&id=42`),
    `${map.azureSite}/index.html?view=all&status=Completed`);
  assert.equal(api.navigationTarget('cloud', `${map.azureSite}/requestSubmission.html`), `${map.cloudflareSite}/requestSubmission.html`);
  assert.equal(api.navigationTarget('cloud', 'http://localhost:3000/index.html'), `${map.cloudflareSite}/index.html`);
  assert.equal(api.navigationTarget('azure', 'http://localhost:3000/index.html'), `${map.azureSite}/index.html`);
  assert.equal(api.navigationTarget('local', `${map.azureSite}/index.html`), '');
});

test('class Azure entry stays disabled until there is a real configured URL', async () => {
  const api = await setConfig();
  assert.equal(api.canUseMode('azure-class', 'localhost'), false);
  assert.equal(api.navigationTarget('azure-class', `${map.cloudflareSite}/`), '');
  await setConfig({ azureClassSite: 'https://class-print.azurewebsites.net' });
  assert.equal(api.navigationTarget('azure-class', `${map.cloudflareSite}/`), 'https://class-print.azurewebsites.net/index.html');
});

test('preview sites and unrecognised hosts do not silently call the wrong provider', async () => {
  const api = await setConfig();
  assert.equal(api.defaultApiMode('feature-123.cloudcomputing-printportal.pages.dev'), 'cloud');
  assert.equal(api.defaultApiMode('test-slot.azurewebsites.net'), 'azure');
  assert.equal(api.defaultApiMode('unconfigured.example.org'), '');
  assert.equal(api.apiOriginFor(''), '');
  await setConfig({ deploymentMode: 'azure' });
  assert.equal(api.defaultApiMode('custom-domain.example.org'), 'azure');
  await setConfig({ deploymentMode: 'azure-class', azureClassSite: 'https://class-print.azurewebsites.net' });
  assert.equal(api.defaultApiMode('class-preview.azurewebsites.net'), 'azure-class');
  assert.equal(api.apiOriginFor('azure-class', 'https://class-preview.azurewebsites.net'), 'https://class-preview.azurewebsites.net');
});

test('unsafe URL values are ignored, not used as API endpoints', async () => {
  const api = await setConfig({ cloudflareApi: 'https://username:password@worker.example.net', azureSite: 'javascript:alert(1)' });
  assert.equal(api.apiOriginFor('cloud'), '');
  assert.equal(api.canUseMode('azure', 'localhost'), false);
});

test('missing public configuration resets state instead of carrying over Azure', async () => {
  const api = await setConfig({ azureClassSite: 'https://class-print.azurewebsites.net', deploymentMode: 'azure-class' });
  await api.loadPublicConfig(async () => { throw new Error('offline'); });
  assert.equal(api.defaultApiMode('localhost'), 'local');
  assert.equal(api.apiOriginFor('cloud'), '');
  assert.equal(api.apiOriginFor('azure'), '');
});

test('generator never inherits a stale class URL and allows explicitly clearing one', () => {
  const { generate } = require('../../../../scripts/generate-public-config.cjs');
  assert.deepEqual(generate(map, {}, {}), map);
  const override = generate({ ...map, azureClassSite: 'https://old.example.com' }, {}, { PUBLIC_AZURE_CLASS_SITE_URL: '' });
  assert.equal(override.azureClassSite, '');
  assert.throws(() => generate(map, {}, { PUBLIC_AZURE_SITE_URL: 'https://example.com/path' }), /HTTPS origin/);
  assert.throws(() => generate(map, {}, { PUBLIC_DEPLOYMENT_MODE: 'azure-class' }), /Class Azure site URL is required/);
});


test('Azure never calls Cloudflare even with a stale Cloudflare selection', async () => {
  const api = await setConfig();
  assert.equal(api.apiOriginFor('cloud', map.azureSite), map.azureSite);
  assert.equal(api.apiOriginFor('azure', map.cloudflareSite), map.cloudflareApi);
  assert.equal(api.apiOriginFor('azure', 'http://localhost:5173'), 'http://localhost:3000');
  assert.equal(api.apiOriginFor('cloud', 'https://preview.example.azurewebsites.net'), 'https://preview.example.azurewebsites.net');
});

test('Azure local API remains functional even if the public config fails to load', async () => {
  const api = await setConfig();
  await api.loadPublicConfig(async () => { throw new Error('unavailable'); });
  assert.equal(api.apiOriginFor('cloud', map.azureSite), map.azureSite);
  assert.equal(api.apiOriginFor('cloud', map.cloudflareSite), '');
});
