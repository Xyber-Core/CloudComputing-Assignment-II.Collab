<div align="center">

# 🖨️ Capital Community Print — Printing Portal

**A responsive community print-request portal for customers and coordinators.**  
Submit a print job, follow its progress, and manage the entire request queue from desktop or mobile.

[![CI](https://github.com/Xyber-Core/CloudComputing-Assignment-II.Collab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Xyber-Core/CloudComputing-Assignment-II.Collab/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-Worker-3178C6?logo=typescript&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers_%26_D1-F38020?logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-8B5CF6)

**[Quick start](#-quick-start--local-development)** · **[Dependencies](#-dependencies-used-in-this-project)** · **[API reference](#-api-reference)** · **[Testing](#-testing)** · **[Troubleshooting](#-troubleshooting)**

</div>

## 📚 Contents

- [Overview](#-overview)
- [Tech stack](#-tech-stack)
- [Dependencies used in this project](#-dependencies-used-in-this-project)
- [Quick start — local development](#-quick-start--local-development)
- [Local and cloud API selection](#-local-and-cloud-api-selection)
- [Cloudflare Worker and D1 — optional demo](#-cloudflare-worker-and-d1--optional-demo)
- [API reference](#-api-reference)
- [Project structure](#-project-structure)
- [Testing](#-testing)
- [CI/CD and dependency hygiene](#-cicd-and-dependency-hygiene)
- [Troubleshooting](#-troubleshooting)
- [Contributing and licence](#-contributing-and-licence)

## 🌟 Overview

**Capital Community Print** is a fictional Wellington, New Zealand printing business supporting community groups and small organisations. Instead of managing poster, flyer and booklet jobs through email and spreadsheets, the portal offers a central place to submit requests, assign work and check progress.

The application demonstrates five core workflows:

1. **Submit** a request with a campaign reference, category, description and priority.
2. **View** requests, with customers limited to their own records and coordinators able to see all records.
3. **Assign and update** requests through a controlled workflow.
4. **Filter** outstanding work by status, category and priority.
5. **Review history** showing timestamps and the actor responsible for changes.

The redesigned UI uses a blue/magenta neon-glass style, responsive navigation, mobile-friendly request cards, dialogs, subtle transitions and a playful font toggle.

### Interface details

- Responsive desktop sidebar and small-screen navigation drawer.
- Clear request cards/tables, filters, progress steps and status badges.
- Confirmation dialogs for coordinator review and archive actions.
- Loading feedback, hover/focus transitions and reduced-motion-friendly styling.
- Local/cloud API selector for the demonstration environments.
- Optional **Silly font mode**, remembered in browser local storage.

## 🧰 Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | HTML5, CSS3, browser JavaScript (ES modules) | Pages, styling, UI logic and API calls |
| Local API | Node.js + **Express 5** | HTTP endpoints, validation and permission checks |
| Local demo data | In-memory JavaScript repository | Quick development without provisioning a database |
| Optional cloud demo API | **Cloudflare Workers** + TypeScript | Serverless request handling |
| Optional cloud demo database | **Cloudflare D1** | SQL persistence for the Worker demonstration |
| API/frontend tests | Built-in **Node.js test runner** (`node --test`) | Automated tests without a separate root test framework |
| Worker tests | **Vitest** + `@cloudflare/vitest-plugin` | Test Worker code in a Workers-compatible environment |
| Worker tooling | **Wrangler** + **TypeScript** | Local Worker runtime, deployment and type checking |
| Source control and CI | Git + GitHub Actions | Code review and automated checks |
| Planned assessment deployment | Microsoft Azure | Required identity-first, NZ-resident architecture and operational evidence |

**This frontend does not require React, Vue, Vite, Tailwind, Webpack or a frontend build command.** Its assets are plain HTML/CSS/JavaScript and are served by Express or a static web host.

## 📦 Dependencies used in this project

There are **two separate npm projects**. Install each from its own lockfile. Do not commit `node_modules` to Git.

### 1. Root project — local Express API and frontend tests

File: [`package.json`](package.json)

| Package | Declared version | Dependency type | Used for |
| --- | --- | --- | --- |
| `express` | `^5.1.0` | Production | HTTP server, routes, JSON parsing and static frontend hosting |

The root test command uses the **Node.js built-in test runner**, not Jest or Mocha. There is no separate frontend dependency installation.

From the repository root:

```bash
npm ci
```

`npm ci` installs exactly what `package-lock.json` records. Prefer it for clean clones and CI. If you intentionally change dependencies, use `npm install` to update both manifest and lockfile, then commit the changes.

**Root npm scripts:**

| Command | Actual script | Result |
| --- | --- | --- |
| `npm start` | `node ProjectImplementationPrintPortal/API/server.js` | Starts Express and serves the frontend on port 3000 by default |
| `npm test` | `node --test ...` | Runs API and frontend test suites |

### 2. Worker project — optional Cloudflare API

File: [`printportal-worker/package.json`](printportal-worker/package.json)

| Package | Declared version | Dependency type | Used for |
| --- | --- | --- | --- |
| `wrangler` | `^4` | Development | Run, configure and deploy Workers / execute D1 commands |
| `typescript` | `^5.5.2` | Development | Type checking Worker TypeScript |
| `vitest` | `~5.0.3` | Development | Worker automated tests |
| `@cloudflare/vitest-plugin` | `^1.4.3` | Development | Cloudflare runtime integration for Vitest |

Install Worker dependencies separately:

```bash
cd printportal-worker
npm ci
```

**Worker npm scripts:**

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local Worker development server with Wrangler |
| `npm start` | Alias for Wrangler development server |
| `npm test` | Run Vitest tests |
| `npm run cf-typegen` | Generate Cloudflare environment types |
| `npm run deploy` | Deploy Worker (requires Cloudflare access/configuration) |

`npx tsc --noEmit` performs a TypeScript check; it is not an npm script in this project.

## 🚀 Quick start — local development

### Step 1 — Clone the repository

```bash
git clone https://github.com/Xyber-Core/CloudComputing-Assignment-II.Collab.git
cd CloudComputing-Assignment-II.Collab
```

If you downloaded the repository ZIP instead, extract it and open a terminal in the folder containing the root `package.json`.

### Step 2 — Install dependencies

```bash
npm ci
```

There is **no need to install anything in the `Frontend` directory**. The local Express server hosts the web pages and assets.

### Step 3 — Run the tests (recommended)

```bash
npm test
```

This runs the local API and frontend test suites. Investigate failures before proceeding.

### Step 4 — Start the local web server

```bash
npm start
```

By default, the project starts at:

**http://localhost:3000**

Use these URLs:

| URL | Purpose |
| --- | --- |
| `http://localhost:3000/` | Dashboard / request list |
| `http://localhost:3000/index.html` | Dashboard and request details |
| `http://localhost:3000/requestSubmission.html` | New request form |
| `http://localhost:3000/api/health` | Basic API health response |

Keep the terminal running while you use the portal. Press **Ctrl+C** to stop the server.

**PowerShell alternative:** the same `npm ci`, `npm test` and `npm start` commands work in Windows PowerShell or the VS Code terminal.

### Step 5 — Select the correct API mode

In the portal's account/settings menu, select **Local** while using `localhost:3000`. On `localhost` or `127.0.0.1`, the redesigned frontend defaults to Local mode unless a previously saved preference overrides it.

> [!WARNING]
> Local Express mode currently uses `createMemoryRepo()`. **Requests and history are reset each time the Node server restarts.** This is intentional for synthetic demonstrations, not persistent production storage. Opening a previously bookmarked `index.html?id=1` after restarting may return `404 Request not found`.

### Optional — Change the port

**Windows PowerShell:**

```powershell
$env:PORT = 4000
npm start
```

**macOS / Linux:**

```bash
PORT=4000 npm start
```

Then open `http://localhost:4000`. Note that the **frontend's local API origin is configured for port 3000**; if you use another port, update `ProjectImplementationPrintPortal/Frontend/Public/Assets/JS/api-config.js` and any hardcoded port logic in `App.js` accordingly. Using the default port avoids these changes.

## 🔁 Local and cloud API selection

The frontend's public API endpoint configuration is:

[`ProjectImplementationPrintPortal/Frontend/Public/Assets/JS/api-config.js`](ProjectImplementationPrintPortal/Frontend/Public/Assets/JS/api-config.js)

```javascript
export const API_BASES = Object.freeze({
  local: 'http://localhost:3000',
  cloud: 'https://printportal-worker.rikerhoch.workers.dev',
});
```

**The cloud URL above is the value found in the supplied project, not a newly verified live deployment.** Replace it with your actual Worker API URL if your deployment differs. These are *public endpoint addresses*, never credential values.

- **Local mode:** uses the Express API, normally at `http://localhost:3000`.
- **Cloud mode:** calls the configured Cloudflare Worker API with D1 (if deployed/configured).
- The browser remembers your selected mode, demo user and font preference in local storage.
- A static frontend opened directly via `file://` is **not supported** because pages load local JSON/components through `fetch`.

**Separate frontend previews:** the Express API permits local CORS origins on ports `3000` and `5173` in the redesigned version. Port `5173` is *optional*, and **Vite is not installed as a project dependency**. Serve `ProjectImplementationPrintPortal/Frontend/Public` from a static host only if you need a separate frontend preview, and keep Express running on port `3000`.

**Real phones on a local network:** `localhost` refers to the phone itself, not your computer. For device testing, use browser responsive mode first. To use an actual phone, provide a reachable LAN API origin, configure the frontend's API URL logic and add the exact frontend origin to the local API's CORS allowlist. Keep this setup on a trusted development network.

## ☁️ Cloudflare Worker and D1 — optional demo

Cloudflare is a **separate demonstration path**, not proof of Azure assignment compliance.

### Set up the Worker locally

From the repository root:

```bash
cd printportal-worker
npm ci
```

The Worker configuration is in [`wrangler.jsonc`](printportal-worker/wrangler.jsonc). It declares a D1 binding named `DB` with database name `printportal-db`. The uploaded configuration also contains a database ID from the original project; **verify or replace it** for your own Cloudflare account.

For a **fresh local D1 database**, initialize the schema and synthetic users:

```bash
npx wrangler d1 execute printportal-db --local --file=./schema.sql
```

Then run the local Worker:

```bash
npm run dev
```

Wrangler prints its local address (commonly `http://localhost:8787`). Check the endpoint printed in your terminal instead of assuming the port.

To test the Worker separately:

```bash
npm test
npx tsc --noEmit
```

The frontend will not automatically use the local Wrangler port. If you want to point the frontend at a local Worker, adjust its API configuration and allow the frontend origin in the Worker's `ALLOWED_ORIGINS` list in `printportal-worker/src/index.ts`.

### Existing remote D1 database: apply the upgrade carefully

For a database that already contains the *original* schema and needs the rejection/archive fields:

```bash
npx wrangler d1 execute printportal-db --remote --file=./migrations/0002_review_archive.sql
```

> [!CAUTION]
> This is a **remote schema-changing operation**. Back up the remote database and verify its current schema first. A **new empty** database should use `schema.sql` instead; do **not** blindly run both the full schema and the upgrade migration. This README does not claim that your existing remote database has been migrated.

### Optional manual Cloudflare deployment

The redesigned project includes [`.github/workflows/cloudflare-deploy.yml`](.github/workflows/cloudflare-deploy.yml) for manually triggered deployment. Its environment is named `cloudflare`, and it expects GitHub Actions secrets named:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow tests the Worker, deploys the bundled Worker code and optionally uploads **only** `ProjectImplementationPrintPortal/Frontend/Public` to the Pages project named `cloudcomputing-printportal`. It does not upload `node_modules` or the Express API source.

Before using it, check that the Pages project exists, your deployment method is compatible with Wrangler's Pages upload, your Worker database binding is correct and the frontend's cloud URL matches the deployment. **Do not put token values in source control.**

## 🔌 API reference

The local API is mounted under `/api` and returns JSON. Except for `/api/health`, request endpoints expect `X-User-Id` **for synthetic demo use only**.

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Basic process health (`{"status":"ok"}`) |
| `GET` | `/api/requests` | Customer / Coordinator | List own / all accessible requests |
| `GET` | `/api/requests/:id` | Owner / Coordinator | Request details and history |
| `POST` | `/api/requests` | Customer | Submit a request |
| `PATCH` | `/api/requests/:id` | Coordinator | Assign staff or advance one status |
| `POST` | `/api/requests/:id/reject` | Coordinator | Reject an active Submitted request (reason required) |
| `DELETE` | `/api/requests/:id` | Coordinator | Archive a Completed request, retaining history |

**List filters:** `status`, `category`, `priority` and `view`. Valid views are `active`, `rejected`, `archived` and `all`.

### API smoke tests

**1. Verify the server is responding:**

```bash
curl http://localhost:3000/api/health
```

Expected JSON:

```json
{"status":"ok"}
```

**2. List available requests:**

```bash
curl -H "X-User-Id: coordinator" http://localhost:3000/api/requests
```

If it returns `[]`, the in-memory demo has no requests yet.

**3. Create a request (macOS/Linux or a terminal with curl):**

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "X-User-Id: customer-a" \
  -d '{"campaignReference":"WLG-DEMO-001","category":"Flyers","description":"500 A5 community flyers","priority":"Normal"}'
```

On **Windows PowerShell**, use `curl.exe` (not the built-in `curl` alias) or `Invoke-RestMethod`; the portal's submission form is also available for testing without terminal quoting issues.

**4. Reject a Submitted request (substitute the ID returned above):**

```bash
curl -X POST http://localhost:3000/api/requests/1/reject \
  -H "Content-Type: application/json" \
  -H "X-User-Id: coordinator" \
  -d '{"reason":"Request requires clarification before production."}'
```

This works **only** when the request exists, is still Submitted, and has not already been rejected or archived. Do not assume request `1` exists after restarting the server.

### HTTP responses you may see

| Code | Meaning |
| --- | --- |
| `200` / `201` | Request succeeded / new request created |
| `400` | Invalid fields, invalid transition or malformed input |
| `401` | Missing/unknown synthetic demo identity |
| `403` | Demo role is not allowed, or customer cannot access the record |
| `404` | Unknown route or missing request ID |
| `409` | Rejection/archive conflicts with the request's current state |
| `500` | Unexpected server error — inspect the local terminal |

## 🗂️ Project structure

```text
CloudComputing-Assignment-II.Collab/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Automated checks
│       └── cloudflare-deploy.yml         # Manual Worker/Pages deployment (redesign)
├── ProjectImplementationPrintPortal/
│   ├── API/
│   │   ├── server.js                     # Express entry point
│   │   ├── SRC/
│   │   │   ├── app.js                    # Routes and role checks
│   │   │   ├── repoMemory.js             # In-memory demo repository
│   │   │   ├── repoSql.js                # Unfinished Azure SQL path
│   │   │   └── validation.js             # Request validation/business rules
│   │   ├── Scripts/                      # SQL/migration scaffolding
│   │   └── Test/                         # API tests
│   └── Frontend/
│       ├── Public/
│       │   ├── index.html               # Dashboard and request details
│       │   ├── requestSubmission.html   # New request page
│       │   └── Assets/
│       │       ├── CSS/                  # Responsive styling
│       │       ├── JS/                   # UI logic and API config
│       │       ├── JSON/                 # Synthetic reference data
│       │       └── Components/           # Navigation/footer fragments
│       └── Test/                          # Frontend tests
├── printportal-worker/
│   ├── src/index.ts                      # Worker API
│   ├── schema.sql                        # Initial D1 schema
│   ├── migrations/                       # Schema upgrades
│   ├── test/                             # Worker tests
│   ├── wrangler.jsonc                    # Worker + D1 configuration
│   ├── package.json
│   └── package-lock.json
├── docs/images/                          # Illustrative screenshots (README package)
├── ASSESSMENT-ALIGNMENT.md               # Rubric gap tracking (redesign)
├── package.json                          # Express dependency + root scripts
├── package-lock.json
├── .gitignore
└── README.md
```

Some files above belong to the **redesigned package**; if you are using a partially merged branch, check the working tree before treating them as present in your current GitHub `main`.

## 🧪 Testing

### Express API and frontend

From the repository root:

```bash
npm ci
npm test
```

The test suites cover request validation, access restrictions, workflow transitions and frontend helper/journey logic. The redesigned backend also includes rejection, archive and history tests.

### Cloudflare Worker

From the repository root:

```bash
cd printportal-worker
npm ci
npx tsc --noEmit
npm test
```

The Worker needs its **own** `npm ci`: installing the root Express dependency does **not** install the Worker's tooling.

### Suggested manual checks

- Submit a request as Customer A; confirm Customer B cannot open it.
- Assign a staff member, then advance through the four statuses in order.
- Reject a *Submitted* request with a required reason; verify history is preserved.
- Archive a *Completed* request; confirm it remains retrievable in the archive.
- Test navigation and the confirmation dialog at desktop and narrow mobile widths.
- Confirm Local and Cloud selectors show a useful error if their APIs are unavailable.

## 🔄 CI/CD and dependency hygiene

The **redesigned** `.github/workflows/ci.yml` is configured to run on pushes and pull requests to `main` and can be run manually. It contains separate jobs for:

1. **Express + frontend:** root `npm ci`, root `npm test` and JavaScript syntax checks.
2. **Cloudflare Worker:** Worker-directory `npm ci`, TypeScript checking and Vitest tests.

The original repository's `ci.yml` ran only the root tests. **If your GitHub branch still has that older workflow, merge the redesigned workflow before claiming Worker tests run in CI.**

### Never track `node_modules`

Both `node_modules` folders are generated by `npm ci` and should remain untracked. Likewise, don't commit `.wrangler`, caches, coverage or generated builds. Keep **both** lockfiles tracked.

A suitable `.gitignore` includes:

```gitignore
**/node_modules/
**/.wrangler/
**/dist/
**/build/
**/coverage/
.env
.env.*
!*.env.example
*.log
.DS_Store
```

If your older Git history already tracks dependencies, adding `.gitignore` **does not automatically remove them from the Git index**. To stop tracking those paths without deleting local copies, run once from the repository root:

```bash
git rm -r --cached --ignore-unmatch node_modules printportal-worker/node_modules ProjectImplementationPrintPortal/API/node_modules
git add .gitignore package.json package-lock.json printportal-worker/package.json printportal-worker/package-lock.json
git commit -m "chore: stop tracking installed dependencies"
```

Review `git status` before committing. Do not remove package lockfiles; `npm ci` relies on them. Never upload secret values or real customer data.

## 🛠️ Troubleshooting

<details>
<summary><strong><code>npm ci</code> fails or complains about the lockfile</strong></summary>

Make sure you're in the folder containing the correct `package.json` and matching `package-lock.json`. Run `npm ci` separately in the repository root and `printportal-worker`. If dependencies were deliberately changed, update the lockfile with `npm install` first; then retry `npm ci`. Do not copy `node_modules` from another computer or operating system.

</details>

<details>
<summary><strong>Port 3000 is already in use (<code>EADDRINUSE</code>)</strong></summary>

Another process is listening on port 3000. Stop the old Node process with Ctrl+C and restart. Alternatively set `PORT` as described above **and update the frontend API URL to match**.

</details>

<details>
<summary><strong><code>GET /api/requests/1</code> returns 404</strong></summary>

The request ID may no longer exist. Local Express uses an in-memory repository; restart = empty request list. Open `http://localhost:3000/`, submit a new request and use its newly assigned ID. Confirm the current list using `GET /api/requests` with a demo user header.

</details>

<details>
<summary><strong><code>POST /api/requests/1/reject</code> returns 404</strong></summary>

Make sure the running `ProjectImplementationPrintPortal/API/SRC/app.js` includes the `/api/requests/:id/reject` route and that `repoMemory.js` includes `rejectRequest()`. Stop any old server process, restart with `npm start` and verify the ID exists. An older API version without the route returns a route-level 404.

</details>

<details>
<summary><strong>403 Forbidden or 409 Conflict</strong></summary>

A customer cannot reject, archive or update requests. Use the Coordinator demo account for coordinator actions. Only a non-rejected **Submitted** request can be rejected, and only a non-archived **Completed** request can be archived.

</details>

<details>
<summary><strong>Frontend says API offline / CORS error</strong></summary>

Verify the server is running and the frontend's selected Local/Cloud mode matches it. Check `api-config.js`, the browser Network tab and allowed origins in the selected API. Running an HTTPS page against a local HTTP URL may be blocked, and a phone's `localhost` is not your computer.

</details>

<details>
<summary><strong>Cloudflare Worker reports missing D1 table or binding</strong></summary>

Check `wrangler.jsonc`, the `DB` binding, target database and whether you ran `schema.sql` locally or the correct migration remotely. Local and remote D1 databases are separate. Don't reapply a migration blindly to a database that already has the columns.

</details>

<details>
<summary><strong>Previously selected API mode keeps returning</strong></summary>

The interface saves the selected mode in browser local storage. Change it back using the account/settings menu, or clear this site's local storage in DevTools for a fresh demo session.

</details>

## 🤝 Contributing and licence

This is a team assessment project. Work from feature branches, keep commits focused, open pull requests where practicable and record actual contributions in the weekly contribution log. A recommended local check before opening a PR is:

```bash
npm ci && npm test
cd printportal-worker && npm ci && npx tsc --noEmit && npm test
```

Retain your actual Git history and document AI assistance in the submission as required by the assessment. Report bugs with the affected route, status code, expected result, actual result and relevant logs **without credentials or personal information**.

Released under the **[MIT License](LICENSE)**. See `LICENSE` for the copyright holders and full terms.

---

<div align="center">

**Built for the Wellington community printing scenario — BACT7602 Assessment 2** 💙💜  
*From a local prototype toward a secure, scalable, observable cloud application.*

</div>
