/*! Copyright 2022-2023 the gnablib contributors MPL-1.1 */

import { Sha1 } from '../hash/Sha1.js';

/**
 * Same as SHA1
 * SHA1 already includes a length, this is just a wrapper
 * @param bytes
 * @returns
 */
export function sha1Sum(bytes: Uint8Array): Uint8Array {
	const hash=new Sha1();
	hash.write(bytes);
	return hash.sum();
}
