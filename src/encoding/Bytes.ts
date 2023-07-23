/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from '../primitive/Safety.js';
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
		safety.intInRangeInc(int,0,255,`bytes[${idx}]`);
		ret[idx++] = int;
	}
	return ret;
}
