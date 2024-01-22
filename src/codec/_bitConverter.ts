/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { Carrier } from '../primitive/BitExt.js';
import { ContentError } from '../primitive/error/ContentError.js';

export const bitConverter = {
	fromBytes: function (
		bytes: Uint8Array,
		bitCount: number,
		bitsToChar: (number: number) => string
	): string {
		/**
		 * Turns as many bits as possible into the encoded form
		 */
		function bitMonster() {
			while (carrier.canDequeue) {
				ret += bitsToChar(carrier.dequeue());
			}
		}

		let ret = '';
		const carrier = new Carrier(8, bitCount);
		for (const byte of bytes) {
			carrier.enqueue(byte);
			bitMonster();
		}
		bitMonster();
		if (!carrier.empty) {
			ret += bitsToChar(carrier.dequeue());
		}
		return ret;
	},

	toBytes: function (
		encoded: string,
		bitCount: number,
		isWhitespace: (char: string) => boolean,
		isPadding: (char: string) => boolean,
		charToBits: (char: string) => number,
		output: Uint8Array
	): number {
		let outputPtr = 0;

		const carrier = new Carrier(bitCount, 8);
		let pad = false;

		for (const char of encoded) {
			if (isWhitespace(char)) continue;
			const idx = charToBits(char);
			if (idx < 0) {
				if (isPadding(char)) {
					pad = true;
					continue;
				}
				throw new ContentError('unknown', 'Character', char);
			}
			if (pad)
				throw new ContentError('Found data after padding', 'Character', char);
			carrier.enqueue(idx);
			if (carrier.canDequeue) {
				output[outputPtr++] = carrier.dequeue();
			}
		}
		return outputPtr;
	},
};
