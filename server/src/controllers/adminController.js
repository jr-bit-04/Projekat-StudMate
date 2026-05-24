const pool = require("../config/db");

const createAnnouncement = async (req, res) => {
  try {
    const { modul, naslov, opis, kategorija, priority, pinned } = req.body;

    const result = await pool.query(
      `INSERT INTO obavjestenje 
       (modul, naslov, opis, kategorija, priority, pinned, datum_vrijeme)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [modul, naslov, opis, kategorija, priority || 1, pinned || false]
    );

    res.status(201).json({ message: "Obavještenje dodato.", announcement: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Greška pri dodavanju obavještenja.", error: error.message });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const { datum, tip_obroka, naslov, opis, aktivan } = req.body;

    const result = await pool.query(
      `INSERT INTO meni (datum, tip_obroka, naslov, opis, aktivan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [datum, tip_obroka, naslov, opis, aktivan ?? true]
    );

    res.status(201).json({ message: "Meni dodat.", menu: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Greška pri dodavanju menija.", error: error.message });
  }
};

const createScholarship = async (req, res) => {
  try {
    const { naslov, institucija, tip, opis, iznos, rok, link, aktivan } = req.body;

    const result = await pool.query(
      `INSERT INTO stipendija 
       (naslov, institucija, tip, opis, iznos, rok, link, aktivan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [naslov, institucija, tip, opis, iznos, rok, link, aktivan ?? true]
    );

    res.status(201).json({ message: "Stipendija dodata.", scholarship: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Greška pri dodavanju stipendije.", error: error.message });
  }
};

const createDiscount = async (req, res) => {
  try {
    const {
      partner_id,
      naslov,
      opis,
      kategorija,
      vrijednost,
      kod,
      valid_from,
      valid_until,
      lokacija,
      aktivan,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO popust 
       (partner_id, naslov, opis, kategorija, vrijednost, kod, valid_from, valid_until, lokacija, aktivan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [partner_id, naslov, opis, kategorija, vrijednost, kod, valid_from, valid_until, lokacija, aktivan ?? true]
    );

    res.status(201).json({ message: "Popust dodat.", discount: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Greška pri dodavanju popusta.", error: error.message });
  }
};

module.exports = {
  createAnnouncement,
  createMenuItem,
  createScholarship,
  createDiscount,
};