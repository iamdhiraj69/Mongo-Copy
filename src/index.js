#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import process from "process";
import logger from "./utils/logger.js";
import { confirmAction } from "./utils/prompt.js";
import env from "./utils/config/env.js";

const program = new Command();
program
  .name("mongocopy")
  .description("Copy MongoDB collections or entire databases between clusters")
  .option("-a, --all", "Copy all collections from source DB")
  .option(
    "-c, --collections <list>",
    "Comma-separated list of collections to copy"
  )
  .option("--dry-run", "Preview the operations without writing to target")
  .option(
    "--batch-size <n>",
    "Documents per insert batch (default from env or 1000)",
    (v) => parseInt(v, 10)
  )
  .option("--yes", "Skip confirmation prompts (CI-friendly)")
  .option(
    "--export-json",
    "Export collections to JSON files (into --output-dir)"
  )
  .option(
    "--import-json",
    "Import collections from JSON files (from --output-dir)"
  )
  .option(
    "--output-dir <dir>",
    "Directory for JSON export/import (default: ./backup)"
  )
  .option(
    "--log-path <path>",
    "Optional path to write logs (if LOG_TO_FILE enabled)"
  )
  .version("1.0.0")
  .parse(process.argv);

const opts = program.opts();

function normalizeCollections(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function dynamicImportCopyService() {
  try {
    return await import(path.resolve(process.cwd(), "./src/copyService.js"));
  } catch {
    try {
      return await import("./copyService.js");
    } catch (err) {
      throw new Error("Failed to load ./src/copyService.js");
    }
  }
}

async function main() {
  const SOURCE_DB_URI = env.SOURCE_DB_URI || process.env.SOURCE_DB_URI;
  const TARGET_DB_URI = env.TARGET_DB_URI || process.env.TARGET_DB_URI;
  const DB_NAME = env.DB_NAME || process.env.DB_NAME;
  if (!SOURCE_DB_URI || !TARGET_DB_URI || !DB_NAME) {
    logger.error(
      "Missing required env vars: SOURCE_DB_URI, TARGET_DB_URI, DB_NAME"
    );
    process.exit(1);
  }

  if (opts.logPath || opts.logPath === "") {
    process.env.LOG_PATH = opts.logPath;
    process.env.LOG_TO_FILE = "true";
  }

  const all = !!opts.all;
  const collections = normalizeCollections(opts.collections);
  const dryRun = !!opts.dryRun;
  const batchSize =
    Number.isFinite(opts.batchSize) && opts.batchSize > 0
      ? opts.batchSize
      : Number.isFinite(env.BATCH_SIZE)
      ? env.BATCH_SIZE
      : 1000;
  const yes = !!opts.yes;
  const exportJson = !!opts.exportJson;
  const importJson = !!opts.importJson;
  const outputDir = opts.outputDir || "./backup";

  if (!all && collections.length === 0 && !exportJson && !importJson) {
    logger.info(
      "Please provide --all or --collections <list> or --export-json/--import-json"
    );
    program.help({ error: false });
    process.exit(0);
  }

  if (exportJson && importJson) {
    logger.error("Cannot use --export-json and --import-json together");
    process.exit(1);
  }

  const display = all
    ? "ALL collections"
    : `collections: ${collections.join(", ")}`;
  const dryText = dryRun ? " (dry-run)" : "";
  if (!yes) {
    const ok = await confirmAction(
      `About to operate on ${display}${dryText}. Continue?`,
      false
    );
    if (!ok) {
      logger.warn("Operation cancelled by user.");
      process.exit(0);
    }
  } else {
    logger.info("Confirmation skipped (--yes).");
  }

  let csModule;
  try {
    csModule = await dynamicImportCopyService();
  } catch (err) {
    logger.error(err.message || String(err));
    process.exit(1);
  }

  const options = {
    all,
    collections,
    dryRun,
    batchSize,
    exportJson,
    importJson,
    outputDir,
    yes,
  };

  try {
    if (typeof csModule.default === "function") {
      await csModule.default(options);
      logger.success("Operation finished.");
      process.exit(0);
    }

    if (typeof csModule.MongoCopyService === "function") {
      const Service = csModule.MongoCopyService;
      const svc = new Service({
        collections: options.collections,
        batchSize: options.batchSize,
        dryRun: options.dryRun,
        yes: options.yes,
        exportJson: options.exportJson,
        importJson: options.importJson,
        outputDir: options.outputDir,
      });
      if (typeof svc.initClients === "function") await svc.initClients();
      if (typeof svc.copyCollections === "function")
        await svc.copyCollections();
      else if (typeof svc.run === "function") await svc.run();
      if (typeof svc.closeClients === "function") await svc.closeClients();
      logger.success("Operation finished.");
      process.exit(0);
    }

    if (csModule && typeof csModule.run === "function") {
      await csModule.run(options);
      logger.success("Operation finished.");
      process.exit(0);
    }

    throw new Error("Unsupported copyService export shape");
  } catch (err) {
    logger.error("Operation failed: " + (err.message || String(err)));
    if (process.env.DEBUG === "true") console.error(err);
    process.exit(1);
  }
}

main();
