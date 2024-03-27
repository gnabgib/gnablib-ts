/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';

//https://en.wikipedia.org/wiki/Densely_packed_decimal

const last3bits = 7;
const bit2and3 = 6;

/** Binary coded decimal, can hold two base10 digits per byte (4bits per digit) */
export type bcd = number;

/**
 * Decode dense2 encoded data (7 bits, mask `0x7F`) into two decimal digits, returned
 * as a single byte, 7-4 MSD, 3-0 LSD (binary coded decimal)
 * @param value number [0 - 0x7F] (oversized will be ignored)
 * @returns Byte, upper 4 bits BCD MSD, lower 4 bits BCD LSD
 */
export function fromDense2(value: number): bcd {
	//We expand if b3=1
	const expand = (value >> 3) & 1;

	//d0 is large if expand and b2=1
	const largeD0 = (value >> 2) & expand;
	//d1 is large if expand and b1=0 and b2=1
	const largeD1 = expand - (expand & ((1 - (value >> 1)) * (value >> 2)));

	//d0 is composed of 3 bits (not large) or 1
	const maskD0 = (last3bits >> (largeD0 * 2)) << 4;
	//d1 is composed of 3 bits (not expand) or 1 (3 bits if not large, but the other bits are relocated)
	const maskD1 = last3bits >> (expand * 2);

	//d0 is composed of masked value OR implied 1 at b3 (if large)
	const d0 = (value & maskD0) | (largeD0 << 7);
	//d1 is composed of masked value OR (bits 6&7 if d0 is large, and this isn't) OR implied 1 at b3 (if large)
	const d1 =
		(value & maskD1) |
		(((value >> 4) & bit2and3) * (largeD0 & (1 - largeD1))) |
		(largeD1 << 3);

	//console.log('fd2',d0,d1,'e',expand,'l',largeD0,largeD1,'m',maskD0,maskD1);
	return d0 | d1;
}

/**
 * If you know `$d0`, `$d1` are ints `0-9` then you can use this, otherwise use {@link toDense2}
 * {@link toDense3} is recommended if you have >2 digits (better compression)
 *
 * @param d0 number 0-9
 * @param d1 number 0-9
 * @returns Packed form, 7 bits long (0x7F mask)
 */
export function toDense2Unsafe(d0: number, d1: number): number {
	//s s: abc0def [0-7][0-7]
	//s l: abc10xf [0-7][8-9]
	//l s: dec110f [8-9][0-7]
	//l l: xxc111f [8-9][8-9]

	//When large the first bit (0x8) is set true (8=1000, 9=1001) so we can use
	// bit shifting to detect largeness (instead of > >=). Handily we never actually
	// set this MSB, it's implied by flags
	const d0Large = (d0 >> 3) & 1;
	d0 &= 1 | (bit2and3 * (1 - d0Large));
	const ret = d0 << 4;

	const d1Large = (d1 >> 3) & 1;
	d1 &= 1 | (bit2and3 * (1 - d1Large));

	if (d0Large) {
		if (d1Large) {
			//xxc111f
			//d0, marker, d1
			return ret | 0xe | d1;
		} else {
			//dec110f
			//d1-23|d0|marker|d1-0
			return ((d1 & bit2and3) << 4) | ret | 0xc | (d1 & 1);
		}
	} else {
		if (d1Large) {
			//abc100f
			// d0,marker,d1
			return ret | 8 | d1;
		} else {
			//abc0def
			return ret | d1;
		}
	}
}

/**
 * Similar to {@link toDense3} (DPD) this encodes 2 base10 digits (00-99) into 7*base2 bits
 * 2^7=128, so we waste a bit, but still saves a bit over BCD (2*4=8 bits)
 *
 * This is not a standard (but can be useful over the wire if INTs are out).
 * {@link toDense3} is recommended (2*dense3 is better than 3*dense2 20b vs 21b)
 *
 * @param d0 number [0 - 9]
 * @param d1 number [0 - 9]
 * @throws EnforceTypeError Invalid int (d0,d1)
 * @throws OutOfRangeError Int isn't 0-9
 * @returns Packed form, 7 bits long (0x7F mask)
 */
