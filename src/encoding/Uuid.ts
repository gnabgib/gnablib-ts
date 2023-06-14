/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from '../primitive/Safety.js';
import { hex } from './Hex.js';

/**
 * Support: (Uint8Array)
 * Chrome, Android webview, ChromeM >=38
 * Edge >=12
 * Firefox, FirefoxM >=4
 * IE: 10
 * Opera: 11.6
 * OperaM: 12
 * Safari: >=5.1
 * SafariM: 4.2
 * Samsung: >=1.0
 * Node: >=1.0
 * Deno: >=0.10
 */

const ind_v4 = '4';
const ind_var1_mask = 0x3f; //0011 1111
const ind_var1_prefix = 0x80; //10xx xxxx

/**
 * Convert at least 16 bytes (128 bits) into a UUIDv4.  In theory a v4
 * is random, but since the bytes are externally provided.. can't guarantee that.
 * If there are more bytes, they'll be ignored.
 * @param bytes
 * @throws InvalidUuid if not enough bits/bytes are provided
 * @returns
 */
export function v4FromBytes(bytes: Uint8Array): string {
	let ret = '';
	safety.lenGte(bytes,16,'UUID bytes');
	let idx = 0;
	eachByte2: for (const byte of bytes) {
		switch (idx++) {
			case 4:
			case 10:
				ret += '-';
				break;
			case 6:
				ret += '-' + ind_v4 + hex.fromByte(byte);
				continue;
			case 8:
				ret += '-' + hex.fromByte((byte & ind_var1_mask) | ind_var1_prefix);
				continue;
			case 16:
				break eachByte2;
		}
		ret += hex.fromByte(byte);
	}
	return ret;
}
