require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = require("./app");
const initDb = require("./config/initDb");
const { ensureProfileImageSupport } = require("./utils/profileImage");
const { ensureCitaonaTrackingSupport } = require("./utils/citaonaTracking");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDb();
    await ensureProfileImageSupport();
    await ensureCitaonaTrackingSupport();

    app.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT}`);
    });
  } catch (error) {
    console.error("Greška pri pokretanju servera:", error);
    process.exit(1);
  }
}

startServer();
