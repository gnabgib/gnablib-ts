import { sha1 } from '../hash/Sha1.js';

/**
 * Same as SHA1
 * SHA1 already includes a length, this is just a wrapper
 * @param bytes
 * @returns
 */
export function sha1sum(bytes: Uint8Array): Uint8Array {
	return sha1(bytes);
}
