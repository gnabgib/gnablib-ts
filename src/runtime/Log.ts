/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { color } from '../cli/csi-tables.js';
import { DateTimeUtc } from '../datetime/dt.js';
import { config } from './Config.js';
import { callFrom } from './callFrom.js';
import {
	ILogEntry,
	ILogOracle,
	ILogTarget,
	LogLevel,
} from './interfaces/ForLog.js';
const { cyan, gray, yellow, red, magenta, reset } = color;

class Entry implements ILogEntry {
	readonly when: DateTimeUtc;
	constructor(
		readonly level: LogLevel,
		readonly message: string,
		readonly fields: Record<string, unknown>,
		when?: DateTimeUtc
	) {
		/* c8 ignore next - for now this is always... `now` but in a deser future..*/
		this.when = when ? when : DateTimeUtc.now();
		//Utility, if there's a caller:undefined in fields, we'll determine it here
		if ('caller' in fields && fields['caller'] == undefined) {
			this.fields['caller'] = callFrom(2);
		}
	}

	/**
	 * Get level/time/message as a string **note** fields are not included, you may wish to add yourself
	 */
	toString(inColor: boolean): string {
		const level = (LogLevel[this.level] + ' ').substring(0, 5);
		if (!inColor)
			return `[${level}] ` + this.when.toString() + ' ' + this.message;

		const clr = [gray, cyan, yellow, red][this.level];
		return (
			`[${clr}${level}${reset}] ` +
			`${magenta}${this.when.toString()}${reset} ` +
			this.message
		);
	}
}

/**
 * Log nowhere, this is the default (if `log.target` is not set), dropping all logs
 */
class LogNone implements ILogTarget {
	readonly supportColor = false;
	log(): void {}
}

/**
 * Log to the console, errors go to console.error, all else to console.log
 * if config.color then the output will be in color
 */
/* c8 ignore start - testing this without making noise is tricky, use DEMO=true instead */
export class LogConsole implements ILogTarget {
	readonly supportColor: boolean;
	constructor(color = true) {
		this.supportColor = color && config.getBool('color');
	}

	/**
	 * Log an entry to the console (as long as the level is high enough)
	 */
	log(entry: ILogEntry): void {
		if (entry.level == LogLevel.Error) {
			//Error cannot be filtered
			console.error(
				entry.toString(this.supportColor) + ' ' + JSON.stringify(entry.fields)
			);
		} else {
			console.log(
				entry.toString(this.supportColor) + ' ' + JSON.stringify(entry.fields)
			);
		}
	}
}
/* c8 ignore stop */
export class LogFilter implements ILogTarget {
	/**
	 * Minimum level that's logged, where DEBUG<INFO<WARN<ERROR
	 */
	ignoreUnder: LogLevel;

	constructor(readonly target: ILogTarget, ignoreUnder = LogLevel.Info) {
		/* c8 ignore next - this is just here for invariant JS calls*/
		this.ignoreUnder = ignoreUnder ?? LogLevel.Info;
	}

	get supportColor(): boolean {
		return this.target.supportColor;
	}

	log(entry: ILogEntry): void {
		if (entry.level < this.ignoreUnder) return;
		this.target.log(entry);
	}
}

class Log {
	private _target: ILogTarget = new LogNone();

	set target(log: ILogTarget | undefined) {
		this._target.log(
			new Entry(LogLevel.Warn, 'Log target being switched', {
				caller: undefined,
			})
		);
		this._target = log ?? new LogNone();
	}

	get supportColor(): boolean {
		return this._target.supportColor;
	}

	debug(message: string, fields: Record<string, unknown> = {}): void {
		this._target.log(new Entry(LogLevel.Debug, message, fields));
	}

	info(message: string, fields: Record<string, unknown> = {}): void {
		this._target.log(new Entry(LogLevel.Info, message, fields));
	}

	warn(message: string, fields: Record<string, unknown> = {}): void {
		this._target.log(new Entry(LogLevel.Warn, message, fields));
	}

	error(message: string, fields: Record<string, unknown> = {}): void {
		this._target.log(new Entry(LogLevel.Error, message, fields));
	}
}

/**
 * Log oracle (singleton)
 */
export const log: ILogOracle = new Log();
