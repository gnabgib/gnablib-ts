/*! Copyright 2023 gnabgib MPL-2.0 */

import { fpb32 } from '../../encoding/ieee754-fpb32.js';
import { fpb64 } from '../../encoding/ieee754-fpb64.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { NullError } from '../../primitive/ErrorExt.js';
import { ColType } from './ColType.js';
import { ACudColType } from './CudColType.js';
import type { Valid } from './Valid.js';

abstract class AFloat extends ACudColType implements Valid<number> {
	constructor(nullable = false) {
		super(nullable);
	}

	valid(input: number | undefined): Error | undefined {
		if (input === undefined || input === null) {
			if (!this.nullable) return new NullError('Float');
		}
	}

	protected _binUnknown(
		bin: Uint8Array,
		pos: number,
		byteSize: number
	): FromBinResult<Uint8Array | undefined> {
		if (pos + 1 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Float.binUnknown unable to find length'
			);

		const l = bin[pos++];
		if (l === 0) {
			if (!this.nullable)
				return new FromBinResult(
					0,
					undefined,
					'Float.binUnknown cannot be null'
				);
			return new FromBinResult(1, undefined);
		}
		if (l !== byteSize)
			return new FromBinResult(
				0,
				undefined,
				`Float8.binUnknown invalid length (${byteSize} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Float.binUnknown missing data');

		return new FromBinResult(9, bin.slice(pos, end));
	}
}

export class Float4 extends AFloat {
	readonly mysqlType = 'FLOAT';
	readonly sqliteType = 'FLOAT'; //Real affinity, still stored as 8byte ieee
	readonly postgresType = 'real';
	readonly cudType = 'float4';
	readonly _colType = ColType.Float4;

	cudByteSize(_input: number): number {
		return 4;
	}

	unknownBin(value: number | undefined): Uint8Array {
		if (value === null || value === undefined) {
			if (!this.nullable) throw new NullError('Float');
		}
		if (typeof value !== 'number') {
			throw new TypeError('Float required');
		}
		const f = fpb32.toBytes(value);
		//We known f.length==4
		const ret = new Uint8Array(f.length + 1);
		ret[0] = f.length;
		ret.set(f, 1);
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<number | undefined> {
		const bytes = this._binUnknown(bin, pos, 4);
		//Propagate null or error (notice type change)
		if (bytes.value === undefined) return bytes.switchT<number | undefined>();
		return new FromBinResult(5, fpb32.fromBytes(bytes.value));
	}
}

export class Float8 extends AFloat {
	readonly mysqlType = 'DOUBLE';
	readonly sqliteType = 'DOUBLE'; //Real affinity
	readonly postgresType = 'double precision';
	readonly cudType = 'float8';
	readonly _colType = ColType.Float8;

	cudByteSize(_input: number): number {
		return 8;
	}

	unknownBin(value: number | undefined): Uint8Array {
		if (value === null || value === undefined) {
			if (!this.nullable) throw new NullError('Float');
		}
		if (typeof value !== 'number') {
			throw new TypeError('Float required');
		}
		const f = fpb64.toBytes(value);
		//We known f.length==8
		const ret = new Uint8Array(f.length + 1);
		ret[0] = f.length;
		ret.set(f, 1);
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<number | undefined> {
		const bytes = this._binUnknown(bin, pos, 8);
		//Propagate null or error (notice type change)
		if (bytes.value === undefined) return bytes.switchT<number | undefined>();
		return new FromBinResult(9, fpb64.fromBytes(bytes.value));
	}
}
