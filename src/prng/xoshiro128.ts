/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

abstract class AXoshiro128 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	protected abstract _gen(): number;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i32(ret, 0, 4);
		return ret;
	}

	rawNext(): number {
		const r = this._gen();

		const t = this._state[1] << 9;
		this._state[2] ^= this._state[0];
		this._state[3] ^= this._state[1];
		this._state[1] ^= this._state[2];
		this._state[0] ^= this._state[3];
		this._state[2] ^= t;
		this._state[3] = (this._state[3] << 11) | (this._state[3] >>> 21); //ROL 11
		return r >>> 0;
	}
}

/**
 * XoShiRo128+ using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * This is slightly (+15%) faster than {@link Xoshiro128pp | XoShiRo128++}/{@link Xoshiro128ss | XoShiRo128**},
 * if you're generating F32, otherwise use one of them.
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro128p extends AXoshiro128 {
	readonly safeBits = 24;
	protected _gen(): number {
		return this._state[0] + this._state[3];
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro128+';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
		return new Xoshiro128p(Uint32Array.of(53, 30301, 71423, 49323), saveable);
	}

	/**
	 * Build by providing 4 seeds, each treated as uint32. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3: number,
		saveable = false
	) {
		const state = Uint32Array.of(seed0, seed1, seed2, seed3);
		return new Xoshiro128p(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new Xoshiro128p(s32, saveable);
	}
}

/**
 * XoShiRo128++ using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro128plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro128pp extends AXoshiro128 {
	readonly safeBits = 32;
	protected _gen(): number {
		let r = this._state[0] + this._state[3];
		r = (r << 7) | (r >>> 25); //ROL 7
		return r + this._state[0];
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro128++';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
		return new Xoshiro128pp(Uint32Array.of(53, 30301, 71423, 49323), saveable);
	}

	/**
	 * Build by providing 4 seeds, each treated as uint32. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3: number,
		saveable = false
	) {
		const state = Uint32Array.of(seed0, seed1, seed2, seed3);
		return new Xoshiro128pp(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new Xoshiro128pp(s32, saveable);
	}
}

/**
 * XoShiRo128** using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro128starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro128ss extends AXoshiro128 {
	readonly safeBits = 32;
	protected _gen(): number {
		let r = this._state[1] * 5;
		r = (r << 7) | (r >>> 25); //ROL 7
		r *= 9;
		return r >>> 0;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro128**';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
		return new Xoshiro128ss(Uint32Array.of(53, 30301, 71423, 49323), saveable);
	}

	/**
	 * Build by providing 4 seeds, each treated as uint32. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3: number,
		saveable = false
	) {
		const state = Uint32Array.of(seed0, seed1, seed2, seed3);
		return new Xoshiro128ss(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new Xoshiro128ss(s32, saveable);
	}
}
