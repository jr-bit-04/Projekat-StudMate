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
  requireModuleAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCitaonaData);

router.post("/rezervacija", protect, createReservation);

router.delete("/rezervacija/:id", protect, cancelReservation);

router.get(
  "/admin/rezervacije",
  protect,
  requireModuleAdmin("citaona"),
  getAdminReservations
);

router.post(
  "/admin/potvrdi",
  protect,
  requireModuleAdmin("citaona"),
  confirmReservationCode
);
router.post(
  "/admin/rezervacija",
  protect,
  requireModuleAdmin("citaona"),
  createAdminReservation
);

module.exports = router;