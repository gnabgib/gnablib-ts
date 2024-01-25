/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class InclusiveRangeError<T> extends RangeError {
	/** Should be in range [$lowInc,$highInc], got $value */
	constructor(readonly value: T, readonly lowInc: T, readonly highInc: T) {
		super(`Should be in range [${lowInc},${highInc}], got ${value}`);
	}

    /** @returns "InclusiveRangeError" */
	get name(): string {
		return 'InclusiveRangeError';
	}
}
