/*! Copyright 2023 gnabgib MPL-2.0 */

import { LogField } from './LogField.js';
import type { LogLevel } from './LogLevel.js';
import { safety } from '../primitive/Safety.js';

/**
 * A complete log entry
 */
export class LogEntry {
	readonly level: LogLevel;
	readonly message: string;
	readonly fields: LogField[];

	constructor(level: LogLevel, message: string, fieldSet?: Record<string, unknown>) {
		this.level = level;
		this.message = message;
		this.fields = [];
		if (fieldSet) {
			for (const key in fieldSet) {
				this.fields.push(new LogField(key, fieldSet[key]));
			}
		}
	}

	add(name: string, value: unknown): void {
		this.fields.push(new LogField(name, value));
	}

	addField(field: LogField): void {
		safety.notNull(field, 'Field');
		this.fields.push(field);
	}
}
