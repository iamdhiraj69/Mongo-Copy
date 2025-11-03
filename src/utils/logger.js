import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_LOG_DIR = path.resolve(__dirname, "..", "..", "logs");
const DEFAULT_LOG_PATH = path.join(DEFAULT_LOG_DIR, "mongodbcopy.log");

const DEBUG = (process.env.DEBUG || "false").toLowerCase() === "true";
const LOG_TO_FILE =
  (process.env.LOG_TO_FILE || "false").toLowerCase() === "true" ||
  (process.env.LOG_PATH ? true : false);
const LOG_PATH = process.env.LOG_PATH ? path.resolve(process.env.LOG_PATH) : DEFAULT_LOG_PATH;

async function ensureLogDirectory(logFilePath) {
  try {
    const dir = path.dirname(logFilePath);
    await fs.promises.mkdir(dir, { recursive: true });
  } catch {
    // Ignore errors
  }
}

async function writeLogToFile(level, message) {
  if (!LOG_TO_FILE) return;
  try {
    await ensureLogDirectory(LOG_PATH);
    const time = new Date().toISOString();
    const line = `[${time}] [${level}] ${message}\n`;
    await fs.promises.appendFile(LOG_PATH, line, { encoding: "utf8" });
  } catch {
    // Ignore errors
  }
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function safeMessage(msg) {
  if (msg === null || msg === undefined) return String(msg);
  if (typeof msg === "string") return msg;
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

const logger = {
  info: (msg) => {
    const text = safeMessage(msg);
    console.log(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.cyan("ℹ")} ${text}`);
    writeLogToFile("INFO", text);
  },

  success: (msg) => {
    const text = safeMessage(msg);
    console.log(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.green("✅")} ${chalk.green(text)}`);
    writeLogToFile("SUCCESS", text);
  },

  warn: (msg) => {
    const text = safeMessage(msg);
    console.warn(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.yellow("⚠")} ${chalk.yellow(text)}`);
    writeLogToFile("WARN", text);
  },

  error: (msg) => {
    const text = safeMessage(msg);
    if (msg instanceof Error && msg.stack) {
      console.error(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.red("❌")} ${chalk.red(msg.message)}`);
      console.error(chalk.red(msg.stack));
      writeLogToFile("ERROR", `${msg.message}\n${msg.stack}`);
    } else {
      console.error(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.red("❌")} ${chalk.red(text)}`);
      writeLogToFile("ERROR", text);
    }
  },

  debug: (msg) => {
    if (!DEBUG) return;
    const text = safeMessage(msg);
    console.log(`${chalk.gray(`[${fmtTime()}]`)} ${chalk.magenta("🐛")} ${chalk.magenta(text)}`);
    writeLogToFile("DEBUG", text);
  },
};

export default logger;
export { logger };
