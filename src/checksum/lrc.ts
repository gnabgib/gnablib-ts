/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

/**
 * [Longitudinal redundancy check](https://en.wikipedia.org/wiki/Longitudinal_redundancy_check)
 * generates an 8bit checksum of a stream of data.  Described in
 * [ISO 1155](https://www.iso.org/standard/5723.html)
 * const tsts = suite('LRC/ISO 1155, RFC 935');
 */
export class Lrc implements IChecksum {
	private readonly _sum = Uint8Array.of(0);
	readonly size = 1;

	write(data: Uint8Array) {
		for (const b of data) this._sum[0] += b;
	}

	sum() {
		return Uint8Array.of(~this._sum[0] + 1);
	}
}
