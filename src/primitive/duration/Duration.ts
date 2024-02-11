// /*! Copyright 2024 the gnablib contributors MPL-1.1 */

// import { superSafe as safe } from '../../safe/index.js';
// import { BitReader } from '../BitReader.js';
// import { BitWriter } from '../BitWriter.js';
// import { WindowStr } from '../WindowStr.js';
// import { ContentError } from '../error/ContentError.js';
// import { ISerializer } from '../interfaces/ISerializer.js';

// const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
// const DBG_RPT = 'Duration';
// const usPerS = 1000000; //        1000000
// const usPerM = usPerS * 60; //   60000000
// const usPerH = usPerM * 60; // 3600000000
// const usPerD = usPerH * 24; //86400000000 //more than 2^32

// /** Days + microseconds (timespan) */
// export class Duration implements ISerializer {
// 	/**Number of bytes required to store this data */
// 	static readonly storageBytes = 8;
// 	/**Number of bits required to serialize this data */
// 	static readonly serialBits = 64;
// 	readonly #us: number;
// 	readonly #d: number;

// 	protected constructor(us: number, day: number) {
// 		this.#us = us;
// 		this.#d = day;
// 	}

// 	public static get zero(): Duration {
// 		return zero;
// 	}

// 	/** (nd)(nh)(nm)(n.uuuuuus) blanks can be dropped, including micro-seconds (.uuuuuu)*/
// 	public toString(): string {
// 		const dBit = this.#d == 0 ? '' : this.#d.toString() + 'd';
// 		let v = this.#us;
// 		const u = v % 1000000;
// 		v = (v / 1000000) | 0;
// 		const s = v % 60;
// 		v = (v / 60) | 0;
// 		const m = v % 60;
// 		v = (v / 60) | 0;

// 		let uBit = '';
// 		if (u > 0) {
// 			uBit = u.toString();
// 			uBit = '.' + ('000000' + uBit).substring(uBit.length);
// 		}
// 		const sBit = (s > 0 || uBit.length > 0 ? s : '') + uBit;
// 		return (
// 			dBit +
// 			(v > 0 ? v + 'h' : '') +
// 			(m > 0 ? m + 'm' : '') +
// 			(sBit.length > 0 ? sBit + 's' : '')
// 		);
// 	}

// 	toJSON(): string {
// 		return this.toString();
// 	}

// 	//valueOf
// 	//serialize

// 	/** Number of bits required to serialize */
// 	get serialSizeBits(): number {
// 		return Duration.serialBits;
// 	}

// 	/**
// 	 * Test internal state is valid, throws if it's not
// 	 * You should call this after a deserialize unless you trust the source
// 	 * @returns self (chainable)
// 	 */
// 	public validate(): Duration {
// 		safe.int.inRangeInc('us', this.#us, 0, usPerD - 1);
// 		return this;
// 	}

// 	/** @hidden */
// 	get [Symbol.toStringTag](): string {
// 		return DBG_RPT;
// 	}

// 	/** @hidden */
// 	[consoleDebugSymbol](/*depth, options, inspect*/) {
// 		return `${DBG_RPT}(${this.toString()})`;
// 	}

// 	public static fromUs(us: number): Duration {
//         const usp=us%usPerD;
// 		const d = (us / usPerD) | 0;
// 		return new Duration(usp, d);
// 	}

// 	public static new(
// 		d: number,
// 		h: number,
// 		m: number,
// 		s: number,
// 		us: number
// 	): Duration {
//         //Round the upper amounts because of floating point error eg 1.001 s = 1.0009999999...
//         const usp=Math.round(d * usPerD + h * usPerH + m * usPerM + s * usPerS) + (us|0);
// 		return Duration.fromUs(
// 			usp
// 		);
// 	}

// 	//public static deserialize(source: BitReader, storage?: Uint8Array): Duration;
// }
// const zero = Duration.fromUs(0);
