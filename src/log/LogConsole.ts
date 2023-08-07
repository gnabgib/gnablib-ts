/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { IStructuredLogger } from './interfaces/IStructuredLogger.js';
import type { LogEntry } from './LogEntry.js';

export class LogConsole implements IStructuredLogger {
	logEntry(entry: LogEntry): void {
		console.log(entry.level.asString(), entry.message);
		entry.fields.forEach((el) => {
			console.log(' - ', el.name, '=', el.value);
		});
	}
}
