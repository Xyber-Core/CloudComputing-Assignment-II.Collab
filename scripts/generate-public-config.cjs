#!/usr/bin/env node
/* ========================================================================== */
/* Generate browser-safe URL config from local dev.env OR GitHub Actions vars. */
/* Every run starts from defaults.json, never a previous Azure build artifact. */
/* ========================================================================== */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'ProjectImplementationPrintPortal/Frontend/Public/Assets/JSON');
const defaultsPath = path.join(directory, 'public-config.defaults.json');
const outputPath = path.join(directory, 'public-config.json');
const devPath = path.join(root, 'ProjectImplementationPrintPortal/API/dev.env');

const FIELDS = Object.freeze({
  PUBLIC_CLOUDFLARE_SITE_URL: 'cloudflareSite',
  PUBLIC_CLOUDFLARE_API_URL: 'cloudflareApi',
  PUBLIC_AZURE_SITE_URL: 'azureSite',
  PUBLIC_AZURE_CLASS_SITE_URL: 'azureClassSite',
  PUBLIC_DEPLOYMENT_MODE: 'deploymentMode',
});

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].trim();
    result[match[1]] = /^(".*"|'.*')$/.test(value) ? value.slice(1, -1) : value;
  }
  return result;
}

function origin(value, key) {
  if (value === '') return '';
  let url;
  try { url = new URL(value); } catch { throw new Error(`${key} must be an absolute URL`); }
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${key} must be an HTTPS origin without a path, query or credentials`);
  }
  return url.origin;
}

function generate(defaults, localValues = {}, vars = {}) {
  const values = { ...defaults };
  for (const [key, field] of Object.entries(FIELDS)) {
    // An explicitly empty var intentionally disables an optional provider.
    const input = Object.hasOwn(vars, key) ? vars[key]
      : Object.hasOwn(localValues, key) ? localValues[key] : values[field];
    if (field === 'deploymentMode') {
      if (!['auto', 'cloud', 'azure', 'azure-class'].includes(input)) throw new Error('Invalid PUBLIC_DEPLOYMENT_MODE');
      values[field] = input;
    } else {
      values[field] = origin(input, key);
    }
  }
  if (!values.cloudflareSite || !values.cloudflareApi) throw new Error('Both Cloudflare URLs must be configured');
  if (values.deploymentMode === 'azure' && !values.azureSite) throw new Error('Azure site URL is required');
  if (values.deploymentMode === 'azure-class' && !values.azureClassSite) throw new Error('Class Azure site URL is required');
  return values;
}

if (require.main === module) {
  // --ci means GitHub vars only. A private developer's dev.env is never read in CI.
  const local = process.argv.includes('--ci') || !fs.existsSync(devPath)
    ? {} : parseEnvFile(fs.readFileSync(devPath,'utf8'));
  const env = Object.fromEntries(Object.keys(FIELDS)
    .filter((key) => Object.hasOwn(process.env, key) && process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]));
  const defaults = JSON.parse(fs.readFileSync(defaultsPath,'utf8'));
  const config = generate(defaults, local, env);
  fs.writeFileSync(outputPath, JSON.stringify(config,null,2)+'\n');
  console.log(`Wrote browser-safe public config (${config.deploymentMode}); no tokens included.`);
}
module.exports = { parseEnvFile, origin, generate };
