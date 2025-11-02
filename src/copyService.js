import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import ora from "ora";
import { logger } from "./utils/logger.js";
import { confirm } from "./utils/prompt.js";
import { loadEnv } from "./utils/config/env.js";

const { SOURCE_URI, DEST_URI } = loadEnv();

export class MongoCopyService {
  constructor(options = {}) {
    this.sourceUri = SOURCE_URI;
    this.destUri = DEST_URI;
    this.collections = options.collections || [];
    this.batchSize = options.batchSize || 1000;
    this.dryRun = options.dryRun || false;
    this.yes = options.yes || false;
    this.exportJson = options.exportJson || false;
    this.importJson = options.importJson || false;
    this.outputDir = options.outputDir || "./backup";
  }

  async initClients() {
    this.sourceClient = new MongoClient(this.sourceUri);
    this.destClient = new MongoClient(this.destUri);
    await this.sourceClient.connect();
    await this.destClient.connect();
    this.sourceDb = this.sourceClient.db();
    this.destDb = this.destClient.db();
  }

  async closeClients() {
    await Promise.allSettled([
      this.sourceClient?.close(),
      this.destClient?.close(),
    ]);
  }

  async listCollections() {
    const cols = await this.sourceDb.listCollections().toArray();
    const names = cols.map((c) => c.name);
    if (this.collections.length === 0) this.collections = names;
    else this.collections = this.collections.filter((c) => names.includes(c));
    return this.collections;
  }

  async copyCollections() {
    const collections = await this.listCollections();

    if (!this.yes) {
      const ok = await confirm(
        `Copy ${collections.length} collection(s): ${collections.join(", ")}?`
      );
      if (!ok) return logger.warn("Operation cancelled by user.");
    }

    const spinner = ora("Starting copy...").start();

    try {
      for (const name of collections) {
        spinner.text = `Processing collection: ${name}`;
        const sourceCol = this.sourceDb.collection(name);
        const destCol = this.destDb.collection(name);

        if (this.dryRun) {
          logger.info(`[DRY-RUN] Would copy collection: ${name}`);
          continue;
        }

        await this.copyCollection(sourceCol, destCol, name, spinner);
      }

      spinner.succeed("✅ Copy completed successfully.");
    } catch (err) {
      spinner.fail("❌ Copy failed.");
      logger.error(err.message);
    } finally {
      await this.closeClients();
    }
  }

  async copyCollection(sourceCol, destCol, name, spinner) {
    const totalDocs = await sourceCol.countDocuments();
    let processed = 0;

    const cursor = sourceCol.find({});
    while (await cursor.hasNext()) {
      const batch = [];
      for (let i = 0; i < this.batchSize && (await cursor.hasNext()); i++) {
        batch.push(await cursor.next());
      }

      if (this.exportJson) {
        await this.exportBatchToJson(batch, name);
      } else if (this.importJson) {
        await this.importBatchFromJson(name);
      } else {
        await destCol.insertMany(batch, { ordered: false });
      }

      processed += batch.length;
      spinner.text = `Collection ${name}: ${processed}/${totalDocs} documents`;
    }

    logger.success(`✔ Finished collection ${name} (${totalDocs} docs)`);
  }

  async exportBatchToJson(batch, name) {
    const dir = path.resolve(this.outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${name}.json`);
    fs.appendFileSync(filePath, JSON.stringify(batch, null, 2));
  }

  async importBatchFromJson(name) {
    const filePath = path.join(this.outputDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found: ${filePath}`);
      return;
    }

    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const destCol = this.destDb.collection(name);
    await destCol.insertMany(json, { ordered: false });
    logger.success(`Imported ${json.length} docs into ${name}`);
  }
}
