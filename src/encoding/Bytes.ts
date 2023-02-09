/*! Copyright 2023 gnabgib MPL-2.0 */

import { OutOfRangeError } from '../primitive/ErrorExt.js';
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

export function toBytes(bytes: string): Uint8Array {
	const stringBytes = bytes.split(',');
	const ret = new Uint8Array(stringBytes.length);
	let idx = 0;
	for (const strByte of stringBytes) {
		const int = parseInt(strByte, 10);
		if (int < 0 || int > 255) throw new OutOfRangeError('byte', int, 0, 255);
		ret[idx++] = int;
	}
	return ret;
}
