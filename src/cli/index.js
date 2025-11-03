#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import logger from "../utils/logger.js";
import { confirmAction } from "../utils/prompt.js";
import copyCollections from "../core/copyService.js";
import env from "../utils/config/env.js";

const program = new Command();
program
  .name("mongodbcopy")
  .option("-a, --all", "Copy all collections")
  .option("-c, --collections <list>", "Comma-separated collections")
  .option("--dry-run", "Simulate without writing")
  .option("--batch-size <n>", "Batch size", (v) => parseInt(v, 10))
  .option("--yes", "Skip confirmation")
  .option("--export-json", "Export collections to JSON")
  .option("--import-json", "Import collections from JSON")
  .option("--output-dir <dir>", "Output directory for JSON", "./backup")
  .option("--log-path <path>", "Log file path")
  .option("--no-progress", "Disable progress bars")
  .option("--copy-indexes", "Copy indexes from source to target")
  .option("--validate-schema", "Validate schema before copying")
  .option("--incremental", "Perform incremental backup (only new/updated docs)")
  .option("--timestamp-field <field>", "Field to use for incremental backup", "_updatedAt")
  .option("--since <date>", "Date for incremental backup (ISO format)", (v) => new Date(v))
  .version("1.0.0")
  .parse(process.argv);

const opts = program.opts();
if (opts.logPath) {
  process.env.LOG_TO_FILE = "true";
  process.env.LOG_PATH = path.resolve(opts.logPath);
}

const all = !!opts.all;
const collections = opts.collections
  ? opts.collections
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];
const dryRun = !!opts.dryRun;
const batchSize =
  Number.isFinite(opts.batchSize) && opts.batchSize > 0 ? opts.batchSize : env.BATCH_SIZE || 1000;
const yes = !!opts.yes;
const exportJson = !!opts.exportJson;
const importJson = !!opts.importJson;
const outputDir = opts.outputDir || "./backup";
const showProgress = opts.progress !== false;
const copyIndexes = !!opts.copyIndexes;
const validateSchema = !!opts.validateSchema;
const incremental = !!opts.incremental;
const timestampField = opts.timestampField || "_updatedAt";
const since = opts.since || null;

if (!all && collections.length === 0 && !exportJson && !importJson) {
  logger.info("Provide --all or --collections or --export-json/--import-json");
  program.help({ error: false });
  process.exit(0);
}
if (exportJson && importJson) {
  logger.error("Cannot use --export-json and --import-json together");
  process.exit(1);
}
const targetCollections = all ? [] : collections;
(async () => {
  if (!yes) {
    const display = all ? "ALL collections" : `collections: ${targetCollections.join(", ")}`;
    const ok = await confirmAction(
      `About to operate on ${display}${dryRun ? " (dry-run)" : ""}. Continue?`,
      false
    );
    if (!ok) {
      logger.warn("Cancelled by user");
      process.exit(0);
    }
  }
  try {
    const result = await copyCollections({
      collections: targetCollections,
      dryRun,
      batchSize,
      exportJson,
      importJson,
      outputDir,
      showProgress,
      copyIndexes,
      validateSchema,
      incremental,
      timestampField,
      since,
    });
    for (const r of result) {
      logger.info(`${r.name}: ${r.status} (${r.copied}/${r.total})`);
    }
    logger.success("Operation completed");
    process.exit(0);
  } catch (err) {
    logger.error(err.stack || err.message || String(err));
    process.exit(1);
  }
})();
