const express = require("express");

const {
  getCitaonaData,
  createReservation,
  confirmReservationCode,
  cancelReservation,
  clearReservationHistory,
  getTrackingStatus,
  receiveTrackingPing,
  registerPushToken,
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
router.get("/tracking/active", protect, getTrackingStatus);
router.post("/tracking/ping", protect, receiveTrackingPing);
router.post("/push-token", protect, registerPushToken);

router.delete("/rezervacije/istorija", protect, clearReservationHistory);

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
