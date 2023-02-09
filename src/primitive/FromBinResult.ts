/*! Copyright 2023 gnabgib MPL-2.0 */

export class BinResult {
	readonly value: unknown;
	readonly byteLen: number;

	constructor(byteLen: number, value: unknown) {
		this.byteLen = byteLen;
		this.value = value;
	}
}
export class FromBinResult<T> {
	readonly value?: T;
	readonly byteLen: number;
	readonly reason: string | undefined;

	constructor(
		bytes: number,
		value?: T,
		reason: string | undefined = undefined
	) {
		this.byteLen = bytes;
		this.value = value;
		this.reason = reason;
	}

	get success(): boolean {
		return this.byteLen > 0;
	}

	switchT<U>(): FromBinResult<U> {
		if (this.value !== undefined)
			throw new TypeError('Unable to convert T to U');
		return new FromBinResult<U>(this.byteLen, undefined, this.reason);
	}
}
