require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = require("./app");
const initDb = require("./config/initDb");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log(`Server radi na portu ${PORT}`);
    });
  } catch (error) {
    console.error("DB init failed:", error);
    process.exit(1);
  }
})();
