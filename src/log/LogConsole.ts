import type { IStructuredLogger } from './IStructuredLogger.js';
import type { LogEntry } from './LogEntry.js';

export class LogConsole implements IStructuredLogger {
	logEntry(entry: LogEntry): void {
		console.log(entry.level.asString(), entry.message);
		entry.fields.forEach((el) => {
			console.log(' - ', el.name, '=', el.value);
		});
	}
}
