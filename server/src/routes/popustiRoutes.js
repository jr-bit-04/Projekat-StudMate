const express = require("express");

const {
  getPopustiData,
  getModerationData,
  approvePopust,
  rejectPopust,
  createPartnerPortalSubmission,
  createApiPromotion,
  createApiPartner,
} = require("../controllers/popustiController");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getPopustiData);

router.post("/partner/submit", createPartnerPortalSubmission);

router.post("/api/promotions", createApiPromotion);

router.get("/moderacija", protect, requireAdmin, getModerationData);
router.put("/moderacija/:id/approve", protect, requireAdmin, approvePopust);
router.put("/moderacija/:id/reject", protect, requireAdmin, rejectPopust);
router.post("/moderacija/api-partner", protect, requireAdmin, createApiPartner);

module.exports = router;