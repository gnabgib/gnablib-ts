/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { utf8 } from '../../codec/Utf8.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';
import { somewhatSafe } from '../../safe/index.js';

export class Plane {
	readonly char: string;
	readonly human: string;
	private constructor(char: string, human: string) {
		somewhatSafe.len.exactly('char',char,1);
		this.char = char;
		this.human = human;
	}
	get isCtrl(): boolean {
		return this.char === 'c';
	}
	toBin(): Uint8Array {
		return utf8.toBytes(this.char);
	}
	static get Control(): Plane {
		return new Plane('c', 'control');
	}
	static get Data(): Plane {
		return new Plane('d', 'data');
	}

	/**
	 * Decode a Plane from a byte array
	 * @param bin
	 * @param pos
	 * @returns Number of bytes consumed, and optional value (if valid)
	 */
	static fromBin(bin: Uint8Array, pos = 0): FromBinResult<Plane> {
		switch (bin[pos]) {
			case 99: //c
				return new FromBinResult(1, Plane.Control);
			case 100: //d
				return new FromBinResult(1, Plane.Data);
		}
		return new FromBinResult<Plane>(
			0,
			undefined,
			'Plane.fromBin unrecognized plane'
		);
	}
}
