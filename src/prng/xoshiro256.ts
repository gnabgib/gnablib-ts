/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

abstract class AXoshiro256 extends APrng64<U64MutArray> {
	readonly bitGen = 64;
	protected abstract _gen(): U64;

	rawNext(): U64 {
		const r = this._gen();

		const t = this._state.at(1).lShift(17);
		this._state.at(2).xorEq(this._state.at(0));
		this._state.at(3).xorEq(this._state.at(1));
		this._state.at(1).xorEq(this._state.at(2));
		this._state.at(0).xorEq(this._state.at(3));
		this._state.at(2).xorEq(t);
		this._state.at(3).lRotEq(45);
		return r;
	}
}

/**
 * [XoShiRo256+](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 * 
 * This is slightly (+15%) faster than {@link Xoshiro256pp | XoShiRo256++}/{@link Xoshiro256ss | XoShiRo256**}, 
 * if you're generating F64, otherwise use one of them.
 *
 * *NOT cryptographically secure*
 * 
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro256plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro256p extends AXoshiro256 {
   
	readonly safeBits = 53;
	protected _gen(): U64 {
		return this._state.at(0).add(this._state.at(3));
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro256+';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoshiro256p(
			U64MutArray.fromBytes(
				// prettier-ignore
				Uint32Array.of(
					0x7b1dcdaf,0xe220a839,
					0xa1b965f4,0x6e789e6a,
					0x8009454f,0x06c45d18,
					0x724c81ec,0xf88bb8a8
				)
			),
			saveable
		);
	}

	/**
	 * Build by providing 4 seeds. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: U64,
		seed1: U64,
		seed2: U64,
		seed3: U64,
		saveable = false
	) {
		const state = U64MutArray.fromLen(4);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		state.at(2).set(seed2);
		state.at(3).set(seed3);
		return new Xoshiro256p(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 8);
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoshiro256p(s64, saveable);
	}
}

/**
 * [XoShiRo256++](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro256plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro256pp extends AXoshiro256 {
	readonly safeBits = 64;
	protected _gen(): U64 {
		const r = this._state.at(0).add(this._state.at(3)).mut();
		r.lRotEq(23).addEq(this._state.at(0));
		return r;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro256++';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoshiro256pp(
			U64MutArray.fromBytes(
				// prettier-ignore
				Uint32Array.of(
					0x7b1dcdaf,0xe220a839,
					0xa1b965f4,0x6e789e6a,
					0x8009454f,0x06c45d18,
					0x724c81ec,0xf88bb8a8
				)
			),
			saveable
		);
	}

	/**
	 * Build by providing 4 seeds. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: U64,
		seed1: U64,
		seed2: U64,
		seed3: U64,
		saveable = false
	) {
		const state = U64MutArray.fromLen(4);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		state.at(2).set(seed2);
		state.at(3).set(seed3);
		return new Xoshiro256pp(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 8);
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoshiro256pp(s64, saveable);
	}
}

const u64_5 = U64.fromUint32Pair(5, 0);
const u64_9 = U64.fromUint32Pair(9, 0);

/**
 * [XoShiRo256**](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [C source](https://prng.di.unimi.it/xoshiro256starstar.c)
 * - [A Quick Look at Xoshiro256** (2018)](https://www.pcg-random.org/posts/a-quick-look-at-xoshiro256.html)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 */
export class Xoshiro256ss extends AXoshiro256 {
	readonly safeBits = 64;
	protected _gen(): U64 {
		const r = this._state.at(1).mul(u64_5).mut();
		r.lRotEq(7).mulEq(u64_9);
		return r;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xoshiro256**';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
		// Which in U32 little-endian follows
		return new Xoshiro256ss(
			U64MutArray.fromBytes(
				// prettier-ignore
				Uint32Array.of(
					0x7b1dcdaf,0xe220a839,
					0xa1b965f4,0x6e789e6a,
					0x8009454f,0x06c45d18,
					0x724c81ec,0xf88bb8a8
				)
			),
			saveable
		);
	}

	/**
	 * Build by providing 4 seeds. They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: U64,
		seed1: U64,
		seed2: U64,
		seed3: U64,
		saveable = false
	) {
		const state = U64MutArray.fromLen(4);
		state.at(0).set(seed0);
		state.at(1).set(seed1);
		state.at(2).set(seed2);
		state.at(3).set(seed3);
		return new Xoshiro256ss(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 8);
		const s64 = U64MutArray.fromBytes(s2.buffer);
		return new Xoshiro256ss(s64, saveable);
	}
}