const pool = require("../config/db");
const { getMenuMutationError } = require("../utils/menzaMenuRules");
const {
  notifyStudentsAboutDiscount,
} = require("../utils/discountNotifications");
const {
  notifyStudentsAboutOpportunity,
} = require("../utils/scholarshipNotifications");

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

    const validationError = getMenuMutationError({
      datum,
      tipObroka: tip_obroka,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (!String(naslov || "").trim()) {
      return res.status(400).json({ message: "Naziv obroka je obavezan." });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM meni
      WHERE datum = $1::date AND tip_obroka = $2
      LIMIT 1
      `,
      [datum, tip_obroka]
    );

    if (existing.rows[0]) {
      return res.status(409).json({
        message: "Meni za izabrani datum i obrok već postoji.",
      });
    }

    const dorucakStavke =
      tip_obroka === "dorucak"
        ? [{ naziv: naslov.trim(), bonovi: 0, cijena: "" }]
        : [];
    const glavnaJela = tip_obroka === "dorucak" ? [] : [naslov.trim()];
    const dodatno =
      tip_obroka !== "dorucak" && String(opis || "").trim()
        ? [opis.trim()]
        : [];

    const result = await pool.query(
      `INSERT INTO meni (
         datum, tip_obroka, dorucak_stavke,
         glavna_jela, prilozi, salate, dodatno, aktivan
       )
       VALUES ($1, $2, $3::jsonb, $4::jsonb, '[]'::jsonb, '[]'::jsonb, $5::jsonb, $6)
       RETURNING *`,
      [
        datum,
        tip_obroka,
        JSON.stringify(dorucakStavke),
        JSON.stringify(glavnaJela),
        JSON.stringify(dodatno),
        aktivan ?? true,
      ]
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

    res.status(201).json({ message: "Konkurs uspjesno dodat.", scholarship: result.rows[0] });

    try {
      await notifyStudentsAboutOpportunity(result.rows[0]);
    } catch (pushError) {
      console.error(
        "Greska pri slanju push obavjestenja za novi stipendijski konkurs ili kredit:",
        pushError.message
      );
    }
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
       (
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
         status,
         approved_at,
         approved_by,
         created_at,
         updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved',NOW(),$11,NOW(),NOW())
       RETURNING *`,
      [
        partner_id,
        naslov,
        opis,
        kategorija,
        vrijednost,
        kod,
        valid_from,
        valid_until,
        lokacija,
        aktivan ?? true,
        req.user.id,
      ]
    );

    res.status(201).json({ message: "Popust dodat.", discount: result.rows[0] });

    try {
      await notifyStudentsAboutDiscount(result.rows[0]);
    } catch (pushError) {
      console.error(
        "Greska pri slanju push obavjestenja za novi admin popust:",
        pushError.message
      );
    }
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
