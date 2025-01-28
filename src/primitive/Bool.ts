/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { ParseProblem } from '../error/index.js';
import { sLen } from '../safe/safe.js';
import { BitReader } from './BitReader.js';
import { BitWriter } from './BitWriter.js';
import { ISerialBit } from './interfaces/ISerial.js';
import { WindowStr } from './WindowStr.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const s = ['false', 'true'];

export class Bool implements ISerialBit {
	/** Number of bytes required in memory*/
	readonly size8 = 1;
	readonly serialBits = 1;

	protected constructor(protected _arr: Uint8Array, protected _pos: number) {}

	//#region Builds
	/** Build from a boolean or numeric value (where 0|NaN=false, and anything else=true) */
	static from(v: number | boolean) {
		return new Bool(Uint8Array.of(v ? 1 : 0), 0);
	}

	/**
	 * Mount an existing array, note this **shares** memory with the array,
	 * changing a value in `arr` will mutate this state.
	 *
	 * @param pos Position to link from
	 * @throws Error if `arr` isn't long enough
	 */
	static mount(arr: Uint8Array, pos = 0) {
		sLen('arr', arr)
			.atLeast(pos + 1)
			.throwNot();
		return new Bool(arr, pos);
	}

	/**
	 * Read next bit from stream and create a value from it
	 * @throws Error if there's not enough content
	 */
	static deserial(br: BitReader): Bool {
		return new Bool(Uint8Array.of(br.readNumberBE(1)), 0);
	}
	//#endregion

	/** Create a **copy** of this element */
	clone() {
		return new Bool(this._arr.slice(this._pos, this._pos + 1), 0);
	}

	toString(): string {
		return s[this._arr[this._pos] & 1];
	}

	valueOf(): boolean {
		return !!(this._arr[this._pos] & 1);
	}

	serial(bw: BitWriter) {
		bw.mustPushNumberBE(this._arr[this._pos], 1);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Bool';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Bool(${this.toString()})`;
	}

	/**
	 * Try and parse from a string, accepts:
	 * - 'true', 'false'
	 * - '1', '0' if settings.preventNumeric!==true
	 * - 'yes','no' if settings.allowYes===true
	 * - 'on','off' if settings.allowOn===true
	 *
	 * Surrounding whitespace will be removed.
	 * @returns Value or problem if parse was unsuccessful
	 */
	static parse(
		src: WindowStr,
		settings?: {
			/**Whether yes/no are accepted as true/false (respectively) */
			allowYes?: boolean;
			/**Whether on/off are accepted as true/false (respectively) */
			allowOn?: boolean;
			/**Don't accept '1'/'0' as true/false values */
			preventNumeric?: boolean;
		}
	): boolean | ParseProblem {
		const tVals = ['true'];
		const fVals = ['false'];
		if (!settings?.preventNumeric) {
			tVals.push('1');
			fVals.push('0');
		}
		if (settings?.allowYes) {
			tVals.push('yes');
			fVals.push('no');
		}
		if (settings?.allowOn) {
			tVals.push('on');
			fVals.push('off');
		}
		src.trimStart().trimEnd();
		const str = src.toString().toLowerCase();
		for (const t of tVals) {
			if (str === t) {
				src.shrink(t.length);
				return true;
			}
		}
		for (const f of fVals) {
			if (str === f) {
				src.shrink(f.length);
				return false;
			}
		}
		return new ParseProblem(
			'src',
			'expecting ' + tVals.join('/') + ' or ' + fVals.join('/'),
			str
		);
	}
}

export class BoolMut extends Bool {
	//#region Builds
	/** Build from a boolean or numeric value (where 0|NaN=false, and anything else=true) */
	static from(v: number | boolean) {
		return new BoolMut(Uint8Array.of(v ? 1 : 0), 0);
	}

	/**
	 * Mount an existing array, note this **shares** memory with the array,
	 * changing a value in `arr` will mutate this state.
	 *
	 * @param pos Position to link from
	 * @throws Error if `arr` isn't long enough
	 */
	static mount(arr: Uint8Array, pos = 0) {
		sLen('arr', arr)
			.atLeast(pos + 1)
			.throwNot();
		return new BoolMut(arr, pos);
	}

	/**
	 * Read next bit from stream and create a value from it
	 * @throws Error if there's not enough content
	 */
	static deserial(br: BitReader): BoolMut {
		return new BoolMut(Uint8Array.of(br.readNumberBE(1)), 0);
	}
	//#endregion

	set(v: boolean) {
		this._arr[this._pos] &= 0xfe;
		this._arr[this._pos] += +v;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `BoolMut(${this.toString()})`;
	}
}
