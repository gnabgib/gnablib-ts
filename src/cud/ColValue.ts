/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { ACudColType } from './types/CudColType.js';
import { ColName } from './ColName.js';
import { FromBinResult } from '../primitive/FromBinResult.js';
import { cudColTypeFromBin } from './types/cudColTypeFromBin.js';

/**
 * @alpha
 */
export class ColValue {
	readonly name: ColName;
	readonly type: ACudColType;
	readonly value: unknown;

	public constructor(name: ColName, type: ACudColType, value: unknown) {
		this.name = name;
		this.type = type;
		this.value = value;
	}

	toBin(): Uint8Array {
		// N(2-64)T(1-N)V(1-N)
		// n = name (2-64 bytes). NOTE bytes not chars
		// t = type (1-N bytes)
		// v = value (1-n bytes)

		const n = this.name.toBin();
		const t = this.type.toBin();
		const v = this.type.unknownBin(this.value);

		const ret = new Uint8Array(n.length + t.length + v.length);
		ret.set(n);
		let ptr = n.length;
		ret.set(t, ptr);
		ptr += t.length;
		ret.set(v, ptr);
		return ret;
	}

	toJSON(): Record<string, unknown> {
		const c: Record<string, unknown> = {};
		c[this.name.name] = this.value;
		return c;
	}

	static fromBin(bin: Uint8Array, pos = 0): FromBinResult<ColValue> {
		let ptr = pos;
		const nFrom = ColName.fromBin(bin, ptr);
		if (!nFrom.success)
			return new FromBinResult<ColValue>(
				0,
				undefined,
				'ColValue.fromBin Missing name: ' + nFrom.reason
			);
		ptr += nFrom.byteLen;

		const tFrom = cudColTypeFromBin(bin, ptr);
		if (!tFrom.success)
			return new FromBinResult<ColValue>(
				0,
				undefined,
				'ColValue.fromBin Missing type: ' + tFrom.reason
			);
		ptr += tFrom.byteLen;

		//We know values (because success)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const vFrom = tFrom.value!.binUnknown(bin, ptr);
		if (!vFrom.success)
			return new FromBinResult<ColValue>(
				0,
				undefined,
				'ColValue.fromBin Missing value: ' + vFrom.reason
			);
		ptr += vFrom.byteLen;

		return new FromBinResult(
			ptr - pos,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			new ColValue(nFrom.value!, tFrom.value!, vFrom.value!)
		);
	}
}
