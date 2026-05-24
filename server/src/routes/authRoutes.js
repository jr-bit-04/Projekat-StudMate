const express = require("express");

const {
  register,
  login,
  forgotPassword,
  verifyResetCode,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);

router.put("/change-password", protect, changePassword);

module.exports = router;
