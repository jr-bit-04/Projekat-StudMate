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

const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDomData);

router.get("/admin/studenti", protect, requireAdmin, searchDomStudents);
router.get("/admin/studenti/:userId/obaveze", protect, requireAdmin, getStudentDomObligations);
router.post("/admin/studenti/:userId/obaveze", protect, requireAdmin, saveStudentDomObligation);

router.get("/admin/obavjestenja", protect, requireAdmin, getDomNotices);
router.post("/admin/obavjestenja", protect, requireAdmin, saveDomNotice);
router.put("/admin/obavjestenja/:id", protect, requireAdmin, updateDomNotice);
router.delete("/admin/obavjestenja/:id", protect, requireAdmin, deleteDomNotice);

module.exports = router;