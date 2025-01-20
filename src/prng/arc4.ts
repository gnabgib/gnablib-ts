/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [ARC4 aka Arcfour, RC4](https://en.wikipedia.org/wiki/RC4) random generator using 2048bit state, 8bit return as described in
 * [Pseudo-Random Number Generator RC4 Period
Improvement](https://people.computing.clemson.edu/~jmarty/courses/commonCourseContent/AdvancedModule-SecurityConceptsAndApplicationToLinux/StudyofRC4.pdf).
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
 */
export class Arc4 extends APrng32<Uint8Array> {
	private _i = 0;
	private _j = 0;
	readonly bitGen = 8;
	readonly safeBits = 8;

	protected trueSave() {
		const ret = new Uint8Array(258);
		ret.set(this._state);
		ret[256] = this._i;
		ret[257] = this._j;
		return ret;
	}

	rawNext(): number {
		//Reset code was in the original source, when this was used as an encryption stream, but as
		// a PRNG it isn't useful

		//function nextByte(resetStream=false):number {
		// if (resetStream) {
		//     byteI=0;
		//     byteJ=0;
		//     return 0;
		// }
		this._i = (this._i + 1) & 0xff;
		this._j = (this._j + this._state[this._i]) & 0xff;
		const t = this._state[this._i];
		this._state[this._i] = this._state[this._j];
		this._state[this._j] = t;
		return this._state[(this._state[this._i] + this._state[this._j]) & 0xff];
	}

	/**
	 * Key-scheduling algorithm (KSA) initializes the sBox
	 * @param key
	 */
	private ksa(key: Uint8Array) {
		for (let i = 0; i < this._state.length; i++) this._state[i] = i;
		for (let i = 0, j = 0; i < this._state.length; i++) {
			j = (j + this._state[i] + key[i % key.length]) & 0xff;
			const t = this._state[i];
			this._state[i] = this._state[j];
			this._state[j] = t;
		}
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'arc4';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		const ret = new Arc4(new Uint8Array(256), saveable);
		//Default use the first 16 bytes of SplitMix32(0):
		// u32: 2462723854,1020716019,454327756,1275600319,
		// hex: 92CA2F0E 3CD6E3F3 1B147DCC 4C081DBF
		ret.ksa(
			// prettier-ignore
			Uint8Array.of(
				0x92, 0xca, 0x2f, 0x0e,
				0x3c, 0xd6, 0xe3, 0xf3,
				0x1b, 0x14, 0x7d, 0xcc,
				0x4c, 0x08, 0x1d, 0xbf
			)
		);
		return ret;
	}

	/**
	 * Build by providing a key of 1-256 bytes, typically 5-16 bytes long.
	 * @param key 1-256 bytes in length
	 * @param saveable Whether the generator's state can be saved
	 * @throws Error key.length <1 || >256 bytes
	 */
	static seed(key: Uint8Array, saveable = false) {
		sLen('key', key).atLeast(1).atMost(256).throwNot();
		const ret = new Arc4(new Uint8Array(256), saveable);
		ret.ksa(key);
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(258).throwNot();
		const ret = new Arc4(state.slice(0, 256), saveable);
		ret._i = state[256];
		ret._j = state[257];
		return ret;
	}
}
