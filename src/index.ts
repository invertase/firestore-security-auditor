#!/usr/bin/env node
import { config } from "dotenv";
config(); // Load environment variables from .env file
import * as fs from "fs";
import * as path from "path";
import logger, { LogLevel } from "./utils/logger";
import { NotFoundError, InternalError } from "./utils/errors";
import { options } from "./commander/program";
import { fetchRulesFromProject } from "./rules/fetch";
import { auditFlow } from "./genkit/flows/audit";
export { auditFlow } from "./genkit/flows/audit";
import { formatAuditResultForOutput } from "./utils/formatAuditResultForOutput";

// Variable to store the rules content globally
let rulesContent: string = "";

/**
 * Main function to run the audit
 */
async function runAudit() {
  // Initialize logger based on options
  logger.initLogger({
    level: options.logLevel as LogLevel,
    enableConsole: true,
    enableFile: !!options.logFile,
    logFile: options.logFile,
    pretty: options.verbose,
  });

  logger.info("Starting Firestore security rules audit...");

  // Check if required options are provided
  if (!options.project) {
    logger.error("Project ID is required. Use --project or -p option.");
    process.exit(1);
  }

  if (options.verbose) {
    logger.debug("Verbose mode enabled");
    logger.debug("CLI Options", options);
  }

  // Load rules file if provided
  if (options.rulesFile) {
    try {
      const rulesPath = path.resolve(options.rulesFile);
      logger.info(`Loading rules from: ${rulesPath}`);

      // Check if file exists
      if (!fs.existsSync(rulesPath)) {
        throw new NotFoundError("Rules file", rulesPath);
      }

      // Read the rules file
      rulesContent = fs.readFileSync(rulesPath, "utf8");
      logger.info(`Rules file loaded (${rulesContent.length} bytes)`);

      // Process rules
      processRules(rulesContent);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.error(`${error.message}`);
      } else {
        logger.error(`Error loading rules file`, error);
      }
      process.exit(1);
    }
  } else {
    logger.info(
      "No rules file provided, will attempt to fetch rules from project"
    );

    // Fetch rules from project
    try {
      rulesContent = await fetchRulesFromProject(options.project);
      processRules(rulesContent);
    } catch (error) {
      logger.error("Failed to fetch rules from project", error);
      process.exit(1);
    }
  }

  // Run the audit
  try {
    await performAudit(options.project);
    logger.success("Audit completed successfully!");
  } catch (error) {
    logger.error("Audit failed", error);
    process.exit(1);
  }
}

/**
 * Process rules from file
 */
function processRules(rules: string): void {
  // This is where you would parse and analyze the rules
  logger.info("Processing rules...");

  logger.info(`Rules content length: ${rules.length} bytes`);
  if (options.verbose) {
    logger.debug("Rules content:", rules);
  }

  try {
    // Basic validation that these are Firestore rules
    if (!rules.includes("service cloud.firestore")) {
      logger.warn(
        "The provided content may not be valid Firestore security rules"
      );
    }

    logger.debug("Rules processed successfully");
  } catch (error) {
    logger.error("Failed to process rules", error);
    throw new InternalError(`Rule processing failed`);
  }
}

/**
 * Perform the security audit using Gemini
 */
async function performAudit(projectId: string): Promise<void> {
  logger.info(`Performing security audit for project: ${projectId}...`);

  try {
    // Make sure we have rules content
    if (!rulesContent || rulesContent.trim() === "") {
      throw new Error("No rules content available for audit");
    }

    logger.info("Sending rules to AI for analysis...");

    // Call the auditFlow with rules content and project ID
    const result = await auditFlow({
      rules: rulesContent,
      projectId: projectId,
    });

    // Log the audit results
    logger.info(
      `Audit completed with overall rating: ${result.overallRating}/10`
    );

    // Log vulnerabilities
    if (result.vulnerabilities.length > 0) {
      logger.info(`Found ${result.vulnerabilities.length} vulnerabilities:`);

      for (const vuln of result.vulnerabilities) {
        const severityColor = getSeverityColor(vuln.severity);
        logger.info(`[${severityColor}] ${vuln.description}`);
        logger.info(`  Recommendation: ${vuln.recommendation}`);
        if (vuln.location) {
          logger.info(`  Location: ${vuln.location}`);
        }
      }
    } else {
      logger.info("No vulnerabilities found.");
    }

    // Log best practices
    if (result.bestPractices.length > 0) {
      logger.info("Best practices recommendations:");
      result.bestPractices.forEach((practice, index) => {
        logger.info(`${index + 1}. ${practice}`);
      });
    }

    // Log summary
    logger.info("Summary: " + result.summary);

    // Print output to a file if requested
    if (options.outputFile) {
      const outputPath = path.resolve(options.outputFile);
      const outputDir = path.dirname(outputPath);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create formatted output
      const formattedOutput = formatAuditResultForOutput(result);

      // Write to file
      fs.writeFileSync(outputPath, formattedOutput);
      logger.success(`Audit results written to ${outputPath}`);
    }
  } catch (error) {
    logger.error(`Failed to perform audit for project ${projectId}`, error);
    throw new InternalError(`Audit failed`);
  }
}

/**
 * Helper function to get color based on severity
 */
function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
    default:
      return severity.toUpperCase();
  }
}

runAudit();
