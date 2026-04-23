const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { connectDb } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
  }),
);

app.get("/healthz", (req, res) => res.json({ ok: true, service: "backend" }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`Backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

start();
