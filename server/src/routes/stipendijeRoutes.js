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
  requireModuleAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getStipendije);

router.get("/admin", protect, requireModuleAdmin("stipendije"), getAdminStipendije);

router.post("/admin", protect, requireModuleAdmin("stipendije"), createStipendija);

router.put("/admin/:id", protect, requireModuleAdmin("stipendije"), updateStipendija);

router.delete("/admin/:id", protect, requireModuleAdmin("stipendije"), deleteStipendija);

module.exports = router;