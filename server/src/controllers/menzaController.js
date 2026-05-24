const pool = require("../config/db");

const getMenzaData = async (req, res) => {
  try {
    const weekStart = req.query.od || new Date().toISOString().slice(0, 10);

    const meni = await pool.query(
      `
      SELECT id, datum, tip_obroka, aktivan, created_at,
             dorucak_stavke, glavna_jela, prilozi, salate, dodatno
      FROM meni
      WHERE datum BETWEEN $1::date AND ($1::date + INTERVAL '6 days')::date
      AND aktivan = true
      ORDER BY datum,
      CASE tip_obroka
        WHEN 'dorucak' THEN 1
        WHEN 'rucak' THEN 2
        WHEN 'vecera' THEN 3
        ELSE 4
      END
      `,
      [weekStart]
    );

    const bonovi = await pool.query(
      `
      SELECT dorucak, rucak, vecera, updated_at
      FROM menza_bonovi
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    const obavjestenja = await pool.query(
      `
      SELECT id, naslov, opis, kategorija, datum_vrijeme
      FROM obavjestenje
      WHERE modul = 'menza'
      ORDER BY datum_vrijeme DESC
      LIMIT 5
      `
    );

    res.json({
      meni: meni.rows,
      bonovi: bonovi.rows[0] || {
        dorucak: 0,
        rucak: 0,
        vecera: 0,
        updated_at: null,
      },
      obavjestenja: obavjestenja.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju menze.",
      error: error.message,
    });
  }
};

const getAdminMenzaMenuByDate = async (req, res) => {
  try {
    const datum = req.query.datum || new Date().toISOString().slice(0, 10);

    const result = await pool.query(
      `
      SELECT id, datum, tip_obroka, aktivan, created_at,
             dorucak_stavke, glavna_jela, prilozi, salate, dodatno
      FROM meni
      WHERE datum = $1
      ORDER BY
      CASE tip_obroka
        WHEN 'dorucak' THEN 1
        WHEN 'rucak' THEN 2
        WHEN 'vecera' THEN 3
        ELSE 4
      END
      `,
      [datum]
    );

    res.json({ meni: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju admin menija.",
      error: error.message,
    });
  }
};

const saveMenzaMenu = async (req, res) => {
  try {
    const {
      datum,
      tip_obroka,
      dorucak_stavke,
      glavna_jela,
      prilozi,
      salate,
      dodatno,
      aktivan,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO meni (
        datum, tip_obroka, dorucak_stavke,
        glavna_jela, prilozi, salate, dodatno, aktivan
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8)
      RETURNING *
      `,
      [
        datum,
        tip_obroka,
        JSON.stringify(dorucak_stavke || []),
        JSON.stringify(glavna_jela || []),
        JSON.stringify(prilozi || []),
        JSON.stringify(salate || []),
        JSON.stringify(dodatno || []),
        aktivan ?? true,
      ]
    );

    res.status(201).json({
      message: "Meni je uspješno sačuvan.",
      meni: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri čuvanju menija.",
      error: error.message,
    });
  }
};

const updateMenzaMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      datum,
      tip_obroka,
      dorucak_stavke,
      glavna_jela,
      prilozi,
      salate,
      dodatno,
      aktivan,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE meni
      SET datum = $1,
          tip_obroka = $2,
          dorucak_stavke = $3::jsonb,
          glavna_jela = $4::jsonb,
          prilozi = $5::jsonb,
          salate = $6::jsonb,
          dodatno = $7::jsonb,
          aktivan = $8
      WHERE id = $9
      RETURNING *
      `,
      [
        datum,
        tip_obroka,
        JSON.stringify(dorucak_stavke || []),
        JSON.stringify(glavna_jela || []),
        JSON.stringify(prilozi || []),
        JSON.stringify(salate || []),
        JSON.stringify(dodatno || []),
        aktivan ?? true,
        id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Meni nije pronađen." });
    }

    res.json({
      message: "Meni je uspješno izmijenjen.",
      meni: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri izmjeni menija.",
      error: error.message,
    });
  }
};

const deleteMenzaMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM meni WHERE id = $1 RETURNING id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Meni nije pronađen." });
    }

    res.json({ message: "Meni je obrisan." });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju menija.",
      error: error.message,
    });
  }
};

const getMenzaNotices = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, naslov, opis, kategorija, priority, pinned, datum_vrijeme
      FROM obavjestenje
      WHERE modul = 'menza'
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

const saveMenzaNotice = async (req, res) => {
  try {
    const { naslov, opis, kategorija, priority, pinned } = req.body;

    const result = await pool.query(
      `
      INSERT INTO obavjestenje (
        modul, naslov, opis, kategorija, priority, pinned, datum_vrijeme
      )
      VALUES ('menza', $1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [naslov, opis, kategorija || "Menza", priority || 1, pinned || false]
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

const updateMenzaNotice = async (req, res) => {
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
      WHERE id = $6 AND modul = 'menza'
      RETURNING *
      `,
      [naslov, opis, kategorija || "Menza", priority || 1, pinned || false, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Obavještenje nije pronađeno." });
    }

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

const deleteMenzaNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM obavjestenje WHERE id = $1 AND modul = 'menza' RETURNING id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Obavještenje nije pronađeno." });
    }

    res.json({ message: "Obavještenje je obrisano." });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju obavještenja.",
      error: error.message,
    });
  }
};
const searchStudentsForMenza = async (req, res) => {
  try {
    const search = `%${req.query.search || ""}%`;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.faculty,
        u.index_number,
        u.dorm,
        COALESCE(b.dorucak, 0) AS dorucak,
        COALESCE(b.rucak, 0) AS rucak,
        COALESCE(b.vecera, 0) AS vecera
      FROM users u
      LEFT JOIN menza_bonovi b ON b.user_id = u.id
      WHERE u.role = 'student'
      AND (
        u.name ILIKE $1 OR
        u.email ILIKE $1 OR
        u.faculty ILIKE $1 OR
        u.index_number ILIKE $1
      )
      ORDER BY u.name ASC
      LIMIT 30
      `,
      [search]
    );

    res.json({ students: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri pretrazi studenata.",
      error: error.message,
    });
  }
};

const updateStudentBonovi = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dorucak, rucak, vecera } = req.body;

    const result = await pool.query(
      `
      INSERT INTO menza_bonovi (user_id, dorucak, rucak, vecera, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        dorucak = EXCLUDED.dorucak,
        rucak = EXCLUDED.rucak,
        vecera = EXCLUDED.vecera,
        updated_at = NOW()
      RETURNING *
      `,
      [userId, dorucak || 0, rucak || 0, vecera || 0]
    );

    res.json({
      message: "Bonovi su uspješno ažurirani.",
      bonovi: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri ažuriranju bonova.",
      error: error.message,
    });
  }
};

module.exports = {
  getMenzaData,
  getAdminMenzaMenuByDate,
  saveMenzaMenu,
  updateMenzaMenu,
  deleteMenzaMenu,
  getMenzaNotices,
  saveMenzaNotice,
  updateMenzaNotice,
  deleteMenzaNotice,
  searchStudentsForMenza,
  updateStudentBonovi,
};