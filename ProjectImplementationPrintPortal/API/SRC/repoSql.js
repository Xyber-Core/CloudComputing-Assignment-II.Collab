/* ============================================================
   Azure SQL repository.
   Authenticates with Entra ID via DefaultAzureCredential: the App
   Service managed identity in Azure, OIDC login in CI, `az login`
   locally. There is no password or connection-string secret.
   ============================================================ */

const sql = require("mssql");

function sqlConfig(env = process.env) {
  return {
    server: env.SQL_SERVER, // e.g. sql-printportal-dev.database.windows.net
    database: env.SQL_DATABASE,
    authentication: { type: "azure-active-directory-default", options: {} },
    options: { encrypt: true },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

const REQUEST_COLUMNS = `Id AS id, CustomerId AS customerId, CampaignReference AS campaignReference,
  Category AS category, Description AS description, Priority AS priority, Status AS status,
  Assignee AS assignee, CreatedAt AS createdAt, UpdatedAt AS updatedAt`;

function createSqlRepo(config = sqlConfig()) {
  const poolPromise = new sql.ConnectionPool(config).connect();
  const request = async () => (await poolPromise).request();

  return {
    async ping() {
      await (await request()).query("SELECT 1");
    },

    async findUser(id) {
      const result = await (await request())
        .input("id", sql.NVarChar(100), id)
        .query("SELECT Id AS id, Role AS role FROM dbo.Users WHERE Id = @id");
      return result.recordset[0] || null;
    },

    async listRequests(filters = {}) {
      const req = await request();
      const where = [];
      const columns = { customerId: "CustomerId", status: "Status", category: "Category", priority: "Priority" };
      for (const [key, column] of Object.entries(columns)) {
        if (!filters[key]) continue;
        req.input(key, sql.NVarChar(100), filters[key]);
        where.push(`${column} = @${key}`);
      }
      const result = await req.query(
        `SELECT ${REQUEST_COLUMNS} FROM dbo.PrintRequest
         ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
         ORDER BY CreatedAt DESC, Id DESC`
      );
      return result.recordset;
    },

    async getRequest(id) {
      const result = await (await request())
        .input("id", sql.Int, id)
        .query(`SELECT ${REQUEST_COLUMNS} FROM dbo.PrintRequest WHERE Id = @id`);
      return result.recordset[0] || null;
    },

    async getHistory(requestId) {
      const result = await (await request())
        .input("requestId", sql.Int, requestId)
        .query(`SELECT RequestId AS requestId, PreviousStatus AS previousStatus, NewStatus AS newStatus,
                  Actor AS actor, ChangedAt AS changedAt
                FROM dbo.StatusHistory WHERE RequestId = @requestId ORDER BY ChangedAt, Id`);
      return result.recordset;
    },

    // Request row and its first history entry are written in one transaction.
    async createRequest(fields, actor) {
      const result = await (await request())
        .input("customerId", sql.NVarChar(100), fields.customerId)
        .input("campaignReference", sql.NVarChar(30), fields.campaignReference)
        .input("category", sql.NVarChar(20), fields.category)
        .input("description", sql.NVarChar(1000), fields.description)
        .input("priority", sql.NVarChar(10), fields.priority)
        .input("actor", sql.NVarChar(100), actor)
        .query(`SET XACT_ABORT ON;
          BEGIN TRANSACTION;
          INSERT INTO dbo.PrintRequest (CustomerId, CampaignReference, Category, Description, Priority, Status)
          VALUES (@customerId, @campaignReference, @category, @description, @priority, 'Submitted');
          DECLARE @id INT = SCOPE_IDENTITY();
          INSERT INTO dbo.StatusHistory (RequestId, PreviousStatus, NewStatus, Actor)
          VALUES (@id, NULL, 'Submitted', @actor);
          COMMIT;
          SELECT ${REQUEST_COLUMNS} FROM dbo.PrintRequest WHERE Id = @id;`);
      return result.recordset[0];
    },

    // Status change and its history entry are written in one transaction.
    async updateRequest(id, changes, actor) {
      const result = await (await request())
        .input("id", sql.Int, id)
        .input("assignee", sql.NVarChar(100), changes.assignee ?? null)
        .input("status", sql.NVarChar(20), changes.status ?? null)
        .input("actor", sql.NVarChar(100), actor)
        .query(`SET XACT_ABORT ON;
          BEGIN TRANSACTION;
          INSERT INTO dbo.StatusHistory (RequestId, PreviousStatus, NewStatus, Actor)
          SELECT Id, Status, @status, @actor FROM dbo.PrintRequest
          WHERE Id = @id AND @status IS NOT NULL AND Status <> @status;
          UPDATE dbo.PrintRequest
          SET Assignee = COALESCE(@assignee, Assignee), Status = COALESCE(@status, Status), UpdatedAt = SYSUTCDATETIME()
          WHERE Id = @id;
          COMMIT;
          SELECT ${REQUEST_COLUMNS} FROM dbo.PrintRequest WHERE Id = @id;`);
      return result.recordset[0];
    },
  };
}

module.exports = { createSqlRepo, sqlConfig };
