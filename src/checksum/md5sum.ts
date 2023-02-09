/*! Copyright 2023 gnabgib MPL-2.0 */

import { md5 } from '../hash/Md5.js';

/**
 * Same as MD5
 * MD5 already includes a length, this is just a wrapper
 * @param bytes
 * @returns
 */
export function md5sum(bytes: Uint8Array): Uint8Array {
	return md5(bytes);
}
