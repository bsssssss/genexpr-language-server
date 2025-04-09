"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["START"] = 0] = "START";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["NONE"] = 5] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(config) {
        this.config = Object.assign({ fileOutput: true, logLevel: LogLevel.INFO }, config);
        this.dir = path_1.default.dirname(this.config.filePath);
    }
    write(message, level) {
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(this.config.filePath)) {
            fs_1.default.mkdirSync(this.dir, { recursive: true });
        }
        const levelStr = LogLevel[level];
        const timestamp = dateFormat(new Date);
        const msg = `${timestamp} [${levelStr}] ${message}\n`;
        fs_1.default.appendFileSync(this.config.filePath, msg);
    }
    start() {
        this.write("=".repeat(15) + " Server started " + "=".repeat(15), LogLevel.START);
    }
    debug(message) {
        this.write(message, LogLevel.DEBUG);
    }
    info(message) {
        this.write(message, LogLevel.INFO);
    }
    warn(message) {
        this.write(message, LogLevel.WARN);
    }
    error(message) {
        this.write(message, LogLevel.ERROR);
    }
}
exports.Logger = Logger;
const defaultLogger = new Logger({
    filePath: path_1.default.join(__dirname, "../../logs/server.log")
});
exports.default = defaultLogger;
function dateFormat(date) {
    const padStart = (value) => value.toString().padStart(2, '0');
    const formatted = `[${padStart(date.getDate())}/${padStart(date.getMonth() + 1)}/${date.getFullYear()}][${padStart(date.getHours())}:${padStart(date.getMinutes())}]`;
    return formatted;
}
// Tests
//defaultLogger.info("My log is talking..");
//# sourceMappingURL=logger.js.map