/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ColType } from './ColType.js';
import { ACudColType } from './ACudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { DateTimeLocal } from '../../datetime/dt.js';
import { BitWriter } from '../../primitive/BitWriter.js';
import { BitReader } from '../../primitive/BitReader.js';
import { IProblem } from '../../error/probs/interfaces/IProblem.js';
import { TypeProblem } from '../../error/probs/TypeProblem.js';
import { ContentError } from '../../error/ContentError.js';

export class DateTimeCol extends ACudColType implements IValid<DateTimeLocal> {
	/*MySQL supports microsecond res, but only for years 1000-9999 which is smaller than -4713-294276 (doh)*/
	readonly mysqlType = 'BIGINT';
	/*SQLite supports second resolution (int) or milliseconds in some formats (which can be dropped) 
    - NOT ENOUGH RES*/
	readonly sqliteType = 'INT8'; //Integer affinity
	readonly postgresType = 'timestamp with time zone';
	readonly cudType = 'datetime';
	readonly _colType = ColType.DateTime;

	constructor(nullable = false) {
		super(nullable);
	}

	cudByteSize(): number {
		return 8;
	}

	valid(input?: DateTimeLocal): IProblem | undefined {
		if (input == undefined) {
			if (!this.nullable) return TypeProblem.Null('input');
		}
	}
	unknownBin(value?: DateTimeLocal): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'DateTime', undefined);
			return new Uint8Array([0]);
		}
		const bytes = new Uint8Array(Math.ceil(DateTimeLocal.serialBits / 8) + 1);
		const bw = BitWriter.mount(bytes);
		bw.pushNumberBE(Math.ceil(DateTimeLocal.serialBits / 8), 8);
		value.serialize(bw);
		return bytes;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<DateTimeLocal | undefined> {
		if (pos + 1 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'DateTimeCol.binUnknown unable to find length'
			);

		const l = bin[pos++];
		if (l === 0) {
			if (!this.nullable)
				return new FromBinResult(
					0,
					undefined,
					'DateTimeCol.binUnknown cannot be null'
				);
			return new FromBinResult(1, undefined);
		}
		if (l !== 8) {
			return new FromBinResult(
				0,
				undefined,
				`DateTimeCol.binUnknown invalid length (8 got ${l})`
			);
		}

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'DateTimeCol.binUnknown missing data'
			);

		const br = BitReader.mount(bin.subarray(pos));
		try {
			const dFrom = DateTimeLocal.deserialize(br);
			return new FromBinResult(1 + l, dFrom);
		} catch (e: unknown) {
			return new FromBinResult(
				0,
				undefined,
				'DateTimeCol.binUnknown bad value: ' + ((e as Error).message ?? '')
			);
		}
	}
}
