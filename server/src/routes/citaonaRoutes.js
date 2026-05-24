const express = require("express");

const {
  getCitaonaData,
  createReservation,
  confirmReservationCode,
  cancelReservation,
  getAdminReservations,
  createAdminReservation,
} = require("../controllers/citaonaController");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCitaonaData);

router.post("/rezervacija", protect, createReservation);

router.delete("/rezervacija/:id", protect, cancelReservation);

router.get(
  "/admin/rezervacije",
  protect,
  requireAdmin,
  getAdminReservations
);

router.post(
  "/admin/potvrdi",
  protect,
  requireAdmin,
  confirmReservationCode
);
router.post(
  "/admin/rezervacija",
  protect,
  requireAdmin,
  createAdminReservation
);

module.exports = router;