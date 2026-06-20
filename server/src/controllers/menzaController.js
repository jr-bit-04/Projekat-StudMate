const pool = require("../config/db");
const {
  getLocalNowParts,
  getMenuMutationError,
  isValidDateString,
} = require("../utils/menzaMenuRules");

const MENZA_MONTHLY_LIMIT = 500;
const LOCAL_TIMEZONE = "Europe/Podgorica";

const EMPTY_BONOVI = {
  dorucak: 0,
  rucak: 0,
  vecera: 0,
  updated_at: null,
};

async function getBonoviByUserId(userId) {
  const bonovi = await pool.query(
    `
    SELECT dorucak, rucak, vecera, updated_at
    FROM menza_bonovi
    WHERE user_id = $1
    `,
    [userId]
  );

  return bonovi.rows[0] || EMPTY_BONOVI;
}

function parseVoucherCount(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function isValidExpiryDate(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(String(value || "").trim());

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);

  if (month < 1 || month > 12) {
    return false;
  }

  const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);

  return Number.isFinite(expiryDate.getTime()) && expiryDate >= new Date();
}

async function getMonthlyVoucherAvailability(queryable = pool) {
  const result = await queryable.query(
    `
    SELECT
      COALESCE(SUM(dorucak), 0)::int AS dorucak,
      COALESCE(SUM(rucak), 0)::int AS rucak,
      COALESCE(SUM(vecera), 0)::int AS vecera,
      TO_CHAR(
        DATE_TRUNC('month', NOW() AT TIME ZONE $1),
        'YYYY-MM'
      ) AS mjesec
    FROM menza_bonovi
    `,
    [LOCAL_TIMEZONE]
  );

  const sold = result.rows[0] || {
    dorucak: 0,
    rucak: 0,
    vecera: 0,
    mjesec: null,
  };

  return {
    mjesec: sold.mjesec,
    limit_po_obroku: MENZA_MONTHLY_LIMIT,
    prodato: {
      dorucak: Number(sold.dorucak || 0),
      rucak: Number(sold.rucak || 0),
      vecera: Number(sold.vecera || 0),
    },
    preostalo: {
      dorucak: Math.max(MENZA_MONTHLY_LIMIT - Number(sold.dorucak || 0), 0),
      rucak: Math.max(MENZA_MONTHLY_LIMIT - Number(sold.rucak || 0), 0),
      vecera: Math.max(MENZA_MONTHLY_LIMIT - Number(sold.vecera || 0), 0),
    },
  };
}

function buildAllowedPurchase(counts, availability) {
  return {
    dorucak: Math.min(counts.dorucak, availability.preostalo.dorucak),
    rucak: Math.min(counts.rucak, availability.preostalo.rucak),
    vecera: Math.min(counts.vecera, availability.preostalo.vecera),
  };
}

function countsMatch(first, second) {
  return (
    first.dorucak === second.dorucak &&
    first.rucak === second.rucak &&
    first.vecera === second.vecera
  );
}

function sumCounts(counts) {
  return counts.dorucak + counts.rucak + counts.vecera;
}

function buildPurchaseSuggestionMessage(allowedPurchase) {
  if (sumCounts(allowedPurchase) === 0) {
    return "Nema vise bonova na raspolaganju.";
  }

  const parts = [];

  if (allowedPurchase.dorucak > 0) {
    parts.push(`dorucak ${allowedPurchase.dorucak}`);
  }

  if (allowedPurchase.rucak > 0) {
    parts.push(`rucak ${allowedPurchase.rucak}`);
  }

  if (allowedPurchase.vecera > 0) {
    parts.push(`vecera ${allowedPurchase.vecera}`);
  }

  return `Trenutno mozes kupiti najvise: ${parts.join(", ")}.`;
}

