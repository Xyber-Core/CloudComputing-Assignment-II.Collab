/* ============================================================
   API tests: business rules + routes against the memory repo.
   Run with `npm test`.
   ============================================================ */

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../SRC/app");
const { createMemoryRepo } = require("../SRC/repoMemory");
const { nextStatus, validateNewRequest, validateUpdate, validateFilters } = require("../SRC/validation");

const VALID = { campaignReference: "WLG-DEMO-001", category: "Flyers", description: "500 A5 flyers", priority: "Normal" };

/* ── Validation ────────────────────────────────────────────── */
describe("validation", () => {
  test("accepts a valid request and normalises the campaign reference", () => {
    const { value, errors } = validateNewRequest({ ...VALID, campaignReference: " wlg-demo-001 " });
    assert.deepEqual(errors, []);
    assert.equal(value.campaignReference, "WLG-DEMO-001");
  });

  test("rejects missing or invalid required fields", () => {
    const { errors } = validateNewRequest({ campaignReference: "!", category: "Stickers", description: " ", priority: "Urgent" });
    assert.equal(errors.length, 4);
  });

  test("statuses follow Submitted → Assigned → In Progress → Completed", () => {
    assert.equal(nextStatus("Submitted"), "Assigned");
    assert.equal(nextStatus("Assigned"), "In Progress");
    assert.equal(nextStatus("In Progress"), "Completed");
    assert.equal(nextStatus("Completed"), null);
  });

  test("Assigned requires an assignee", () => {
    assert.equal(validateUpdate({ status: "Submitted", assignee: null }, { status: "Assigned" }).errors.length, 1);
    assert.deepEqual(validateUpdate({ status: "Submitted", assignee: null }, { status: "Assigned", assignee: "Sam Patel" }).errors, []);
  });

  test("statuses cannot be skipped or moved past Completed", () => {
    assert.equal(validateUpdate({ status: "Submitted", assignee: "Sam Patel" }, { status: "In Progress" }).errors.length, 1);
    assert.equal(validateUpdate({ status: "Completed", assignee: "Sam Patel" }, { status: "Submitted" }).errors.length, 1);
  });

  test("filters only accept known values", () => {
    assert.deepEqual(validateFilters({ status: "In Progress", category: "" }).filters, { status: "In Progress" });
    assert.equal(validateFilters({ priority: "Urgent" }).errors.length, 1);
  });
});

/* ── Routes ────────────────────────────────────────────────── */
describe("routes", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createApp({ repo: createMemoryRepo() }).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  async function call(path, { user, method = "GET", body } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (user) headers["X-User-Id"] = user;
    const res = await fetch(baseUrl + path, { method, headers, body: body && JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  }
  const submit = (user, fields = {}) => call("/api/requests", { user, method: "POST", body: { ...VALID, ...fields } });
  const update = (id, body) => call(`/api/requests/${id}`, { user: "coordinator", method: "PATCH", body });

  test("health check reports ok", async () => {
    assert.deepEqual(await call("/api/health"), { status: 200, body: { status: "ok" } });
  });

  test("unknown or missing users are rejected", async () => {
    assert.equal((await call("/api/requests")).status, 401);
    assert.equal((await call("/api/requests", { user: "intruder" })).status, 401);
  });

  test("customers submit requests; coordinators cannot", async () => {
    const created = await submit("customer-a");
    assert.equal(created.status, 201);
    assert.equal(created.body.status, "Submitted");
    assert.equal(created.body.customerId, "customer-a");
    assert.equal((await submit("coordinator")).status, 403);
  });

  test("invalid submissions return 400", async () => {
    assert.equal((await submit("customer-a", { category: "Stickers" })).status, 400);
  });

  test("customers see only their own requests; coordinators see all", async () => {
    const mine = await submit("customer-b", { campaignReference: "WLG-B-001" });
    const listB = await call("/api/requests", { user: "customer-b" });
    assert.ok(listB.body.every((r) => r.customerId === "customer-b"));
    assert.ok(listB.body.some((r) => r.id === mine.body.id));

    const all = await call("/api/requests", { user: "coordinator" });
    assert.ok(all.body.some((r) => r.customerId === "customer-a"));
    assert.ok(all.body.some((r) => r.customerId === "customer-b"));
  });

  test("customers cannot open another customer's request", async () => {
    const created = await submit("customer-a");
    assert.equal((await call(`/api/requests/${created.body.id}`, { user: "customer-b" })).status, 403);
    assert.equal((await call(`/api/requests/${created.body.id}`, { user: "customer-a" })).status, 200);
    assert.equal((await call("/api/requests/99999", { user: "coordinator" })).status, 404);
  });

  test("only coordinators can assign or change status", async () => {
    const created = await submit("customer-a");
    const res = await call(`/api/requests/${created.body.id}`, {
      user: "customer-a",
      method: "PATCH",
      body: { assignee: "Sam Patel", status: "Assigned" },
    });
    assert.equal(res.status, 403);
  });

  test("status changes enforce the assignee and sequence rules", async () => {
    const { body } = await submit("customer-a");
    assert.equal((await update(body.id, { status: "Assigned" })).status, 400);
    assert.equal((await update(body.id, { status: "In Progress" })).status, 400);
    assert.equal((await update(body.id, { assignee: "Nobody" })).status, 400);
  });

  test("filters narrow the list by status, category and priority", async () => {
    const { body } = await submit("customer-a", { category: "Booklets", priority: "High" });
    await update(body.id, { assignee: "Aroha Ngata", status: "Assigned" });

    const res = await call("/api/requests?status=Assigned&category=Booklets&priority=High", { user: "coordinator" });
    assert.ok(res.body.some((r) => r.id === body.id));
    assert.ok(res.body.every((r) => r.status === "Assigned" && r.category === "Booklets" && r.priority === "High"));
    assert.equal((await call("/api/requests?status=Lost", { user: "coordinator" })).status, 400);
  });

  test("full lifecycle records timestamped history with the responsible identity", async () => {
    const { body } = await submit("customer-a");
    await update(body.id, { assignee: "Leilani Fono", status: "Assigned" });
    await update(body.id, { status: "In Progress" });
    const done = await update(body.id, { status: "Completed" });
    assert.equal(done.body.status, "Completed");
    assert.equal((await update(body.id, { status: "Completed" })).status, 400);

    const view = await call(`/api/requests/${body.id}`, { user: "customer-a" });
    assert.equal(view.status, 200, "completed requests remain viewable");
    assert.deepEqual(
      view.body.history.map((h) => [h.previousStatus, h.newStatus, h.actor]),
      [
        [null, "Submitted", "customer-a"],
        ["Submitted", "Assigned", "coordinator"],
        ["Assigned", "In Progress", "coordinator"],
        ["In Progress", "Completed", "coordinator"],
      ]
    );
    assert.ok(view.body.history.every((h) => !Number.isNaN(Date.parse(h.changedAt))));
  });

  test("malformed JSON returns 400", async () => {
    const res = await fetch(baseUrl + "/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": "customer-a" },
      body: "{bad json",
    });
    assert.equal(res.status, 400);
  });
});
