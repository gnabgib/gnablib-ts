/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { intExt } from '../primitive/xtInt.js';
import { utf8 } from '../codec/Utf8.js';
import { fpb64 } from '../codec/ieee754-fpb.js';
import { Uint64 } from '../primitive/Uint64.js';
import { Int64 } from '../primitive/Int64.js';
import { FromBinResult } from '../primitive/FromBinResult.js';
import { asBE } from '../endian/platform.js';
import { DateTimeLocal } from '../datetime/dt.js';
import { BitWriter } from '../primitive/BitWriter.js';

/**
 * @alpha
 */
export function unknownToBin(value: unknown): Uint8Array {
	let ret: Uint8Array;
	if (typeof value === 'string') {
		const enc = utf8.toBytes(value);
		const len = intExt.uintToScaleBytes(enc.length);
		ret = new Uint8Array(len.length + enc.length);
		ret.set(len);
		ret.set(enc, len.length);
	} else if (typeof value === 'boolean') {
		ret = new Uint8Array(2);
		ret[0] = 1;
		ret[1] = value ? 1 : 0;
	} else if (typeof value === 'number') {
		if (Number.isInteger(value)) {
			const n = asBE.intMinBytes(value);
			ret = new Uint8Array(1 + n.length);
			ret[0] = n.length;
			ret.set(n, 1);
		} else {
			const f = fpb64.toBytes(value);
			ret = new Uint8Array(1 + f.length);
			ret[0] = f.length;
			ret.set(f, 1);
		}
	} else if (value == undefined) {
		ret = new Uint8Array(1);
		//ret[0]=0;
	} else if (value instanceof DateTimeLocal) {
		ret = new Uint8Array(1 + value.serialSizeBits / 8);
		const bw = BitWriter.mount(ret);
		bw.pushNumberBE(value.serialSizeBits / 8, 1);
		value.serialize(bw);
	} else if (value instanceof Int64) {
		const i = value.toMinBytes();
		ret = new Uint8Array(1 + i.length);
		ret[0] = i.length;
		ret.set(i, 1);
	} else if (value instanceof Uint64) {
		const u = asBE.minBytes(value.toBytes());
		//uintToMinBytes(value);
		ret = new Uint8Array(1 + u.length);
		ret[0] = u.length;
		ret.set(u, 1);
	} else {
		throw new Error('Bad data ' + typeof value);
	}
	return ret;
}

/**
 * @alpha
 */
export function unknownFromBin(
	bin: Uint8Array,
	pos: 0
): FromBinResult<unknown> {
	const l = bin[pos];
	if (l === 0) return new FromBinResult(1, undefined);
	throw new Error('TODO: Finish');
}
