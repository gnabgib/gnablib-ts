/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { ColType } from './ColType.js';
import { ACudColType } from './ACudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { TableName } from '../TableName.js';
import { ColName } from '../ColName.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { IProblem } from '../../error/probs/interfaces/IProblem.js';
import { TypeProblem } from '../../error/probs/TypeProblem.js';
import { RangeProblem } from '../../error/probs/RangeProblem.js';
import { ContentError } from '../../error/ContentError.js';
import { sLen } from '../../safe/safe.js';
import { I64 } from '../../primitive/number/I64.js';

//sql engines keep everything signed, even when IDs cannot be negative

const min64 = I64.fromI32s(0, 0x80000000);
const max64 = I64.fromI32s(0xffffffff, 0xffffffff);

export abstract class ARef extends ACudColType implements IValid<number | I64> {
	protected abstract get _maxByteLen(): number;
	protected abstract get _max64(): I64;
	protected abstract get _cudPrefix(): string;

	readonly table: TableName;
	readonly column: ColName;

	public constructor(table: TableName, column: ColName, nullable = false) {
		super(nullable);
		this.table = table;
		this.column = column;
	}

	get cudType(): string {
		return (
			this._cudPrefix + '(' + this.table.name + '.' + this.column.name + ')'
		);
	}

	cudByteSize(): number {
		return this._maxByteLen;
	}

	valid(input?: number | I64): IProblem | undefined {
		let i64: I64;
		if (input == undefined) {
			if (!this.nullable) return TypeProblem.Null('Ref');
			return;
		} else if (input instanceof I64) {
			i64 = input;
			//if (input.lt(min64) || input.gt(max64)) return new OutOfRangeError('Id', input, min64, max64);
		} else if (Number.isInteger(input)) {
			//Good
			i64 = I64.fromInt(input);
		} else {
			return TypeProblem.UnexpVal('Ref', input, 'integer or Int64');
		}
		if (i64.lt(min64) || i64.gt(this._max64))
			return RangeProblem.IncInc('Ref', input, min64, this._max64);
	}

	toBin(): Uint8Array {
		const s = super.toBin();
		const t = this.table.toBin();
		const c = this.column.toBin();
		const ret = new Uint8Array(s.length + t.length + c.length);
		ret.set(s);
		let ptr = s.length;
		ret.set(t, ptr);
		ptr += t.length;
		ret.set(c, ptr);
		return ret;
	}

	unknownBin(value?: number | I64): Uint8Array {
		let i64: I64;
		if (value == undefined) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Ref', undefined);
			return new Uint8Array([0]);
		} else if (value instanceof I64) {
			//Good
			i64 = value;
		} else if (typeof value === 'number' && Number.isInteger(value)) {
			//Good
			i64 = I64.fromInt(value);
		} else {
			throw new TypeError('Integer or Int64 required');
		}
		const n = i64.toBytesBE(); // i64.toMinBytes();
		sLen('i64-bytes', n).atMost(this._maxByteLen).throwNot();

		const ret = new Uint8Array(1 + n.length);
		ret[0] = n.length;
		ret.set(n, 1);
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<I64 | undefined> {
		if (pos + 1 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Ref.binUnknown unable to find length'
			);

		const l = bin[pos++];
		if (l === 0) {
			if (!this.nullable)
				return new FromBinResult(0, undefined, 'Ref.binUnknown cannot be null');
			return new FromBinResult(1, undefined);
		}
		if (l > this._maxByteLen)
			return new FromBinResult(
				0,
				undefined,
				`Ref.binUnknown invalid length (0<${this._maxByteLen} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Ref.binUnknown missing data');

		return new FromBinResult(
			l + 1,
			I64.fromBytesBE(bin.subarray(pos, pos + 1))
		); //  Int64.fromMinBytes(bin, pos, l));
	}

	static fromBinSub(
		colByte: number,
		nullable: boolean,
		len: number,
		bin: Uint8Array,
		pos: number
	): FromBinResult<ARef> {
		//Col type is already known/parsed from bin

		switch (colByte) {
			case ColType.Ref2:
			case ColType.Ref4:
			case ColType.Ref8:
				//Only parse for ref types
				break;
			default:
				return new FromBinResult<ARef>(
					0,
					undefined,
					`ARef.fromBin invalid colType ${colByte}`
				);
		}
		let ptr = pos;
		const tFrom = TableName.fromBin(bin, ptr);
		if (!tFrom.success)
			return new FromBinResult<ARef>(
				0,
				undefined,
				'ARef.fromBinSub missing table: ' + tFrom.reason
			);
		ptr += tFrom.byteLen;

		const cFrom = ColName.fromBin(bin, ptr);
		if (!cFrom.success)
			return new FromBinResult<ARef>(
				0,
				undefined,
				'ARef.fromBinSub missing column: ' + cFrom.reason
			);
		ptr += cFrom.byteLen;

		//We know values (because success)
		switch (colByte) {
			case ColType.Ref2:
				return new FromBinResult(
					len + ptr - pos,
					new Ref2(tFrom.value!, cFrom.value!, nullable)
				);
			case ColType.Ref4:
				return new FromBinResult(
					len + ptr - pos,
					new Ref4(tFrom.value!, cFrom.value!, nullable)
				);
			case ColType.Ref8:
				return new FromBinResult(
					len + ptr - pos,
					new Ref8(tFrom.value!, cFrom.value!, nullable)
				);
		}
	}
}

export class Ref2 extends ARef {
	readonly _colType = ColType.Ref2;
	readonly _maxByteLen = 2;
	readonly _max64 = I64.fromI32s(0x7fff, 0);
	readonly _cudPrefix = 'ref2';

	readonly mysqlType = 'SMALLINT';
	readonly sqliteType = 'INT2'; //Integer affinity
	readonly postgresType = 'smallint';
}

export class Ref4 extends ARef {
	readonly _colType = ColType.Ref4;
	readonly _maxByteLen = 4;
	readonly _max64 = I64.fromI32s(0x7fffffff, 0);
	readonly _cudPrefix = 'ref4';

	readonly mysqlType = 'INT';
	readonly sqliteType = 'INT'; //Integer affinity
	readonly postgresType = 'integer';
}

export class Ref8 extends ARef {
	readonly _colType = ColType.Ref8;
	readonly _maxByteLen = 8;
	readonly _max64 = max64;
	readonly _cudPrefix = 'ref8';

	readonly mysqlType = 'BIGINT';
	readonly sqliteType = 'BIGINT'; //Integer affinity
	readonly postgresType = 'bigint';
}
