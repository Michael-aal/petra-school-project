import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

// In local development, backend/.env is the authoritative configuration.
// In production, platform-injected environment variables must remain authoritative.
const isDevelopment = (process.env.NODE_ENV || "development") === "development";

dotenv.config({
  path: path.join(backendRoot, ".env"),
  override: isDevelopment,
  quiet: true,
});
