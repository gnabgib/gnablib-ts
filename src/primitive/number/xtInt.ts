/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

/**
 * Parse string content as a base10 form of an integer.  Much stricter than
 * [Number.parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt),
 * this *only* allows:
 * - Leading whitespace
 * - An optional sign
 * - One or more digits
 * - Trailing whitespace
 *
 * Floating point numbers that have only zeros after the decimal won't parse.
 * Scientific notation won't parse.
 *
 * @param input A string integer, leading/trailing whitespace is ignored
 * @returns Integer or NaN
 */
export function parseDec(input: string): number {
	if (/^\s*[-+]?\d+\s*$/.test(input)) {
		return Number.parseInt(input, 10);
	}
	return Number.NaN;
}

/**
 * Parse string content as a base16 form of an integer.  Much stricter than
 * [Number.parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt),
 * this *only* allows:
 * - Leading whitespace
 * - An optional sign
 * - An optional 0x marker
 * - One or more digits
 * - Trailing whitespace
 *
 * Floating point numbers won't parse.
 * Scientific notation won't parse (but can look like hex)
 * @param input A string hexadecimal integer, leading/trailing whitespace is ignored
 * @returns Integer or NaN
 */
export function parseHex(input: string): number {
	if (/^\s*[-+]?(?:0x)?([a-fA-F0-9]+)\s*$/.test(input)) {
		return parseInt(input, 16);
	}
	return Number.NaN;
}

/**
 * Parse a list of numbers with comma separation, that is only composed of 
 * a sign indicator, digits, commas and whitespace
 * @param numCsv 
 */
export function parseCsv(numCsv:string):number[] {
	const nums=numCsv.split(',');
	const ret:number[]=[];
	for(const num of nums) {
		ret.push(Number.parseInt(num,10));
		//todo: Not sure the following alt is needed
		//ret.push(parseDec(num));
	}
	return ret;
}