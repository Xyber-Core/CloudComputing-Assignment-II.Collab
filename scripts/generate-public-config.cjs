#!/usr/bin/env node
/* Generate ONLY public URLs for the browser. No secrets are ever copied.
 * Local: npm run config:local   (reads API/dev.env)
 * CI:    npm run config:ci      (reads GitHub Actions PUBLIC_* vars)
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const output = path.join(ROOT, 'ProjectImplementationPrintPortal/Frontend/Public/Assets/JSON/public-config.json');
const devFile = path.join(ROOT, 'ProjectImplementationPrintPortal/API/dev.env');
const fields = {
  PUBLIC_CLOUDFLARE_SITE_URL: 'cloudflareSite',
  PUBLIC_CLOUDFLARE_API_URL: 'cloudflareApi',
  PUBLIC_AZURE_SITE_URL: 'azureSite',
  PUBLIC_AZURE_CLASS_SITE_URL: 'azureClassSite',
  PUBLIC_DEPLOYMENT_MODE: 'deploymentMode',
};

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].trim();
    result[match[1]] = (/^(["']).*\1$/.test(value)) ? value.slice(1, -1) : value;
  }
  return result;
}

function validateOrigin(value, key) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error(`${key} must be an absolute URL`); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${key} must be a safe URL origin (HTTPS, no path/query/credentials)`);
  }
  return url.origin;
}

const fromFile = process.argv.includes('--ci') || !fs.existsSync(devFile)
  ? {}
  : parseEnvFile(fs.readFileSync(devFile, 'utf8'));
const config = JSON.parse(fs.readFileSync(output, 'utf8'));
for (const [envKey, field] of Object.entries(fields)) {
  // GitHub environment/repository variables override developer-local settings.
  const incoming = process.env[envKey]?.trim() || fromFile[envKey]?.trim();
  const value = incoming === undefined ? config[field] : incoming;
  if (field === 'deploymentMode') {
    if (!['auto', 'cloud', 'azure', 'azure-class'].includes(value)) throw new Error('Invalid PUBLIC_DEPLOYMENT_MODE');
    config[field] = value;
  } else {
    config[field] = validateOrigin(value, envKey);
  }
}
if (!config.cloudflareSite || !config.cloudflareApi) throw new Error('Cloudflare public URLs must be configured');
fs.writeFileSync(output, JSON.stringify(config, null, 2) + '\n');
console.log('Validated browser-safe public endpoint configuration (no credentials).');