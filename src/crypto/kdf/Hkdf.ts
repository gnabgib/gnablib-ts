/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import type { IHash } from '../interfaces/IHash.js';
import { Hmac } from '../mac/Hmac.js';
import { sNum } from '../../safe/safe.js';

//(HMAC-based Extract-and-Expand Key Derivation Function)[https://datatracker.ietf.org/doc/html/rfc5869] (2010)

const maxUint8 = 255;

/**
 * Extract pseudorandom from IKM
 * @param hash Hash to use for extraction
 * @param ikm Input keying material
 * @param salt Optional salt value (not expected to be secret), defaults hash.size bytes of 0
 * @returns pseudorandom key of at hash.size bytes
 */
export function extract(
	hash: IHash,
	ikm: Uint8Array,
	salt?: Uint8Array
): Uint8Array {
	const mac = new Hmac(hash, salt ?? new Uint8Array(hash.blockSize));
	mac.write(ikm);
	return mac.sum();
}

/**
 * Expand pseudorandom key to lenBytes
 * @param hash Hash to use for expansion
 * @param prk pseudorandom key of at least hash.size bytes
 * @param lenBytes Length of output (in bytes)
 * @param info Optional info data (not expected to be secret), defaults to zero-bytes (zero length string)
 * @returns
 */
export function expand(
	hash: IHash,
	prk: Uint8Array,
	lenBytes: number,
	info?: Uint8Array
): Uint8Array {
	//Per RFC, and because only one byte is used per round to indicate which round it is
	sNum('lenBytes', lenBytes)
		.unsigned()
		.atMost(maxUint8 * hash.size)
		.throwNot();
	//If no info is provided, zero length
	info = info ?? new Uint8Array(0);
	//Chose the lower bound since the last write may need to be sized to remaining space
	// (if lenBytes isn't multiple of hash.size)
	const safeN = Math.floor(lenBytes / hash.size);
	const ret = new Uint8Array(lenBytes);
	const msg = new Uint8Array(hash.size + 1 + info.length);
	let t = new Uint8Array(0);
	let i = 1;
	let pos = 0;
	let mPos = 0;
	const mac = new Hmac(hash, prk);
	for (; i <= safeN; ) {
		//Note i is 1 based (hence <=)
		msg.set(t, 0);
		msg.set(info, t.length);
		mPos = t.length + info.length;
		msg[mPos] = i;
		mPos += 1;
		mac.write(msg.subarray(0, mPos));
		t = mac.sum();
		mac.reset();
		ret.set(t, pos);
		i++;
		pos += hash.size;
	}
	const rem = lenBytes - pos;
	if (rem > 0) {
		msg.set(t, 0);
		msg.set(info, t.length);
		mPos = t.length + info.length;
		msg[mPos] = i;
		mPos += 1;
		mac.write(msg.subarray(0, mPos));
		t = mac.sum();
		ret.set(t.subarray(0, rem), pos);
	}
	return ret;
}

/**
 * Hash-based key derivation function (HKDF)
 * @param hash Hash to use for KDF
 * @param ikm Input keying material
 * @param lenBytes Length of output (in bytes)
 * @param salt Optional salt value (not expected to be secret), defaults hash.size bytes of 0
 * @param info Optional info data (not expected to be secret), defaults to zero-bytes (zero length string)
 * @returns Output keying material
 */
export function hkdf(
	hash: IHash,
	ikm: Uint8Array,
	lenBytes: number,
	salt?: Uint8Array,
	info?: Uint8Array
): Uint8Array {
	const prk = extract(hash, ikm, salt);
	return expand(hash, prk, lenBytes, info);
}
