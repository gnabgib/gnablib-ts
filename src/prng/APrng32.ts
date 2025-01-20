/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { BitWriter } from '../primitive/BitWriter.js';

/**
 * Features to convert a generator of 1-32 random bits into bool/u16/i16/u32/i32/f32/f64 or to fill a Uint8Array
 *
 * Note the generator must produce a maximum of 32bits because bit-shifting operations are used (limited to 32
 * in JS).  Since this is intended to be internal, we do not check bigGen() for >0, <=32
 *
 * @internal
 */
export abstract class APrng32<T> {
	/** How many bits are generated by {@link rawNext} */
	abstract get bitGen(): number;
	/** Usable bits generated {@link rawNext} */
	abstract get safeBits(): number;
	/**
	 * Generate the next number in the sequence, be aware of {@link bitGen} if you intend to use this value
	 * over the next* methods
	 */
	abstract rawNext(): number;
	protected abstract trueSave(): Uint8Array;

	protected constructor(
		protected readonly _state: T,
		/** Whether this instance can be exported as bytes */
		readonly saveable: boolean
	) {}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with {@link saveable}=true.
	 * An empty array is returned when `!saveable`
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		return this.trueSave();
	}

	private _nextU(bits: number): number {
		//Note to libdev: bits must be 32 max, this *only* obeys bitGen
		let shift = bits;
		let ret = 0;
		while (shift > this.bitGen) {
			shift -= this.bitGen;
			ret |= this.rawNext() << shift;
		}
		//Catch bitGen aligned generation
		if (shift == this.bitGen) {
			return ret | this.rawNext();
		}
		//Shift has to be < bitGen  at this point
		return ret | (this.rawNext() >>> (this.bitGen - shift));
	}

	/**
	 * Generate a random boolean.
	 *
	 * @returns
	 */
	public nextBool(): boolean {
		//Some PRNG are optimized for floating point generation, and so the lower bits
		// have some uniformity problems.  Consequentially, checking oddness (&1==1) of
		// a complete value is risky, instead we check the most significant bit
		const r = this.rawNext();
		return r >>> (this.bitGen - 1) == 1;
		//Note we could also compare  >2**(this.bitGen/2) although this causes problems
		// with odd-bit count generators (there are U31 ones)

		//Note a more complicated algo xoring several bits could also work, and might repeat
		// less, however it's a more expensive operation.  xoring several bits distributed
		// through the raw number could also work, but determining a distribution for any
		// generator sign would be even more work (eg bitGet/3, xor top bit of each section)
	}

	/**
	 * Generate a random unsigned 8bit integer `[0 - 255]`
	 * @returns
	 */
	public nextByte(): number {
		return this._nextU(8);
	}

	/**
	 * Generate a random unsigned 16bit integer `[0 - 65535]`
	 * @returns
	 */
	public nextU16(): number {
		return this._nextU(16);
	}

	/**
	 * Generate a random signed 16bit integer `[-32768 - 32767]`
	 * @returns
	 */
	public nextI16(): number {
		let ret = this._nextU(16) >>> 0;
		if (ret > 0x7fff) ret = ~(0xffff - ret);
		return ret;
	}

	/**
	 * Generate a random unsigned 31bit integer `[0 - 2147483647]`,
	 * which is the same as the positive range of an int32, see also: {@link nextI32}
	 * @returns
	 */
	public nextU31(): number {
		return this._nextU(31);
	}

	/**
	 * Generate a random unsigned 32bit integer `[0 - 4294967295]`
	 * @returns
	 */
	public nextU32(): number {
		return this._nextU(32) >>> 0;
	}

	/**
	 * Generate `n` random unsigned 32bit integers `[0 - 4294967295]`
	 * @param n
	 */
	*seqU32(n = 1): Generator<number, void, unknown> {
		let i = 0;
		while (i++ < n) {
			yield this._nextU(32) >>> 0;
		}
	}

	/**
	 * Generate a random signed 32bit integer `[-2147483648 - 2147483647]`
	 * @returns
	 */
	public nextI32(): number {
		return this._nextU(32);
	}

	//U64, OOS (requires U64)

	/**
	 * Generate a random 32bit floating point number `[0 - 1)`
	 * Note: JS has no F32 type, so this generates an F64 with 24 bits of randomness
	 *  and may cause some rounding error
	 * @returns
	 */
	public nextF32(): number {
		const pow2_n24 = 0.000000059604644775390625; //2**-24
		const u = this._nextU(24);
		return u * pow2_n24;
		//110010000111001000011100
	}

	/**
	 * Generate a random 64bit floating point number `[0 - 1)`
	 * @returns
	 */
	public nextF64(): number {
		const pow2_n53 = 1.1102230246251565404236316680908e-16; //2**-53
		const pow2_26 = 67108864;
		//Some PRNG are optimized for floating point generation, and so the lower bits
		// have some uniformity problems.  Consequentially, we request two random numbers -
		// 27b + 26b. Using _nextU means the remainder is discarded so for >U27b generators
		// the low bits are dropped (U31: 4,5 U32: 5,6 bits dropped respectively)
		const high = this._nextU(27);
		const low = this._nextU(26);
		return (high * pow2_26 + low) * pow2_n53;
	}

	/**
	 * Fill the provided array with random data.  Most significant bits are written into
	 * the first byte, next bits into the following byte etc.
	 *
	 * @param target A byte array of any size
	 * @returns target to allow `let a=Prng.fillBytes(new Uint8Array(n));`
	 */
	public fillBytes(target: Uint8Array): Uint8Array {
		const bw = BitWriter.mount(target);
		const diff = this.bitGen - this.safeBits;
		/* DEBUG  target.length[safeBits]..
		  [#] = consume number from the stream, which is #bits
        */
		// /*DEBUG*/let d = `${target.length}`;
		while (!bw.full) {
			// /*DEBUG*/d += `[${this.safeBits}]`;
			bw.pushNumberBE(this.rawNext() >>> diff, this.safeBits);
		}
		// /*DEBUG*/console.log(d);
		return target;
	}
}
