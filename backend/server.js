import "./config/loadEnv.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import academicRoutes from "./routes/academicRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import paystackRoutes from "./routes/paystackRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import classmarkerRoutes from "./routes/classmarkerRoutes.js";
import assessmentsRoutes from "./routes/assessmentsRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buf) => {
    if (req.originalUrl === "/api/paystack/webhook") {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/classmarker", classmarkerRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/superadmin", superAdminRoutes);

app.use(notFound);
app.use(errorHandler);

let server;

const start = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  }
});

process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }
});

console.log(`QUIZLAB_API_KEY loaded: ${Boolean(process.env.QUIZLAB_API_KEY)}`);
start();
