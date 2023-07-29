// /*! Copyright 2023 the gnablib contributors MPL-1.1 */

// import { hex } from '../encoding/Hex.js';
// import { asBE } from '../endian/platform.js';
// import { safety } from './Safety.js';

// const maxU32Plus1 = 0x100000000;

// export class U128 {
// 	protected arr: Uint32Array;
// 	protected pos: number;

// 	/**
// 	 * Uint32 is platform ordered, but the U32 are in LE order
// 	 * [pos]=low32, [pos+1]=highLow32, [pos+2]=lowHigh32, [pos+3]=high32
// 	 *
// 	 * On LE systems this means it's true LE (bytes: 0..31, 32..63, 64..95, 96..127),
// 	 * on BE systems this means it's a form of middle (31..0, 63..32, 95..64, 127..96)
// 	 * @param arr
// 	 * @param pos
// 	 */
// 	protected constructor(arr: Uint32Array, pos = 0) {
// 		this.arr = arr;
// 		this.pos = pos;
// 	}

// 	/**
// 	 * Value as a stream of bytes (big-endian order) COPY
// 	 * @returns Uint8Array[16]
// 	 */
// 	toBytesBE(): Uint8Array {
// 		//Invert l/h & project into bytes
// 		const r = new Uint8Array(
// 			Uint32Array.of(
// 				this.arr[this.pos + 3],
// 				this.arr[this.pos + 2],
// 				this.arr[this.pos + 1],
// 				this.arr[this.pos]
// 			).buffer
// 		);
// 		asBE.i32(r, 0, 4);
// 		return r;
// 	}

// 	/**
// 	 * String version of this value, in big endian
// 	 * @returns
// 	 */
// 	toString(): string {
// 		return 'u128{' + hex.fromBytes(this.toBytesBE()) + '}';
// 	}

// 	/**
// 	 * Build from an integer - note JS can only support up to 51bit ints
// 	 * @param uint51
// 	 * @returns
// 	 */
// 	static fromIntUnsafe(uint51: number): U128 {
// 		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
// 	}

// 	/**
// 	 * Build from an integer - note JS can only support up to 51bit ints
// 	 * @param uint51 0-Number.MAX_SAFE_INT
// 	 * @returns
// 	 */
// 	static fromInt(uint51: number): U128 {
// 		safety.intGte(uint51, 0, 'uint51');
// 		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
// 	}

// 	/**
// 	 * Build from four integers, each truncated to 32 bits
// 	 * @param u32LowLow
// 	 * @param u32LowHigh
// 	 * @param u32HighLow
// 	 * @param u32HighHigh
// 	 */
// 	static fromUint32Quad(
// 		u32LowLow: number,
// 		u32LowHigh: number,
// 		u32HighLow: number,
// 		u32HighHigh: number
// 	): U128 {
// 		return new U128(
// 			Uint32Array.of(u32LowLow, u32LowHigh, u32HighLow, u32HighHigh)
// 		);
// 	}

// 	/**
// 	 * Created a "view" into an existing Uint32Array
// 	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
// 	 * @param source
// 	 * @param pos Position to link (default 0), note this is an array-position not bytes
// 	 * @returns
// 	 */
// 	static fromArray(source: Uint32Array, pos = 0): U128 {
// 		return new U128(source, pos);
// 	}

// 	/**
// 	 * A U128 with value 340,282,366,920,938,463,463,374,607,431,768,211,455 (the maximum Uint128)
// 	 */
// 	static get max(): U128 {
// 		return max;
// 	}

// 	/**
// 	 * A U128 with value 0 (the minimum Uint128)
// 	 */
// 	static get min(): U128 {
// 		return zero;
// 	}

// 	/**
// 	 * A U128 with value 0
// 	 */
// 	static get zero(): U128 {
// 		return zero;
// 	}
// }
// const zero = U128.fromIntUnsafe(0);
// const max = U128.fromUint32Quad(0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff);

// export class U128Mut extends U128 {
// 	/**
// 	 * Zero out this value
// 	 */
// 	zero(): void {
// 		this.arr.fill(0, this.pos, this.pos + 4);
// 	}

//     /**
// 	 * Build from an integer - note JS can only support up to 51bit ints
// 	 * @param uint51
// 	 * @returns
// 	 */
// 	static fromIntUnsafe(uint51: number): U128Mut {
// 		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
// 	}

// 	/**
// 	 * Build from an integer - note JS can only support up to 51bit ints
// 	 * @param uint51 0-Number.MAX_SAFE_INT
// 	 * @returns
// 	 */
// 	static fromInt(uint51: number): U128Mut {
// 		safety.intGte(uint51, 0, 'uint51');
// 		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
// 	}

// 	/**
// 	 * Build from four integers, each truncated to 32 bits
// 	 * @param u32LowLow
// 	 * @param u32LowHigh
// 	 * @param u32HighLow
// 	 * @param u32HighHigh
// 	 */
// 	static fromUint32Quad(
// 		u32LowLow: number,
// 		u32LowHigh: number,
// 		u32HighLow: number,
// 		u32HighHigh: number
// 	): U128Mut {
// 		return new U128Mut(
// 			Uint32Array.of(u32LowLow, u32LowHigh, u32HighLow, u32HighHigh)
// 		);
// 	}

// 	/**
// 	 * Created a "view" into an existing Uint32Array
// 	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state,
//      * and changes to to U128Mt will alter `source`
//      * 
// 	 * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
// 	 * @param source
// 	 * @param pos Position to link (default 0), note this is an array-position not bytes
// 	 * @returns
// 	 */
// 	static fromArray(source: Uint32Array, pos = 0): U128Mut {
// 		return new U128Mut(source, pos);
// 	}
// }
