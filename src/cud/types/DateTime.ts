/*! Copyright 2023 gnabgib MPL-2.0 */

import { NullError } from '../../primitive/ErrorExt.js';
import { DateTime } from '../../primitive/DateTime.js';
import { ColType } from './ColType.js';
import { ACudColType } from './CudColType.js';
import type { Valid } from './Valid.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';

export class DateTimeCol extends ACudColType implements Valid<DateTime> {
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

	cudByteSize(_input: DateTime): number {
		return 8;
	}

	valid(input: DateTime | undefined): Error | undefined {
		if (input === undefined || input === null) {
			if (!this.nullable) return new NullError('DateTime');
		}
	}
	unknownBin(value: DateTime | undefined): Uint8Array {
		if (!value) {
			if (!this.nullable) throw new NullError('DateTime');
			return new Uint8Array([0]);
		}
		const d = value.toBin();
		const ret = new Uint8Array(1 + d.length);
		ret[0] = d.length;
		ret.set(d, 1);
		return ret;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<DateTime | undefined> {
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

		const dFrom = DateTime.fromBin(bin, pos);
		if (!dFrom.success)
			return new FromBinResult(
				0,
				undefined,
				'DateTimeCol.binUnknown bad value: ' + dFrom.reason
			);
		return new FromBinResult(1 + l, dFrom.value);
	}
}
