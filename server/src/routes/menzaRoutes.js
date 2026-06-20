const express = require("express");

const {
  getMenzaData,
  getMyBonovi,
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
  purchaseBonovi,
} = require("../controllers/menzaController");

const { protect, requireModuleAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMenzaData);
router.get("/bonovi", protect, getMyBonovi);
router.post("/bonovi/kupovina", protect, purchaseBonovi);

router.get("/admin/meni", protect, requireModuleAdmin("menza"), getAdminMenzaMenuByDate);
router.post("/admin/meni", protect, requireModuleAdmin("menza"), saveMenzaMenu);
router.put("/admin/meni/:id", protect, requireModuleAdmin("menza"), updateMenzaMenu);
router.delete("/admin/meni/:id", protect, requireModuleAdmin("menza"), deleteMenzaMenu);

router.get("/admin/obavjestenja", protect, requireModuleAdmin("menza"), getMenzaNotices);
router.post("/admin/obavjestenja", protect, requireModuleAdmin("menza"), saveMenzaNotice);
router.put("/admin/obavjestenja/:id", protect, requireModuleAdmin("menza"), updateMenzaNotice);
router.delete("/admin/obavjestenja/:id", protect, requireModuleAdmin("menza"), deleteMenzaNotice);

router.get("/admin/studenti", protect, requireModuleAdmin("menza"), searchStudentsForMenza);
router.put("/admin/bonovi/:userId", protect, requireModuleAdmin("menza"), updateStudentBonovi);

module.exports = router;
