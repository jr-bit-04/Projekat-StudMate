const pool = require("../config/db");

const getStipendije = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM stipendija
      WHERE aktivan = true
      AND (rok IS NULL OR rok >= CURRENT_DATE)
      ORDER BY rok ASC, created_at DESC
    `);

    res.json({
      konkursi: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju konkursa.",
      error: error.message,
    });
  }
};

const getAdminStipendije = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM stipendija
      ORDER BY created_at DESC
    `);

    res.json({
      konkursi: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju admin konkursa.",
      error: error.message,
    });
  }
};

const createStipendija = async (req, res) => {
  try {
    const {
      naslov,
      institucija,
      tip,
      opis,
      iznos,
      rok,
      link,
      aktivan,
    } = req.body;

    if (!naslov || !institucija || !tip || !opis || !rok) {
      return res.status(400).json({
        message: "Sva obavezna polja moraju biti popunjena.",
      });
    }

    if (String(rok).slice(0, 10) < new Date().toLocaleDateString("en-CA")) {
      return res.status(400).json({
        message: "Rok ne može biti u prošlosti.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO stipendija (
        naslov,
        institucija,
        tip,
        opis,
        iznos,
        rok,
        link,
        aktivan,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *
      `,
      [
        naslov,
        institucija,
        tip,
        opis,
        iznos || null,
        rok,
        link || null,
        aktivan ?? true,
      ]
    );

    res.status(201).json({
      message: "Konkurs uspješno dodat.",
      konkurs: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri dodavanju konkursa.",
      error: error.message,
    });
  }
};

const updateStipendija = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      naslov,
      institucija,
      tip,
      opis,
      iznos,
      rok,
      link,
      aktivan,
    } = req.body;
    
    if (!naslov || !institucija || !tip || !opis || !rok) {
      return res.status(400).json({
        message: "Sva obavezna polja moraju biti popunjena.",
      });
    }


    const result = await pool.query(
      `
      UPDATE stipendija
      SET naslov = $1,
          institucija = $2,
          tip = $3,
          opis = $4,
          iznos = $5,
          rok = $6,
          link = $7,
          aktivan = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [
        naslov,
        institucija,
        tip,
        opis,
        iznos || null,
        rok,
        link || null,
        aktivan,
        id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "Konkurs nije pronađen.",
      });
    }

    res.json({
      message: "Konkurs uspješno izmijenjen.",
      konkurs: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri izmjeni konkursa.",
      error: error.message,
    });
  }
};

const deleteStipendija = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM stipendija
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "Konkurs nije pronađen.",
      });
    }

    res.json({
      message: "Konkurs obrisan.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju konkursa.",
      error: error.message,
    });
  }
};

module.exports = {
  getStipendije,
  getAdminStipendije,
  createStipendija,
  updateStipendija,
  deleteStipendija,
};