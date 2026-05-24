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

module.exports = { getMe };