const getMenzaData = async (req, res) => {
  try {
    const weekStart = req.query.od || getLocalNowParts().date;

    const meni = await pool.query(
      `
      SELECT id, datum::text AS datum, tip_obroka, aktivan, created_at,
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
      bonovi: await getBonoviByUserId(req.user.id),
      obavjestenja: obavjestenja.rows,
      prodaja: await getMonthlyVoucherAvailability(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju menze.",
      error: error.message,
    });
  }
};

const getMyBonovi = async (req, res) => {
  try {
    res.json({
      bonovi: await getBonoviByUserId(req.user.id),
      prodaja: await getMonthlyVoucherAvailability(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greska pri ucitavanju bonova.",
      error: error.message,
    });
  }
};

const getAdminMenzaMenuByDate = async (req, res) => {
  try {
    const datum = req.query.datum;

    if (!isValidDateString(datum)) {
      return res.status(400).json({
        message: "Datum mora biti u formatu YYYY-MM-DD.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, datum::text AS datum, tip_obroka, aktivan, created_at,
             dorucak_stavke, glavna_jela, prilozi, salate, dodatno
      FROM meni
      WHERE datum = $1::date
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

    const validationError = getMenuMutationError({
      datum,
      tipObroka: tip_obroka,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
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
        message:
          "Meni za izabrani datum i obrok već postoji. Osvježi stranicu i izmijeni postojeći meni.",
      });
    }

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

    const existing = await pool.query(
      `SELECT id, datum::text AS datum, tip_obroka FROM meni WHERE id = $1`,
      [id]
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ message: "Meni nije pronađen." });
    }

    if (
      existing.rows[0].datum !== datum ||
      existing.rows[0].tip_obroka !== tip_obroka
    ) {
      return res.status(409).json({
        message:
          "Izabrani meni pripada drugom datumu ili obroku. Osvježi stranicu i pokušaj ponovo.",
      });
    }

    const validationError = getMenuMutationError({
      datum,
      tipObroka: tip_obroka,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await pool.query(
      `
      UPDATE meni
      SET dorucak_stavke = $1::jsonb,
          glavna_jela = $2::jsonb,
          prilozi = $3::jsonb,
          salate = $4::jsonb,
          dodatno = $5::jsonb,
          aktivan = $6
      WHERE id = $7
      RETURNING *
      `,
      [
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
        u.profile_image_path AS profile_image_url,
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

const purchaseBonovi = async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Kupovina bonova je dostupna samo studentima.",
      });
    }

    const { dorucak, rucak, vecera, cardNumber, cvv, expiryDate } = req.body;

    const dorucakCount = parseVoucherCount(dorucak);
    const rucakCount = parseVoucherCount(rucak);
    const veceraCount = parseVoucherCount(vecera);
    const normalizedCardNumber = String(cardNumber || "").replace(/\D/g, "");
    const normalizedCvv = String(cvv || "").replace(/\D/g, "");

    if (
      dorucakCount === null ||
      rucakCount === null ||
      veceraCount === null
    ) {
      return res.status(400).json({
        message: "Broj bonova mora biti cio broj jednak ili veci od nule.",
      });
    }

    const requestedCounts = {
      dorucak: dorucakCount,
      rucak: rucakCount,
      vecera: veceraCount,
    };

    if (sumCounts(requestedCounts) === 0) {
      return res.status(400).json({
        message: "Unesi broj bonova za bar jedan obrok.",
      });
    }

    if (normalizedCardNumber.length !== 12) {
      return res.status(400).json({
        message: "Broj kartice mora imati tacno 12 cifara.",
      });
    }

    if (normalizedCvv.length !== 3) {
      return res.status(400).json({
        message: "CVV mora imati tacno 3 cifre.",
      });
    }

    if (!isValidExpiryDate(expiryDate)) {
      return res.status(400).json({
        message: "Datum isteka mora biti u formatu MM/YY i kartica ne smije biti istekla.",
      });
    }

    await client.query("BEGIN");
    await client.query("LOCK TABLE menza_bonovi IN EXCLUSIVE MODE");

    const availability = await getMonthlyVoucherAvailability(client);
    const allowedPurchase = buildAllowedPurchase(requestedCounts, availability);

    if (!countsMatch(requestedCounts, allowedPurchase)) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: buildPurchaseSuggestionMessage(allowedPurchase),
        allowedPurchase,
        prodaja: availability,
      });
    }

    await client.query(
      `
      INSERT INTO menza_bonovi_kupovine (
        user_id,
        dorucak,
        rucak,
        vecera,
        purchased_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [req.user.id, dorucakCount, rucakCount, veceraCount]
    );

    const result = await client.query(
      `
      INSERT INTO menza_bonovi (user_id, dorucak, rucak, vecera, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        dorucak = menza_bonovi.dorucak + EXCLUDED.dorucak,
        rucak = menza_bonovi.rucak + EXCLUDED.rucak,
        vecera = menza_bonovi.vecera + EXCLUDED.vecera,
        updated_at = NOW()
      RETURNING *
      `,
      [req.user.id, dorucakCount, rucakCount, veceraCount]
    );

    const updatedAvailability = await getMonthlyVoucherAvailability(client);
    await client.query("COMMIT");

    res.status(201).json({
      message: "Kupovina bonova je simulirana i stanje je azurirano.",
      bonovi: result.rows[0] || EMPTY_BONOVI,
      prodaja: updatedAvailability,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({
      message: "Greska pri kupovini bonova.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getMenzaData,
  getMyBonovi,
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
  purchaseBonovi,
};
