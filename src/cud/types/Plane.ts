/*! Copyright 2023 gnabgib MPL-2.0 */

import { lenInRangeInclusive } from '../../primitive/StringExt.js';
import * as Utf8 from '../../encoding/Utf8.js';
import { FromBinResult } from '../../primitive/FromBinResult.js';

export class Plane {
	readonly char: string;
	readonly human: string;
	private constructor(char: string, human: string) {
		lenInRangeInclusive(char, 1, 1);
		this.char = char;
		this.human = human;
	}
	get isCtrl(): boolean {
		return this.char === 'c';
	}
	toBin(): Uint8Array {
		return Utf8.toBytes(this.char);
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
				return new FromBinResult(1, this.Control);
			case 100: //d
				return new FromBinResult(1, this.Data);
		}
		return new FromBinResult<Plane>(
			0,
			undefined,
			'Plane.fromBin unrecognized plane'
		);
	}
}
