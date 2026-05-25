const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
  /^http:\/\/localhost:5173$/,
  /^http:\/\/127\.0\.0\.1:5173$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/,
  /^http:\/\/172\.16\.\d{1,3}\.\d{1,3}:5173$/,
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

app.use(express.json());
app.use(cookieParser());
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
