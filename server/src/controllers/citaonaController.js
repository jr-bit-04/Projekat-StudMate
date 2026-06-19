const pool = require("../config/db");
const {
  CITAONA_LOCATION,
  calculateDistanceMeters,
} = require("../utils/citaonaTracking");
const {
  isExpoPushToken,
  saveUserPushToken,
  sendPushToUsers,
} = require("../utils/pushNotifications");

const durations = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
const OUTSIDE_WARNING_LEAD_MINUTES = 15;

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const normalized = Math.max(0, totalMinutes);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function addMinutesToTime(time, minutesToAdd) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

function isSameLocalDate(dateValue, compareDate = new Date()) {
  const selected = new Date(dateValue);
  selected.setHours(0, 0, 0, 0);

  const current = new Date(compareDate);
  current.setHours(0, 0, 0, 0);

  return selected.getTime() === current.getTime();
}

function getWorkingHours(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay();

  if (day === 0) {
    return {
      isOpen: false,
      open: null,
      close: null,
      openMinutes: null,
      closeMinutes: null,
    };
  }

  if (day === 6) {
    return {
      isOpen: true,
      open: "07:00",
      close: "15:00",
      openMinutes: 420,
      closeMinutes: 900,
    };
  }

  return {
    isOpen: true,
    open: "07:00",
    close: "21:00",
    openMinutes: 420,
    closeMinutes: 1260,
  };
}

function isWorkingTime(dateValue, timeFrom, timeTo) {
  const hours = getWorkingHours(dateValue);

  if (!hours.isOpen) return false;

  const from = timeToMinutes(timeFrom);
  const to = timeToMinutes(timeTo);

  return from >= hours.openMinutes && to <= hours.closeMinutes && to > from;
}

function isPastTime(dateValue, timeFrom) {
  if (!isSameLocalDate(dateValue)) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return timeToMinutes(timeFrom) < nowMinutes;
}

function isTodayOrTomorrow(dateValue) {
  const selected = new Date(dateValue);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return (
    selected.getTime() === today.getTime() ||
    selected.getTime() === tomorrow.getTime()
  );
}

function getTrackingWindow(dateValue) {
  const hours = getWorkingHours(dateValue);

  if (!hours.isOpen) {
    return null;
  }

  let startMinutes = hours.openMinutes;

  if (isSameLocalDate(dateValue)) {
    const now = new Date();
    startMinutes = Math.max(
      startMinutes,
      now.getHours() * 60 + now.getMinutes()
    );
  }

  if (startMinutes >= hours.closeMinutes) {
    return null;
  }

  return {
    vrijeme_od: minutesToTime(startMinutes),
    vrijeme_do: hours.close,
    full_day: true,
  };
}

function getReservationWindow({
  trackingEnabled,
  datum,
  vrijemeOd,
  trajanje,
}) {
  if (trackingEnabled) {
    return getTrackingWindow(datum);
  }

  if (!durations.includes(Number(trajanje))) {
    return null;
  }

  return {
    vrijeme_od: vrijemeOd,
    vrijeme_do: addMinutesToTime(vrijemeOd, Number(trajanje)),
    full_day: false,
  };
}

function getNowIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getRemainingGraceMinutes(outsideSince) {
  if (!outsideSince) return CITAONA_LOCATION.graceMinutes;

  const elapsedMs = Date.now() - new Date(outsideSince).getTime();
  const remainingMs =
    CITAONA_LOCATION.graceMinutes * 60 * 1000 - Math.max(0, elapsedMs);

  return Math.max(0, Math.ceil(remainingMs / 60000));
}

function shouldSendOutsideWarning(reservation) {
  if (
    !reservation ||
    reservation.status !== "active" ||
    !reservation.outside_since ||
    reservation.outside_warning_sent_at
  ) {
    return false;
  }

  const warningLeadMinutes = Math.min(
    OUTSIDE_WARNING_LEAD_MINUTES,
    CITAONA_LOCATION.graceMinutes
  );
  const elapsedMs = Date.now() - new Date(reservation.outside_since).getTime();
  const warningThresholdMs = Math.max(
    0,
    (CITAONA_LOCATION.graceMinutes - warningLeadMinutes) * 60 * 1000
  );
  const cancelThresholdMs = CITAONA_LOCATION.graceMinutes * 60 * 1000;

  return elapsedMs >= warningThresholdMs && elapsedMs < cancelThresholdMs;
}

