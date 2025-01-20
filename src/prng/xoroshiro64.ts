/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

abstract class AXoroshiro64 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	readonly safeBits = 32;
	protected abstract _gen(): number;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i32(ret, 0, 2);
		return ret;
	}

	rawNext(): number {
		const r = this._gen();
		this._state[1] ^= this._state[0];
		this._state[0] =
			((this._state[0] << 26) | (this._state[0] >>> 6)) ^
			this._state[1] ^
			(this._state[1] << 9); //lRot 26 a=26, b=9
		this._state[1] = (this._state[1] << 13) | (this._state[1] >>> 19); //lRot 13 c=13
		return r >>> 0;
	}
}

/**
 * XoRoShiRo64* using xor-rotate-shift-rotate, with 64bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro64star.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoroshiro64s extends AXoroshiro64 {
	protected _gen(): number {
		return Math.imul(this._state[0], 0x9e3779bb);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro64*';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF | 16294208416658607535
		// Which in U32 little-endian is:
		return new Xoroshiro64s(Uint32Array.of(0x7b1dcdaf, 0xe220a839), saveable);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number, seed1: number, saveable = false) {
		const s = Uint32Array.of(seed0, seed1);
		return new Xoroshiro64s(s, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(8).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 2);
		const s32 = new Uint32Array(s2.buffer);
		return new Xoroshiro64s(s32, saveable);
	}
}

/**
 * XoRoShiRo64** using xor-rotate-shift-rotate, with 64bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro64starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoroshiro64ss extends AXoroshiro64 {
	protected _gen(): number {
		const r = Math.imul(this._state[0], 0x9e3779bb);
		return Math.imul((r << 5) | (r >>> 27), 5);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro64**';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF | 16294208416658607535
		// Which in U32 little-endian is:
		return new Xoroshiro64ss(Uint32Array.of(0x7b1dcdaf, 0xe220a839), saveable);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number, seed1: number, saveable = false) {
		const s = Uint32Array.of(seed0, seed1);
		return new Xoroshiro64ss(s, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(8).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 2);
		const s32 = new Uint32Array(s2.buffer);
		return new Xoroshiro64ss(s32, saveable);
	}
}