export function toDense2(d0: number, d1: number): number {
	sNum('d0', d0).unsigned().atMost(9).throwNot();
	sNum('d1', d1).unsigned().atMost(9).throwNot();
	return toDense2Unsafe(d0, d1);
}

/**
 * Decode dense3 encoded data (10bits, mask 0x3FF) into three decimal digits
 *
 * You probably want {@link fromDense3}
 *
 * @param value number 0-0x3FF (oversized will be ignored)
 * @returns Binary coded decimal MSD:d0,d1,d2 (3 nibbles=12 bits long)
 */
export function fromDense3Unsafe(value: number): bcd {
	//We expand if b3=1
	const expand = (value >> 3) & 1;
	let ctrl = value & (bit2and3 * expand);
	//If ctrl=110 then pull down b6,b5 final=b2 b1 b6 b5
	ctrl = (((((ctrl >> 2) & (ctrl >> 1)) * 0x60) & value) >> 5) | (ctrl << 1);
	// ctrl=b2 b1 b6 b5
	// 0 0 0 0       l2
	// 0 1 0 0    l1
	// 1 0 0 0 l0
	// 1 1 0 0 l0 l1
	// 1 1 0 1 l0    l2
	// 1 1 1 0    l1 l2
	// 1 1 1 1 l0 l1 l2

	//l0=1000|1100|1101|1111 -> 1x00|11x1
	const largeD0 =
		expand &
		(((ctrl >> 3) & (1 - ((ctrl >> 1) | ctrl))) |
			((ctrl >> 3) & (ctrl >> 2) & ctrl));
	//l1=0100|1100|1110|1111 -> x100|111x
	const largeD1 =
		expand &
		(((ctrl >> 2) & (1 - ((ctrl >> 1) | ctrl))) |
			((ctrl >> 3) & (ctrl >> 2) & (ctrl >> 1)));
	//l2=0000|1101|1110|1111 -> 0000|11xx where xx!=00, x|x!=0
	const largeD2 =
		expand &
		((1 - ((ctrl >> 3) | (ctrl >> 2) | (ctrl >> 1) | ctrl)) |
			((ctrl >> 3) & (ctrl >> 2) & ((ctrl >> 1) | ctrl)));

	//D1 is shifted when !large, and ctrl starts with 11
	const shiftD1 = (1 - largeD1) & (ctrl >> 3) & (ctrl >> 2);
	//D2 is shifted most of the time when not large
	// by 7 (mod=1000,1100) or by 4 (mod=0100) or by 0 (!expand)
	//NOTE: No not-large check here because it's used during the shit (@see maskD2)
	const shiftD2by =
		expand * ((((ctrl >> 3) & 1) * 7) | (((ctrl >> 2) & 1) * 4));

	const maskD0 = (last3bits >> (largeD0 * 2)) << 7;
	//Mask 654 for non-shift,not-large, 4 for large or shift and 98 for shift
	const maskD1 =
		((last3bits >> ((largeD1 | shiftD1) * 2)) << 4) | (shiftD1 * 0x300);
	//Mask if !large, and shift by shiftD2By*2
	const maskD2 = 1 | ((1 - largeD2) * (bit2and3 << shiftD2by));

	//d0 is large if b2=1 & b6=1 & ~b5=1
	const d0 = ((value & maskD0) << 1) | (largeD0 << 11);
	let d1 = value & maskD1;
	//Shift to get the shifted mask values, and mask the result to ignore those in the wrong place
	d1 = (d1 | (d1 >> 3) | (largeD1 << 7)) & 0xf0;
	let d2 = value & maskD2;
	//Shift to get the shifted mask values, and mask the result to ignore those in the wrong place
	d2 = (d2 | (d2 >> 4) | (d2 >> 7) | (largeD2 << 3)) & 0xf;
	// console.log('fd3','0x'+value.toString(16),'d',d0>>8,d1>>4,d2,'e',expand,'mod',mod,
	//     'l',largeD0,largeD1,largeD2,
	//     'm','0x'+maskD0.toString(16),'0x'+maskD1.toString(16),'0x'+maskD2.toString(16),
	//     'sh',shiftD1,shiftD2by);
	return d0 | d1 | d2;
}

