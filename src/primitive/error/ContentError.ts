/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class ContentError extends SyntaxError {
    /** Invalid; $reason ($value) */
	constructor(readonly reason: string, readonly value?: unknown) {
		super(`Invalid; ${reason} (${value??''})`);
	}
}