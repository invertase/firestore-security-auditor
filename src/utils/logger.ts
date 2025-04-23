// utils/logger.ts
import chalk from "chalk";
import pino from "pino";
import * as fs from "fs";
import * as path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFile?: string;
  pretty?: boolean;
}

// lower default to warn
const defaultConfig: LoggerConfig = {
  level: "warn",
  enableConsole: true,
  enableFile: false,
  pretty: true,
};

// numeric weights
const levelValues: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

let currentConfig = { ...defaultConfig };

const pinoLogger = pino(
  { level: process.env.LOG_LEVEL || defaultConfig.level },
  pino.destination({ dest: "/dev/null", sync: false })
);

let fileLogger: pino.Logger | null = null;

export function initLogger(config: Partial<LoggerConfig> = {}) {
  currentConfig = { ...defaultConfig, ...config };
  pinoLogger.level = currentConfig.level;

  if (currentConfig.enableFile && currentConfig.logFile) {
    const logDir = path.dirname(currentConfig.logFile);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fileLogger = pino(
      { level: currentConfig.level },
      pino.destination(currentConfig.logFile)
    );
  }
}

function shouldConsoleLog(level: LogLevel) {
  return (
    currentConfig.enableConsole &&
    levelValues[level] >= levelValues[currentConfig.level]
  );
}

export function debug(msg: string, data?: any) {
  if (shouldConsoleLog("debug")) {
    console.log(chalk.gray(`[DEBUG] ${msg}`));
    if (data) console.log(chalk.gray(JSON.stringify(data, null, 2)));
  }
  pinoLogger.debug(data || {}, msg);
  fileLogger?.debug(data || {}, msg);
}

export function info(msg: string, data?: any) {
  if (shouldConsoleLog("info")) {
    console.log(chalk.blue(`[INFO]  ${msg}`));
    if (data) console.log(data);
  }
  pinoLogger.info(data || {}, msg);
  fileLogger?.info(data || {}, msg);
}

export function success(msg: string, data?: any) {
  if (shouldConsoleLog("info")) {
    console.log(chalk.green(`[SUCCESS] ${msg}`));
    if (data) console.log(data);
  }
  pinoLogger.info({ success: true, ...data }, msg);
  fileLogger?.info({ success: true, ...data }, msg);
}

export function warn(msg: string, data?: any) {
  if (shouldConsoleLog("warn")) {
    console.log(chalk.yellow(`[WARNING] ${msg}`));
    if (data) console.log(data);
  }
  pinoLogger.warn(data || {}, msg);
  fileLogger?.warn(data || {}, msg);
}

export function error(msg: string, err?: Error | any) {
  if (shouldConsoleLog("error")) {
    console.error(chalk.red(`[ERROR] ${msg}`));
    if (err?.stack) console.error(chalk.red(err.stack));
    else if (err) console.error(chalk.red(JSON.stringify(err, null, 2)));
  }
  if (err instanceof Error) {
    pinoLogger.error({ err }, msg);
    fileLogger?.error({ err }, msg);
  } else {
    pinoLogger.error(err || {}, msg);
    fileLogger?.error(err || {}, msg);
  }
}

export function fatal(msg: string, err?: Error | any) {
  if (shouldConsoleLog("fatal")) {
    console.error(chalk.bgRed.white(`[FATAL] ${msg}`));
    if (err?.stack) console.error(chalk.red(err.stack));
    else if (err) console.error(chalk.red(JSON.stringify(err, null, 2)));
  }
  if (err instanceof Error) {
    pinoLogger.fatal({ err }, msg);
    fileLogger?.fatal({ err }, msg);
  } else {
    pinoLogger.fatal(err || {}, msg);
    fileLogger?.fatal(err || {}, msg);
  }
}

export const logger = {
  debug,
  info,
  success,
  warn,
  error,
  fatal,
  initLogger,
};
