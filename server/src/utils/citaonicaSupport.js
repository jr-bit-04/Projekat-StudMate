const pool = require("../config/db");
const { CITAONA_LOCATION } = require("./citaonaTracking");

const DEFAULT_CITAONICA_NAME = "Glavna citaonica";

async function ensureDefaultCitaonica(totalSeats) {
  const existing = await pool.query(
    `
    SELECT id
    FROM citaonica
    WHERE LOWER(naziv) = LOWER($1)
    LIMIT 1
    `,
    [DEFAULT_CITAONICA_NAME]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const created = await pool.query(
    `
    INSERT INTO citaonica (
      naziv,
      lokacija,
      broj_mjesta,
      tracking_latitude,
      tracking_longitude
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      DEFAULT_CITAONICA_NAME,
      CITAONA_LOCATION.address,
      totalSeats,
      CITAONA_LOCATION.latitude,
      CITAONA_LOCATION.longitude,
    ]
  );

  return created.rows[0];
}

async function syncCitaonicaSeatCounts() {
  await pool.query(`
    UPDATE citaonica c
    SET broj_mjesta = counts.total,
        updated_at = NOW()
    FROM (
      SELECT citaonica_id, COUNT(*)::INTEGER AS total
      FROM mjesto
      WHERE citaonica_id IS NOT NULL
      GROUP BY citaonica_id
    ) counts
    WHERE c.id = counts.citaonica_id
      AND c.broj_mjesta <> counts.total
  `);
}

async function normalizeSeatNumbersPerRoom() {
  await pool.query(`
    WITH ranked AS (
      SELECT
        id,
        citaonica_id,
        ROW_NUMBER() OVER (
          PARTITION BY citaonica_id
          ORDER BY broj_mjesta ASC, id ASC
        )::INTEGER AS next_broj_mjesta
      FROM mjesto
      WHERE citaonica_id IS NOT NULL
    )
    UPDATE mjesto m
    SET broj_mjesta = ranked.next_broj_mjesta
    FROM ranked
    WHERE m.id = ranked.id
      AND m.broj_mjesta <> ranked.next_broj_mjesta
  `);
}

async function ensureCitaonicaSupport() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS citaonica (
      id SERIAL PRIMARY KEY,
      naziv TEXT NOT NULL,
      lokacija TEXT NOT NULL,
      broj_mjesta INTEGER NOT NULL CHECK (broj_mjesta > 0),
      tracking_latitude DOUBLE PRECISION,
      tracking_longitude DOUBLE PRECISION,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE mjesto
    ADD COLUMN IF NOT EXISTS citaonica_id INTEGER REFERENCES citaonica(id) ON DELETE RESTRICT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS mjesto_citaonica_id_idx
    ON mjesto (citaonica_id)
  `);

  await pool.query(`
    ALTER TABLE mjesto
    DROP CONSTRAINT IF EXISTS mjesto_broj_mjesta_key
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS citaonica_naziv_unique_idx
    ON citaonica (LOWER(naziv))
  `);

  const existingSeats = await pool.query(`
    SELECT
      COUNT(*)::INTEGER AS total,
      COALESCE(MAX(broj_mjesta), 0)::INTEGER AS max_broj
    FROM mjesto
  `);

  const totalSeats = existingSeats.rows[0]?.total || 0;

  if (totalSeats > 0) {
    const defaultCitaonica = await ensureDefaultCitaonica(totalSeats);

    await pool.query(
      `
      UPDATE mjesto
      SET citaonica_id = $1
      WHERE citaonica_id IS NULL
      `,
      [defaultCitaonica.id]
    );
  }

  await normalizeSeatNumbersPerRoom();

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS mjesto_citaonica_broj_mjesta_unique_idx
    ON mjesto (citaonica_id, broj_mjesta)
    WHERE citaonica_id IS NOT NULL
  `);

  await syncCitaonicaSeatCounts();
}

module.exports = {
  ensureCitaonicaSupport,
  syncCitaonicaSeatCounts,
};
