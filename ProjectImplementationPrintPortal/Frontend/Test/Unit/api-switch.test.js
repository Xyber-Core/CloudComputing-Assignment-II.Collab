/* Public endpoint routing — these tests do not require live cloud credentials. */
const { test } = require('node:test');
const assert = require('node:assert/strict');

const config = import('../../Public/Assets/JS/api-config.js');
const map = {
  cloudflareSite: 'https://cloudcomputing-printportal.pages.dev',
  cloudflareApi: 'https://printportal-worker.rikerhoch.workers.dev',
  azureSite: 'https://wellingtionprint-dxhudcabe8hdhmee.japaneast-01.azurewebsites.net',
  azureClassSite: 'https://class-print.azurewebsites.net',
  deploymentMode: 'auto',
};

async function setConfig(overrides = {}) {
  const module = await config;
  await module.loadPublicConfig(async () => ({ ok: true, json: async () => ({ ...map, ...overrides }) }));
  return module;
}

test('hostname chooses the correct API mode on both providers', async () => {
  const api = await setConfig();
  assert.equal(api.defaultApiMode('cloudcomputing-printportal.pages.dev'), 'cloud');
  assert.equal(api.defaultApiMode('wellingtionprint-dxhudcabe8hdhmee.japaneast-01.azurewebsites.net'), 'azure');
  assert.equal(api.defaultApiMode('class-print.azurewebsites.net'), 'azure-class');
  assert.equal(api.defaultApiMode('localhost'), 'local');
  assert.equal(api.apiOriginFor('cloud'), map.cloudflareApi);
  assert.equal(api.apiOriginFor('azure'), map.azureSite);
  assert.equal(api.apiOriginFor('azure-class'), map.azureClassSite);
  assert.equal(api.apiOriginFor('local', 'http://127.0.0.1:5173'), 'http://127.0.0.1:3000');
});

test('switch changes site and preserves current page / query parameters', async () => {
  const api = await setConfig();
  assert.equal(api.navigationTarget('azure', 'https://cloudcomputing-printportal.pages.dev/index.html?view=all&status=Completed'), `${map.azureSite}/index.html?view=all&status=Completed`);
  assert.equal(api.navigationTarget('cloud', `${map.azureSite}/requestSubmission.html`), `${map.cloudflareSite}/requestSubmission.html`);
  assert.equal(api.navigationTarget('azure-class', `${map.azureSite}/`), `${map.azureClassSite}/index.html`);
  assert.equal(api.navigationTarget('local', `${map.azureSite}/index.html`), '');
});

test('optional class deployment stays disabled until configured', async () => {
  const api = await setConfig({ azureClassSite: '' });
  assert.equal(api.canUseMode('azure-class', 'cloudcomputing-printportal.pages.dev'), false);
  assert.equal(api.navigationTarget('azure-class', `${map.cloudflareSite}/index.html`), '');
});

test('pinned deployment mode works on Azure preview hostnames', async () => {
  const api = await setConfig({ deploymentMode: 'azure' });
  assert.equal(api.defaultApiMode('preview-slot.azurewebsites.net'), 'azure');
  await setConfig({ deploymentMode: 'cloud' });
  assert.equal(api.defaultApiMode('some-preview.pages.dev'), 'cloud');
});

test('browser configuration filters unsafe URL values', async () => {
  const api = await setConfig({ azureClassSite: 'javascript:alert(1)', cloudflareApi: 'https://name:pass@example.com' });
  assert.equal(api.canUseMode('azure-class', 'localhost'), false);
  assert.equal(api.apiOriginFor('cloud'), '');
});
