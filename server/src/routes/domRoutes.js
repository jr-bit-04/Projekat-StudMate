const express = require("express");

const {
  getDomData,
  searchDomStudents,
  getStudentDomObligations,
  saveStudentDomObligation,
  getDomNotices,
  saveDomNotice,
  updateDomNotice,
  deleteDomNotice,
} = require("../controllers/domController");

const { protect, requireModuleAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDomData);

router.get("/admin/studenti", protect, requireModuleAdmin("dom"), searchDomStudents);
router.get("/admin/studenti/:userId/obaveze", protect, requireModuleAdmin("dom"), getStudentDomObligations);
router.post("/admin/studenti/:userId/obaveze", protect, requireModuleAdmin("dom"), saveStudentDomObligation);

router.get("/admin/obavjestenja", protect, requireModuleAdmin("dom"), getDomNotices);
router.post("/admin/obavjestenja", protect, requireModuleAdmin("dom"), saveDomNotice);
router.put("/admin/obavjestenja/:id", protect, requireModuleAdmin("dom"), updateDomNotice);
router.delete("/admin/obavjestenja/:id", protect, requireModuleAdmin("dom"), deleteDomNotice);

module.exports = router;