/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

abstract class AXoroshiro128 extends APrng64<U64MutArray> {
	readonly bitGen = 64;
	protected abstract get _a(): number;
	protected abstract get _b(): number;
	protected abstract get _c(): number;
	protected abstract _gen(): U64;

	rawNext(): U64 {
		const s0 = this._state.at(0);
		const s1 = this._state.at(1);
		const r = this._gen();

		s1.xorEq(s0);
		s0.lRotEq(this._a).xorEq(s1).xorEq(s1.lShift(this._b));
		s1.lRotEq(this._c);
		return r;
	}
}

/**
 * XoRoShiRo128+ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * This is slightly (+15%) faster than {@link Xoroshiro128pp | XoRoShiRo128++}/{@link Xoroshiro128ss | XoRoShiRo128**},
 * if you're generating {@link nextF64 |F64}, otherwise use one of them.
 *
 * **Note** these are the updated a/b/c parameters from 2018 (preferred)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoroshiro128p extends AXoroshiro128 {
	readonly safeBits = 53;
	protected readonly _a: number = 24;
	protected readonly _b: number = 16;
	protected readonly _c: number = 37;

	protected _gen(): U64 {
		return this._state.at(0).add(this._state.at(1)).mut();
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro128+';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoroshiro128p(
			U64MutArray.fromBytes(
				Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			),
			saveable
		);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: U64, seed1: U64, saveable = false) {
		const state = U64MutArray.fromLen(2);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		return new Xoroshiro128p(state, saveable);
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
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoroshiro128p(s64, saveable);
	}
}

/**
 * XoRoShiRo128+ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * This is slightly (+15%) faster than {@link Xoroshiro128pp | XoRoShiRo128++}/{@link Xoroshiro128ss | XoRoShiRo128**},
 * if you're generating {@link nextF64 |F64}, otherwise use one of them.
 *
 * **Note** these are the original a/b/c parameters from 2016, prefer {@link Xoroshiro128p | Xoroshiro128+}
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoroshiro128p_2016 extends Xoroshiro128p {
	protected readonly _a = 55;
	protected readonly _b = 14;
	protected readonly _c = 36;

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro128+_2016';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoroshiro128p_2016(
			U64MutArray.fromBytes(
				Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			),
			saveable
		);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: U64, seed1: U64, saveable = false) {
		const state = U64MutArray.fromLen(2);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		return new Xoroshiro128p_2016(state, saveable);
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
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoroshiro128p_2016(s64, saveable);
	}
}

/**
 * XoRoShiRo128++ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro128plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 * - {@link Xoroshiro128ss | Xoroshiro128**}
 */
export class Xoroshiro128pp extends AXoroshiro128 {
	readonly safeBits = 64;
	protected readonly _a: number = 49;
	protected readonly _b: number = 21;
	protected readonly _c: number = 28;

	protected _gen(): U64 {
		return this._state
			.at(0)
			.mut()
			.addEq(this._state.at(1))
			.lRotEq(17)
			.addEq(this._state.at(0));
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro128++';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoroshiro128pp(
			U64MutArray.fromBytes(
				Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			),
			saveable
		);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: U64, seed1: U64, saveable = false) {
		const state = U64MutArray.fromLen(2);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		return new Xoroshiro128pp(state, saveable);
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
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoroshiro128pp(s64, saveable);
	}
}

const u64_5 = U64.fromI32s(5, 0);
const u64_9 = U64.fromI32s(9, 0);

/**
 * XoRoShiRo128** using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoroshiro128starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 * - {@link Xoroshiro128pp | Xoroshiro128++}
 */
export class Xoroshiro128ss extends AXoroshiro128 {
	readonly safeBits = 64;
	protected readonly _a: number = 24;
	protected readonly _b: number = 16;
	protected readonly _c: number = 37;

	protected _gen(): U64 {
		return this._state.at(0).mut().mulEq(u64_5).lRotEq(7).mulEq(u64_9);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoroshiro128**';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoroshiro128ss(
			U64MutArray.fromBytes(
				Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			),
			saveable
		);
	}

	/**
	 * Build by providing 2 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: U64, seed1: U64, saveable = false) {
		const state = U64MutArray.fromLen(2);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		return new Xoroshiro128ss(state, saveable);
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
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoroshiro128ss(s64, saveable);
	}
}
