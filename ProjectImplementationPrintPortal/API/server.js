const { createApp } = require('./SRC/app');
const { createMemoryRepo } = require('./SRC/repoMemory');

async function start() {
  // Local demo is intentionally in-memory. For Azure, set SQL_SERVER / SQL_DATABASE,
  // provide the mssql package, and grant the application identity DB permissions.
  const repo = process.env.SQL_SERVER
    ? require('./SRC/repoSql').createSqlRepo()
    : createMemoryRepo();
  await repo.ping();
  const port = Number(process.env.PORT) || 3000;
  createApp({ repo }).listen(port, () => console.log(`PrintPortal listening on http://localhost:${port}`));
}
start().catch((error) => { console.error(error); process.exitCode = 1; });
