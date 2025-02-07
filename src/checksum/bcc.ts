/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

/**
 * [Block Check Character (BCC)](https://en.wikipedia.org/wiki/Block_check_character)
 * generates an 8bit checksum of a stream of data.  Described in
 * [RFC-914](https://datatracker.ietf.org/doc/html/rfc914)
 * 
 * @example
 * ```js
 * import { Bcc } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Bcc();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x43
 * ```
 */
export class Bcc implements IChecksum {
	private _sum = 0;
	readonly size = 1;

	write(data: Uint8Array) {
		for (const b of data) this._sum ^= b;
	}

	sum() {
		return Uint8Array.of(this._sum);
	}
}
