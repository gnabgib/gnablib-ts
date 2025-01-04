/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../primitive/number/U32.js';
import { U64 } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { IRandUInt } from './interfaces/IRandInt.js';
import { IRandU64 } from './interfaces/IRandU64.js';

class Rc4State {
	private readonly _s = new Uint8Array(256);
	private _i = 0;
	private _j = 0;

	constructor(key: Uint8Array) {
		sLen('key', key).atMost(this._s.length).throwNot();
		this._init(key);
	}

	private _init(key: Uint8Array) {
		for (let i = 0; i < this._s.length; i++) this._s[i] = i;
		for (let i = 0, j = 0; i < this._s.length; i++) {
			j = (j + this._s[i] + key[i % key.length]) & 0xff;
			let t = this._s[i];
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
		let t = this._s[this._i];
		this._s[this._i] = this._s[this._j];
		this._s[this._j] = t;
		return this._s[(this._s[this._i] + this._s[this._j]) & 0xff];
	}
}

/**
 * [RC4 aka ARC4](https://en.wikipedia.org/wiki/RC4) random generator using 2048bit state, 32bit return as described in
 * [Pseudo-Random Number Generator RC4 Period
Improvement](https://people.computing.clemson.edu/~jmarty/courses/commonCourseContent/AdvancedModule-SecurityConceptsAndApplicationToLinux/StudyofRC4.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * 
 * - [Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 * - [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/)
 *
 * @param seed
 * @returns Generator
 */
export function rc4_32(key: Uint8Array): IRandUInt {
	const s = new Rc4State(key);

	// sLen('key',key).atMost(s.length).throwNot();
	// let byteI=0;
	// let byteJ=0;

	// function init() {
	//     //let i=0;
	//     for(let i=0;i<s.length;i++) s[i]=i;
	//     for(let i=0,j=0;i<s.length;i++) {
	//         j = (j + s[i] + key[i % key.length]) & 0xFF;
	//         let t=s[i];
	//         s[i]=s[j];
	//         s[j]=t;
	//     }
	// }
	// function nextByte():number {
	// //function nextByte(resetStream=false):number {
	//     // if (resetStream) {
	//     //     byteI=0;
	//     //     byteJ=0;
	//     //     return 0;
	//     // }
	//     byteI=(byteI+1)&0xFF;
	//     byteJ=(byteJ+s[byteI])&0xFF;
	//     let t=s[byteI];
	//     s[byteI]=s[byteJ];
	//     s[byteJ]=t;
	//     return s[(s[byteI] + s[byteJ]) & 0xFF];
	// }

	// init();

	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		const ret = new Uint8Array(4);
		for (let i = 0; i < 4; i++) ret[i] = s.nextByte();
		//nextByte(true);
		return U32.iFromBytesLE(ret) >>> 0;
	};
}

/**
 * [RC4 aka ARC4](https://en.wikipedia.org/wiki/RC4) random generator using 2048bit state, 64bit return as described in
 * [Pseudo-Random Number Generator RC4 Period
Improvement](https://people.computing.clemson.edu/~jmarty/courses/commonCourseContent/AdvancedModule-SecurityConceptsAndApplicationToLinux/StudyofRC4.pdf)
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * 
 * - [Test Vectors for the Stream Cipher RC4](https://datatracker.ietf.org/doc/html/rfc6229)
 * - [RSA and ECC in JavaScript](http://www-cs-students.stanford.edu/~tjw/jsbn/)
 *
 * @param seed
 * @returns Generator
 */
export function rc4_64(key: Uint8Array): IRandU64 {
	const s = new Rc4State(key);

	/** Get the next random number uint32 [0 - 18446744073709551615] */
	return () => {
		const ret = new Uint8Array(8);
		for (let i = 0; i < 8; i++) ret[i] = s.nextByte();
		return U64.fromBytesLE(ret);
	};
}
