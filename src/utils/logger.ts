import fs from 'fs';
import path from 'path';

export interface LoggerConfig {
  filePath: string;
  fileOutput?: boolean;
  logLevel?: LogLevel;
}

export enum LogLevel {
  START,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE
}

export class Logger {
  private config: LoggerConfig;
  private dir: string;

  constructor(config: LoggerConfig) {
    this.config = {
      fileOutput: true,
      logLevel: LogLevel.INFO,
      ...config
    }
    this.dir = path.dirname(this.config.filePath);
  }

  write(message: string, level: LogLevel): void {
    // Create directory if it doesn't exist
    if (!fs.existsSync(this.config.filePath)) {
      fs.mkdirSync(this.dir, { recursive: true })
    }

    const levelStr = LogLevel[level];
    const timestamp = dateFormat(new Date);
    const msg = `${timestamp} [${levelStr}] ${message}\n`;

    fs.appendFileSync(this.config.filePath, msg);
  }

  start(): void {
    this.write("=".repeat(15) + " Server started " + "=".repeat(15), LogLevel.START);
  }
  debug(message: string): void {
    this.write(message, LogLevel.DEBUG);
  }
  info(message: string): void {
    this.write(message, LogLevel.INFO);
  }
  warn(message: string): void {
    this.write(message, LogLevel.WARN);
  }
  error(message: string): void {
    this.write(message, LogLevel.ERROR);
  }
}

const defaultLogger = new Logger({
  filePath: path.join(__dirname, "../../logs/server.log")
})

export default defaultLogger;

function dateFormat(date: Date): string {
  const padStart = (value: number): string => value.toString().padStart(2, '0');
  const formatted = `[${padStart(date.getDate())}/${padStart(date.getMonth() + 1)}/${date.getFullYear()}][${padStart(date.getHours())}:${padStart(date.getMinutes())}]`;
  return formatted;
}

// Tests
//defaultLogger.info("My log is talking..");
