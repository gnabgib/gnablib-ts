/*! Copyright 2024 the gnablib contributors MPL-1.1 */

const DBG_RPT = 'InclusiveRangeError';

export class InclusiveRangeError<T> extends RangeError {
	/** Should be in range [$lowInc,$highInc], got $value */
	constructor(readonly noun:string, readonly value: T, readonly lowInc: T, readonly highInc: T) {
		super(`${noun} should be in range [${lowInc},${highInc}] got ${value}`);
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
