const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const menzaRoutes = require("./routes/menzaRoutes");
const domRoutes = require("./routes/domRoutes");
const citaonaRoutes = require("./routes/citaonaRoutes");
const popustiRoutes = require("./routes/popustiRoutes");
const stipendijeRoutes = require("./routes/stipendijeRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = [
  /^http:\/\/localhost:517[34]$/,
  /^http:\/\/127\.0\.0\.1:517[34]$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:517[34]$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:517[34]$/,
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.some((allowedOrigin) => allowedOrigin.test(origin))) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/menza", menzaRoutes);
app.use("/api/dom", domRoutes);
app.use("/api/citaona", citaonaRoutes);
app.use("/api/popusti", popustiRoutes);
app.use("/api/stipendije", stipendijeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
const pool = require("./config/db");


app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);


module.exports = app;
