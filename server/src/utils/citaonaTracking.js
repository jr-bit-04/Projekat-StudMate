const pool = require("../config/db");

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const CITAONA_LOCATION = {
  address: "2 Cetinjski Put, Podgorica 81000, Crna Gora",
  latitude: 42.44306,
  longitude: 19.24028,
  radiusMeters: parsePositiveInt(process.env.CITAONA_RADIUS_METERS, 120),
  graceMinutes: parsePositiveInt(process.env.CITAONA_GRACE_MINUTES, 60),
};

async function ensureCitaonaTrackingSupport() {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS location_tracking_consent BOOLEAN NOT NULL DEFAULT false
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS location_tracking_consent_updated_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN NOT NULL DEFAULT false
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS outside_since TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS last_latitude DOUBLE PRECISION
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS last_longitude DOUBLE PRECISION
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS last_distance_meters INTEGER
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS auto_cancelled_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS outside_warning_sent_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE rezervacija
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rezervacija_lokacija_log (
      id BIGSERIAL PRIMARY KEY,
      rezervacija_id INTEGER NOT NULL REFERENCES rezervacija(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      distance_meters INTEGER NOT NULL,
      is_within_radius BOOLEAN NOT NULL,
      accuracy_meters DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS rezervacija_lokacija_log_rezervacija_created_at_idx
    ON rezervacija_lokacija_log (rezervacija_id, created_at DESC)
  `);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(from, to) {
  const earthRadius = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

module.exports = {
  CITAONA_LOCATION,
  calculateDistanceMeters,
  ensureCitaonaTrackingSupport,
};
