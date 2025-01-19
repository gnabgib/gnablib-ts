/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';

interface ItoBytesLEer {
	toBytesLE(): Uint8Array;
}

/**
 * Features to convert a generator of 1-64 random bits into bool/u16/i16/u32/i32/u64/f32/f64 or to fill a Uint8Array
 *
 * Note the generator must produce a maximum of 32bits because bit-shifting operations are used (limited to 32
 * in JS).  Since this is intended to be internal, we do not check bigGen() for >0, <=32
 *
 * @internal
 */
export abstract class APrng64<T extends ItoBytesLEer> {
	protected readonly _state: T;
	/** Whether this instance can be exported as bytes */
	readonly saveable: boolean;
	/** How many bits are generated by {@link rawNext} */
	abstract get bitGen(): number;
	/**
	 * Generate the next number in the sequence, be aware of {@link bitGen} if you intend to use this value
	 * over the next* methods
	 */
	abstract rawNext(): U64;

	protected constructor(state: T, saveable: boolean) {
		this._state = state;
		this.saveable = saveable;
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with {@link saveable}=true.
	 * An empty array is returned when `!saveable`
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		return this._state.toBytesLE();
	}

	private _nextU(bits: number): U64 {
		//Note to libdev: bits must be 64 max
		const ret = U64Mut.fromUint32Pair(0, 0);
		let shift = bits;
		while (shift > this.bitGen) {
			shift -= this.bitGen;
			ret.orEq(this.rawNext().lShift(shift));
			//ret.lShiftEq(shift).orEq(this.rawNext());
		}
		//Catch bitGen aligned generation
		if (shift == this.bitGen) {
			return ret.orEq(this.rawNext());
		}
		//Shift has to be < bitGen  at this point
		return ret.orEq(this.rawNext().rShift(this.bitGen - shift));
	}

	/**
	 * Generate a random boolean.
	 *
	 * @returns
	 */
	public nextBool(): boolean {
		//Some PRNG are optimized for floating point generation, and so the lower bits
		// have some uniformity problems.  Consequentially, checking oddness (&1==1) of
		// a complete value is risky, instead we check the most significant bit of the
		// lower U32
		const r = this.rawNext()
			.mut()
			.rShiftEq(this.bitGen - 1);
		return r.low == 1;
	}

	/**
	 * Generate a random unsigned 8bit integer `[0 - 255]`
	 * @returns
	 */
	public nextByte(): number {
		return this._nextU(8).low;
	}

	/**
	 * Generate a random unsigned 16bit integer `[0 - 65535]`
	 * @returns
	 */
	public nextU16(): number {
		return this._nextU(16).low;
	}

	/**
	 * Generate a random signed 16bit integer `[-32768 - 32767]`
	 * @returns
	 */
	public nextI16(): number {
		let ret = this._nextU(16).low >>> 0;
		if (ret > 0x7fff) ret = ~(0xffff - ret);
		return ret;
	}

	/**
	 * Generate a random unsigned 31bit integer `[0 - 2147483647]`,
	 * which is the same as the positive range of an int32, see also: {@link nextI32}
	 * @returns
	 */
	public nextU31(): number {
		return this._nextU(31).low;
	}

	/**
	 * Generate a random unsigned 32bit integer `[0 - 4294967295]`
	 * @returns
	 */
	public nextU32(): number {
		return this._nextU(32).low;
	}

	/**
	 * Generate a random unsigned 64bit integer `[0 - 18446744073709551615]`
	 * @returns
	 */
	public nextU64(): U64 {
		return this._nextU(64);
	}

	/**
	 * Generate `n` random unsigned 64bit integers `[0 - 18446744073709551615]`
	 * @param n 
	 */
	*seqU64(n=1): Generator<U64, void, unknown> {
		let i=0;
		while(i++<n) {
			yield this._nextU(64);
		}
	}

	/**
	 * Generate a random signed 32bit integer `[-2147483648 - 2147483647]`
	 * @returns
	 */
	public nextI32(): number {
		return this._nextU(32).low | 0;
	}

	/**
	 * Generate a random 32bit floating point number `[0 - 1)`
	 * Note: JS has no F32 type, so this generates an F64 with 24 bits of randomness
	 *  and may cause some rounding error
	 * @returns
	 */
	public nextF32(): number {
		const pow2_n24 = 0.000000059604644775390625; //2**-24
		const u = this._nextU(24).low;
		return u * pow2_n24;
		//110010000111001000011100
	}

	/**
	 * Generate a random 64bit floating point number `[0 - 1)`
	 * @returns
	 */
	public nextF64(): number {
		const pow2_n53 = 1.1102230246251565404236316680908e-16; //2**-53
		const pow2_32 = 4294967296; //2**32
		const n = this._nextU(53);
		return (n.high * pow2_32 + n.low) * pow2_n53;
	}

	//todo: fill bytes
}
