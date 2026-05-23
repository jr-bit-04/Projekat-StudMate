const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const createToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
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
      INSERT INTO users
      (name, email, password_hash, role, faculty, dorm, index_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, faculty, dorm, index_number
      `,
      [
        name,
        email,
        hashedPassword,
        role || "student",
        faculty || null,
        dorm || null,
        index_number || null,
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
      "SELECT * FROM users WHERE email = $1",
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
      return res.status(400).json({ message: "Email je obavezan." });
    }

    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({
        message: "Ako nalog postoji, link za reset lozinke je poslat na email.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"StudMate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset lozinke - StudMate",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset lozinke</h2>
          <p>Klikni na dugme ispod da resetuješ lozinku:</p>
          <a href="${resetLink}" style="display:inline-block;background:#1672f6;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Resetuj lozinku
          </a>
          <p>Ako nisi tražila reset lozinke, ignoriši ovaj email.</p>
        </div>
      `,
    });

    res.json({
      message: "Ako nalog postoji, link za reset lozinke je poslat na email.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri slanju emaila.",
      error: error.message,
    });
  }
};
module.exports = {
  register,
  login,
  forgotPassword
};