const pool = require("../config/db");
const {
  PROFILE_USER_COLUMNS,
  PUBLIC_USER_COLUMNS,
} = require("../utils/userColumns");
const {
  saveProfileImage,
  removeProfileImage,
} = require("../utils/profileImage");
const {
  isExpoPushToken,
  saveUserPushToken,
} = require("../utils/pushNotifications");

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${PROFILE_USER_COLUMNS}
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju profila.",
      error: error.message,
    });
  }
};

const normalizeBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const getAllUsers = async (req, res) => {
  try {
    const search = `%${req.query.search || ""}%`;

    const result = await pool.query(
      `
      SELECT ${PUBLIC_USER_COLUMNS},
             created_at, last_login_at
      FROM users
      WHERE name ILIKE $1
         OR email ILIKE $1
         OR COALESCE(faculty, '') ILIKE $1
         OR COALESCE(index_number, '') ILIKE $1
      ORDER BY (role = 'admin') DESC, name ASC
      `,
      [search]
    );

    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju korisnika.",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, admin_module, dorm, faculty, index_number } =
      req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Ime i email su obavezni." });
    }

    const safeRole = role === "admin" ? "admin" : "student";
    const safeModule = safeRole === "admin" ? admin_module || null : null;

    if (
      Number(id) === req.user.id &&
      (safeRole !== "admin" || safeModule !== "all")
    ) {
      return res.status(400).json({
        message: "Ne možeš sebi oduzeti globalna admin prava.",
      });
    }

    const emailTaken = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2",
      [email, id]
    );

    if (emailTaken.rows.length > 0) {
      return res.status(409).json({
        message: "Drugi korisnik već koristi ovaj email.",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET name = $1,
          email = $2,
          role = $3,
          admin_module = $4,
          dorm = $5,
          faculty = $6,
          index_number = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING ${PUBLIC_USER_COLUMNS}
      `,
      [
        name,
        email,
        safeRole,
        safeModule,
        dorm || "-",
        faculty || null,
        index_number || null,
        id,
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({ message: "Korisnik je ažuriran.", user: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri izmjeni korisnika.",
      error: error.message,
    });
  }
};

const updateMyProfileImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "Odaberi profilnu sliku prije čuvanja.",
      });
    }

    const currentUser = await pool.query(
      `
      SELECT id, profile_image_path AS profile_image_url
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (!currentUser.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    const previousImage = currentUser.rows[0].profile_image_url;
    const profileImageUrl = await saveProfileImage({
      userId: req.user.id,
      dataUrl: image,
    });

    try {
      const result = await pool.query(
        `
        UPDATE users
        SET profile_image_path = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING ${PROFILE_USER_COLUMNS}
        `,
        [profileImageUrl, req.user.id]
      );

      if (previousImage && previousImage !== profileImageUrl) {
        await removeProfileImage(previousImage);
      }

      res.json({
        message: "Profilna slika je uspješno sačuvana.",
        user: result.rows[0],
      });
    } catch (error) {
      await removeProfileImage(profileImageUrl).catch(() => {});
      throw error;
    }
  } catch (error) {
    const statusCode =
      error.message?.includes("Profilna slika") ||
      error.message?.includes("Dozvoljeni formati") ||
      error.message?.includes("4 MB") ||
      error.message?.includes("sliku")
        ? 400
        : 500;

    res.status(statusCode).json({
      message: error.message || "Greška pri čuvanju profilne slike.",
      error: error.message,
    });
  }
};

const updateMyPreferences = async (req, res) => {
  try {
    const { location_tracking_consent } = req.body;

    if (location_tracking_consent === undefined) {
      return res.status(400).json({
        message: "Pošalji novu vrijednost za dozvolu praćenja lokacije.",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET location_tracking_consent = $1,
          location_tracking_consent_updated_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING ${PROFILE_USER_COLUMNS}
      `,
      [normalizeBoolean(location_tracking_consent), req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    res.json({
      message: "Podešavanje lokacije je sačuvano.",
      user: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri čuvanju podešavanja lokacije.",
      error: error.message,
    });
  }
};

const registerMyPushToken = async (req, res) => {
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
      devicePlatform: device_platform || devicePlatform || "mobile",
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

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).json({
      message: "Ne možeš obrisati sopstveni nalog.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE obavjestenje SET created_by = NULL WHERE created_by = $1",
      [id]
    );

    const userResult = await client.query(
      `
      SELECT id, profile_image_path AS profile_image_url
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    const result = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    await client.query("COMMIT");

    if (!result.rows[0]) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    if (userResult.rows[0]?.profile_image_url) {
      await removeProfileImage(userResult.rows[0].profile_image_url).catch(
        () => {}
      );
    }

    res.json({ message: "Korisnik je obrisan." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({
      message: "Greška pri brisanju korisnika.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  updateMyProfileImage,
  updateMyPreferences,
  registerMyPushToken,
};
