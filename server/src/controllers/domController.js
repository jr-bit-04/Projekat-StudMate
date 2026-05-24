const pool = require("../config/db");

const getDomData = async (req, res) => {
  try {
    const obligations = await pool.query(
      `
      SELECT id, user_id, mjesec, godina, iznos, uplaceno, status, due_date, paid_at, created_at, updated_at
      FROM dom_obaveza
      WHERE user_id = $1
      ORDER BY godina DESC, id ASC
      `,
      [req.user.id]
    );

    const obavjestenja = await pool.query(
      `
      SELECT id, naslov, opis, kategorija, datum_vrijeme
      FROM obavjestenje
      WHERE modul = 'dom'
      ORDER BY datum_vrijeme DESC
      LIMIT 5
      `
    );

    res.json({
      obligations: obligations.rows,
      obavjestenja: obavjestenja.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju doma.",
      error: error.message,
    });
  }
};

const searchDomStudents = async (req, res) => {
  try {
    const search = `%${req.query.search || ""}%`;

    const adminResult = await pool.query(
      `SELECT dorm FROM users WHERE id = $1`,
      [req.user.id]
    );

    const adminDorm = adminResult.rows[0]?.dorm;

    if (!adminDorm) {
      return res.status(400).json({
        message: "Admin nema dodijeljen studentski dom.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, faculty, index_number, dorm
      FROM users
      WHERE role = 'student'
      AND dorm = $1
      AND (
        name ILIKE $2 OR
        email ILIKE $2 OR
        faculty ILIKE $2 OR
        index_number ILIKE $2
      )
      ORDER BY name ASC
      LIMIT 50
      `,
      [adminDorm, search]
    );

    res.json({ students: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri pretrazi studenata.",
      error: error.message,
    });
  }
};

const getStudentDomObligations = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await pool.query(
      `
      SELECT id, name, email, faculty, index_number, dorm
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    const obligations = await pool.query(
      `
      SELECT id, user_id, mjesec, godina, iznos, uplaceno, status, due_date, paid_at, created_at, updated_at
      FROM dom_obaveza
      WHERE user_id = $1
      ORDER BY godina DESC, id ASC
      `,
      [userId]
    );

    res.json({
      student: student.rows[0],
      obligations: obligations.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju obaveza studenta.",
      error: error.message,
    });
  }
};

const saveStudentDomObligation = async (req, res) => {
  try {
    const { userId } = req.params;

    const {
      mjesec,
      godina,
      iznos,
      uplaceno,
      due_date,
      paid_at,
      boravi_u_domu,
    } = req.body;

    const finalStatus =
      boravi_u_domu === false
        ? "inactive"
        : Number(uplaceno || 0) >= Number(iznos || 0)
        ? "paid"
        : "unpaid";

    const result = await pool.query(
      `
      INSERT INTO dom_obaveza (
        user_id, mjesec, godina, iznos, uplaceno, status, due_date, paid_at, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (user_id, mjesec, godina)
      DO UPDATE SET
        iznos = EXCLUDED.iznos,
        uplaceno = EXCLUDED.uplaceno,
        status = EXCLUDED.status,
        due_date = EXCLUDED.due_date,
        paid_at = EXCLUDED.paid_at,
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId,
        mjesec,
        godina,
        iznos || 0,
        uplaceno || 0,
        finalStatus,
        due_date || null,
        paid_at || null,
      ]
    );

    res.json({
      message: "Obaveza je uspješno sačuvana.",
      obligation: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri čuvanju obaveze.",
      error: error.message,
    });
  }
};

const getDomNotices = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, naslov, opis, kategorija, priority, pinned, datum_vrijeme
      FROM obavjestenje
      WHERE modul = 'dom'
      ORDER BY datum_vrijeme DESC
      `
    );

    res.json({ obavjestenja: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju obavještenja.",
      error: error.message,
    });
  }
};

const saveDomNotice = async (req, res) => {
  try {
    const { naslov, opis, kategorija, priority, pinned } = req.body;

    const result = await pool.query(
      `
      INSERT INTO obavjestenje (modul, naslov, opis, kategorija, priority, pinned, datum_vrijeme)
      VALUES ('dom', $1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [naslov, opis, kategorija || "Dom", priority || 1, pinned || false]
    );

    res.status(201).json({
      message: "Obavještenje je uspješno dodato.",
      obavjestenje: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri čuvanju obavještenja.",
      error: error.message,
    });
  }
};

const updateDomNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { naslov, opis, kategorija, priority, pinned } = req.body;

    const result = await pool.query(
      `
      UPDATE obavjestenje
      SET naslov = $1,
          opis = $2,
          kategorija = $3,
          priority = $4,
          pinned = $5,
          datum_vrijeme = NOW()
      WHERE id = $6 AND modul = 'dom'
      RETURNING *
      `,
      [naslov, opis, kategorija || "Dom", priority || 1, pinned || false, id]
    );

    res.json({
      message: "Obavještenje je izmijenjeno.",
      obavjestenje: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri izmjeni obavještenja.",
      error: error.message,
    });
  }
};

const deleteDomNotice = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM obavjestenje WHERE id = $1 AND modul = 'dom'`,
      [id]
    );

    res.json({ message: "Obavještenje je obrisano." });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju obavještenja.",
      error: error.message,
    });
  }
};

module.exports = {
  getDomData,
  searchDomStudents,
  getStudentDomObligations,
  saveStudentDomObligation,
  getDomNotices,
  saveDomNotice,
  updateDomNotice,
  deleteDomNotice,
};