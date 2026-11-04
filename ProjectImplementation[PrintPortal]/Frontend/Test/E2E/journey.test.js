/* ============================================================
   E2E: the scenario's demonstration journey, end to end over HTTP.
   Uses a fresh campaign reference each run.
   - No BASE_URL: starts a local server (in-memory repository).
   - BASE_URL=https://<app>.azurewebsites.net: runs against a deployment.
   Run with `npm run test:e2e` from API/.
   ============================================================ */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

let server;
let baseUrl = process.env.BASE_URL;

before(async () => {
  if (baseUrl) return;
  const { createApp } = require("../../../API/SRC/app");
  const { createMemoryRepo } = require("../../../API/SRC/repoMemory");
  server = createApp({ repo: createMemoryRepo() }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server?.close());

async function call(path, user, method = "GET", body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json", "X-User-Id": user },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test("frontend pages and assets are served", async () => {
  for (const path of ["/", "/requestSubmission.html", "/Assets/JS/App.js", "/Assets/JSON/Data.json"]) {
    assert.equal((await fetch(baseUrl + path)).status, 200, path);
  }
});

test("demonstration journey: submit, assign, progress, history, isolation", async () => {
  const campaign = `WLG-DEMO-${Date.now().toString(36).toUpperCase()}`;

  // Customer A submits a flyer-printing request.
  const created = await call("/api/requests", "customer-a", "POST", {
    campaignReference: campaign,
    category: "Flyers",
    description: "1000 x A5 flyers, double-sided, 150gsm gloss",
    priority: "High",
  });
  assert.equal(created.status, 201);
  const id = created.body.id;

  // Coordinator finds it among outstanding work.
  const outstanding = await call("/api/requests?status=Submitted&category=Flyers", "coordinator");
  assert.ok(outstanding.body.some((r) => r.id === id));

  // Coordinator assigns a named staff member and advances through every status.
  for (const body of [{ assignee: "Aroha Ngata", status: "Assigned" }, { status: "In Progress" }, { status: "Completed" }]) {
    const res = await call(`/api/requests/${id}`, "coordinator", "PATCH", body);
    assert.equal(res.status, 200, JSON.stringify(res.body));
  }

  // Customer A views the completed request and its status history.
  const view = await call(`/api/requests/${id}`, "customer-a");
  assert.equal(view.status, 200);
  assert.equal(view.body.status, "Completed");
  assert.equal(view.body.assignee, "Aroha Ngata");
  assert.deepEqual(view.body.history.map((h) => h.newStatus), ["Submitted", "Assigned", "In Progress", "Completed"]);
  assert.deepEqual(view.body.history.map((h) => h.actor), ["customer-a", "coordinator", "coordinator", "coordinator"]);

  // Customer B cannot access the request, directly or via their list.
  assert.equal((await call(`/api/requests/${id}`, "customer-b")).status, 403);
  assert.ok(!(await call("/api/requests", "customer-b")).body.some((r) => r.id === id));
});
