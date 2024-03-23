/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { FromBinResult } from '../../primitive/FromBinResult.js';
import { ColType } from './ColType.js';
import { ACudColType } from './ACudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { somewhatSafe } from '../../safe/safe.js';
import { IProblem } from '../../error/probs/interfaces/IProblem.js';
import { TypeProblem } from '../../error/probs/TypeProblem.js';
import { ContentError } from '../../error/ContentError.js';

const len1Byte = 255;
const len2Byte = 65536; //65k
const len3Byte = 16777216; //16M
const len4Byte = 1000000000; //1G - both Postgres and SQLite have this constraint

abstract class ABin extends ACudColType implements IValid<Uint8Array> {
	//BLOB, TEXT types cannot have default values (MySQL)
	readonly sqliteType = 'BLOB'; //Blob affinity
	readonly postgresType = 'bytea';

	constructor(nullable = false) {
		super(nullable);
	}

	protected _valid(
		input: Uint8Array | undefined,
		maxLen: number
	): IProblem | undefined {
		if (input == undefined) {
			if (!this.nullable) return TypeProblem.Null('input');
		} else {
			somewhatSafe.len.inRangeInc('input', input, 0, maxLen);
		}
	}

	abstract valid(input?: Uint8Array): IProblem | undefined;
}

export class Bin1 extends ABin {
	readonly mysqlType = 'TINYBLOB';
	readonly cudType = 'bin1';
	readonly _colType = ColType.Bin1;

	cudByteSize(input: Uint8Array): number {
		return input.length + 1;
	}

	valid(input?: Uint8Array): IProblem | undefined {
		return this._valid(input, len1Byte);
	}

	unknownBin(value?: Uint8Array): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Bin', undefined);
			return new Uint8Array([0]);
		}
		somewhatSafe.len.atMost('value', value, len1Byte);
		const ret = new Uint8Array(1 + value.length);
		ret[0] = value.length;
		ret.set(value, 1);
		return ret;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<Uint8Array | undefined> {
		if (pos + 1 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Bin1.binUnknown unable to find length byte'
			);

		const l = bin[pos++];
		// //Impossible:
		// if (l > len1Byte)
		// 	return new FromBinResult(0,undefined,`Bin1.binUnknown size invalid (0<${len1Byte} got ${l})`);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Bin1.binUnknown missing data');

		//A shortcoming of this is something nullable looks the same as something empty
		if (l === 0 && this.nullable) return new FromBinResult(1, undefined);

		return new FromBinResult(l + 1, bin.slice(pos, pos + l));
	}
}

export class Bin2 extends ABin {
	readonly mysqlType = 'BLOB';
	readonly cudType = 'bin2';
	readonly _colType = ColType.Bin2;

	cudByteSize(input: Uint8Array): number {
		return input.length + 2;
	}

	valid(input?: Uint8Array): IProblem | undefined {
		return this._valid(input, len2Byte);
	}

	unknownBin(value?: Uint8Array): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Bin', undefined);
			return new Uint8Array([0]);
		}
		somewhatSafe.len.atMost('value', value, len2Byte);
		const ret = new Uint8Array(2 + value.length);
		ret[0] = value.length >> 8;
		ret[1] = value.length;
		ret.set(value, 2);
		return ret;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<Uint8Array | undefined> {
		if (pos + 2 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Bin2.binUnknown unable to find length bytes'
			);

		const l = (bin[pos++] << 8) | bin[pos++];
		// //Impossible:
		// if (l > len2Byte)
		// 	return new FromBinResult(0,undefined,`Bin2.binUnknown size invalid (0<${len2Byte} got ${l})`);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Bin2.binUnknown missing data');

		//A shortcoming of this is something nullable looks the same as something empty
		if (l === 0 && this.nullable) return new FromBinResult(2, undefined);

		return new FromBinResult(l + 2, bin.slice(pos, pos + l));
	}
}

export class Bin3 extends ABin {
	readonly mysqlType = 'MEDIUMBLOB';
	readonly cudType = 'bin3';
	readonly _colType = ColType.Bin3;

	cudByteSize(input: Uint8Array): number {
		return input.length + 3;
	}

	valid(input?: Uint8Array): IProblem | undefined {
		return this._valid(input, len3Byte);
	}

	unknownBin(value?: Uint8Array): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Bin', undefined);
			return new Uint8Array([0]);
		}
		somewhatSafe.len.atMost('value', value, len3Byte);
		const ret = new Uint8Array(3 + value.length);
		ret[0] = value.length >> 16;
		ret[1] = value.length >> 8;
		ret[2] = value.length;
		ret.set(value, 3);
		return ret;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<Uint8Array | undefined> {
		if (pos + 3 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Bin3.binUnknown unable to find length bytes'
			);

		const l = (bin[pos++] << 16) | (bin[pos++] << 8) | bin[pos++];
		// //Impossible:
		// if (l > len3Byte)
		// 	return new FromBinResult(0,undefined,`Bin3.binUnknown size invalid (0<${len3Byte} got ${l})`);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Bin3.binUnknown missing data');

		//A shortcoming of this is something nullable looks the same as something empty
		if (l === 0 && this.nullable) return new FromBinResult(3, undefined);

		return new FromBinResult(l + 3, bin.slice(pos, pos + l));
	}
}

export class Bin4ish extends ABin {
	/* True 4 byte size would lead up to 4294967296 bytes (4G) of data, but sqlite and postgres 
        cap out at 1G so we constrain here too */
	readonly mysqlType = 'LONGBLOB';
	readonly cudType = 'bin4';
	readonly _colType = ColType.Bin4ish;

	cudByteSize(input: Uint8Array): number {
		return input.length + 4;
	}

	valid(input?: Uint8Array): IProblem | undefined {
		return this._valid(input, len4Byte);
	}

	unknownBin(value?: Uint8Array): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Bin', undefined);
			return new Uint8Array([0]);
		}
		somewhatSafe.len.atMost('value', value, len4Byte);
		const ret = new Uint8Array(4 + value.length);
		ret[0] = value.length >>> 24;
		ret[1] = value.length >> 16;
		ret[2] = value.length >> 8;
		ret[3] = value.length;
		ret.set(value, 4);
		return ret;
	}

	binUnknown(
		bin: Uint8Array,
		pos: number
	): FromBinResult<Uint8Array | undefined> {
		if (pos + 4 > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Bin4ish.binUnknown unable to find length bytes'
			);

		const l =
			((bin[pos++] << 24) |
				(bin[pos++] << 16) |
				(bin[pos++] << 8) |
				bin[pos++]) >>>
			0;
		//Impossible:
		if (l > len4Byte)
			return new FromBinResult(
				0,
				undefined,
				`Bin4ish.binUnknown size invalid (0<${len4Byte} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Bin4ish.binUnknown missing data');

		//A shortcoming of this is something nullable looks the same as something empty
		if (l === 0 && this.nullable) return new FromBinResult(4, undefined);

		return new FromBinResult(l + 4, bin.slice(pos, pos + l));
	}
}
