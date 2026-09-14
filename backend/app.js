import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { requestId } from "./middleware/requestId.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes, { jwksHandler } from "./routes/authRoutes.js";
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
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import classmarkerRoutes from "./routes/classmarkerRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import assessmentsRoutes from "./routes/assessmentsRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { distributedApiRateLimiter } from "./middleware/distributedRateLimiter.js";
import { prisma } from "./config/db.js";
import { checkQueueHealth } from "./jobs/queue.js";

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean).map((origin) => origin.trim().replace(/\/+$/, ""));

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, "")) || isLocalDevOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

app.use(requestId);
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(apiRateLimiter);
app.use(distributedApiRateLimiter);

app.get("/.well-known/jwks.json", jwksHandler);
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/classmarker", classmarkerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/assessments", assessmentsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
