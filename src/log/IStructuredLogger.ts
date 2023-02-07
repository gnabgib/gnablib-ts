import type { LogEntry } from './LogEntry';

export interface IStructuredLogger {
	/**
	 * Log an entry somewhere
	 * @param entry
	 */
	logEntry(entry: LogEntry): void;
}
