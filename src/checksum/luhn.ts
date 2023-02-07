import * as intExt from '../primitive/IntExt';
import * as utf8 from '../encoding/Utf8';
const ord_0 = 48; //char '0'

export function sumStr(str: string): number {
	const bytes = utf8.toBytes(str);
	let ptr = bytes.length - 1;
	let sum = 0;
	let mul = 2;
	while (ptr >= 0) {
		let val = bytes[ptr--] - ord_0;
		intExt.inRangeInclusive(val, 0, 10);
		val *= mul;
		sum += ((val % 10) + val / 10) | 0;
		mul = 1 + (mul % 2);
	}
	return (10 - (sum % 10)) % 10;
}

export function sumInt(int: number): number {
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
