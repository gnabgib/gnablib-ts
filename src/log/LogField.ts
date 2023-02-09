/*! Copyright 2023 gnabgib MPL-2.0 */

/**
 * A tuple of the field name and value
 */
export class LogField {
	readonly name: string;
	readonly value: unknown;
	constructor(name: string, value: unknown) {
		this.name = name;
		this.value = value;
	}
}
