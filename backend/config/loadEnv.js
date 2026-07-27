import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(__dirname, "..", "..");

const envFiles = [path.join(backendRoot, ".env"), path.join(projectRoot, ".env")];

for (const envFile of envFiles) {
  dotenv.config({ path: envFile, override: false });
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "change_this_to_a_long_random_secret";
}
