/*! Copyright 2023 gnabgib MPL-2.0 */

import * as hex from '../encoding/Hex.js';

export class Uint64Array {
	private readonly _buff: Uint32Array;

	constructor(sizeOrData: number | string) {
		switch (typeof sizeOrData) {
			case 'number':
				this._buff = new Uint32Array(sizeOrData * 2);
				break;
			case 'string':
				this._buff = new Uint32Array(hex.toBytes(sizeOrData));
				break;
			default:
				this._buff = new Uint32Array(0);
		}
	}

	get length(): number {
		return this._buff.length / 2;
	}
}
