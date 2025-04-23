#!/usr/bin/env node
import { config } from "dotenv";
config(); // Load environment variables from .env file

import * as fs from "fs";
import * as path from "path";

import ora from "ora";
import { logger, LogLevel } from "./utils/logger";
import { NotFoundError } from "./utils/errors";
import { options } from "./commander/program";
import { fetchRulesFromProject } from "./rules/fetch";
import { auditFlow } from "./genkit/flows/audit";
import { prettyReport } from "./utils/prettyReport";

let rulesContent: string = "";

async function runAudit() {
  // Initialize logger
  logger.initLogger({
    level: options.logLevel as LogLevel,
    enableConsole: true,
    enableFile: !!options.logFile,
    logFile: options.logFile,
    pretty: options.verbose,
  });

  logger.info("Starting Firestore security rules audit...");

  if (!options.project) {
    logger.error("Project ID is required. Use --project or -p option.");
    process.exit(1);
  }

  // ─── Fetch Rules ─────────────────────────────────────────────────────────────
  const fetchSpinner = ora(
    `Fetching Firestore rules for project ${options.project}\n`
  ).start();
  try {
    if (options.rulesFile) {
      const rulesPath = path.resolve(options.rulesFile);
      if (!fs.existsSync(rulesPath)) {
        throw new NotFoundError("Rules file", rulesPath);
      }
      rulesContent = fs.readFileSync(rulesPath, "utf8");
      fetchSpinner.succeed(
        `Loaded rules from file (${rulesContent.length} bytes)`
      );
    } else {
      rulesContent = await fetchRulesFromProject(options.project);
      fetchSpinner.succeed("Fetched rules from Firebase");
    }
  } catch (err) {
    fetchSpinner.fail("Could not load rules");
    logger.error("Error loading rules", err);
    process.exit(1);
  }

  // ─── Process Rules ───────────────────────────────────────────────────────────
  const processSpinner = ora("Processing rules…\n").start();
  try {
    processRules(rulesContent);
    processSpinner.succeed("Rules processed");
  } catch (err) {
    processSpinner.fail("Rule processing failed");
    logger.error("Failed to process rules", err);
    process.exit(1);
  }

  // ─── Run Audit ───────────────────────────────────────────────────────────────
  const auditSpinner = ora("Running security audit…\n").start();
  let result;
  try {
    result = await auditFlow({
      rules: rulesContent,
      projectId: options.project,
    });
    auditSpinner.succeed("Audit complete");
  } catch (err) {
    auditSpinner.fail("Audit failed");
    logger.error("Audit error", err);
    process.exit(1);
  }

  // ─── Pretty Console Report ──────────────────────────────────────────────────
  prettyReport(result);
}

runAudit().catch((err) => {
  logger.fatal("Unexpected error", err);
  process.exit(1);
});

/**
 * Process rules from file (basic validation & logging)
 */
function processRules(rules: string): void {
  logger.info("Processing rules...");
  logger.info(`Rules content length: ${rules.length} bytes`);
  if (!rules.includes("service cloud.firestore")) {
    logger.warn(
      "The provided content may not be valid Firestore security rules"
    );
  }
  logger.debug("Rules processed successfully");
}
