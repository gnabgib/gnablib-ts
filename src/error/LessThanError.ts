/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'LessThanError';

export class LessThanError extends RangeError {
	/** $noun should be < $lessThan, got $value */
	constructor(
		readonly noun: string,
		readonly value: number,
		readonly lessThan: number
	) {
		super(`${noun} should be < ${lessThan}, got ${value}`);
	}

	/** @hidden */
	get name(): string {
		return DBG_RPT;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}
}
