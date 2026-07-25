import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(backendRoot, ".env"), override: true });
dotenv.config({ path: path.join(projectRoot, ".env"), override: false });
