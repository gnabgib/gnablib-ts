/*! Copyright 2023 gnabgib MPL-2.0 */

import type { ACudColType } from './types/CudColType.js';
import { ColName } from './ColName.js';
import { FromBinResult } from '../primitive/FromBinResult.js';
import { cudColTypeFromBin } from './types/cudColTypeFromBin.js';

//Postgres:
//  Max table name: 63 bytes (~=chars in ascii)
//  Max column name: 63 bytes (~=chars in ascii)
//SQLite:
//  Max table name: ?
//  Max column name: ?
//MariaDb & MySQL: https://dev.mysql.com/doc/refman/8.0/en/identifiers.html
//  Max table name: 64 bytes (~=chars in ascii)
//  Max column name: 64 bytes (~=chars in ascii)

/**
 * @alpha
 */
export class CreateColDef {
	readonly name: ColName;
	readonly type: ACudColType;

	public constructor(name: ColName, type: ACudColType) {
		this.name = name;
		this.type = type;
	}

	toBin(): Uint8Array {
		//N(2-*)T(1-*)
		const n = this.name.toBin();
		const t = this.type.toBin();
		const ret = new Uint8Array(n.length + t.length);
		ret.set(n);
		const ptr = n.length;
		ret.set(t, ptr);
		return ret;
	}

	toJSON(): Record<string, unknown> {
		const c: Record<string, unknown> = {};
		c[this.name.name] = this.type.cudType + (this.type.nullable ? '?' : '');
		return c;
	}

	static fromBin(bin: Uint8Array, pos = 0): FromBinResult<CreateColDef> {
		let ptr = pos;
		const nFrom = ColName.fromBin(bin, ptr);
		if (!nFrom.success)
			return new FromBinResult<CreateColDef>(
				0,
				undefined,
				'CreateColDef.fromBin missing name: ' + nFrom.reason
			);
		ptr += nFrom.byteLen;

		const tFrom = cudColTypeFromBin(bin, ptr);
		if (!tFrom.success)
			return new FromBinResult<CreateColDef>(
				0,
				undefined,
				'CreateColDef.fromBin missing type: ' + tFrom.reason
			);
		ptr += tFrom.byteLen;

		return new FromBinResult(
			ptr - pos,
            //We;ve a
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			new CreateColDef(nFrom.value!, tFrom.value!)
		);
	}
}
