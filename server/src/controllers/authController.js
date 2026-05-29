const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const resetCodes = new Map();
const RESET_CODE_TTL_MS = 15 * 60 * 1000;

const createToken = (userId, role, extraPayload = {}, options = {}) => {
  return jwt.sign(
    { id: userId, role, ...extraPayload },
    process.env.JWT_SECRET,
    {
      expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const normalizeResetCode = (code = "") => String(code).replace(/\D/g, "").slice(0, 6);

const hashResetCode = (email, code) => {
  const secret = process.env.RESET_CODE_SECRET || process.env.JWT_SECRET;

  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${normalizeResetCode(code)}:${secret}`)
    .digest("hex");
};

const isResetCodeValid = (email, code, entry) => {
  if (!entry || entry.expiresAt < Date.now()) return false;

  const expected = Buffer.from(entry.codeHash, "hex");
  const actual = Buffer.from(hashResetCode(email, code), "hex");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const createMailTransporter = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("SMTP korisnik ili lozinka nijesu podešeni.");
  }

  if (!process.env.SMTP_SERVICE && !process.env.SMTP_HOST) {
    throw new Error("SMTP servis ili host nijesu podešeni.");
  }

  const transportConfig = process.env.SMTP_SERVICE
    ? { service: process.env.SMTP_SERVICE }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      };

  return nodemailer.createTransport({
    ...transportConfig,
    auth: {
      user,
      pass,
    },
  });
};

const getMailFrom = () => {
  return process.env.MAIL_FROM || `"StudMate" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      faculty,
      dorm,
      index_number,
      admin_module,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Ime, email i lozinka su obavezni.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Korisnik sa ovim emailom već postoji.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        faculty,
        dorm,
        index_number,
        admin_module
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id,
        name,
        email,
        role,
        faculty,
        dorm,
        index_number,
        admin_module
      `,
      [
        name,
        email,
        hashedPassword,
        role || "student",
        faculty || null,
        dorm || null,
        index_number || null,
        admin_module || null,
      ]
    );

    const user = newUser.rows[0];
    const token = createToken(user.id, user.role);

    res.status(201).json({
      message: "Registracija uspješna.",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri registraciji.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email i lozinka su obavezni.",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        email,
        password_hash,
        role,
        faculty,
        dorm,
        index_number,
        admin_module
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Pogrešan email ili lozinka.",
      });
    }

    const user = result.rows[0];

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Pogrešan email ili lozinka.",
      });
    }

    delete user.password_hash;

    await pool.query(
      `
      UPDATE users
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    const token = createToken(user.id, user.role);

    res.json({
      message: "Prijava uspješna.",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri prijavi.",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email je obavezan.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const result = await pool.query(
      "SELECT id, email FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: "Ako nalog postoji, kod za reset lozinke je poslat na email.",
      });
    }

    const user = result.rows[0];
    const resetCode = String(crypto.randomInt(100000, 1000000));

    resetCodes.set(normalizedEmail, {
      userId: user.id,
      codeHash: hashResetCode(normalizedEmail, resetCode),
      expiresAt: Date.now() + RESET_CODE_TTL_MS,
    });

    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: getMailFrom(),
      to: email,
      subject: "Kod za reset lozinke - StudMate",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset lozinke</h2>
          <p>Unesi ovaj kod u StudMate aplikaciju:</p>
          <div style="display:inline-block;background:#1672f6;color:white;padding:14px 22px;border-radius:10px;font-size:28px;font-weight:bold;letter-spacing:6px;">
            ${resetCode}
          </div>
          <p>Kod važi 15 minuta.</p>
          <p>Ako nisi tražila reset lozinke, ignoriši ovaj email.</p>
        </div>
      `,
    });

    res.json({
      message: "Ako nalog postoji, kod za reset lozinke je poslat na email.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri slanju emaila.",
      error: error.message,
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email i kod su obavezni.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeResetCode(code);
    const entry = resetCodes.get(normalizedEmail);

    if (!isResetCodeValid(normalizedEmail, normalizedCode, entry)) {
      resetCodes.delete(normalizedEmail);

      return res.status(400).json({
        message: "Kod nije validan ili je istekao.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, role, faculty, dorm, index_number, admin_module
      FROM users
      WHERE id = $1
      `,
      [entry.userId]
    );

    if (result.rows.length === 0) {
      resetCodes.delete(normalizedEmail);

      return res.status(404).json({
        message: "Korisnik nije pronađen.",
      });
    }

    const user = result.rows[0];
    const token = createToken(
      user.id,
      user.role,
      { passwordReset: true },
      { expiresIn: "15m" }
    );

    resetCodes.delete(normalizedEmail);

    res.json({
      message: "Kod je potvrđen. Možeš promijeniti lozinku na profilu.",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri potvrdi koda.",
      error: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const isPasswordReset = req.user.passwordReset === true;

    if ((!isPasswordReset && !currentPassword) || !newPassword) {
      return res.status(400).json({
        message: isPasswordReset
          ? "Unesi novu lozinku."
          : "Unesi trenutnu i novu lozinku.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Nova lozinka mora imati najmanje 6 karaktera.",
      });
    }

    const result = await pool.query(
      `
      SELECT id, password_hash
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Korisnik nije pronađen.",
      });
    }

    const user = result.rows[0];

    if (!isPasswordReset) {
      const isCurrentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          message: "Trenutna lozinka nije tačna.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [hashedPassword, req.user.id]
    );

    if (isPasswordReset) {
      const userResult = await pool.query(
        `
        SELECT id, name, email, role, faculty, dorm, index_number, admin_module
        FROM users
        WHERE id = $1
        `,
        [req.user.id]
      );

      const updatedUser = userResult.rows[0];

      return res.json({
        message: "Lozinka je uspješno promijenjena.",
        user: updatedUser,
        token: createToken(updatedUser.id, updatedUser.role),
      });
    }

    res.json({
      message: "Lozinka je uspješno promijenjena.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri promjeni lozinke.",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  changePassword,
};
