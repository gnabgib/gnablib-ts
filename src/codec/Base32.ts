/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/error/ContentError.js';
import { IBase32 } from './interfaces/IBase32.js';
/**
 * Support: (Uint8Array)
 * Chrome, Android webview, ChromeM >=38
 * Edge >=12
 * Firefox, FirefoxM >=4
 * IE: 10
 * Opera: 11.6
 * OperaM: 12
 * Safari: >=5.1
 * SafariM: 4.2
 * Samsung: >=1.0
 * Node: >=1.0
 * Deno: >=0.10
 */

// [Wiki: Base32](https://en.wikipedia.org/wiki/Base32)
// [RFC-4648: The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)

const pad = '=';
const msk = 0x1f; //00011111
const byteEat = 5;

interface options {
	/**
	 * Whether padding is required on encode/decode if not directly specified (second optional arg of each method)
	 */
	requirePad: boolean;
	/**
	 * The table for zbase32 is lower case, but we expect upper case input (for case-folding) so
	 * we'll correct it after build
	 */
	makeTblLower?: boolean;
	/**
	 * Additional decodes beyond case-insensitive(tbl), record set of character:int value pairs
	 * NOTE case folding is not automatically done (provide decodes for both character-cases if required)
	 * Example: extraDecodes:{'o':0,'O':0}
	 */
	extraDecodes?: Record<string, number>;
}

class Base32 implements IBase32 {
	readonly #decode: Uint8Array;
	/**
	 * Whether padding is required (when not specified on @see fromBytes @see toBytes)
	 */
	readonly reqPad: boolean;

	constructor(
		/**
		 * Encoding table
		 */
		readonly tbl: string,
		/**
		 * Configuration options
		 */
		options: options
	) {
		this.#decode = this.buildDecode(options);
		this.reqPad = options.requirePad;
		if (options.makeTblLower) this.tbl = tbl.toLowerCase();
	}

	private buildDecode(options: options): Uint8Array {
		//We only need to set the first 127 places, since they're ASCII
		// The first 32 aren't printable, but we'd have to branch to compensate, so let's waste a little memory
		// to avoid
		const code = new Uint8Array(127);
		//Set equals sign pos to 33 (padding indicator)
		code[pad.charCodeAt(0)] = 33;
		for (let i = 0; i < 32; ) {
			//Generally codePointAt is better, but we know this ASCII (no UTF16 vs UTF32 troubles)
			// and charCodeAt will always return a number, while codePointAt may return undefined (if you're mid-rune)
			//OFFSET by 1 (since 0 is used as bad indicator)
			const idx = i++;
			code[this.tbl.charCodeAt(idx)] = i;
			//To lower case = char|space (where space=0x20)
			//NOTE, this ill corrupt chars < 0x20 but they're non-printable (so out of scope)
			code[this.tbl.charCodeAt(idx) | 0x20] = i;
		}
		if (options.extraDecodes) {
			for (const d in options.extraDecodes) {
				//Note the decode value is +1 (because 0=undefined)
				code[d.charCodeAt(0)] = options.extraDecodes[d] + 1;
			}
		}

		//For every byte value, the return is either 1-32 (valid char), 33 (padding), or 0 (invalid)
		// note this also exploits the rule that out of range access will also return 0 (eg code[4000]==0)
		return code;
	}

	fromBytes(b: Uint8Array, addPad?: boolean): string {
		if (addPad === undefined) addPad = this.reqPad;
		let ret = '';
		let pos = byteEat - 1;

		//We can eat 5 bytes at a time (=8 base32 chars) = 40bits
		//We'll have to to as two bit shifts because JS/32bit only
		for (; pos < b.length; pos += byteEat) {
			// [aaaaabbb][bbcccccd][ddddeeee][efffffgg][ggghhhhh]
			ret +=
				this.tbl.charAt(b[pos - 4] >>> 3) + //a
				this.tbl.charAt(((b[pos - 4] << 2) | (b[pos - 3] >>> 6)) & msk) + //b
				this.tbl.charAt((b[pos - 3] >>> 1) & msk) + //c
				this.tbl.charAt(((b[pos - 3] << 4) | (b[pos - 2] >>> 4)) & msk) + //d
				this.tbl.charAt(((b[pos - 2] << 1) | (b[pos - 1] >>> 7)) & msk) + //e
				this.tbl.charAt((b[pos - 1] >>> 2) & msk) + //f
				this.tbl.charAt(((b[pos - 1] << 3) | (b[pos] >>> 5)) & msk) + //g
				this.tbl.charAt(b[pos] & msk); //h
		}
		//We have 1,2,3,4 bytes not encoded at this point
		switch (b.length - pos + byteEat - 1) {
			case 1:
				//[aaaaabbb]
				ret +=
					this.tbl.charAt(b[pos - 4] >>> 3) +
					this.tbl.charAt((b[pos - 4] << 2) & msk);
				if (addPad) ret += pad + pad + pad + pad + pad + pad;
				break;
			case 2:
				// [aaaaabbb][bbcccccd]
				ret +=
					this.tbl.charAt(b[pos - 4] >>> 3) + //a
					this.tbl.charAt(((b[pos - 4] << 2) | (b[pos - 3] >>> 6)) & msk) + //b
					this.tbl.charAt((b[pos - 3] >>> 1) & msk) + //c
					this.tbl.charAt((b[pos - 3] << 4) & msk); //d
				if (addPad) ret += pad + pad + pad + pad;
				break;
			case 3:
				// [aaaaabbb][bbcccccd][ddddeeee]
				ret +=
					this.tbl.charAt(b[pos - 4] >>> 3) + //a
					this.tbl.charAt(((b[pos - 4] << 2) | (b[pos - 3] >>> 6)) & msk) + //b
					this.tbl.charAt((b[pos - 3] >>> 1) & msk) + //c
					this.tbl.charAt(((b[pos - 3] << 4) | (b[pos - 2] >>> 4)) & msk) + //d
					this.tbl.charAt((b[pos - 2] << 1) & msk); //e
				if (addPad) ret += pad + pad + pad;
				break;
			case 4:
				// [aaaaabbb][bbcccccd][ddddeeee][efffffgg]
				ret +=
					this.tbl.charAt(b[pos - 4] >>> 3) + //a
					this.tbl.charAt(((b[pos - 4] << 2) | (b[pos - 3] >>> 6)) & msk) + //b
					this.tbl.charAt((b[pos - 3] >>> 1) & msk) + //c
					this.tbl.charAt(((b[pos - 3] << 4) | (b[pos - 2] >>> 4)) & msk) + //d
					this.tbl.charAt(((b[pos - 2] << 1) | (b[pos - 1] >>> 7)) & msk) + //e
					this.tbl.charAt((b[pos - 1] >>> 2) & msk) + //f
					this.tbl.charAt((b[pos - 1] << 3) & msk); //g
				if (addPad) ret += pad;
				break;
		}
		return ret;
	}

