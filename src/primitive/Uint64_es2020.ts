/*! Copyright 2023 gnabgib MPL-2.0 */

import { Uint64 as Uint64_es2016 } from './Uint64.js';

/**
 * A 64 bit int/uint
 */
export class Uint64 extends Uint64_es2016 {
	toBigInt(): bigint {
		// @ts-expect-error: es2016 doesn't support BigInt, bigint literals
		return (BigInt(this.highU32) << 32n) | BigInt(this.lowU32);
		//return BigInt('0x'+hex.fromBytes(this.toBytes()));
	}

	static fromBigInt(num: bigint): Uint64 {
		// @ts-expect-error: es2016 doesn't support BigInt
		const lowMask = BigInt(0xffffffff);
		const low = num & lowMask;
		// @ts-expect-error: es2016 doesn't support bigint literals (32n)
		const high = num >> 32n;
		return new Uint64(Number(low), Number(high));
	}
}
