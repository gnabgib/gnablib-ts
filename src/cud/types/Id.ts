/*! Copyright 2023 gnabgib MPL-2.0 */

import { Int64 } from '../../primitive/Int64.js';
import {
	EnforceTypeError,
	OutOfRangeError,
} from '../../primitive/ErrorExt.js';
import { ColType } from './ColType.js';
import { ACudColType } from './CudColType.js';
import type { Valid } from './Valid.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { safety } from '../../primitive/Safety.js';

//sql engines keep everything signed, even when IDs cannot be negative
const min64 = new Int64(0, 0);

abstract class AId extends ACudColType implements Valid<number | Int64> {
	protected abstract get _maxByteLen(): number;
	protected abstract get _max64(): Int64;

	constructor() {
		super(false);
	}

	valid(input: number | Int64 | undefined): Error | undefined {
		let i64: Int64;
		safety.notNull(input,'input');
		if (input instanceof Int64) {
			i64 = input;
			//if (input.lt(min64) || input.gt(max64)) return new OutOfRangeError('Id', input, min64, max64);
		} else if (typeof input === 'number' && Number.isInteger(input)) {
			//Good
			i64 = Int64.fromNumber(input);
		} else {
			return new EnforceTypeError('Integer|Int64', input);
		}
		if (i64.lt(min64) || i64.gt(this._max64))
			return new OutOfRangeError('Id', input, min64, this._max64);
	}

	cudByteSize(_input: number): number {
		return this._maxByteLen;
	}

	unknownBin(value: number | Int64): Uint8Array {
		let i64: Int64;
		safety.notNull(value,'value');
		if (value instanceof Int64) {
			//Good
			i64 = value;
		} else if (typeof value === 'number' && Number.isInteger(value)) {
			//Good
			i64 = Int64.fromNumber(value);
		} else {
			throw new TypeError('Integer or Int64 required');
		}
		const n = i64.toMinBytes();
		safety.lenInRangeInc(n,0,this._maxByteLen,'i64-bytes');

		const ret = new Uint8Array(1 + n.length);
		ret[0] = n.length;
		ret.set(n, 1);
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<Int64> {
		if (pos + 1 > bin.length)
			return new FromBinResult<Int64>(
				0,
				undefined,
				'Id.binUnknown unable to find length'
			);

		const l = bin[pos++];
		if (l === 0) {
			return new FromBinResult<Int64>(
				0,
				undefined,
				'Id.binUnknown cannot be null'
			);
		}
		if (l > this._maxByteLen)
			return new FromBinResult<Int64>(
				0,
				undefined,
				`Id.binUnknown invalid length (0<${this._maxByteLen} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult<Int64>(
				0,
				undefined,
				'Id.binUnknown missing data'
			);

		return new FromBinResult(l + 1, Int64.fromMinBytes(bin, pos, l));
	}
}

export class Id2 extends AId {
	readonly _colType = ColType.Id2;
	readonly _maxByteLen = 2;
	readonly _max64 = new Int64(0x7fff, 0);

	readonly mysqlType = 'SMALLINT AUTO_INCREMENT PRIMARY KEY';
	readonly sqliteType = 'INT2 PRIMARY KEY NOT NULL'; //Integer affinity
	readonly postgresType =
		'smallint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY';
	readonly cudType = 'id2';
}

export class Id4 extends AId {
	readonly _colType = ColType.Id4;
	readonly _maxByteLen = 4;
	readonly _max64 = new Int64(0x7fffffff, 0);

	readonly mysqlType = 'INT AUTO_INCREMENT PRIMARY KEY';
	readonly sqliteType = 'INT PRIMARY KEY NOT NULL'; //Integer affinity
	readonly postgresType = 'int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY';
	readonly cudType = 'id4';
}

export class Id8 extends AId {
	readonly _colType = ColType.Id8;
	readonly _maxByteLen = 8;
	readonly _max64 = Int64.max;

	readonly mysqlType = 'BIGINT AUTO_INCREMENT PRIMARY KEY';
	readonly sqliteType = 'BIGINT PRIMARY KEY NOT NULL'; //Integer affinity
	readonly postgresType = 'bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY';
	readonly cudType = 'id8';
}
