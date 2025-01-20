/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

abstract class AXorShift128p_ extends APrng64<U64MutArray> {
	readonly bitGen = 64;
	readonly safeBits = 64;
	protected abstract get _a(): number;
	protected abstract get _b(): number;
	protected abstract get _c(): number;

	rawNext(): U64 {
		const s1 = this._state.at(0).mut();
		const s0 = this._state.at(1);
		const ret = s0.add(s1);
		//good

		this._state.at(0).set(s0);
		s1.xorEq(s1.lShift(this._a));

		this._state
			.at(1)
			.set(s1.xor(s0).xor(s1.rShift(this._b)).xor(s0.rShift(this._c)));
		return ret;
	}
}

/**
 * XorShift with 128bit state, 64bit return as described in
 * [Vigna XorShift128plus](http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf)
 *
 * `a=23`, `b=18`, `c=5`
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 * - {@link XorShift128pV8 | XorShift128+V8}
 */
export class XorShift128p extends AXorShift128p_ {
	protected readonly _a: number = 23;
	protected readonly _b: number = 18;
	protected readonly _c: number = 5;

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xorshift128+';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new XorShift128p(
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
		return new XorShift128p(state, saveable);
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
		return new XorShift128p(s64, saveable);
	}
}

/**
 * XorShift with 128bit state, 64bit return as described in
 * [Vigna XorShift128plus](http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf)
 * using the same tuning parameters as the v8 implementation
 *
 * `a=23`, `b=17`, `c=26`
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 * - {@link XorShift128p | XorShift128+}
 */
export class XorShift128pV8 extends AXorShift128p_ {
	protected readonly _a: number = 23;
	protected readonly _b: number = 17;
	protected readonly _c: number = 26;

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xorshift128+v8';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new XorShift128pV8(
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
		return new XorShift128pV8(state, saveable);
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
		return new XorShift128pV8(s64, saveable);
	}
}
