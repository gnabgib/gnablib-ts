/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'GrievousError';

export class GrievousError extends Error {
	/** Most grievous of situations (log a bug): $reason */
	constructor(readonly reason: string) {
		super('Most grievous of situations (log a bug): ' + reason);
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
