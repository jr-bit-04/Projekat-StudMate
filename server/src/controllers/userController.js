const pool = require("../config/db");

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, dorm, role, admin_module, index_number, faculty, created_at, updated_at, last_login_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju profila.",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const search = `%${req.query.search || ""}%`;

    const result = await pool.query(
      `
      SELECT id, name, email, role, admin_module, dorm, faculty, index_number,
             created_at, last_login_at
      FROM users
      WHERE name ILIKE $1
         OR email ILIKE $1
         OR COALESCE(faculty, '') ILIKE $1
         OR COALESCE(index_number, '') ILIKE $1
      ORDER BY (role = 'admin') DESC, name ASC
      `,
      [search]
    );

    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju korisnika.",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, admin_module, dorm, faculty, index_number } =
      req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Ime i email su obavezni." });
    }

    const safeRole = role === "admin" ? "admin" : "student";
    const safeModule = safeRole === "admin" ? admin_module || null : null;

    if (
      Number(id) === req.user.id &&
      (safeRole !== "admin" || safeModule !== "all")
    ) {
      return res.status(400).json({
        message: "Ne možeš sebi oduzeti globalna admin prava.",
      });
    }

    const emailTaken = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2",
      [email, id]
    );

    if (emailTaken.rows.length > 0) {
      return res.status(409).json({
        message: "Drugi korisnik već koristi ovaj email.",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          role = $3,
          admin_module = $4,
          dorm = $5,
          faculty = $6,
          index_number = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING id, name, email, role, admin_module, dorm, faculty, index_number
      `,
      [
        name,
        email,
        safeRole,
        safeModule,
        dorm || "-",
        faculty || null,
        index_number || null,
        id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({ message: "Korisnik je ažuriran.", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri izmjeni korisnika.",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).json({
      message: "Ne možeš obrisati sopstveni nalog.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE obavjestenje SET created_by = NULL WHERE created_by = $1",
      [id]
    );
    const result = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );
    await client.query("COMMIT");

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({ message: "Korisnik je obrisan." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({
      message: "Greška pri brisanju korisnika.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = { getMe, getAllUsers, updateUser, deleteUser };