/**
 * Decode dense3 encoded data (10bits, mask 0x3FF) into three decimal digits
 *
 * @param value number 0-0x3FF
 * @throws EnforceTypeError Invalid int (value)
 * @throws OutOfRangeError Int isn't 0-0x3ff
 * @returns Binary coded decimal MSD:d0,d1,d2 (3 nibbles=12 bits long)
 */
export function fromDense3(value: number): bcd {
	sNum('value', value).unsigned().atMost(0x3ff).throwNot();
	return fromDense3Unsafe(value);
}

/**
 * Encode 3 base10 digits as DPD3 (10bits 0x3FF mask), if you cannot be sure
 * d0-d2 are in range 0-9 you probably want to use {@link toDense3}
 *
 * @param d0 integer [0 - 9] (>9 truncated (only last bit used))
 * @param d1 integer [0 - 9] (>9 truncated (only last bit used))
 * @param d2 integer [0 - 9] (>9 truncated (only last bit used))
 * @returns Packed form, 10 bits long (0x3FF mask)
 */
export function toDense3Unsafe(d0: number, d1: number, d2: number): number {
	let ret = 0;

	//When large the first bit (0x8) is set true (8=1000, 9=1001) so we can use
	// bit shifting to detect largeness (instead of > >=). Handily we never actually
	// set this MSB, it's implied by flags
	const d0Large = (d0 >> 3) & 1;
	d0 &= 1 | (bit2and3 * (1 - d0Large));
	ret |= d0 << 7;

	const d1Large = (d1 >> 3) & 1;
	d1 &= 1 | (bit2and3 * (1 - d1Large));
	ret |= d1 << 4;

	const d2Large = (d2 >> 3) & 1;
	d2 &= 1 | (bit2and3 * (1 - d2Large));
	ret |= d2;

	/**
	 * Performance: (1Billion conversions)
	 * - Nested if statement (ugly): ~350ms (CLEAR WINNER)
	 * - Combine aLarge, bLarge, cLarge and switch (0-8): ~1s (3x)
	 * - Jump functions: ~36s (100x)
	 *
	 * So we stick with the nested if (despite switch looking nicer)
	 */
	if (d0Large) {
		if (d1Large) {
			if (d2Large) {
				//8th row | x 	x 	c 	1 	1 	f 	1 	1 	1 	i
				return ret | 0x6e;
			} else {
				//5th row | g 	h 	c 	0 	0 	f 	1 	1 	1 	i
				//GH move doesn't matter (set to 1)
				return ret | ((d2 & bit2and3) << 7) | 0xe;
			}
		} else {
			if (d2Large) {
				// 6th row | d 	e 	c 	0 	1 	f 	1 	1 	1 	i
				//DE move we have to mask b6 (to get to zero)
				return (ret & ~0x40) | ((d1 & bit2and3) << 7) | 0x2e;
			} else {
				//4th row |  g 	h 	c 	d 	e 	f 	1 	1 	0 	i
				//GH move, we have to mask b1 to zero (it might not be from d2)
				return (ret & ~2) | ((d2 & bit2and3) << 7) | 0xc;
			}
		}
	} else {
		if (d1Large) {
			if (d2Large) {
				//7th row | a 	b 	c 	1 	0 	f 	1 	1 	1 	i
				return ret | 0x4e;
			} else {
				//3rd row | a 	b 	c 	g 	h 	f 	1 	0 	1 	i
				//Because of the GH move we have to mask b2 (to get to 0)
				return (ret & ~4) | ((d2 & bit2and3) << 4) | 0xa;
			}
		} else {
			if (d2Large) {
				//2nd row | a 	b 	c 	d 	e 	f 	1 	0 	0 	i
				return ret | 0x8;
			} else {
				//1st row | a 	b 	c 	d 	e 	f 	0 	g 	h 	i
				return ret;
			}
		}
	}

	// //The if performance is about 3x
	// //(presumably 3 branch vs 8? no jump table optimization for switch in js)
	// const combo = (aLarge << 2) | (bLarge << 1) | cLarge; //Now a number 0-7
	// switch (combo) {
	// 	//Sorted by table-order (not combo order) since most likely are higher
	// 	case 0:
	// 		//1st row | a 	b 	c 	d 	e 	f 	0 	g 	h 	i
	// 		return ret;
	// 	case 1:
	// 		//2nd row | a 	b 	c 	d 	e 	f 	1 	0 	0 	i
	// 		return ret | 0x8;
	// 	case 2:
	// 		//3rd row | a 	b 	c 	g 	h 	f 	1 	0 	1 	i
	// 		//Because of the GH move we have to mask b2 (to get to 0)
	// 		return (ret & ~4) | ((c & 6) << 4) | 0xa;
	// 	case 4:
	// 		//4th row |  g 	h 	c 	d 	e 	f 	1 	1 	0 	i
	// 		return ret | ((c & 6) << 7) | 0xc;
	// 	case 6:
	// 		//5th row | g 	h 	c 	0 	0 	f 	1 	1 	1 	i
	// 		//GH move doesn't matter (set to 1)
	// 		return ret | ((c & 6) << 7) | 0xe;
	// 	case 5:
	// 		// 6th row | d 	e 	c 	0 	1 	f 	1 	1 	1 	i
	// 		//DE move we have to mask b6 (to get to zero)
	// 		return (ret & ~0x40) | ((b & 6) << 7) | 0x2e;
	// 	case 3:
	// 		//7th row | a 	b 	c 	1 	0 	f 	1 	1 	1 	i
	// 		return ret | 0x4e;
	// 	default:
	// 		//case 7:
	// 		//8th row | x 	x 	c 	1 	1 	f 	1 	1 	1 	i
	// 		return ret | 0x6e;
	// }

	// //Turns out the switch version is about 30x faster
	// const funcs=[
	//     //1st row | a 	b 	c 	d 	e 	f 	0 	g 	h 	i
	//     ()=>ret,
	//     //2nd row | a 	b 	c 	d 	e 	f 	1 	0 	0 	i
	//     ()=>ret|0x8,
	//     //3rd row | a 	b 	c 	g 	h 	f 	1 	0 	1 	i
	//     //Because of the GH move we have to mask b2 (to get to 0)
	//     ()=>(ret&~4)|((c&6)<<4)|0xA,
	//     //7th row | a 	b 	c 	1 	0 	f 	1 	1 	1 	i
	//     ()=>ret|0x4e,
	//     //4th row |  g 	h 	c 	d 	e 	f 	1 	1 	0 	i
	//     ()=>ret|((c&6)<<7)|0xc,
	//     // 6th row | d 	e 	c 	0 	1 	f 	1 	1 	1 	i
	//     //DE move we have to mask b6 (to get to zero)
	//     ()=>(ret&~0x40)|((b&6)<<7)|0x2e,
	//     //5th row | g 	h 	c 	0 	0 	f 	1 	1 	1 	i
	//     //GH move doesn't matter (set to 1)
	//     ()=>ret|((c&6)<<7)|0xE,
	//     //8th row | x 	x 	c 	1 	1 	f 	1 	1 	1 	i
	//     ()=>ret|0x6E
	// ];
	// return funcs[combo]();
}

