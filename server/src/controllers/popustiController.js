const crypto = require("crypto");
const pool = require("../config/db");

function generateApiKey() {
  return crypto.randomBytes(24).toString("hex");
}

const getPopustiData = async (req, res) => {
  try {
    const popusti = await pool.query(`
      SELECT
        p.*,
        pr.naziv AS partner_naziv,
        pr.logo_url,
        pr.website
      FROM popust p
      LEFT JOIN partner pr ON pr.id = p.partner_id
      WHERE p.aktivan = true
      AND p.status = 'approved'
      ORDER BY
        CASE WHEN p.valid_until IS NULL THEN 1 ELSE 0 END,
        p.valid_until ASC,
        p.created_at DESC
    `);

    const partneri = await pool.query(`
      SELECT id, naziv, logo_url, website
      FROM partner
      WHERE status = 'active'
      ORDER BY naziv ASC
    `);

    res.json({
      popusti: popusti.rows,
      partneri: partneri.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju popusta.",
      error: error.message,
    });
  }
};

const getModerationData = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        pr.naziv AS partner_naziv,
        pr.kontakt_email,
        pr.tip
      FROM popust p
      LEFT JOIN partner pr ON pr.id = p.partner_id
      ORDER BY p.submitted_at DESC NULLS LAST, p.created_at DESC
    `);

    res.json({ popusti: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju moderacije.",
      error: error.message,
    });
  }
};

const approvePopust = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE popust
      SET status = 'approved',
          aktivan = true,
          approved_at = NOW(),
          approved_by = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [req.user.id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Popust nije pronađen." });
    }

    res.json({
      message: "Popust je odobren.",
      popust: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri odobravanju popusta.",
      error: error.message,
    });
  }
};

const rejectPopust = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE popust
      SET status = 'rejected',
          aktivan = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Popust nije pronađen." });
    }

    res.json({
      message: "Popust je odbijen.",
      popust: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri odbijanju popusta.",
      error: error.message,
    });
  }
};

const createPartnerPortalSubmission = async (req, res) => {
  try {
    const {
      naziv,
      website,
      logo_url,
      kontakt_email,
      naslov,
      opis,
      kategorija,
      vrijednost,
      kod,
      valid_from,
      valid_until,
      lokacija,
      image_url,
    } = req.body;

    if (!naziv || !kontakt_email || !naslov || !opis || !kategorija) {
      return res.status(400).json({
        message: "Naziv ustanove, email, naslov, opis i kategorija su obavezni.",
      });
    }

    let partner = await pool.query(
      `SELECT * FROM partner WHERE LOWER(naziv) = LOWER($1) LIMIT 1`,
      [naziv]
    );

    let partnerId;

    if (partner.rows[0]) {
      partnerId = partner.rows[0].id;
    } else {
      const createdPartner = await pool.query(
        `
        INSERT INTO partner (
          naziv, logo_url, website, kontakt_email, tip, status, created_at
        )
        VALUES ($1, $2, $3, $4, 'portal', 'active', NOW())
        RETURNING *
        `,
        [naziv, logo_url || null, website || null, kontakt_email]
      );

      partnerId = createdPartner.rows[0].id;
    }

    const result = await pool.query(
      `
      INSERT INTO popust (
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
        source,
        status,
        image_url,
        submitted_at,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,'portal','pending',$10,NOW(),NOW(),NOW())
      RETURNING *
      `,
      [
        partnerId,
        naslov,
        opis,
        kategorija,
        vrijednost || null,
        kod || null,
        valid_from || null,
        valid_until || null,
        lokacija || null,
        image_url || null,
      ]
    );

    res.status(201).json({
      message: "Promocija je poslata na moderaciju.",
      popust: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri slanju promocije.",
      error: error.message,
    });
  }
};

const createApiPromotion = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ message: "API ključ je obavezan." });
    }

    const partner = await pool.query(
      `SELECT * FROM partner WHERE api_key = $1 AND status = 'active' LIMIT 1`,
      [apiKey]
    );

    if (!partner.rows[0]) {
      return res.status(403).json({ message: "Nevažeći API ključ." });
    }

    const {
      naslov,
      opis,
      kategorija,
      vrijednost,
      kod,
      valid_from,
      valid_until,
      lokacija,
      image_url,
    } = req.body;

    if (!naslov || !opis || !kategorija) {
      return res.status(400).json({
        message: "Naslov, opis i kategorija su obavezni.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO popust (
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
        source,
        status,
        image_url,
        submitted_at,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,'api','pending',$10,NOW(),NOW(),NOW())
      RETURNING *
      `,
      [
        partner.rows[0].id,
        naslov,
        opis,
        kategorija,
        vrijednost || null,
        kod || null,
        valid_from || null,
        valid_until || null,
        lokacija || null,
        image_url || null,
      ]
    );

    res.status(201).json({
      message: "API promocija je primljena i čeka odobrenje.",
      popust: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri API promociji.",
      error: error.message,
    });
  }
};

const getApiPartners = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, naziv, website, logo_url, kontakt_email, api_key, status, created_at
      FROM partner
      WHERE tip = 'api'
      ORDER BY created_at DESC
    `);

    res.json({ partneri: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju API partnera.",
      error: error.message,
    });
  }
};

const createApiPartner = async (req, res) => {
  try {
    const { naziv, website, logo_url, kontakt_email } = req.body;

    if (!naziv) {
      return res.status(400).json({ message: "Naziv partnera je obavezan." });
    }

    const apiKey = generateApiKey();

    const result = await pool.query(
      `
      INSERT INTO partner (
        naziv, website, logo_url, kontakt_email, tip, api_key, status, created_at
      )
      VALUES ($1,$2,$3,$4,'api',$5,'active',NOW())
      RETURNING *
      `,
      [naziv, website || null, logo_url || null, kontakt_email || null, apiKey]
    );

    res.status(201).json({
      message: "API partner je dodat.",
      partner: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri dodavanju API partnera.",
      error: error.message,
    });
  }
};

module.exports = {
  getPopustiData,
  getModerationData,
  approvePopust,
  rejectPopust,
  createPartnerPortalSubmission,
  createApiPromotion,
  createApiPartner,
  getApiPartners,
};