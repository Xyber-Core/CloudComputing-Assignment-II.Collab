/* ============================================================
   In-memory repository for local development and tests.
   Same interface as repoSql.js.
   ============================================================ */

// Synthetic demo accounts (mirrors the seed in 001CreatePrintRequest.sql).
const DEMO_USERS = [
  { id: "customer-a", role: "Customer" },
  { id: "customer-b", role: "Customer" },
  { id: "coordinator", role: "Coordinator" },
];

function createMemoryRepo(users = DEMO_USERS) {
  const requests = [];
  const history = [];
  let nextId = 1;

  const now = () => new Date().toISOString();
  const copy = (row) => ({ ...row });
  const matches = (request, filters) =>
    Object.entries(filters).every(([key, value]) => !value || request[key] === value);

  return {
    async ping() {},

    async findUser(id) {
      return users.find((u) => u.id === id) || null;
    },

    async listRequests(filters = {}) {
      return requests.filter((r) => matches(r, filters)).reverse().map(copy);
    },

    async getRequest(id) {
      const request = requests.find((r) => r.id === id);
      return request ? copy(request) : null;
    },

    async getHistory(requestId) {
      return history.filter((h) => h.requestId === requestId).map(copy);
    },

    async createRequest(fields, actor) {
      const ts = now();
      const request = { id: nextId++, ...fields, status: "Submitted", assignee: null, createdAt: ts, updatedAt: ts };
      requests.push(request);
      history.push({ requestId: request.id, previousStatus: null, newStatus: "Submitted", actor, changedAt: ts });
      return copy(request);
    },

    async updateRequest(id, changes, actor) {
      const request = requests.find((r) => r.id === id);
      const ts = now();
      if (changes.status && changes.status !== request.status) {
        history.push({ requestId: id, previousStatus: request.status, newStatus: changes.status, actor, changedAt: ts });
      }
      Object.assign(request, changes, { updatedAt: ts });
      return copy(request);
    },
  };
}

module.exports = { createMemoryRepo, DEMO_USERS };
