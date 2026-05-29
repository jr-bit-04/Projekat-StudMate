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
  requireModuleAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getPopustiData);

router.post("/partner/submit", createPartnerPortalSubmission);

router.post("/api/promotions", createApiPromotion);

router.get("/moderacija", protect, requireModuleAdmin("popusti"), getModerationData);
router.put("/moderacija/:id/approve", protect, requireModuleAdmin("popusti"), approvePopust);
router.put("/moderacija/:id/reject", protect, requireModuleAdmin("popusti"), rejectPopust);
router.post("/moderacija/api-partner", protect, requireModuleAdmin("popusti"), createApiPartner);

module.exports = router;