async function sendCitaonaOutsideWarning(userId, reservation) {
  const remainingMinutes = getRemainingGraceMinutes(reservation.outside_since);

  return sendPushToUsers([userId], {
    title: "Vrati se u citaonicu",
    body: `Van si dozvoljenog radijusa. Ako se ne vratis u narednih ${remainingMinutes} min, rezervacija ce biti automatski otkazana.`,
    data: {
      type: "citaona_outside_warning",
      reservationId: reservation.id,
      remainingGraceMinutes: remainingMinutes,
    },
  });
}

async function sendCitaonaAutoCancelNotification(userId, reservation) {
  return sendPushToUsers([userId], {
    title: "Rezervacija je otkazana",
    body: "Rezervacija u citaonici je automatski otkazana jer si bio van dozvoljenog radijusa duze od dozvoljenog vremena.",
    data: {
      type: "citaona_auto_cancelled",
      reservationId: reservation.id,
      cancellationReason: reservation.cancellation_reason || null,
    },
  });
}

async function sendCitaonaMissedCheckInNotification(userId, reservation) {
  return sendPushToUsers([userId], {
    title: "Rezervacija je otkazana",
    body: "Rezervacija u citaonici je automatski otkazana jer se nisi prijavio u roku od 15 minuta.",
    data: {
      type: "citaona_no_show_cancelled",
      reservationId: reservation.id,
      cancellationReason: reservation.cancellation_reason || "missed_check_in",
    },
  });
}

async function sendCitaonaRoomDeletedNotification(userIds, roomName) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return;
  }

  return sendPushToUsers(userIds, {
    title: "Rezervacija je otkazana",
    body: `Rezervacija u citaonici ${roomName} je otkazana jer citaonica vise nije dostupna.`,
    data: {
      type: "citaona_room_deleted",
      roomName,
    },
  });
}

function mapReservation(row) {
  if (!row) return row;

  return {
    ...row,
    tracking_enabled: row.tracking_enabled === true,
    remaining_grace_minutes:
      row.tracking_enabled && row.status === "active"
        ? getRemainingGraceMinutes(row.outside_since)
        : null,
  };
}

function roomSupportsTracking(row) {
  return (
    row &&
    row.tracking_latitude !== null &&
    row.tracking_latitude !== undefined &&
    row.tracking_longitude !== null &&
    row.tracking_longitude !== undefined
  );
}

async function getSeatById(seatId) {
  const result = await pool.query(
    `
    SELECT
      m.id,
      m.broj_mjesta,
      m.status,
      m.citaonica_id,
      c.naziv AS citaonica_naziv,
      c.lokacija AS citaonica_lokacija,
      c.tracking_latitude,
      c.tracking_longitude
    FROM mjesto m
    JOIN citaonica c ON c.id = m.citaonica_id
    WHERE m.id = $1
    LIMIT 1
    `,
    [seatId]
  );

  const seat = result.rows[0] || null;

  if (!seat) {
    return null;
  }

  return {
    ...seat,
    tracking_supported: roomSupportsTracking(seat),
  };
}

