/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { FromBinResult } from '../../primitive/FromBinResult.js';
import { ColType } from './ColType.js';
import { ACudColType } from './ACudColType.js';
import type { IValid } from '../interfaces/IValid.js';
import { IProblem } from '../../error/probs/interfaces/IProblem.js';
import { TypeProblem } from '../../error/probs/TypeProblem.js';
import { ContentError } from '../../error/ContentError.js';

export class Bool extends ACudColType implements IValid<boolean> {
	readonly mysqlType = 'tinyint(1)'; //boolean,bool map
	readonly sqliteType = 'TINYINT'; //Integer affinity
	readonly postgresType = 'boolean';
	readonly cudType = 'bool';
	readonly _colType = ColType.Bool;

	constructor(nullable = false) {
		super(nullable);
	}

	cudByteSize(): number {
		return 1;
	}

	valid(input?: boolean): IProblem | undefined {
		if (input == undefined) {
			if (!this.nullable) return TypeProblem.Null('input');
		}
	}

	unknownBin(value?: boolean): Uint8Array {
		if (!value) {
			if (!this.nullable)
				throw new ContentError('cannot be null', 'Bool', undefined);
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
