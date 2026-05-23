const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
const pool = require("./config/db");


app.use("/", healthRoutes);

module.exports = app;