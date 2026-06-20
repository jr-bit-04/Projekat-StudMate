const pool = require("../config/db");

const VALID_MONTHS = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];
const DOM_MONTHLY_PRICE = 30;

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

function getCurrentYear() {
  return new Date().getFullYear();
}

function normalizeSelectedMonths(months) {
  if (!Array.isArray(months) || months.length === 0) {
    return [];
  }

  const uniqueMonths = [...new Set(months.map((item) => String(item || "").trim()))];

  if (uniqueMonths.some((item) => !VALID_MONTHS.includes(item))) {
    return null;
  }

  return uniqueMonths;
}

function isPaidStatus(status = "") {
  return String(status).toLowerCase() === "paid";
}

function isInactiveStatus(status = "") {
  return String(status).toLowerCase() === "inactive";
}

function buildDueDate(year, month) {
  const monthIndex = VALID_MONTHS.indexOf(month);

  if (monthIndex === -1) {
    return null;
  }

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-10`;
}

async function ensureSameDorm(adminUser, userId) {
  const studentRes = await pool.query(
    `
    SELECT id, name, email, faculty, index_number, dorm,
           profile_image_path AS profile_image_url
    FROM users
    WHERE id = $1
    `,
    [userId]
  );
  const student = studentRes.rows[0];

  if (!student) {
    return { ok: false, status: 404, message: "Student nije pronađen." };
  }

  if (adminUser.admin_module === "all") {
    return { ok: true, student };
  }

  const adminRes = await pool.query(
    "SELECT dorm FROM users WHERE id = $1",
    [adminUser.id]
  );
  const adminDorm = adminRes.rows[0]?.dorm;

  if (!adminDorm || adminDorm === "-") {
    return {
      ok: false,
      status: 400,
      message: "Admin nema dodijeljen studentski dom.",
    };
  }

  if (student.dorm !== adminDorm) {
    return {
      ok: false,
      status: 403,
      message: "Student ne pripada tvom domu.",
    };
  }

  return { ok: true, student };
}

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

    const lastUpdatedRes = await pool.query(
      `
      SELECT
        GREATEST(
          (SELECT MAX(COALESCE(updated_at, created_at)) FROM dom_obaveza WHERE user_id = $1),
          (SELECT MAX(datum_vrijeme) FROM obavjestenje WHERE modul = 'dom'),
          (SELECT last_updated FROM module_last_update WHERE module = 'dom')
        ) AS last_updated
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

    await pool.query(`
      UPDATE module_last_update
      SET last_updated = NOW()
      WHERE module = 'dom'
    `);

    res.json({
      obligations: obligations.rows,
      obavjestenja: obavjestenja.rows,
      lastUpdated: lastUpdatedRes.rows[0]?.last_updated || null,
      monthlyPrice: DOM_MONTHLY_PRICE,
      currentYear: getCurrentYear(),
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
    const isGlobal = req.user.admin_module === "all";

    let result;

    if (isGlobal) {
      result = await pool.query(
        `
        SELECT id, name, email, faculty, index_number, dorm,
               profile_image_path AS profile_image_url
        FROM users
        WHERE role = 'student'
        AND (
          name ILIKE $1 OR
          email ILIKE $1 OR
          faculty ILIKE $1 OR
          index_number ILIKE $1
        )
        ORDER BY name ASC
        LIMIT 50
        `,
        [search]
      );
    } else {
      const adminResult = await pool.query(
        `SELECT dorm FROM users WHERE id = $1`,
        [req.user.id]
      );
      const adminDorm = adminResult.rows[0]?.dorm;

      if (!adminDorm || adminDorm === "-") {
        return res.status(400).json({
          message: "Admin nema dodijeljen studentski dom.",
        });
      }

      result = await pool.query(
        `
        SELECT id, name, email, faculty, index_number, dorm,
               profile_image_path AS profile_image_url
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
    }

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

    const check = await ensureSameDorm(req.user, userId);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

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
      student: check.student,
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

    if (!mjesec || !godina) {
      return res.status(400).json({
        message: "Mjesec i godina su obavezni.",
      });
    }

    if (!VALID_MONTHS.includes(mjesec)) {
      return res.status(400).json({
        message: "Nevažeći mjesec.",
      });
    }

    const check = await ensureSameDorm(req.user, userId);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

    const safeIznos = Math.max(0, Number(iznos) || 0);
    const safeUplaceno = Math.max(0, Number(uplaceno) || 0);

    let finalStatus;
    if (boravi_u_domu === false) {
      finalStatus = "inactive";
    } else if (safeIznos === 0) {
      finalStatus = "inactive";
    } else if (safeUplaceno >= safeIznos) {
      finalStatus = "paid";
    } else {
      finalStatus = "unpaid";
    }

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
        safeIznos,
        safeUplaceno,
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

const deleteStudentDomObligation = async (req, res) => {
  try {
    const { id } = req.params;

    const obligationRes = await pool.query(
      "SELECT user_id FROM dom_obaveza WHERE id = $1",
      [id]
    );
    const obligation = obligationRes.rows[0];

    if (!obligation) {
      return res.status(404).json({ message: "Obaveza nije pronađena." });
    }

    const check = await ensureSameDorm(req.user, obligation.user_id);
    if (!check.ok) {
      return res.status(check.status).json({ message: check.message });
    }

    await pool.query("DELETE FROM dom_obaveza WHERE id = $1", [id]);

    await pool.query(`
      UPDATE module_last_update
      SET last_updated = NOW()
      WHERE module = 'dom'
    `);

    res.json({ message: "Obaveza je obrisana." });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju obaveze.",
      error: error.message,
    });
  }
};

const purchaseDomObligations = async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Placanje doma je dostupno samo studentima.",
      });
    }

    const { months, cardNumber, cvv, expiryDate } = req.body;
    const selectedMonths = normalizeSelectedMonths(months);
    const normalizedCardNumber = String(cardNumber || "").replace(/\D/g, "");
    const normalizedCvv = String(cvv || "").replace(/\D/g, "");
    const currentYear = getCurrentYear();

    if (selectedMonths === null) {
      return res.status(400).json({
        message: "Odabrani mjeseci nijesu validni.",
      });
    }

    if (selectedMonths.length === 0) {
      return res.status(400).json({
        message: "Izaberi bar jedan mjesec za uplatu doma.",
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

    const userRes = await client.query(
      `
      SELECT dorm
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    const userDorm = userRes.rows[0]?.dorm;

    if (!userDorm || userDorm === "-") {
      return res.status(400).json({
        message: "Student nema dodijeljen studentski dom.",
      });
    }

    await client.query("BEGIN");
    await client.query("LOCK TABLE dom_obaveza IN EXCLUSIVE MODE");

    const existingRes = await client.query(
      `
      SELECT id, mjesec, godina, status, due_date
      FROM dom_obaveza
      WHERE user_id = $1
        AND godina = $2
        AND mjesec = ANY($3::text[])
      `,
      [req.user.id, currentYear, selectedMonths]
    );

    const existingByMonth = new Map(
      existingRes.rows.map((item) => [item.mjesec, item])
    );

    const alreadyPaidMonths = selectedMonths.filter((month) =>
      isPaidStatus(existingByMonth.get(month)?.status)
    );

    if (alreadyPaidMonths.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: `Ovi mjeseci su vec placeni: ${alreadyPaidMonths.join(", ")}.`,
        conflictingMonths: alreadyPaidMonths,
      });
    }

    const inactiveMonths = selectedMonths.filter((month) =>
      isInactiveStatus(existingByMonth.get(month)?.status)
    );

    if (inactiveMonths.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: `Za ove mjesece student ne boravi u domu: ${inactiveMonths.join(", ")}.`,
        conflictingMonths: inactiveMonths,
      });
    }

    for (const month of selectedMonths) {
      const existing = existingByMonth.get(month);
      const dueDate = existing?.due_date || buildDueDate(currentYear, month);

      if (existing?.id) {
        await client.query(
          `
          UPDATE dom_obaveza
          SET iznos = $1,
              uplaceno = $1,
              status = 'paid',
              due_date = COALESCE(due_date, $2),
              paid_at = NOW(),
              updated_at = NOW()
          WHERE id = $3
          `,
          [DOM_MONTHLY_PRICE, dueDate, existing.id]
        );
      } else {
        await client.query(
          `
          INSERT INTO dom_obaveza (
            user_id,
            mjesec,
            godina,
            iznos,
            uplaceno,
            status,
            due_date,
            paid_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $4, 'paid', $5, NOW(), NOW(), NOW())
          `,
          [req.user.id, month, currentYear, DOM_MONTHLY_PRICE, dueDate]
        );
      }
    }

    await client.query(`
      UPDATE module_last_update
      SET last_updated = NOW()
      WHERE module = 'dom'
    `);

    const obligations = await client.query(
      `
      SELECT id, user_id, mjesec, godina, iznos, uplaceno, status, due_date, paid_at, created_at, updated_at
      FROM dom_obaveza
      WHERE user_id = $1
      ORDER BY godina DESC, id ASC
      `,
      [req.user.id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Placanje doma je simulirano i obaveze su azurirane.",
      obligations: obligations.rows,
      paidMonths: selectedMonths,
      totalAmount: selectedMonths.length * DOM_MONTHLY_PRICE,
      monthlyPrice: DOM_MONTHLY_PRICE,
      currentYear,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({
      message: "Greska pri placanju doma.",
      error: error.message,
    });
  } finally {
    client.release();
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

    if (!naslov || !opis) {
      return res.status(400).json({
        message: "Naslov i opis su obavezni.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO obavjestenje (modul, naslov, opis, kategorija, priority, pinned, datum_vrijeme)
      VALUES ('dom', $1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [naslov, opis, kategorija || "Dom", priority || 1, pinned || false]
    );

    await pool.query(`
      UPDATE module_last_update
      SET last_updated = NOW()
      WHERE module = 'dom'
    `);

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

    if (!naslov || !opis) {
      return res.status(400).json({
        message: "Naslov i opis su obavezni.",
      });
    }

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

const deleteDomNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM obavjestenje WHERE id = $1 AND modul = 'dom' RETURNING id`,
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

module.exports = {
  getDomData,
  purchaseDomObligations,
  searchDomStudents,
  getStudentDomObligations,
  saveStudentDomObligation,
  deleteStudentDomObligation,
  getDomNotices,
  saveDomNotice,
  updateDomNotice,
  deleteDomNotice,
};
