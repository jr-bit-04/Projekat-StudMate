const express = require("express");
const {
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  updateMyProfileImage,
  updateMyPreferences,
  registerMyPushToken,
} = require("../controllers/userController");
const { protect, requireGlobalAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me/avatar", protect, updateMyProfileImage);
router.put("/me/preferences", protect, updateMyPreferences);
router.post("/push-token", protect, registerMyPushToken);

router.get("/admin", protect, requireGlobalAdmin, getAllUsers);
router.put("/admin/:id", protect, requireGlobalAdmin, updateUser);
router.delete("/admin/:id", protect, requireGlobalAdmin, deleteUser);

module.exports = router;
