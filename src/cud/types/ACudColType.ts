/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { IPostgresType } from '../interfaces/IPostgresType.js';
import type { ISqliteType } from '../interfaces/ISqliteType.js';
import type { IMysqlType } from '../interfaces/IMysqlType.js';
import type { ColType } from './ColType.js';
import type { FromBinResult } from '../../primitive/FromBinResult.js';

const nullMarker = 0x80;

export abstract class ACudColType
	implements IMysqlType, IPostgresType, ISqliteType
{
	public readonly nullable: boolean;

	protected constructor(nullable: boolean) {
		this.nullable = nullable;
	}

	toBin(): Uint8Array {
		const ret = new Uint8Array(1);
		ret[0] = this._colType;
		if (this.nullable) ret[0] |= nullMarker;
		return ret;
	}

	abstract cudByteSize(input: unknown): number;
	protected abstract get _colType(): ColType;
	abstract get cudType(): string;
	abstract get mysqlType(): string;
	abstract get postgresType(): string;
	abstract get sqliteType(): string;
	abstract unknownBin(value: unknown): Uint8Array;
	abstract binUnknown(bin: Uint8Array, pos: number): FromBinResult<unknown>;
}
