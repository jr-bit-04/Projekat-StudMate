const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Nema tokena. Prijavi se ponovo." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token nije validan." });
  }
};
const requireGlobalAdmin = (req, res, next) => {
  if (req.user.role !== "admin" || req.user.admin_module !== "all") {
    return res.status(403).json({
      message: "Samo globalni admin ima pristup ovome.",
    });
  }

  next();
};

const requireModuleAdmin = (module) => (req, res, next) => {
  if (
    req.user.role !== "admin" ||
    (req.user.admin_module !== module && req.user.admin_module !== "all")
  ) {
    return res.status(403).json({
      message: "Nemaš dozvolu za ovaj modul.",
    });
  }

  next();
};

module.exports = {
  protect,
  requireGlobalAdmin,
  requireModuleAdmin,
};
