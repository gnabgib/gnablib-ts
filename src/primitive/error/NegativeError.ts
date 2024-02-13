/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'NegativeError';

/**
 * An error representing an invalid value, where it should have been greater than or equal to zero,
 * but was found to be negative
 */
export class NegativeError extends RangeError {
	/** $noun should be positive, got $value */
	constructor(readonly noun: string, readonly value: number) {
		super(`${noun} should be positive, got ${value}`);
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
