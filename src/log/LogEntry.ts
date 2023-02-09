/*! Copyright 2023 gnabgib MPL-2.0 */

import { LogField } from './LogField.js';
import type { LogLevel } from './LogLevel.js';
import * as objExt from '../primitive/ObjExt.js';

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
		this.fields = new Array<LogField>();
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
		objExt.notNull(field, 'Field');
		this.fields.push(field);
	}
}
