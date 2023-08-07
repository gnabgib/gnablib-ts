/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { Int64 } from '../../primitive/Int64.js';
import {
	EnforceTypeError,
	NullError,
	OutOfRangeError,
} from '../../primitive/ErrorExt.js';
import { ColType } from './ColType.js';
import { ACudColType } from './CudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { safety } from '../../primitive/Safety.js';

//sql engines keep everything signed

abstract class AInt extends ACudColType implements IValid<number | Int64> {
	protected abstract get _maxByteLen(): number;
	protected abstract get _min64(): Int64;
	protected abstract get _max64(): Int64;

	constructor(nullable = false) {
		super(nullable);
	}

	cudByteSize(_input: number): number {
		return this._maxByteLen;
	}

	valid(input: number | Int64 | undefined): Error | undefined {
		let i64: Int64;
		if (input === undefined || input === null) {
			if (!this.nullable) return new NullError('Int');
			return undefined;
		} else if (input instanceof Int64) {
			i64 = input;
			//if (input.lt(min64) || input.gt(max64)) return new OutOfRangeError('Id', input, min64, max64);
		} else if (typeof input === 'number' && Number.isInteger(input)) {
			//Good
			i64 = Int64.fromNumber(input);
		} else {
			return new EnforceTypeError('Integer|Int64', input);
		}
		if (i64.lt(this._min64) || i64.gt(this._max64))
			return new OutOfRangeError('Int', input, this._min64, this._max64);
	}

	unknownBin(value: number | Int64 | undefined): Uint8Array {
		let i64: Int64;
		if (value === null || value === undefined) {
			if (!this.nullable) throw new NullError('Int');
			return new Uint8Array([0]);
		} else if (value instanceof Int64) {
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

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<Int64 | undefined> {
		if (pos + 1 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Int.binUnknown unable to find length'
			);

		const l = bin[pos++];
		if (l === 0) {
			if (!this.nullable)
				return new FromBinResult(0, undefined, 'Int.binUnknown cannot be null');
			return new FromBinResult(1, undefined);
		}
		if (l > this._maxByteLen)
			return new FromBinResult(
				0,
				undefined,
				`Int.binUnknown invalid length (0<${this._maxByteLen} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Int.binUnknown missing data');

		return new FromBinResult(l + 1, Int64.fromMinBytes(bin, pos, l));
	}
}

/**
 * 2 byte signed integer (-32768 - 32767)
 */
export class Int2 extends AInt {
	readonly _colType = ColType.Int2;
	readonly _maxByteLen = 2;
	readonly _min64 = new Int64(0xffff8000, 0xffffffff);
	readonly _max64 = new Int64(0x7fff, 0);

	readonly mysqlType = 'SMALLINT';
	readonly sqliteType = 'INT2'; //Integer affinity
	readonly postgresType = 'smallint';
	readonly cudType = 'int2';
}

/**
 * 4 byte signed integer (-2147483648 - 2147483647)
 */
export class Int4 extends AInt {
	readonly _colType = ColType.Int4;
	readonly _maxByteLen = 4;
	readonly _min64 = new Int64(0x80000000, 0xffffffff);
	readonly _max64 = new Int64(0x7fffffff, 0);

	readonly mysqlType = 'INT';
	readonly sqliteType = 'INT'; //Integer affinity
	readonly postgresType = 'int';
	readonly cudType = 'int4';
}

/**
 * 8 byte signed integer (-9223372036854775809 - 9223372036854775808)
 */
export class Int8 extends AInt {
	readonly _colType = ColType.Int8;
	readonly _maxByteLen = 8;
	readonly _min64 = Int64.min;
	readonly _max64 = Int64.max;

	readonly mysqlType = 'BIGINT';
	readonly sqliteType = 'INT'; //Integer affinity
	readonly postgresType = 'bigint';
	readonly cudType = 'int8';
}
