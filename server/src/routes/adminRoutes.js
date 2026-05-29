const express = require("express");

const {
  createAnnouncement,
  createMenuItem,
  createScholarship,
  createDiscount,
} = require("../controllers/adminController");

const { protect, requireGlobalAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/announcements", protect, requireGlobalAdmin, createAnnouncement);
router.post("/menu", protect, requireGlobalAdmin, createMenuItem);
router.post("/scholarships", protect, requireGlobalAdmin, createScholarship);
router.post("/discounts", protect, requireGlobalAdmin, createDiscount);

module.exports = router;