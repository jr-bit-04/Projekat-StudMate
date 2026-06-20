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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS menza_bonovi_kupovine (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dorucak INTEGER NOT NULL DEFAULT 0 CHECK (dorucak >= 0),
      rucak INTEGER NOT NULL DEFAULT 0 CHECK (rucak >= 0),
      vecera INTEGER NOT NULL DEFAULT 0 CHECK (vecera >= 0),
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menza_bonovi_kupovine_purchased_at
    ON menza_bonovi_kupovine (purchased_at)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_menza_bonovi_kupovine_user_id
    ON menza_bonovi_kupovine (user_id)
  `);
}

module.exports = initDb;

