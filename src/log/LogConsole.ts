import type { IStructuredLogger } from './IStructuredLogger';
import type { LogEntry } from './LogEntry';

export class LogConsole implements IStructuredLogger {
	logEntry(entry: LogEntry): void {
		console.log(entry.level.asString(), entry.message);
		entry.fields.forEach((el) => {
			console.log(' - ', el.name, '=', el.value);
		});
	}
}
