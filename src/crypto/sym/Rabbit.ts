/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from '../../endian/platform.js';
import { U32 } from '../../primitive/number/U32.js';
import { somewhatSafe } from '../../safe/safe.js';
import { IFullCrypt } from '../interfaces/IFullCrypt.js';

// Section 2.5 Counter System
const a = [
	0x4d34d34d, 0xd34d34d3, 0x34d34d34, 0x4d34d34d, 0xd34d34d3, 0x34d34d34,
	0x4d34d34d, 0xd34d34d3,
];
const stateSize32 = 8; // 8* 32Bit numbers =256 bits
const blockSize = 16; //16* 8bit = 128, 8* 16bit, 4* 32bit
const wordSize = 0x100000000; //2^32
const wordMask = 0xffffffff;

/**
 * [Rabbit](https://web.archive.org/web/20131211141248/http://www.cryptico.com/images/pages/rabbit_sasc_final.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Rabbit_(cipher))
 *
 * Rabbit is a stream cipher designed for high performance in software/hardware implementations.  *Due to ambiguities
 * in RFC-4503, this may not be compatible with other implementations.*
 *
 * First Published: *2003*
 * Block size: *16 bytes*
 * Key size: *16 bytes*
 * IV size: *8 bytes*
 * Rounds:
 *
 * Specified in
 * - [The Stream Cipher Rabbit](https://www.ecrypt.eu.org/stream/p3ciphers/rabbit/rabbit_p3.pdf)
 * - [RFC-4503](https://datatracker.ietf.org/doc/html/rfc4503) (2006)
 * - [The eStream Project](https://www.ecrypt.eu.org/stream/rabbitp3.html)
 * - [eCrypt II](https://www.ecrypt.eu.org/stream/e2-rabbit.html)
 */
export class Rabbit implements IFullCrypt {
	readonly blockSize = blockSize;
	readonly #x = new Uint32Array(stateSize32);
	readonly #c = new Uint32Array(stateSize32);
	readonly #state = new Uint8Array(blockSize);
	readonly #s32 = new Uint32Array(this.#state.buffer);

	private _counterCarryBit = 0;

	constructor(key: Uint8Array, iv?: Uint8Array) {
		somewhatSafe.len.exactly('key', key, 16);
		if (iv != undefined) somewhatSafe.len.exactly('iv', iv, 8);
		//Copy the key and correct endianness if required
		const k = key.slice();
		asBE.i128(k);
		asLE.i32(k, 0, 4);
		//asBE.i32(k,0,4);
		const k32 = new Uint32Array(k.buffer);

		//Key setup scheme
		const hMask = 0xffff0000;
		const lMask = 0x0000ffff;
		//States
		this.#x[0] = k32[0];
		this.#x[1] = (k32[3] << 16) | (k32[2] >>> 16);
		this.#x[2] = k32[1];
		this.#x[3] = (k32[0] << 16) | (k32[3] >>> 16);
		this.#x[4] = k32[2];
		this.#x[5] = (k32[1] << 16) | (k32[0] >>> 16);
		this.#x[6] = k32[3];
		this.#x[7] = (k32[2] << 16) | (k32[1] >>> 16);

		//Counters
		this.#c[0] = (k32[2] << 16) | (k32[2] >>> 16);
		this.#c[1] = (k32[0] & hMask) | (k32[1] & lMask);
		this.#c[2] = (k32[3] << 16) | (k32[3] >>> 16);
		this.#c[3] = (k32[1] & hMask) | (k32[2] & lMask);
		this.#c[4] = (k32[0] << 16) | (k32[0] >>> 16);
		this.#c[5] = (k32[2] & hMask) | (k32[3] & lMask);
		this.#c[6] = (k32[1] << 16) | (k32[1] >>> 16);
		this.#c[7] = (k32[3] & hMask) | (k32[0] & lMask);

		this.block();
		this.block();
		this.block();
		this.block();

		//Re-init counter
		this.#c[0] ^= this.#x[4];
		this.#c[1] ^= this.#x[5];
		this.#c[2] ^= this.#x[6];
		this.#c[3] ^= this.#x[7];
		this.#c[4] ^= this.#x[0];
		this.#c[5] ^= this.#x[1];
		this.#c[6] ^= this.#x[2];
		this.#c[7] ^= this.#x[3];

		//IV setup scheme
		if (iv != undefined) {
			const i = iv.slice();
			asBE.i64(i);
			asLE.i32(i, 0, 2);
			const i32 = new Uint32Array(i.buffer);

			this.#c[0] ^= i32[0];
			this.#c[1] ^= (i32[1] & hMask) | ((i32[0] & hMask) >>> 16);
			this.#c[2] ^= i32[1];
			this.#c[3] ^= ((i32[1] & lMask) << 16) | (i32[0] & lMask);
			this.#c[4] ^= i32[0];
			this.#c[5] ^= (i32[1] & hMask) | ((i32[0] & hMask) >>> 16);
			this.#c[6] ^= i32[1];
			this.#c[7] ^= ((i32[1] & lMask) << 16) | (i32[0] & lMask);

			this.block();
			this.block();
			this.block();
			this.block();
		}
		// this.blab();
	}

