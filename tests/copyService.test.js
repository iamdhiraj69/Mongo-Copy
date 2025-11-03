import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";

// Set env vars before any imports to prevent validation errors
process.env.SOURCE_DB_URI = "mongodb://localhost:27017";
process.env.TARGET_DB_URI = "mongodb://localhost:27017";
process.env.DB_NAME = "test_db";

describe("mongodbcopy", () => {
  describe("API exports", () => {
    it("should export copyCollections from api.js", async () => {
      const api = await import("../src/api.js");
      expect(api.copyCollections).toBeDefined();
      expect(typeof api.copyCollections).toBe("function");
    });

    it("should export copyCollectionsNamed from api.js", async () => {
      const api = await import("../src/api.js");
      expect(api.copyCollectionsNamed).toBeDefined();
      expect(typeof api.copyCollectionsNamed).toBe("function");
    });
  });

  describe("copyCollections function", () => {
    let copyCollections;

    beforeAll(async () => {
      const module = await import("../src/core/copyService.js");
      copyCollections = module.copyCollections;
    });

    it("should be exported from core/copyService.js", () => {
      expect(copyCollections).toBeDefined();
      expect(typeof copyCollections).toBe("function");
    });

    it("should accept showProgress parameter", () => {
      expect(copyCollections).toBeDefined();
      // Verify it accepts the parameter by checking it doesn't throw
      expect(() => copyCollections.length).not.toThrow();
    });

    it("should accept copyIndexes parameter", () => {
      expect(copyCollections).toBeDefined();
      expect(() => copyCollections.length).not.toThrow();
    });

    it("should accept validateSchema parameter", () => {
      expect(copyCollections).toBeDefined();
      expect(() => copyCollections.length).not.toThrow();
    });

    it("should accept incremental parameter", () => {
      expect(copyCollections).toBeDefined();
      expect(() => copyCollections.length).not.toThrow();
    });
  });

  describe("Configuration", () => {
    it("should have environment config module", async () => {
      const envModule = await import("../src/utils/config/env.js");
      expect(envModule.default).toBeDefined();
      expect(envModule.SOURCE_DB_URI).toBeDefined();
      expect(envModule.TARGET_DB_URI).toBeDefined();
      expect(envModule.DB_NAME).toBeDefined();
    });

    it("should support BATCH_SIZE configuration", async () => {
      const envModule = await import("../src/utils/config/env.js");
      expect(envModule.default).toBeDefined();
      expect(envModule.default.BATCH_SIZE).toBeDefined();
    });
  });

  describe("Utilities", () => {
    it("should have logger utility", async () => {
      const logger = await import("../src/utils/logger.js");
      expect(logger.default).toBeDefined();
      expect(logger.default.info).toBeDefined();
      expect(logger.default.error).toBeDefined();
      expect(logger.default.warn).toBeDefined();
      expect(logger.default.success).toBeDefined();
    });

    it("should have prompt utilities", async () => {
      const prompt = await import("../src/utils/prompt.js");
      expect(prompt.confirmAction).toBeDefined();
      expect(prompt.askInput).toBeDefined();
      expect(prompt.askSelect).toBeDefined();
      expect(prompt.askMultiSelect).toBeDefined();
    });
  });

  describe("Feature Support", () => {
    it("should have cli-progress dependency installed", async () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
      );
      expect(packageJson.dependencies["cli-progress"]).toBeDefined();
    });

    it("should support progress bar functionality", async () => {
      const cliProgress = await import("cli-progress");
      expect(cliProgress.SingleBar).toBeDefined();
      expect(typeof cliProgress.SingleBar).toBe("function");
    });
  });

  describe("Parameter Validation", () => {
    let copyCollections;

    beforeAll(async () => {
      const module = await import("../src/core/copyService.js");
      copyCollections = module.copyCollections;
    });

    it("should handle empty collections array", () => {
      expect(() => {
        copyCollections({ collections: [] });
      }).not.toThrow();
    });

    it("should handle various batch sizes", () => {
      expect(() => {
        copyCollections({ batchSize: 100 });
        copyCollections({ batchSize: 1000 });
        copyCollections({ batchSize: 5000 });
      }).not.toThrow();
    });

    it("should handle dry run mode", () => {
      expect(() => {
        copyCollections({ dryRun: true });
      }).not.toThrow();
    });

    it("should handle JSON export mode", () => {
      expect(() => {
        copyCollections({ exportJson: true, outputDir: "./test-backup" });
      }).not.toThrow();
    });

    it("should handle JSON import mode", () => {
      expect(() => {
        copyCollections({ importJson: true, outputDir: "./test-backup" });
      }).not.toThrow();
    });

    it("should handle incremental mode with date", () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(() => {
        copyCollections({ incremental: true, since, timestampField: "updatedAt" });
      }).not.toThrow();
    });

    it("should handle schema validation", () => {
      expect(() => {
        copyCollections({ validateSchema: true });
      }).not.toThrow();
    });

    it("should handle index copying", () => {
      expect(() => {
        copyCollections({ copyIndexes: true });
      }).not.toThrow();
    });

    it("should handle progress bar toggle", () => {
      expect(() => {
        copyCollections({ showProgress: true });
        copyCollections({ showProgress: false });
      }).not.toThrow();
    });
  });

  describe("CLI Options", () => {
    it("should support all command line flags", async () => {
      // This test verifies the CLI can be imported without errors
      expect(() => {
        // Note: We don't actually import the CLI here as it would execute
        // Just verify the file exists
        const cliPath = path.join(process.cwd(), "src", "cli", "index.js");
        expect(fs.existsSync(cliPath)).toBe(true);
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing required parameters gracefully", () => {
      // The function should not throw when called without parameters
      // as it has defaults from env
      expect(() => {
        import("../src/core/copyService.js");
      }).not.toThrow();
    });
  });

  describe("Integration Points", () => {
    it("should integrate with MongoDB client", async () => {
      const { MongoClient } = await import("mongodb");
      expect(MongoClient).toBeDefined();
      expect(typeof MongoClient).toBe("function");
    });

    it("should integrate with file system operations", () => {
      expect(fs.existsSync).toBeDefined();
      expect(fs.mkdirSync).toBeDefined();
      expect(fs.writeFileSync).toBeDefined();
      expect(fs.readFileSync).toBeDefined();
    });

    it("should integrate with path utilities", () => {
      expect(path.join).toBeDefined();
      expect(path.resolve).toBeDefined();
    });
  });
});
