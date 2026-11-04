/* ============================================================
   Frontend unit tests: App.js helpers + Data.json consistency.
   Run with `npm test` from API/.
   ============================================================ */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { nextStatus, buildQuery, escapeHtml, tourCardPosition } = require("../../Public/Assets/JS/App.js");
const data = require("../../Public/Assets/JSON/Data.json");
const validation = require("../../../API/SRC/validation");

test("nextStatus walks the defined sequence and stops at Completed", () => {
  assert.equal(nextStatus(data.statuses, "Submitted"), "Assigned");
  assert.equal(nextStatus(data.statuses, "In Progress"), "Completed");
  assert.equal(nextStatus(data.statuses, "Completed"), null);
});

test("buildQuery skips blank filters and encodes values", () => {
  assert.equal(buildQuery({ status: "", category: "", priority: "" }), "");
  assert.equal(buildQuery({ status: "In Progress", category: "", priority: "High" }), "?status=In+Progress&priority=High");
});

test("escapeHtml neutralises markup from user-entered fields", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`), "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;");
  assert.equal(escapeHtml(null), "");
});

test("tour card sits below the highlight, flips above near the bottom, and stays on screen", () => {
  const card = { width: 300, height: 120 };
  const viewport = { width: 1024, height: 768 };
  assert.deepEqual(tourCardPosition({ top: 100, bottom: 150, left: 20 }, card, viewport), { top: 162, left: 20 });
  assert.deepEqual(tourCardPosition({ top: 600, bottom: 700, left: 900 }, card, viewport), { top: 468, left: 712 });
  assert.deepEqual(tourCardPosition({ top: 10, bottom: 760, left: -5 }, card, viewport), { top: 12, left: 12 });
});

test("Data.json reference data matches the API's validation rules", () => {
  assert.deepEqual(data.categories, validation.CATEGORIES);
  assert.deepEqual(data.priorities, validation.PRIORITIES);
  assert.deepEqual(data.statuses, validation.STATUSES);
  assert.deepEqual(data.staff, validation.STAFF);
  assert.deepEqual(new Set(data.users.map((u) => u.role)), new Set(Object.values(validation.ROLES)));
});
