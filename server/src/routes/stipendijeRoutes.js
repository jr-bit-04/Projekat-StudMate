const express = require("express");

const {
  getStipendije,
  getAdminStipendije,
  createStipendija,
  updateStipendija,
  deleteStipendija,
} = require("../controllers/stipendijeController");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getStipendije);

router.get("/admin", protect, requireAdmin, getAdminStipendije);

router.post("/admin", protect, requireAdmin, createStipendija);

router.put("/admin/:id", protect, requireAdmin, updateStipendija);

router.delete("/admin/:id", protect, requireAdmin, deleteStipendija);

module.exports = router;