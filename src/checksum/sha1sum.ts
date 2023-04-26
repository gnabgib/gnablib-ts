/*! Copyright 2022-2023 gnabgib MPL-2.0 */

import { Sha1 } from '../hash/Sha1.js';

/**
 * Same as SHA1
 * SHA1 already includes a length, this is just a wrapper
 * @param bytes
 * @returns
 */
export function sha1sum(bytes: Uint8Array): Uint8Array {
	const hash=new Sha1();
	hash.write(bytes);
	return hash.sum();
}
