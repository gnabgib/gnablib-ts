/*! Copyright 2023 the gnablib contributors MPL-1.1 */

//[Block check character](https://en.wikipedia.org/wiki/Block_check_character)

export function bcc(bytes: Uint8Array): number {
	let sum = 0;
	for (const byte of bytes) {
		sum ^= byte;
	}
	return sum;
}
