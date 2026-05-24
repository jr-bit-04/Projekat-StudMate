const express = require("express");

const {
  getMenzaData,
  getAdminMenzaMenuByDate,
  saveMenzaMenu,
  updateMenzaMenu,
  deleteMenzaMenu,
  getMenzaNotices,
  saveMenzaNotice,
  updateMenzaNotice,
  deleteMenzaNotice,
  searchStudentsForMenza,
  updateStudentBonovi,
} = require("../controllers/menzaController");

const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMenzaData);

router.get("/admin/meni", protect, requireAdmin, getAdminMenzaMenuByDate);
router.post("/admin/meni", protect, requireAdmin, saveMenzaMenu);
router.put("/admin/meni/:id", protect, requireAdmin, updateMenzaMenu);
router.delete("/admin/meni/:id", protect, requireAdmin, deleteMenzaMenu);

router.get("/admin/obavjestenja", protect, requireAdmin, getMenzaNotices);
router.post("/admin/obavjestenja", protect, requireAdmin, saveMenzaNotice);
router.put("/admin/obavjestenja/:id", protect, requireAdmin, updateMenzaNotice);
router.delete("/admin/obavjestenja/:id", protect, requireAdmin, deleteMenzaNotice);

router.get("/admin/studenti", protect, requireAdmin, searchStudentsForMenza);
router.put("/admin/bonovi/:userId", protect, requireAdmin, updateStudentBonovi);

module.exports = router;