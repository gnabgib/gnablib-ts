/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ColType } from './ColType.js';
import { ACudColType } from './ACudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { utf8 } from '../../codec/Utf8.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { somewhatSafe } from '../../safe/safe.js';
import { IProblem } from '../../error/probs/interfaces/IProblem.js';
import { TypeProblem } from '../../error/probs/TypeProblem.js';
import { ContentError } from '../../error/ContentError.js';

abstract class AUtf8 extends ACudColType implements IValid<string> {
	protected abstract get _lenBytes(): number;
	protected abstract get _maxStrLen(): number;
	//BLOB, TEXT types cannot have default values (MySQL)
	readonly sqliteType = 'TEXT'; //Text affinity
	readonly postgresType = 'text';

	constructor(nullable = false) {
		super(nullable);
	}

	cudByteSize(input: string): number {
		return input.length + this._lenBytes;
	}

	valid(input?: string): IProblem | undefined {
		if (input == undefined) {
			if (!this.nullable) return TypeProblem.Null('Utf8');
			return undefined;
		}
		somewhatSafe.len.atMost('input', input, this._maxStrLen);
	}

	unknownBin(value?: string): Uint8Array {
		if (value == undefined) {
			if (!this.nullable) 
				throw new ContentError('cannot be null', 'String', undefined);
			return new Uint8Array([0]);
		} else if (!(typeof value === 'string')) {
			throw new TypeError('String required');
		}
		const b = utf8.toBytes(value);
		somewhatSafe.len.atMost('value-bytes', b, this._maxStrLen);

		const ret = new Uint8Array(this._lenBytes + b.length);
		let lenPtr = this._lenBytes - 1;
		ret[lenPtr--] = b.length;
		if (lenPtr > 0) ret[lenPtr--] = b.length >> 8;
		if (lenPtr > 0) ret[lenPtr--] = b.length >> 16;
		if (lenPtr > 0) ret[lenPtr--] = b.length >> 24;
		ret.set(b, this._lenBytes);
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<string | undefined> {
		if (pos + this._lenBytes > bin.length)
			return new FromBinResult(
				0,
				undefined,
				'Utf8.binUnknown unable to find length'
			);

		let l = 0;
		for (let i = 0; i < this._lenBytes; i++) {
			l = (l << 8) | bin[pos++];
		}
		if (l > this._maxStrLen)
			return new FromBinResult(
				0,
				undefined,
				`Utf8.binUnknown length invalid (0<${this._maxStrLen} got ${l})`
			);

		const end = pos + l;
		if (end > bin.length)
			return new FromBinResult(0, undefined, 'Utf8.binUnknown missing data');

		//A shortcoming of this is something nullable looks the same as something empty
		if (l === 0 && this.nullable)
			return new FromBinResult(this._lenBytes, undefined);

		const s = utf8.fromBytes(bin.slice(pos, end));
		return new FromBinResult(l + this._lenBytes, s);
	}
}

/**
 * Text in utf8 encoding up to 255 bytes long (not necc. chars)
 */
export class Utf81 extends AUtf8 {
	readonly _colType = ColType.Utf81;
	readonly _lenBytes = 1;
	readonly _maxStrLen = 0xff;

	readonly mysqlType = 'TINYTEXT';
	readonly cudType = 'utf8-1';
}

/**
 * Text in utf8 encoding up to 65535 bytes (65kb) long (not necc. chars)
 */
export class Utf82 extends AUtf8 {
	readonly _colType = ColType.Utf82;
	readonly _lenBytes = 2;
	readonly _maxStrLen = 0xffff;

	readonly mysqlType = 'TEXT';
	readonly cudType = 'utf8-2';
}

/**
 * Text in utf8 encoding up to 16777215 bytes (16M) long (not necc. chars)
 */
export class Utf83 extends AUtf8 {
	readonly _colType = ColType.Utf83;
	readonly _lenBytes = 3;
	readonly _maxStrLen = 0xffffff;

	readonly mysqlType = 'MEDIUMTEXT';
	readonly cudType = 'utf8-3';
}

/**
 * Text in utf8 encoding up to 1000000 bytes (1G) long (not necc. chars)
 */
export class Utf84ish extends AUtf8 {
	readonly _colType = ColType.Utf84ish;
	readonly _lenBytes = 4;
	readonly _maxStrLen = 1000000000; //1G - both Postgres and SQLite have this constraint

	readonly mysqlType = 'LONGTEXT';
	readonly cudType = 'utf8-4';
}
