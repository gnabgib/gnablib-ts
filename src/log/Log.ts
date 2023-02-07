import * as intExt from '../primitive/IntExt';
import { LogLevel } from './LogLevel';
import type { IStructuredLogger } from './IStructuredLogger';
import { LogEntry } from './LogEntry';
import { LogConsole } from './LogConsole';

class Log {
	private _log: IStructuredLogger;
	private _ignoreUnder: number;

	constructor() {
		this._log = new LogConsole();
		this._ignoreUnder = LogLevel.info().value - 1;
	}

	set log(log: IStructuredLogger) {
		this._log = log;
	}

	set ignoreUnder(value: number) {
		intExt.inRangeInclusive(value, 0, 255);
		this._ignoreUnder = value;
	}

	logEntry(entry: LogEntry) {
		if (entry.level.value < this._ignoreUnder) return;
		this._log.logEntry(entry);
	}

	debug(message: string, fieldSet?: Record<string, unknown>) {
		this.logEntry(new LogEntry(LogLevel.debug(), message, fieldSet));
	}

	info(message: string, fieldSet?: Record<string, unknown>) {
		this.logEntry(new LogEntry(LogLevel.info(), message, fieldSet));
	}

	warn(message: string, fieldSet?: Record<string, unknown>) {
		this.logEntry(new LogEntry(LogLevel.warn(), message, fieldSet));
	}

	error(message: string, fieldSet?: Record<string, unknown>) {
		this.logEntry(new LogEntry(LogLevel.error(), message, fieldSet));
	}
}
/**
 * Log oracle (singleton)
 */
export const log = new Log();