	toBytes(base32: string, requirePad?: boolean): Uint8Array {
		const name = 'toBytes';
		const ret = new Uint8Array(Math.ceil((base32.length * 5) / 8)); //Note it may be shorter if no pad, or ignored chars

		let padCount = 0;
		let retPtr = 0;
		let carry = 0;
		let carrySize = 0;
		let ptr = 0;
		for (; ptr < base32.length; ptr++) {
			const dec = this.#decode[base32.charCodeAt(ptr)];
			//If 0, invalid
			if (dec === 0)
				throw new ContentError('Unknown char', name, base32.charAt(ptr));
			if (dec === 33) {
				padCount++;
				continue;
			}
			if (padCount > 0)
				throw new ContentError('Found after padding', name, base32.charAt(ptr));
			//Otherwise decoded char is off by 1
			carry = (carry << 5) | (dec - 1);
			carrySize += 5;
			if (carrySize >= 8) {
				carrySize -= 8;
				ret[retPtr++] = carry >> carrySize;
			}
		}

		switch (carrySize) {
			// [aaaaabbb][bbcccccd][ddddeeee][efffffgg][ggghhhhh]
			//Can be any number 0-7 (because +5 -8): 0,1,2,3,4,5,6,7 (8 is consumed)
			case 4: //+4 char -2 byte
				if (padCount === 0 && !requirePad) break;
				if (padCount != 4)
					throw new ContentError(
						'Bad padding, expecting 4 got',
						name,
						padCount
					);
				break;
			case 3: //+7 char -4 byte
				if (padCount === 0 && !requirePad) break;
				if (padCount != 1)
					throw new ContentError(
						'Bad padding, expecting 1 got',
						name,
						padCount
					);
				break;
			case 2: //+2 char -1 byte
				if (padCount === 0 && !requirePad) break;
				if (padCount != 6)
					throw new ContentError(
						'Bad padding, expecting 6 got',
						name,
						padCount
					);
				break;
			case 1: //+5 char -3 byte
				if (padCount === 0 && !requirePad) break;
				if (padCount != 3)
					throw new ContentError(
						'Bad padding, expecting 3 got',
						name,
						padCount
					);
				break;

			case 0:
				//Don't allow spurious padding
				if (padCount > 0)
					throw new ContentError(
						'Bad padding, expecting 0 got',
						name,
						padCount
					);
				break;

			//case 7: //+3 char -1 byte, but this is invalid (should only be +2 char)
			//case 6: //+6 char -3 byte, but this is invalid (should only be +5)
			//case 5: //+1 char -0, but this is invalid (should be +2 -1)
			default:
				throw new ContentError('Incorrect character count', name, ptr);
		}

		return ret.subarray(0, retPtr);
	}
}

/**
 * RFC 4648 base 32 (padding default on)
 */
export const base32: IBase32 = new Base32('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', {
	requirePad: true,
});

/**
 * z-base-32 (padding default off)
 */
export const zbase32: IBase32 = new Base32('YBNDRFG8EJKMCPQXOT1UWISZA345H769', {
	requirePad: false,
	makeTblLower: true,
});

/**
 * RFC 4648 base 32 hex, sortable, (padding default on)
 */
export const base32hex: IBase32 = new Base32(
	'0123456789ABCDEFGHIJKLMNOPQRSTUV',
	{
		requirePad: true,
	}
);

/**
 * Crockford's Base32
 */
export const crockford32: IBase32 = new Base32(
	'0123456789ABCDEFGHJKMNPQRSTVWXYZ',
	{
		requirePad: false,
		extraDecodes: { o: 0, O: 0, i: 1, I: 1, l: 1, L: 1 },
	}
);