	private block(): void {
		const g = new Uint32Array(8);
		for (let i = 0; i < 8; i++) {
			//Counter update (2.5)
			const t = this.#c[i] + a[i] + this._counterCarryBit;
			this._counterCarryBit = t / wordSize;
			this.#c[i] = t;

			// nextState (2.6)
			const uv = (this.#x[i] + this.#c[i]) & wordMask;
			const uvLow = uv & 0xffff;
			const uvHigh = uv >>> 16;
			//From ecrypt/rabbit.c impl
			const h =
				((((uvLow * uvLow) >>> 17) + uvLow * uvHigh) >>> 15) + uvHigh * uvHigh;
			const l = (((uv & 0xffff0000) * uv) | 0) + uvLow * uv;
			g[i] = h ^ l;
		}

		//We get mod WORDSIZE for free because of Uint32Array
		this.#x[0] = g[0] + U32.rol(g[7], 16) + U32.rol(g[6], 16);
		this.#x[1] = g[1] + U32.rol(g[0], 8) + g[7];
		this.#x[2] = g[2] + U32.rol(g[1], 16) + U32.rol(g[0], 16);
		this.#x[3] = g[3] + U32.rol(g[2], 8) + g[1];
		this.#x[4] = g[4] + U32.rol(g[3], 16) + U32.rol(g[2], 16);
		this.#x[5] = g[5] + U32.rol(g[4], 8) + g[3];
		this.#x[6] = g[6] + U32.rol(g[5], 16) + U32.rol(g[4], 16);
		this.#x[7] = g[7] + U32.rol(g[6], 8) + g[5];

		//Extraction (2.7)
		this.#s32[0] = this.#x[0] ^ (this.#x[5] >>> 16) ^ (this.#x[3] << 16);
		this.#s32[1] = this.#x[2] ^ (this.#x[7] >>> 16) ^ (this.#x[5] << 16);
		this.#s32[2] = this.#x[4] ^ (this.#x[1] >>> 16) ^ (this.#x[7] << 16);
		this.#s32[3] = this.#x[6] ^ (this.#x[3] >>> 16) ^ (this.#x[1] << 16);
		// NOTE: RFC-4503 specifies state is big-endian S[127..0], but NOT whether
		// block should considered big or little endian (MSB first, MSB last).
		// We (may) invert the state here so that block is considered Big endian
		// allowing the RFC test vectors to be used without reversing each S0/S1/S2.
		//
		// There are historical Rabbit definitions which have S0/S1/S2 bytes listed in
		// the opposite order, suggesting the spec may have changed during the eStream phases.
		//
		// Unfortunately other implementations don't shed light:
		// -Crypto-JS doesn't pass RFC-4503 test vectors
		// -WolfSSL has deprecated Rabbit
		// -The eStream project includes a zip that includes test vectors (test-vectors.txt),
		//  HOWEVER the first test (Test 1) gives a different result to RFC-4503 A.1#1
		//  (for the same input) *sigh*

		//Correct endian
		asBE.i128(this.#state);
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		let nToWrite = plain.length;
		let pos = 0;
		if (enc !== plain) enc.set(plain);
		//Encrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				enc[pos++] ^= this.#state[i];
			}
			nToWrite -= blockSize;
		}
		//Encrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				enc[pos++] ^= this.#state[i];
			}
		}
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		let nToWrite = plain.length;
		let pos = 0;
		if (enc !== plain) plain.set(enc);
		//Encrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				plain[pos++] ^= this.#state[i];
			}
			nToWrite -= blockSize;
		}
		//Encrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				plain[pos++] ^= this.#state[i];
			}
		}
	}

	encryptSize(plainLen: number): number {
		return plainLen;
	}
}
