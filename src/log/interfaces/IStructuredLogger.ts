/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { LogEntry } from '../LogEntry.js';

export interface IStructuredLogger {
	/**
	 * Log an entry somewhere
	 * @param entry
	 */
	logEntry(entry: LogEntry): void;
}
