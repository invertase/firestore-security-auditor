import chalk from "chalk";
import pino from "pino";
import * as fs from "fs";
import * as path from "path";

// Define log levels
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

// Configuration interface
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFile?: string;
  pretty?: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: "info",
  enableConsole: true,
  enableFile: false,
  pretty: true,
};

// Create Pino logger instance - simplified to avoid transport issues
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || defaultConfig.level,
});

// Setup file logger if needed
let fileLogger: pino.Logger | null = null;

/**
 * Initialize the logger with custom configuration
 */
export function initLogger(config: Partial<LoggerConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Update Pino logger level
  pinoLogger.level = finalConfig.level;

  // Setup file logger if enabled
  if (finalConfig.enableFile && finalConfig.logFile) {
    const logDir = path.dirname(finalConfig.logFile);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fileLogger = pino(
      { level: finalConfig.level },
      pino.destination(finalConfig.logFile)
    );
  }
}

/**
 * Log a debug message
 */
export function debug(message: string, data?: any): void {
  if (defaultConfig.enableConsole) {
    console.log(chalk.gray(`[DEBUG] ${message}`));
    if (data) console.log(chalk.gray(JSON.stringify(data, null, 2)));
  }

  pinoLogger.debug(data || {}, message);
  fileLogger?.debug(data || {}, message);
}

/**
 * Log an info message
 */
export function info(message: string, data?: any): void {
  if (defaultConfig.enableConsole) {
    console.log(chalk.blue(`[INFO] ${message}`));
    if (data) console.log(data);
  }

  pinoLogger.info(data || {}, message);
  fileLogger?.info(data || {}, message);
}

/**
 * Log a success message
 */
export function success(message: string, data?: any): void {
  if (defaultConfig.enableConsole) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
    if (data) console.log(data);
  }

  pinoLogger.info({ success: true, ...data }, message);
  fileLogger?.info({ success: true, ...data }, message);
}

/**
 * Log a warning message
 */
export function warn(message: string, data?: any): void {
  if (defaultConfig.enableConsole) {
    console.log(chalk.yellow(`[WARNING] ${message}`));
    if (data) console.log(data);
  }

  pinoLogger.warn(data || {}, message);
  fileLogger?.warn(data || {}, message);
}

/**
 * Log an error message
 */
export function error(message: string, err?: Error | any): void {
  if (defaultConfig.enableConsole) {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (err?.stack) {
      console.error(chalk.red(err.stack));
    } else if (err) {
      console.error(chalk.red(JSON.stringify(err, null, 2)));
    }
  }

  if (err instanceof Error) {
    pinoLogger.error({ err }, message);
    fileLogger?.error({ err }, message);
  } else {
    pinoLogger.error(err || {}, message);
    fileLogger?.error(err || {}, message);
  }
}

/**
 * Log a fatal error message
 */
export function fatal(message: string, err?: Error | any): void {
  if (defaultConfig.enableConsole) {
    console.error(chalk.bgRed.white(`[FATAL] ${message}`));
    if (err?.stack) {
      console.error(chalk.red(err.stack));
    } else if (err) {
      console.error(chalk.red(JSON.stringify(err, null, 2)));
    }
  }

  if (err instanceof Error) {
    pinoLogger.fatal({ err }, message);
    fileLogger?.fatal({ err }, message);
  } else {
    pinoLogger.fatal(err || {}, message);
    fileLogger?.fatal(err || {}, message);
  }
}

/**
 * Create a logger object with all methods
 */
export const logger = {
  debug,
  info,
  success,
  warn,
  error,
  fatal,
  initLogger,
};

// Export default logger
export default logger;
