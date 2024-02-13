/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'AtMostError';

/**
 * An error representing an invalid value, where it should have been less than equal to a value
 */
export class AtMostError extends RangeError {
	/** $noun should be at most $max, got $value */
	constructor(
		readonly noun: string,
		readonly max: number,
		readonly value: number
	) {
		super(`${noun} should be at most ${max}, got ${value}`);
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
