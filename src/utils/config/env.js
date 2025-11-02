import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
dotenv.config({ path: path.resolve(repoRoot, ".env") });

const REQUIRED = ["SOURCE_DB_URI", "TARGET_DB_URI", "DB_NAME"];

const missing = REQUIRED.filter((k) => {
  const v = process.env[k];
  return !v || String(v).trim().length === 0;
});

if (missing.length > 0) {
  console.error(
    chalk.redBright(
      `\n❌ Missing required environment variables: ${missing.join(
        ", "
      )}\n\nPlease copy \".env.example\" to \".env\" and fill these values.`
    )
  );
  process.exit(1);
}

function parseIntegerEnv(key, fallback) {
  const raw = process.env[key];
  if (raw == null) return fallback;
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBooleanEnv(key, fallback) {
  const raw = process.env[key];
  if (raw == null) return fallback;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const SOURCE_DB_URI = String(process.env.SOURCE_DB_URI).trim();
const TARGET_DB_URI = String(process.env.TARGET_DB_URI).trim();
const DB_NAME = String(process.env.DB_NAME).trim();

const BATCH_SIZE = parseIntegerEnv("BATCH_SIZE", 1000);
const COPY_INDEXES = parseBooleanEnv("COPY_INDEXES", true);
const DEBUG = parseBooleanEnv("DEBUG", false);

const env = {
  SOURCE_DB_URI,
  TARGET_DB_URI,
  DB_NAME,
  BATCH_SIZE,
  COPY_INDEXES,
  DEBUG,
};

export {
  SOURCE_DB_URI,
  TARGET_DB_URI,
  DB_NAME,
  BATCH_SIZE,
  COPY_INDEXES,
  DEBUG,
};
export default env;
