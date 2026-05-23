require("dotenv").config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});