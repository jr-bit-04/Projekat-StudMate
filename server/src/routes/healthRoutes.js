const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "StudMate API radi" });
});

router.get("/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Baza radi",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri konekciji sa bazom",
      error: error.message,
    });
  }
});

module.exports = router;