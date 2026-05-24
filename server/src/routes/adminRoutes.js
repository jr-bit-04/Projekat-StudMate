const express = require("express");

const {
  createAnnouncement,
  createMenuItem,
  createScholarship,
  createDiscount,
} = require("../controllers/adminController");

const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/announcements", protect, requireAdmin, createAnnouncement);
router.post("/menu", protect, requireAdmin, createMenuItem);
router.post("/scholarships", protect, requireAdmin, createScholarship);
router.post("/discounts", protect, requireAdmin, createDiscount);

module.exports = router;