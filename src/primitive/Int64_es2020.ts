/*! Copyright 2023 gnabgib MPL-2.0 */

import { Int64 as Int64_es2016 } from './Int64.js';

/**
 * A 64 bit int/uint
 */
export class Int64 extends Int64_es2016 {
	toBigInt(): bigint {
		// @ts-expect-error: es2016 doesn't support BigInt, bigint literals
		return (BigInt(this.highU32 >> 0) << 32n) | BigInt(this.lowU32);
	}

	static fromBigInt(num: bigint): Int64 {
		// @ ts-expect-error: es2016 doesn't support BigInt
		const lowMask = BigInt(0xffffffff);
		const low = num & lowMask;
		// @ts-expect-error: es2016 doesn't support bigint literals (32n)
		const high = num >> 32n;
		return new Int64(Number(low), Number(high));
	}
}