async function getVisibleCitaonice({ datum, vrijemeOd, vrijemeDo }) {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.naziv,
      c.lokacija,
      COALESCE(stats.active_seats, 0)::INTEGER AS broj_mjesta,
      COALESCE(occupied.zauzeta_mjesta, 0)::INTEGER AS zauzeta_mjesta,
      GREATEST(
        COALESCE(stats.active_seats, 0)::INTEGER - COALESCE(occupied.zauzeta_mjesta, 0)::INTEGER,
        0
      )::INTEGER AS slobodna_mjesta,
      (c.tracking_latitude IS NOT NULL AND c.tracking_longitude IS NOT NULL) AS tracking_supported
    FROM citaonica c
    LEFT JOIN (
      SELECT
        citaonica_id,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER AS active_seats
      FROM mjesto
      GROUP BY citaonica_id
    ) stats ON stats.citaonica_id = c.id
    LEFT JOIN (
      SELECT
        m.citaonica_id,
        COUNT(DISTINCT r.mjesto_id)::INTEGER AS zauzeta_mjesta
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      WHERE r.datum = $1
        AND r.status IN ('pending', 'active')
        AND r.vrijeme_od < $3
        AND r.vrijeme_do > $2
        AND m.status = 'active'
      GROUP BY m.citaonica_id
    ) occupied ON occupied.citaonica_id = c.id
    WHERE c.status = 'active'
      AND COALESCE(stats.active_seats, 0) > 0
    ORDER BY c.naziv ASC
    `,
    [datum, vrijemeOd, vrijemeDo]
  );

  return result.rows;
}

function isReservationInTrackingWindow(reservation) {
  if (!reservation || !["pending", "active"].includes(reservation.status)) {
    return false;
  }

  if (!isSameLocalDate(reservation.datum)) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const from = timeToMinutes(reservation.vrijeme_od);
  const to = timeToMinutes(reservation.vrijeme_do);

  return nowMinutes >= from && nowMinutes <= to;
}

async function getCurrentUser(userId) {
  const result = await pool.query(
    `
    SELECT
      id,
      role,
      COALESCE(location_tracking_consent, false) AS location_tracking_consent
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function markExpiredReservations() {
  const expiredPendingReservations = await pool.query(
    `
    UPDATE rezervacija
    SET status = 'expired',
        auto_cancelled_at = COALESCE(auto_cancelled_at, NOW()),
        cancellation_reason = COALESCE(cancellation_reason, 'missed_check_in')
    WHERE status = 'pending'
    AND expires_at < NOW()
    RETURNING id, user_id, cancellation_reason
    `
  );

  await Promise.all(
    expiredPendingReservations.rows.map(async (reservation) => {
      try {
        await sendCitaonaMissedCheckInNotification(
          reservation.user_id,
          reservation
        );
      } catch (pushError) {
        console.error(
          "Greska pri slanju push obavjestenja za istek rezervacije bez dolaska:",
          pushError.message
        );
      }
    })
  );

  await pool.query(
    `
    UPDATE rezervacija
    SET status = 'completed'
    WHERE status = 'active'
    AND (datum + vrijeme_do) < NOW()
    `
  );
}

async function getActiveTrackingReservation(userId) {
  await markExpiredReservations();

  const result = await pool.query(
    `
    SELECT
      id,
      kod,
      datum,
      vrijeme_od,
      vrijeme_do,
      status,
      tracking_enabled,
      outside_since,
      last_location_at,
      last_distance_meters,
      cancellation_reason
    FROM rezervacija
    WHERE user_id = $1
      AND tracking_enabled = true
      AND status IN ('pending', 'active')
      AND datum = CURRENT_DATE
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, vrijeme_od ASC
    LIMIT 1
    `,
    [userId]
  );

  const reservation = mapReservation(result.rows[0] || null);

  return {
    reservation,
    shouldTrack: isReservationInTrackingWindow(reservation),
  };
}

const getCitaonaData = async (req, res) => {
  try {
    await markExpiredReservations();

    const datum = req.query.datum || new Date().toISOString().slice(0, 10);
    const vrijemeOd = req.query.vrijeme_od || "07:00";
    const trajanje = Number(req.query.trajanje || 60);
    const requestedRoomId = Number.parseInt(req.query.citaonica_id, 10);

    const user = await getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    const trackingPreferenceEnabled = user.location_tracking_consent === true;
    const requestedVrijemeDo = addMinutesToTime(
      vrijemeOd,
      durations.includes(trajanje) ? trajanje : 60
    );
    const initialRooms = await getVisibleCitaonice({
      datum,
      vrijemeOd,
      vrijemeDo: requestedVrijemeDo,
    });
    const shouldFilterByRoom = user.role !== "admin";
    const hasRequestedRoom =
      Number.isFinite(requestedRoomId) &&
      initialRooms.some((room) => room.id === requestedRoomId);
    const selectedRoomId = shouldFilterByRoom
      ? hasRequestedRoom
        ? requestedRoomId
        : initialRooms[0]?.id || null
      : null;
    const requestedRoom =
      initialRooms.find((room) => room.id === selectedRoomId) || null;
    const trackingEnabled =
      trackingPreferenceEnabled && requestedRoom?.tracking_supported === true;
    const reservationWindow = getReservationWindow({
      trackingEnabled,
      datum,
      vrijemeOd,
      trajanje,
    });

    const effectiveVrijemeOd = reservationWindow?.vrijeme_od || vrijemeOd;
    const effectiveVrijemeDo =
      reservationWindow?.vrijeme_do || requestedVrijemeDo;

    const visibleRooms = await getVisibleCitaonice({
      datum,
      vrijemeOd: effectiveVrijemeOd,
      vrijemeDo: effectiveVrijemeDo,
    });
    const selectedRoom =
      visibleRooms.find((room) => room.id === selectedRoomId) ||
      requestedRoom ||
      null;

    const mjesta = await pool.query(
      `
      SELECT
        m.id,
        m.broj_mjesta,
        m.status,
        m.citaonica_id,
        c.naziv AS citaonica_naziv,
        c.lokacija AS citaonica_lokacija,
        (c.tracking_latitude IS NOT NULL AND c.tracking_longitude IS NOT NULL) AS tracking_supported
      FROM mjesto m
      JOIN citaonica c ON c.id = m.citaonica_id
      WHERE c.status = 'active'
        AND m.status = 'active'
        AND ($1::INTEGER IS NULL OR m.citaonica_id = $1)
      ORDER BY c.naziv ASC, m.broj_mjesta ASC
      `
      ,
      [selectedRoomId]
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
      [datum, effectiveVrijemeOd, effectiveVrijemeDo]
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
        r.tracking_enabled,
        r.outside_since,
        r.last_location_at,
        r.last_distance_meters,
        r.auto_cancelled_at,
        r.cancellation_reason,
        m.broj_mjesta,
        c.id AS citaonica_id,
        c.naziv AS citaonica_naziv,
        c.lokacija AS citaonica_lokacija
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      JOIN citaonica c ON c.id = m.citaonica_id
      WHERE r.user_id = $1
      AND r.status IN ('pending', 'active')
      ORDER BY r.datum DESC, r.vrijeme_od DESC
      `,
      [req.user.id]
    );

    const istorija = await pool.query(
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
        r.tracking_enabled,
        r.outside_since,
        r.last_location_at,
        r.last_distance_meters,
        r.auto_cancelled_at,
        r.cancellation_reason,
        m.broj_mjesta,
        c.id AS citaonica_id,
        c.naziv AS citaonica_naziv,
        c.lokacija AS citaonica_lokacija
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      JOIN citaonica c ON c.id = m.citaonica_id
      WHERE r.user_id = $1
      ORDER BY r.datum DESC, r.vrijeme_od DESC, r.created_at DESC
      `,
      [req.user.id]
    );

    const obavjestenja = await pool.query(
      `
      SELECT id, naslov, opis, kategorija, datum_vrijeme
      FROM obavjestenje
      WHERE modul = 'citaona'
      ORDER BY datum_vrijeme DESC
      LIMIT 5
      `
    );

    const zauzetaIds = zauzeta.rows.map((item) => item.mjesto_id);

    const mappedMjesta = mjesta.rows.map((mjesto) => ({
      ...mjesto,
      zauzeto: zauzetaIds.includes(mjesto.id),
    }));

    res.json({
      citaonice: visibleRooms,
      selected_citaonica_id: selectedRoomId,
      mjesta: mappedMjesta,
      rezervacije: mojeRezervacije.rows.map(mapReservation),
      istorija: istorija.rows.map(mapReservation),
      obavjestenja: obavjestenja.rows,
      vrijeme_do: effectiveVrijemeDo,
      radi: isWorkingTime(datum, effectiveVrijemeOd, effectiveVrijemeDo),
      tracking: {
        enabled_by_preference: trackingEnabled,
        address:
          selectedRoom?.lokacija ||
          visibleRooms[0]?.lokacija ||
          CITAONA_LOCATION.address,
        radius_meters: CITAONA_LOCATION.radiusMeters,
        grace_minutes: CITAONA_LOCATION.graceMinutes,
        reservation_mode: trackingEnabled ? "daily_tracking" : "standard",
        reservation_window: reservationWindow,
      },
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

    if (!datum || !mjesto_id) {
      return res.status(400).json({ message: "Datum i mjesto su obavezni." });
    }

    if (!isTodayOrTomorrow(datum)) {
      return res.status(400).json({
        message: "Rezervacija je moguća samo za danas ili sjutra.",
      });
    }

    const user = await getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    const seat = await getSeatById(mjesto_id);

    if (!seat || seat.status !== "active") {
      return res.status(404).json({
        message: "Izabrano mjesto nije pronađeno ili nije dostupno.",
      });
    }

    const trackingEnabled =
      user.location_tracking_consent === true &&
      seat.tracking_supported === true;

    const reservationWindow = getReservationWindow({
      trackingEnabled,
      datum,
      vrijemeOd: vrijeme_od || "07:00",
      trajanje: Number(trajanje || 60),
    });

    if (!reservationWindow) {
      return res.status(400).json({
        message: trackingEnabled
          ? "Za izabrani dan više nema dostupnog radnog vremena za dnevnu rezervaciju."
          : "Nevažeće trajanje rezervacije.",
      });
    }

    const effectiveVrijemeOd = reservationWindow.vrijeme_od;
    const effectiveVrijemeDo = reservationWindow.vrijeme_do;

    if (!trackingEnabled && isPastTime(datum, effectiveVrijemeOd)) {
      return res.status(400).json({
        message: "Ne možeš rezervisati termin koji je već prošao.",
      });
    }

    if (!isWorkingTime(datum, effectiveVrijemeOd, effectiveVrijemeDo)) {
      return res.status(400).json({
        message: "Čitaonica ne radi u izabranom terminu.",
      });
    }

    await markExpiredReservations();

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
      [mjesto_id, datum, effectiveVrijemeOd, effectiveVrijemeDo]
    );

    if (overlap.rows.length > 0) {
      return res.status(400).json({
        message: "Mjesto je zauzeto u izabranom terminu.",
      });
    }

    const userOverlap = await pool.query(
      `
      SELECT id
      FROM rezervacija
      WHERE user_id = $1
      AND datum = $2
      AND status IN ('pending', 'active')
      AND vrijeme_od < $4
      AND vrijeme_do > $3
      `,
      [req.user.id, datum, effectiveVrijemeOd, effectiveVrijemeDo]
    );

    if (userOverlap.rows.length > 0) {
      return res.status(400).json({
        message: "Već imaš rezervaciju koja se preklapa sa izabranim terminom.",
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
        expires_at,
        tracking_enabled
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
        ($4::date + $5::time + INTERVAL '15 minutes'),
        $7
      )
      RETURNING *
      `,
      [
        kod,
        req.user.id,
        mjesto_id,
        datum,
        effectiveVrijemeOd,
        effectiveVrijemeDo,
        trackingEnabled,
      ]
    );

    res.status(201).json({
      message: trackingEnabled
        ? "Dnevna rezervacija sa praćenjem lokacije je uspješno kreirana."
        : "Rezervacija je uspješno kreirana.",
      rezervacija: mapReservation(result.rows[0]),
      tracking: {
        enabled: trackingEnabled,
        address: seat.citaonica_lokacija || CITAONA_LOCATION.address,
        radius_meters: CITAONA_LOCATION.radiusMeters,
        grace_minutes: CITAONA_LOCATION.graceMinutes,
      },
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
          checked_in_at = NOW(),
          outside_since = NULL,
          outside_warning_sent_at = NULL,
          last_location_at = NULL,
          last_latitude = NULL,
          last_longitude = NULL,
          last_distance_meters = NULL
      WHERE id = $1
      RETURNING *
      `,
      [item.id]
    );

    res.json({
      message: "Rezervacija je potvrđena. Student može koristiti čitaonicu.",
      rezervacija: mapReservation(result.rows[0]),
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
      SET status = 'cancelled',
          cancellation_reason = COALESCE(cancellation_reason, 'cancelled_by_user')
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
      rezervacija: mapReservation(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri otkazivanju rezervacije.",
      error: error.message,
    });
  }
};

const clearReservationHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM rezervacija
      WHERE user_id = $1
      AND status NOT IN ('pending', 'active')
      RETURNING id
      `,
      [req.user.id]
    );

    res.json({
      message: "Istorija rezervacija je obrisana.",
      deleted: result.rowCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri brisanju istorije rezervacija.",
      error: error.message,
    });
  }
};

const getTrackingStatus = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    const activeTracking = await getActiveTrackingReservation(req.user.id);

    res.json({
      enabled_by_preference: user.location_tracking_consent === true,
      location: {
        address: CITAONA_LOCATION.address,
        radius_meters: CITAONA_LOCATION.radiusMeters,
        grace_minutes: CITAONA_LOCATION.graceMinutes,
      },
      reservation: activeTracking.reservation,
      shouldTrack: activeTracking.shouldTrack,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju statusa praćenja.",
      error: error.message,
    });
  }
};

const registerPushToken = async (req, res) => {
  try {
    const {
      expo_push_token,
      expoPushToken,
      device_platform,
      devicePlatform,
      enabled,
    } = req.body || {};

    const rawToken = expo_push_token ?? expoPushToken ?? "";
    const normalizedToken = String(rawToken || "").trim();
    const pushEnabled =
      enabled === undefined
        ? true
        : enabled === true ||
          enabled === "true" ||
          enabled === 1 ||
          enabled === "1";

    if (pushEnabled && !isExpoPushToken(normalizedToken)) {
      return res.status(400).json({
        message: "Expo push token nije validan.",
      });
    }

    const savedToken = await saveUserPushToken({
      userId: req.user.id,
      expoPushToken: normalizedToken,
      devicePlatform: device_platform || devicePlatform || null,
      enabled: pushEnabled,
    });

    res.json({
      message: pushEnabled
        ? "Push token je uspjesno sacuvan."
        : "Push notifikacije su uspjesno iskljucene.",
      push_token: savedToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greska pri cuvanju push tokena.",
      error: error.message,
    });
  }
};

const receiveTrackingPing = async (req, res) => {
  try {
    const { reservation_id, latitude, longitude, accuracy_meters } = req.body;

    if (!reservation_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Rezervacija i koordinate su obavezni.",
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const accuracy =
      accuracy_meters === undefined || accuracy_meters === null
        ? null
        : Number(accuracy_meters);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        message: "Koordinate nijesu validne.",
      });
    }

    await markExpiredReservations();

    const reservationResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        datum,
        vrijeme_od,
        vrijeme_do,
        status,
        tracking_enabled,
        outside_since,
        outside_warning_sent_at,
        last_location_at,
        last_distance_meters,
        cancellation_reason
      FROM rezervacija
      WHERE id = $1
        AND user_id = $2
        AND tracking_enabled = true
        AND status IN ('pending', 'active')
      LIMIT 1
      `,
      [reservation_id, req.user.id]
    );

    const reservation = reservationResult.rows[0];

    if (!reservation) {
      return res.status(404).json({
        message: "Aktivna tracked rezervacija nije pronađena.",
      });
    }

    if (!isReservationInTrackingWindow(reservation)) {
      return res.json({
        message: "Rezervacija trenutno nije u periodu aktivnog praćenja.",
        reservation: mapReservation(reservation),
      });
    }

    const distance = calculateDistanceMeters(
      { latitude: lat, longitude: lon },
      {
        latitude: CITAONA_LOCATION.latitude,
        longitude: CITAONA_LOCATION.longitude,
      }
    );
    const withinRadius = distance <= CITAONA_LOCATION.radiusMeters;

    await pool.query(
      `
      INSERT INTO rezervacija_lokacija_log (
        rezervacija_id,
        user_id,
        latitude,
        longitude,
        distance_meters,
        is_within_radius,
        accuracy_meters
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [reservation.id, req.user.id, lat, lon, distance, withinRadius, accuracy]
    );

    let result;

    if (reservation.status === "pending") {
      result = await pool.query(
        `
        UPDATE rezervacija
        SET outside_since = NULL,
            outside_warning_sent_at = NULL,
            last_location_at = NOW(),
            last_latitude = $2,
            last_longitude = $3,
            last_distance_meters = $4
        WHERE id = $1
        RETURNING *
        `,
        [reservation.id, lat, lon, distance]
      );
    } else if (withinRadius) {
      result = await pool.query(
        `
        UPDATE rezervacija
        SET outside_since = NULL,
            outside_warning_sent_at = NULL,
            last_location_at = NOW(),
            last_latitude = $2,
            last_longitude = $3,
            last_distance_meters = $4
        WHERE id = $1
        RETURNING *
        `,
        [reservation.id, lat, lon, distance]
      );
    } else {
      const outsideSince = reservation.outside_since
        ? new Date(reservation.outside_since)
        : new Date();
      const elapsedMs = Date.now() - outsideSince.getTime();
      const shouldCancel =
        elapsedMs >= CITAONA_LOCATION.graceMinutes * 60 * 1000;

      result = await pool.query(
        `
        UPDATE rezervacija
        SET outside_since = COALESCE(outside_since, NOW()),
            last_location_at = NOW(),
            last_latitude = $2,
            last_longitude = $3,
            last_distance_meters = $4,
            status = CASE WHEN $5 THEN 'cancelled' ELSE status END,
            auto_cancelled_at = CASE WHEN $5 THEN NOW() ELSE auto_cancelled_at END,
            cancellation_reason = CASE
              WHEN $5 THEN 'outside_radius_timeout'
              ELSE cancellation_reason
            END
        WHERE id = $1
        RETURNING *
        `,
        [reservation.id, lat, lon, distance, shouldCancel]
      );
    }

    const updatedReservation = mapReservation(result.rows[0]);

    if (updatedReservation.status === "cancelled") {
      try {
        await sendCitaonaAutoCancelNotification(req.user.id, updatedReservation);
      } catch (pushError) {
        console.error("GreÅ¡ka pri slanju push obavjeÅ¡tenja za auto-otkazivanje:", pushError.message);
      }
    } else if (shouldSendOutsideWarning(updatedReservation)) {
      try {
        await sendCitaonaOutsideWarning(req.user.id, updatedReservation);
        await pool.query(
          `
          UPDATE rezervacija
          SET outside_warning_sent_at = NOW()
          WHERE id = $1
            AND outside_warning_sent_at IS NULL
          `,
          [updatedReservation.id]
        );
        updatedReservation.outside_warning_sent_at = new Date().toISOString();
      } catch (pushError) {
        console.error("GreÅ¡ka pri slanju push upozorenja za Äitaonicu:", pushError.message);
      }
    }

    res.json({
      message:
        updatedReservation.status === "cancelled"
          ? "Rezervacija je automatski otkazana jer je student bio van dozvoljenog radijusa duže od 60 minuta."
          : updatedReservation.status === "pending"
          ? "Lokacija je evidentirana. Rezervacija i dalje čeka potvrdu dolaska."
          : "Lokacija je evidentirana.",
      reservation: updatedReservation,
      tracking: {
        distance_meters: distance,
        within_radius: withinRadius,
        radius_meters: CITAONA_LOCATION.radiusMeters,
        grace_minutes: CITAONA_LOCATION.graceMinutes,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri obradi lokacije.",
      error: error.message,
    });
  }
};

const getAdminReservations = async (req, res) => {
  try {
    await markExpiredReservations();

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.kod,
        r.datum,
        r.vrijeme_od,
        r.vrijeme_do,
        r.status,
        r.admin_note,
        r.created_by_admin,
        r.tracking_enabled,
        r.outside_since,
        r.last_location_at,
        r.last_distance_meters,
        r.auto_cancelled_at,
        r.cancellation_reason,
        u.name,
        u.index_number,
        u.profile_image_path AS profile_image_url,
        m.broj_mjesta,
        c.id AS citaonica_id,
        c.naziv AS citaonica_naziv,
        c.lokacija AS citaonica_lokacija
      FROM rezervacija r
      JOIN users u ON u.id = r.user_id
      JOIN mjesto m ON m.id = r.mjesto_id
      JOIN citaonica c ON c.id = m.citaonica_id
      ORDER BY r.created_at DESC
      `
    );

    res.json({
      rezervacije: result.rows.map(mapReservation),
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

    const seat = await getSeatById(mjesto_id);

    if (!seat || seat.status !== "active") {
      return res.status(404).json({
        message: "Izabrano mjesto nije pronađeno ili nije dostupno.",
      });
    }

    const vrijeme_do = addMinutesToTime(vrijeme_od, Number(trajanje));

    if (!isWorkingTime(datum, vrijeme_od, vrijeme_do)) {
      return res.status(400).json({
        message: "Čitaonica ne radi u izabranom terminu.",
      });
    }

    await markExpiredReservations();

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
        created_by_admin,
        tracking_enabled
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
        true,
        false
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
      rezervacija: mapReservation(result.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri admin rezervaciji.",
      error: error.message,
    });
  }
};

const createCitaonica = async (req, res) => {
  const client = await pool.connect();

  try {
    const naziv = String(req.body?.naziv || "").trim();
    const lokacija = String(req.body?.lokacija || "").trim();
    const brojMjesta = Number.parseInt(req.body?.broj_mjesta, 10);

    if (!naziv || !lokacija || !Number.isFinite(brojMjesta)) {
      return res.status(400).json({
        message: "Naziv, lokacija i broj mjesta su obavezni.",
      });
    }

    if (brojMjesta < 1 || brojMjesta > 500) {
      return res.status(400).json({
        message: "Broj mjesta mora biti između 1 i 500.",
      });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT id
      FROM citaonica
      WHERE LOWER(naziv) = LOWER($1)
      LIMIT 1
      `,
      [naziv]
    );

    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Čitaonica sa ovim nazivom već postoji.",
      });
    }

    const createdRoom = await client.query(
      `
      INSERT INTO citaonica (naziv, lokacija, broj_mjesta)
      VALUES ($1, $2, $3)
      RETURNING id, naziv, lokacija, broj_mjesta, status, created_at
      `,
      [naziv, lokacija, brojMjesta]
    );

    await client.query(
      `
      INSERT INTO mjesto (broj_mjesta, status, citaonica_id)
      SELECT seat_number, 'active', $1
      FROM generate_series(1, $2::INTEGER) AS seat_number
      `,
      [createdRoom.rows[0].id, brojMjesta]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Nova čitaonica je uspješno dodata.",
      citaonica: {
        ...createdRoom.rows[0],
        tracking_supported: false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      message: "Greška pri dodavanju čitaonice.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const deleteCitaonica = async (req, res) => {
  const client = await pool.connect();

  try {
    const roomId = Number.parseInt(req.params.id, 10);

    if (!Number.isFinite(roomId) || roomId < 1) {
      return res.status(400).json({
        message: "Nevažeći identifikator čitaonice.",
      });
    }

    await client.query("BEGIN");

    const roomResult = await client.query(
      `
      SELECT id, naziv, status
      FROM citaonica
      WHERE id = $1
      LIMIT 1
      `,
      [roomId]
    );

    const room = roomResult.rows[0];

    if (!room || room.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Čitaonica nije pronađena ili je već obrisana.",
      });
    }

    const activeReservations = await client.query(
      `
      SELECT COUNT(*)::INTEGER AS total
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      WHERE m.citaonica_id = $1
        AND r.status IN ('pending', 'active')
      `,
      [roomId]
    );

    if ((activeReservations.rows[0]?.total || 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message:
          "Čitaonica se ne može obrisati dok postoje aktivne ili čekajuće rezervacije.",
      });
    }

    await client.query(
      `
      UPDATE citaonica
      SET status = 'inactive',
          updated_at = NOW()
      WHERE id = $1
      `,
      [roomId]
    );

    await client.query(
      `
      UPDATE mjesto
      SET status = 'inactive'
      WHERE citaonica_id = $1
      `,
      [roomId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Čitaonica "${room.naziv}" je uspješno obrisana.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      message: "Greška pri brisanju čitaonice.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const deleteCitaonicaV2 = async (req, res) => {
  const client = await pool.connect();

  try {
    const roomId = Number.parseInt(req.params.id, 10);

    if (!Number.isFinite(roomId) || roomId < 1) {
      return res.status(400).json({
        message: "NevaÅ¾eÄ‡i identifikator Äitaonice.",
      });
    }

    await client.query("BEGIN");

    const roomResult = await client.query(
      `
      SELECT id, naziv, status
      FROM citaonica
      WHERE id = $1
      LIMIT 1
      `,
      [roomId]
    );

    const room = roomResult.rows[0];

    if (!room || room.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "ÄŒitaonica nije pronaÄ‘ena ili je veÄ‡ obrisana.",
      });
    }

    const activeReservations = await client.query(
      `
      SELECT r.id, r.user_id
      FROM rezervacija r
      JOIN mjesto m ON m.id = r.mjesto_id
      WHERE m.citaonica_id = $1
        AND r.status IN ('pending', 'active')
      `,
      [roomId]
    );

    const affectedUserIds = Array.from(
      new Set(
        activeReservations.rows
          .map((reservation) => reservation.user_id)
          .filter(Boolean)
      )
    );

    if (activeReservations.rows.length > 0) {
      await client.query(
        `
        UPDATE rezervacija r
        SET status = 'cancelled',
            cancellation_reason = 'room_deleted_by_admin',
            auto_cancelled_at = COALESCE(r.auto_cancelled_at, NOW())
        FROM mjesto m
        WHERE r.mjesto_id = m.id
          AND m.citaonica_id = $1
          AND r.status IN ('pending', 'active')
        `,
        [roomId]
      );
    }

    await client.query(
      `
      UPDATE citaonica
      SET status = 'inactive',
          updated_at = NOW()
      WHERE id = $1
      `,
      [roomId]
    );

    await client.query(
      `
      UPDATE mjesto
      SET status = 'inactive'
      WHERE citaonica_id = $1
      `,
      [roomId]
    );

    await client.query("COMMIT");

    if (affectedUserIds.length > 0) {
      try {
        await sendCitaonaRoomDeletedNotification(affectedUserIds, room.naziv);
      } catch (pushError) {
        console.error(
          "Greska pri slanju push obavjestenja za obrisanu citaonicu:",
          pushError.message
        );
      }
    }

    res.json({
      message:
        activeReservations.rows.length > 0
          ? `ÄŒitaonica "${room.naziv}" je uspjeÅ¡no obrisana. Otkazano rezervacija: ${activeReservations.rows.length}.`
          : `ÄŒitaonica "${room.naziv}" je uspjeÅ¡no obrisana.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({
      message: "GreÅ¡ka pri brisanju Äitaonice.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getCitaonaData,
  createReservation,
  confirmReservationCode,
  cancelReservation,
  clearReservationHistory,
  getTrackingStatus,
  registerPushToken,
  receiveTrackingPing,
  getAdminReservations,
  createAdminReservation,
  createCitaonica,
  deleteCitaonica: deleteCitaonicaV2,
};
