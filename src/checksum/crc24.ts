/*! Copyright 2023 the gnablib contributors MPL-1.1 */

const INIT = 0xb704ce;
const POLY = 0x1864cfb;
const BIT24 = 0x1000000;

/**
 * # CRC-24
 *
 * - Specified in [RFC-4880](https://datatracker.ietf.org/doc/html/rfc4880#section-6.1)
 * - Used by PGP in [Radix-64](https://en.wikipedia.org/wiki/Base64#OpenPGP)
 * - Used in [RTCM](https://en.wikipedia.org/wiki/Radio_Technical_Commission_for_Maritime_Services) 104v3
 * - Intel CRC24a instruction uses the same polynomial
 *
 * @example
 * ```js
 * import { crc24 } from 'gnablib/checksum';
 * import { utf8 } from 'gnablib/codec';
 *
 * crc24(utf8.toBytes('message digest')); // 0xdbf0b6
 * ```
 */
export function crc24(bytes: Uint8Array, crc = INIT): number {
	for (let i = 0; i < bytes.length; i++) {
		crc ^= bytes[i] << 16;
		for (let j = 0; j < 8; j++) {
			crc <<= 1;
			if ((crc & BIT24) == BIT24) crc ^= POLY;
		}
	}
	return crc & 0xffffff;
}
