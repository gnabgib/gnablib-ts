/*! Copyright 2023 the gnablib contributors MPL-1.1 */

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
	readonly reason?: string;

	constructor(
		bytes: number,
		value?: T,
		reason?: string
	) {
		this.byteLen = bytes;
		this.value = value;
		this.reason = reason;
	}

	get success(): boolean {
		return this.byteLen > 0;
	}

	switchT<U>(): FromBinResult<U> {
		if (this.value != undefined)
			throw new TypeError('Unable to convert T to U');
		return new FromBinResult<U>(this.byteLen, undefined, this.reason);
	}
}
