/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class LengthError extends RangeError {
    /** Need $need, have $available */
    constructor(readonly need: number, readonly available: number) {
        super(`Need ${need}, have ${available}`);
        this.need = need;
        this.available = available;
    }
}
