/*! Copyright 2023 gnabgib MPL-2.0 */

import { _sha2_512 } from './_Sha2-512.js';

export const init512_256 = [
	//These are pre-generated @see generateIV (in _Sha2_512_224)
	0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
	0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2
];

export function sha2_512_256(bytes: Uint8Array): Uint8Array {
	//256/8=32
	return _sha2_512(bytes, init512_256).slice(0, 32);
}
