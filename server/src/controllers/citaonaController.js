const pool = require("../config/db");

const durations = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function isWorkingTime(dateValue, timeFrom, timeTo) {
  const date = new Date(dateValue);
  const day = date.getDay();

  if (day === 0) return false;

  const from = timeToMinutes(timeFrom);
  const to = timeToMinutes(timeTo);

  if (day === 6) {
    return from >= 420 && to <= 900;
  }

  return from >= 420 && to <= 1260;
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function addMinutesToTime(time, minutesToAdd) {
  const total = timeToMinutes(time) + minutesToAdd;

  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isTodayOrTomorrow(dateValue) {
  const selected = new Date(dateValue);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return selected.getTime() === today.getTime() || selected.getTime() === tomorrow.getTime();
}

const getCitaonaData = async (req, res) => {
  try {
    const datum = req.query.datum || new Date().toISOString().slice(0, 10);
    const vrijemeOd = req.query.vrijeme_od || "07:00";
    const trajanje = Number(req.query.trajanje || 60);
    const vrijemeDo = addMinutesToTime(vrijemeOd, trajanje);

    if (!durations.includes(trajanje)) {
      return res.status(400).json({ message: "Nevažeće trajanje rezervacije." });
    }

    const mjesta = await pool.query(
      `
      SELECT id, broj_mjesta, status
      FROM mjesto
      ORDER BY broj_mjesta ASC
      `
    );

    const zauzeta = await pool.query(
      `
      SELECT mjesto_id
      FROM rezervacija
      WHERE datum = $1
      AND status IN ('pending', 'active')
      AND vrijeme_od < $3
      AND vrijeme_do > $2
      `,
      [datum, vrijemeOd, vrijemeDo]
    );

    const mojeRezervacije = await pool.query(
      `
      SELECT 
        r.id,
        r.kod,
        r.datum,
        r.vrijeme_od,
        r.vrijeme_do,
        r.status,
        r.created_at,
        r.checked_in_at,
        r.expires_at,
        m.broj_mjesta
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      WHERE r.user_id = $1
      ORDER BY r.datum DESC, r.vrijeme_od DESC
      `,
      [req.user.id]
    );

    const zauzetaIds = zauzeta.rows.map((item) => item.mjesto_id);

    const mappedMjesta = mjesta.rows.map((mjesto) => ({
      ...mjesto,
      zauzeto: zauzetaIds.includes(mjesto.id),
    }));

    res.json({
      mjesta: mappedMjesta,
      rezervacije: mojeRezervacije.rows,
      vrijeme_do: vrijemeDo,
      radi: isWorkingTime(datum, vrijemeOd, vrijemeDo),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju čitaonice.",
      error: error.message,
    });
  }
};

const createReservation = async (req, res) => {
  try {
    const { datum, vrijeme_od, trajanje, mjesto_id } = req.body;

    if (!datum || !vrijeme_od || !trajanje || !mjesto_id) {
      return res.status(400).json({ message: "Sva polja su obavezna." });
    }

    if (!isTodayOrTomorrow(datum)) {
      return res.status(400).json({
        message: "Rezervacija je moguća samo za danas ili sjutra.",
      });
    }

    if (!durations.includes(Number(trajanje))) {
      return res.status(400).json({ message: "Nevažeće trajanje rezervacije." });
    }

    const vrijeme_do = addMinutesToTime(vrijeme_od, Number(trajanje));

    if (!isWorkingTime(datum, vrijeme_od, vrijeme_do)) {
      return res.status(400).json({
        message: "Čitaonica ne radi u izabranom terminu.",
      });
    }

    const overlap = await pool.query(
      `
      SELECT id
      FROM rezervacija
      WHERE mjesto_id = $1
      AND datum = $2
      AND status IN ('pending', 'active')
      AND vrijeme_od < $4
      AND vrijeme_do > $3
      `,
      [mjesto_id, datum, vrijeme_od, vrijeme_do]
    );

    if (overlap.rows.length > 0) {
      return res.status(400).json({
        message: "Mjesto je zauzeto u izabranom terminu.",
      });
    }

    const kod = generateCode();

    const result = await pool.query(
      `
      INSERT INTO rezervacija (
        kod,
        user_id,
        mjesto_id,
        datum,
        vrijeme_od,
        vrijeme_do,
        status,
        created_at,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'pending',
        NOW(),
        ($4::date + $5::time + INTERVAL '15 minutes')
      )
      RETURNING *
      `,
      [kod, req.user.id, mjesto_id, datum, vrijeme_od, vrijeme_do]
    );

    res.status(201).json({
      message: "Rezervacija je uspješno kreirana.",
      rezervacija: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri kreiranju rezervacije.",
      error: error.message,
    });
  }
};

const confirmReservationCode = async (req, res) => {
  try {
    const { kod } = req.body;

    const reservation = await pool.query(
      `
      SELECT *
      FROM rezervacija
      WHERE kod = $1
      AND status = 'pending'
      `,
      [kod]
    );

    if (!reservation.rows[0]) {
      return res.status(404).json({
        message: "Rezervacija sa ovim kodom nije pronađena ili nije aktivna.",
      });
    }

    const item = reservation.rows[0];

    const now = new Date();
    const expiresAt = new Date(item.expires_at);

    if (now > expiresAt) {
      await pool.query(
        `
        UPDATE rezervacija
        SET status = 'expired'
        WHERE id = $1
        `,
        [item.id]
      );

      return res.status(400).json({
        message: "Rezervacija je istekla jer student nije došao na vrijeme.",
      });
    }

    const result = await pool.query(
      `
      UPDATE rezervacija
      SET status = 'active',
          checked_in_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [item.id]
    );

    res.json({
      message: "Rezervacija je potvrđena. Student može koristiti čitaonicu.",
      rezervacija: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri potvrdi rezervacije.",
      error: error.message,
    });
  }
};
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE rezervacija
      SET status = 'cancelled'
      WHERE id = $1
      AND user_id = $2
      AND status = 'pending'
      RETURNING *
      `,
      [id, req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "Rezervacija nije pronađena ili se ne može otkazati.",
      });
    }

    res.json({
      message: "Rezervacija je otkazana.",
      rezervacija: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri otkazivanju rezervacije.",
      error: error.message,
    });
  }
};
const getAdminReservations = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.kod,
        r.datum,
        r.vrijeme_od,
        r.vrijeme_do,
        r.status,
        u.name,
        u.index_number,
        m.broj_mjesta
      FROM rezervacija r
      JOIN users u ON u.id = r.user_id
      JOIN mjesto m ON m.id = r.mjesto_id
      ORDER BY r.created_at DESC
      `
    );

    res.json({
      rezervacije: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju rezervacija.",
      error: error.message,
    });
  }
};
const createAdminReservation = async (req, res) => {
  try {
    const { datum, vrijeme_od, trajanje, mjesto_id, admin_note } = req.body;

    if (!datum || !vrijeme_od || !trajanje || !mjesto_id) {
      return res.status(400).json({ message: "Sva polja su obavezna." });
    }

    const vrijeme_do = addMinutesToTime(vrijeme_od, Number(trajanje));

    if (!isWorkingTime(datum, vrijeme_od, vrijeme_do)) {
      return res.status(400).json({
        message: "Čitaonica ne radi u izabranom terminu.",
      });
    }

    const overlap = await pool.query(
      `
      SELECT id
      FROM rezervacija
      WHERE mjesto_id = $1
      AND datum = $2
      AND status IN ('pending', 'active')
      AND vrijeme_od < $4
      AND vrijeme_do > $3
      `,
      [mjesto_id, datum, vrijeme_od, vrijeme_do]
    );

    if (overlap.rows.length > 0) {
      return res.status(400).json({
        message: "Mjesto je zauzeto u izabranom terminu.",
      });
    }

    const kod = generateCode();

    const result = await pool.query(
      `
      INSERT INTO rezervacija (
        kod,
        user_id,
        mjesto_id,
        datum,
        vrijeme_od,
        vrijeme_do,
        status,
        created_at,
        checked_in_at,
        expires_at,
        admin_note,
        created_by_admin
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'active',
        NOW(),
        NOW(),
        ($4::date + $5::time + INTERVAL '15 minutes'),
        $7,
        true
      )
      RETURNING *
      `,
      [
        kod,
        req.user.id,
        mjesto_id,
        datum,
        vrijeme_od,
        vrijeme_do,
        admin_note || "Rezervacija unesena od strane admina",
      ]
    );

    res.status(201).json({
      message: "Mjesto je uspješno zauzeto od strane admina.",
      rezervacija: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri admin rezervaciji.",
      error: error.message,
    });
  }
};
module.exports = {
  getCitaonaData,
  createReservation,
  confirmReservationCode,
  cancelReservation,
  getAdminReservations,
  createAdminReservation,
};