/**
 * The core of Densely packed decimal - fit 3 base10 digits (000-999) into 10*base2 bits
 * 2^10=1024, so we waste a small amount of space,but it's better than BCD (4bits/base10 digit)
 *
 * If you know `$d0`, `$d1`, `$d2` are in range, {@link toDense3Unsafe} is faster
 * @param d0 integer [0 - 9]
 * @param d1 integer [0 - 9]
 * @param d2 integer [0 - 9]
 * @throws EnforceTypeError Invalid int (d0/d1/d2)
 * @throws OutOfRangeError Int isn't 0-9
 * @returns Packed form, 10 bits long (0x3FF mask)
 */
export function toDense3(d0: number, d1: number, d2: number): number {
	sNum('d0', d0).unsigned().atMost(9).throwNot();
	sNum('d1', d1).unsigned().atMost(9).throwNot();
	sNum('d2', d2).unsigned().atMost(9).throwNot();
	return toDense3Unsafe(d0, d1, d2);
}

/**
 * Uses 7 bits
 * @param value
 * @param bytes
 * @param bitPos
 */
export function push2DigitsToBytes(
	value: number,
	bytes: Uint8Array,
	bitPos: number
): number {
	sNum('value', value).unsigned().lt(100).throwNot();
	const packBits = 7;
	const startBitPos = bitPos & 0x7;
	const bytePos = bitPos >> 3;

	//0 [________][________] s<<1      [sssssss_][________]
	//1 [x_______][________] s<<0      [xsssssss][________]
	//2 [xx______][________] s>>1      [xxssssss][s_______]
	//3 [xxx_____][________] s>>2,s<<6 [xxxsssss][ss______]
	//4 [xxxx____][________] s>>3,s<<5 [xxxxssss][sss_____]
	//5 [xxxxx___][________] s>>4,s<<4 [xxxxxsss][ssss____]
	//6 [xxxxxx__][________] s>>5,s<<3 [xxxxxxss][sssss___]
	//7 [xxxxxxx_][________] s>>6,s<<2 [xxxxxxxs][ssssss__]

	//When <0 Either shift doens't happen.. so we can OR two directions.. for speed
	bytes[bytePos] |= (value << (1 - startBitPos)) | (value >> (startBitPos - 1));
	bytes[bytePos + 1] = value << (9 - startBitPos);
	return bitPos + packBits;
}
// export function push2DigitsToBytesN(
// 	d0: number,
// 	d1: number,
// 	bytes: Uint8Array,
// 	bitPos: number
// ): number {
// 	//TODO
// 	return 0;
// }

