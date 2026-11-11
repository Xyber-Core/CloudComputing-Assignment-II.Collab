/* ============================================================
   Reference data and business-rule validation.
   Used by the routes before anything reaches a repository.
   ============================================================ */

const ROLES = { CUSTOMER: "Customer", COORDINATOR: "Coordinator" };
const CATEGORIES = ["Posters", "Flyers", "Booklets"];
const PRIORITIES = ["Low", "Normal", "High"];
const STATUSES = ["Submitted", "Assigned", "In Progress", "Completed"];
const STAFF = ["Aroha Ngata", "Sam Patel", "Leilani Fono"];

const CAMPAIGN_REFERENCE = /^[A-Z0-9][A-Z0-9-]{2,29}$/; // e.g. WLG-DEMO-001
const MAX_DESCRIPTION = 1000;

const text = (value) => (typeof value === "string" ? value.trim() : "");
const oneOf = (list) => list.join(", ");

function nextStatus(status) {
  const i = STATUSES.indexOf(status);
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}

/* ── Submit a request ──────────────────────────────────────── */
function validateNewRequest(body = {}) {
  const value = {
    campaignReference: text(body.campaignReference).toUpperCase(),
    category: text(body.category),
    description: text(body.description),
    priority: text(body.priority),
  };
  const errors = [];
  if (!CAMPAIGN_REFERENCE.test(value.campaignReference)) {
    errors.push("Campaign reference must be 3-30 letters, numbers or hyphens (e.g. WLG-DEMO-001).");
  }
  if (!CATEGORIES.includes(value.category)) errors.push(`Category must be one of: ${oneOf(CATEGORIES)}.`);
  if (!value.description || value.description.length > MAX_DESCRIPTION) {
    errors.push(`Description is required (max ${MAX_DESCRIPTION} characters).`);
  }
  if (!PRIORITIES.includes(value.priority)) errors.push(`Priority must be one of: ${oneOf(PRIORITIES)}.`);
  return { value, errors };
}

/* ── Assign and update (coordinator) ───────────────────────── */
function validateUpdate(current, body = {}) {
  const changes = {};
  const errors = [];
  if (current.rejectedAt) return { changes, errors: ["Rejected requests cannot be updated."] };
  if (current.deletedAt) return { changes, errors: ["Archived requests cannot be updated."] };

  if (body.assignee !== undefined) {
    const assignee = text(body.assignee);
    if (STAFF.includes(assignee)) changes.assignee = assignee;
    else errors.push(`Assignee must be one of: ${oneOf(STAFF)}.`);
  }

  if (body.status !== undefined) {
    const allowed = nextStatus(current.status);
    if (text(body.status) === allowed) changes.status = allowed;
    else if (allowed) errors.push(`Status can only move from ${current.status} to ${allowed}.`);
    else errors.push(`${current.status} is the final status.`);
  }

  if (changes.status === "Assigned" && !(changes.assignee || current.assignee)) {
    errors.push("A request needs an assignee before it can be Assigned.");
  }
  if (!errors.length && !Object.keys(changes).length) errors.push("Provide an assignee and/or the next status.");
  return { changes, errors };
}

/* ── Find outstanding work (list filters) ──────────────────── */
function validateFilters(query = {}) {
  const filters = {};
  const errors = [];
  for (const [key, allowed] of [["status", STATUSES], ["category", CATEGORIES], ["priority", PRIORITIES], ["view", ["active", "rejected", "archived", "all"]]]) {
    if (!query[key]) continue;
    if (allowed.includes(query[key])) filters[key] = query[key];
    else errors.push(`Filter ${key} must be one of: ${oneOf(allowed)}.`);
  }
  return { filters, errors };
}

module.exports = {
  ROLES,
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  STAFF,
  nextStatus,
  validateNewRequest,
  validateUpdate,
  validateFilters,
};
