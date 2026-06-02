const pool = require("./db");

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS module_last_update (
      module TEXT PRIMARY KEY,
      last_updated TIMESTAMPTZ NOT NULL
    )
  `);

  await pool.query(
    `
    INSERT INTO module_last_update (module, last_updated)
    VALUES ('dom', NOW())
    ON CONFLICT (module) DO NOTHING
    `
  );
}

module.exports = initDb;

