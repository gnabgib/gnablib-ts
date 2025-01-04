/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../primitive/number/U32.js';
import { U64 } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { IRandU32 } from './interfaces/IRandInt.js';
import { IRandU64 } from './interfaces/IRandU64.js';

class Rc4State {
	private readonly _s = new Uint8Array(256);
	private _i = 0;
	private _j = 0;

	constructor(key: Uint8Array | undefined, drop: number) {
		if (key) {
			sLen('key', key).atLeast(1).atMost(this._s.length).throwNot();
			this.ksa(key);
		} else {
			//Default use the first 16 bytes of splitMix32(0):
			// u32: 2462723854,1020716019,454327756,1275600319,
			// hex: 92CA2F0E 3CD6E3F3 1B147DCC 4C081DBF
			this.ksa(
				// prettier-ignore
				Uint8Array.of(
					0x92, 0xca, 0x2f, 0x0e,
					0x3c, 0xd6, 0xe3, 0xf3,
					0x1b, 0x14, 0x7d, 0xcc,
					0x4c, 0x08, 0x1d, 0xbf
				)
			);
		}
		//Drop the first $drop bytes from the stream
		for (let i = 0; i < drop; i++) this.nextByte();
	}

	/**
	 * Key-scheduling algorithm (KSA) initializes the sBox
	 * @param key
	 */
	private ksa(key: Uint8Array) {
		for (let i = 0; i < this._s.length; i++) this._s[i] = i;
		for (let i = 0, j = 0; i < this._s.length; i++) {
			j = (j + this._s[i] + key[i % key.length]) & 0xff;
			const t = this._s[i];
			this._s[i] = this._s[j];
			this._s[j] = t;
		}
	}

	nextByte(): number {
		//Reset code was in the original source, when this was used as an encryption stream, but as
		// a PRNG it isn't useful

		//function nextByte(resetStream=false):number {
		// if (resetStream) {
		//     byteI=0;
		//     byteJ=0;
		//     return 0;
		// }
		this._i = (this._i + 1) & 0xff;
		this._j = (this._j + this._s[this._i]) & 0xff;
		const t = this._s[this._i];
		this._s[this._i] = this._s[this._j];
		this._s[this._j] = t;
		return this._s[(this._s[this._i] + this._s[this._j]) & 0xff];
	}
}

/**
 * [ARC4 aka Arcfour, RC4](https://en.wikipedia.org/wiki/RC4) random generator using 2048bit state, 32bit return as described in
 * [Pseudo-Random Number Generator RC4 Period
Improvement](https://people.computing.clemson.edu/~jmarty/courses/commonCourseContent/AdvancedModule-SecurityConceptsAndApplicationToLinux/StudyofRC4.pdf).
 * Values are packed in little endian order for U32 values.
 * 
 * *NOT cryptographically secure*
 * 
 * Multiple vulnerabilities have been discovered in RC4.
 *
 * Related:
 * 
 * - [Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 * - [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/)
 * - [RFC4345: Improved Arcfour Modes for SSH Transport Layer Protocol](https://datatracker.ietf.org/doc/html/rfc4345)
 * - [RFC6229: Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 *
 * @param key Must be 1-256 bytes long, typically 5-16 bytes long, a default (fixed 16 byte) key is used if not specified
 * @param [drop=0] Drop the first `drop` bytes, RFC4345 recommends 1536 (when used as a cipher)
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function arc4_32(key?: Uint8Array, drop = 0): IRandU32 {
	const s = new Rc4State(key, drop);

	return () => {
		const ret = new Uint8Array(4);
		for (let i = 0; i < 4; i++) ret[i] = s.nextByte();
		//nextByte(true);
		return U32.iFromBytesLE(ret) >>> 0;
	};
}

/**
 * [ARC4 aka Arcfour, RC4](https://en.wikipedia.org/wiki/RC4) random generator using 2048bit state, 64bit return as described in
 * [Pseudo-Random Number Generator RC4 Period
Improvement](https://people.computing.clemson.edu/~jmarty/courses/commonCourseContent/AdvancedModule-SecurityConceptsAndApplicationToLinux/StudyofRC4.pdf).
 * Values are packed in little endian order for U64 values.
 *
 * *NOT cryptographically secure*
 * 
 * Multiple vulnerabilities have been discovered in RC4.
 *
 * Related:
 * 
 * - [Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 * - [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/)
 * - [RFC4345: Improved Arcfour Modes for SSH Transport Layer Protocol](https://datatracker.ietf.org/doc/html/rfc4345)
 * - [RFC6229: Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 *
 * @param key Must be 1-256 bytes long, typically 5-16 bytes long, a default (fixed 16 byte) key is used if not specified
 * @param [drop=0] Drop the first `drop` bytes, RFC4345 recommends 1536 (when used as a cipher)
 * @returns Generator of uint64 [0 - 18446744073709551615]
 */
export function arc4_64(key?: Uint8Array, drop = 0): IRandU64 {
	const s = new Rc4State(key, drop);

	return () => {
		const ret = new Uint8Array(8);
		for (let i = 0; i < 8; i++) ret[i] = s.nextByte();
		return U64.fromBytesLE(ret);
	};
}
