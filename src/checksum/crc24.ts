/*! Copyright 2023 the gnablib contributors MPL-1.1 */

const INIT = 0xb704ce;
const POLY = 0x1864cfb;
const BIT24 = 0x1000000;

/**
 * CRC-24 as used by PGP [RFC-4880](https://datatracker.ietf.org/doc/html/rfc4880#section-6.1)
 * Intel CRC24a instruction uses the same poly
 * @param bytes
 * @param init
 * @returns
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
