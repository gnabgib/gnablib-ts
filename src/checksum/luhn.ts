/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { utf8 } from '../codec/Utf8.js';
import { sNum } from '../safe/safe.js';

const ord_0 = 48; //char '0'

export function luhnStr(str: string): number {
	const bytes = utf8.toBytes(str);
	let ptr = bytes.length - 1;
	let sum = 0;
	let mul = 2;
	while (ptr >= 0) {
		let val = bytes[ptr--] - ord_0;
		sNum(`str-bytes[${ptr+1}]`,val).unsigned().atMost(9).throwNot();
		val *= mul;
		sum += ((val % 10) + val / 10) | 0;
		mul = 1 + (mul % 2);
	}
	return (10 - (sum % 10)) % 10;
}

export function luhnInt(int: number): number {
	let sum = 0;
	let mul = 2;
	while (int > 0) {
		let val = int % 10;
		int = (int - val) / 10;
		val *= mul;
		sum += ((val % 10) + val / 10) | 0;
		mul = 1 + (mul % 2);
	}
	sum = (10 - (sum % 10)) % 10;
	return sum;
}
