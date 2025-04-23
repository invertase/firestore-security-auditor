import { Command } from "commander";
import { LogLevel } from "../utils/logger";

// Define the program
const program = new Command();

program
  .name("firestore-security-auditor")
  .description("CLI tool to audit Firestore security rules")
  .version("0.1.0");

// Add command options
program
  .option("-p, --project <project>", "Firestore project ID")
  .option(
    "-r, --rules-file <rulesFile>",
    "Path to Firestore security rules file"
  )
  .option("-v, --verbose", "Enable verbose output", false)
  .option(
    "--log-level <level>",
    "Set the logging level (debug, info, warn, error, fatal)",
    "info" as LogLevel
  )
  .option("--log-file <file>", "Enable file logging and specify log file path");

// Parse command line arguments
program.parse();

// Get options
export const options = program.opts();
