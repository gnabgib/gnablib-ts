/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'ZeroError';

/**
 * An error representing an invalid value, where it should have been anything but zero
 */
export class ZeroError extends RangeError {
	/** $noun should not be 0 */
	constructor(readonly noun: string) {
		super(`${noun} should not be 0`);
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
