import { FromBinResult } from '../../primitive/FromBinResult.js';
import { NullError } from '../../primitive/ErrorExt.js';
import { ColType } from './ColType.js';
import { ACudColType } from './CudColType.js';
import type { Valid } from './Valid.js';

export class Bool extends ACudColType implements Valid<boolean> {
	readonly mysqlType = 'tinyint(1)'; //boolean,bool map
	readonly sqliteType = 'TINYINT'; //Integer affinity
	readonly postgresType = 'boolean';
	readonly cudType = 'bool';
	readonly _colType = ColType.Bool;

	constructor(nullable = false) {
		super(nullable);
	}

	cudByteSize(_input: boolean): number {
		return 1;
	}

	valid(input: boolean | undefined): Error | undefined {
		if (input === undefined || input === null) {
			if (!this.nullable) return new NullError('Bool');
		}
	}

	unknownBin(value: boolean | undefined): Uint8Array {
		if (!value) {
			if (!this.nullable) throw new NullError('Bool');
			return new Uint8Array([0]);
		}
		const ret = new Uint8Array(2);
		ret[0] = 1;
		ret[1] = value ? 1 : 0;
		return ret;
	}

	binUnknown(bin: Uint8Array, pos: number): FromBinResult<boolean | undefined> {
		const l = bin[pos];
		if (l === 0) {
			if (!this.nullable)
				return new FromBinResult(
					0,
					undefined,
					'Bool.binUnknown cannot be null'
				);
			return new FromBinResult(1, undefined);
		}
		//Let's use C's definition of boolean: 0=false, 1-255=true
		return new FromBinResult(2, bin[1] !== 0);
	}
}
