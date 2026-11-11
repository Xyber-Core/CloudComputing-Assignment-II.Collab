/* Public endpoints only. Never place API keys or secrets in this file.
 * Cloudflare Pages: set the cloud URL to your Worker URL before publishing.
 * Localhost auto-selects the local Express server at port 3000.
 */
export const API_BASES = Object.freeze({
  local: 'http://localhost:3000',
  cloud: 'https://printportal-worker.rikerhoch.workers.dev',
});
export function defaultApiMode(hostname) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname) ? 'local' : 'cloud';
}
