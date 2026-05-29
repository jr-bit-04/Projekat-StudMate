require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seedGlobalAdmin() {
  const name = process.env.ADMIN_NAME || "Globalni Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@studmate.me").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `
      UPDATE users
      SET role = 'admin',
          admin_module = 'all',
          password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, existing.rows[0].id]
    );

    console.log(`Postojeći nalog (${email}) je unaprijeđen u globalnog admina.`);
  } else {
    await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, admin_module, dorm)
      VALUES ($1, $2, $3, 'admin', 'all', '-')
      `,
      [name, email, passwordHash]
    );

    console.log(`Globalni admin je kreiran: ${email}`);
  }

  console.log(`Lozinka: ${password}`);
}

seedGlobalAdmin()
  .catch((error) => {
    console.error("Greška pri kreiranju globalnog admina:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