export function push3DigitsToBytes(
	value: number,
	bytes: Uint8Array,
	bitPos: number
): number {
	sNum('value', value).unsigned().lt(1000).throwNot();
	const packBits = 10;
	const startBitPos = bitPos & 0x7;
	const bytePos = bitPos >> 3;
	const d2 = value % 10;
	value = (value / 10) | 0;
	const d1 = value % 10;
	const d0 = (value / 10) | 0;

	const composed = toDense3(d0, d1, d2);

	//0 [________][________] s>>2,s<<8 [ssssssss][ss______]
	//1 [x_______][________] s>>3,s<<7 [xsssssss][sss_____]
	//2 [xx______][________] s>>4,s<<6 [xxssssss][ssss____]
	//3 [xxx_____][________] s>>5,s<<5 [xxxsssss][sssss___]
	//4 [xxxx____][________] s>>6,s<<4 [xxxxssss][ssssss__]
	//5 [xxxxx___][________] s>>7,s<<3 [xxxxxsss][sssssss_]
	//6 [xxxxxx__][________] s>>8,s<<2,s<<a [xxxxxxss][ssssssss]
	//7 [xxxxxxx_][________] s>>9,s<<1,s<<9 [xxxxxxxs][ssssssss][s_______]

	//When <0 Either shift doesn't happen.. so we can OR two directions.. for speed
	bytes[bytePos] |= composed >> (startBitPos + 2);
	bytes[bytePos + 1] = composed << (8 - startBitPos);
	bytes[bytePos + 2] = composed << (16 - startBitPos);
	return bitPos + packBits;
}
