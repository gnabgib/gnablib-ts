/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';
const last2Bits = 0x3;
const last4Bits = 0xf;
const last5Bits = 0x1f;
const last7Bits = 0x7f;

//Big endian
//[S][E][E][E][E][E][M][M] [M][M][M][M][M][M][M][M]
const fp16ManSize = 10;
//const fp16ExpSize = 5;
const fp16MaxMan = 0x7ff;
const fp16MaxExp = 0x1f;
const fp16Bias = 15; //fp16MaxExp>>1
const fp16round64Correction = Math.pow(2, -1 - fp16ManSize) - Math.pow(2, -77);
//Big endian
//[S][E][E][E][E][E][E][E] [E][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//https://en.wikipedia.org/wiki/IEEE_754
const fp32ManSize = 23;
//const fp32ExpSize = 8;
const fp32MaxMan = 0x7fffff;
const fp32MaxExp = 0xff;
const fp32Bias = 127; //fp32MaxExp>>1
const fp32round64Correction = Math.pow(2, -1 - fp32ManSize) - Math.pow(2, -77);
//Big endian
//[S][E][E][E][E][E][E][E] [E][E][E][E][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//[M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//https://en.wikipedia.org/wiki/IEEE_754
const fp64ManSize = 52;
//const fp64ExpSize = 11;
const fp64MaxMan = 0xfffffffffffff;
const fp64MaxExp = 0x7ff;
const fp64Bias = 1023; //fp64MaxExp>>1

function signMul(firstByte: number): number {
	//In big-endian, the first byte has the sign bit in the MSB position
	//It's 1 for negative, and 0 for positive.. but let's use math instead of branching
	// lookup: 1-> -1 0-> 1
	//Possible with: 1-bit*2
	//      0: 1-0*2 = 1
	//      1: 1-1*2 = -1
	return 1 - ((firstByte >> 6) & 2);
}

export const fpb16 = {
	/**
	 * 2^-10 ~-=E-3 = 9.765625e-4
	 */
	EPSILON: 9.765625e-4,

	/**
	 * 2^11 = 2048
	 */
	MAX_INT: 2048,

	/**
	 * Encode a binary floating point number to 16 bit precision IEEE754 (big endian) bytes
	 * @param float16
	 * @returns
	 */
	toBytes: function (float16: number): Uint8Array {
		const ret = new Uint8Array(2);
		const sign = float16 < 0 || (float16 === 0 && 1 / float16 < 0) ? 1 : 0;
		let mantissa = 0;
		let exponent = 0;
		//Make the value positive now
		float16 *= 1 - sign * 2;
		if (Number.isNaN(float16)) {
			//NaN cases
			//There are actually many NaN, the mantissa MSB indicates "quietness" the rest may
			// share clues, which are OOS here
			mantissa = fp16MaxMan;
			exponent = fp16MaxExp; //eMax=255
		} else if (float16 === Infinity) {
			//Infinities (and beyond)
			//mantissa=0;
			exponent = fp16MaxExp;
		} else {
			//Valid numbers
			//Log2 of the value:
			exponent = Math.floor(Math.log2(float16));
			let c: number;
			// Math.log can be subject to floating point error
			if (float16 * (c = Math.pow(2, -exponent)) < 1) {
				exponent--;
				c *= 2;
			}
			if (exponent + fp16Bias > 0) {
				float16 += fp16round64Correction / c;
			} else {
				float16 += fp16round64Correction * Math.pow(2, 1 - fp16Bias);
			}
			if (float16 * c >= 2) {
				exponent++;
				c /= 2;
			}
			const unbiasExp = exponent + fp16Bias;
			if (unbiasExp >= fp16MaxExp) {
				mantissa = 0;
				exponent = fp16MaxExp;
			} else if (unbiasExp > 0) {
				mantissa = (float16 * c - 1) * Math.pow(2, fp16ManSize);
				exponent = unbiasExp;
			} else {
				mantissa =
					float16 * Math.pow(2, fp16Bias - 1) * Math.pow(2, fp16ManSize);
				exponent = 0;
			}
		}
		ret[0] = (sign << 7) | (exponent << 2) | (mantissa >> 8);
		ret[1] = mantissa;

		return ret;
	},

	/**
	 * Decode 16 bit IEEE754 (big endian) data into a floating point binary number
	 * DOESN'T confirm there's enough space in `bytes`
	 * @param bytes
	 * @param pos
	 * @returns
	 */
	fromBytesUnsafe: function (bytes: Uint8Array, pos: number): number {
		const sign = signMul(bytes[pos]);
		let exponent = (bytes[pos] >> 2) & last5Bits;
		let mantissa = ((bytes[pos] & last2Bits) << 8) | bytes[pos + 1];

		switch (exponent) {
			case fp16MaxExp:
				//Catch infinities and NaN
				return mantissa ? NaN : sign * Infinity;
			case 0:
				//Subnormal numbers (no implicit leading 1)
				exponent += 1;
				break;
			default:
				//Implicit leading 1
				mantissa |= 0x400;
		}
		return sign * mantissa * Math.pow(2, exponent - fp16Bias - fp16ManSize);
	},

	/**
	 * Decode 16 bit IEEE754 (big endian) data into a floating point binary number
	 * @param bytes
	 * @param pos
	 * @throws {SizeError} If there aren't enough bytes defined
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array, pos = 0): number {
		sNum('pos', pos)
			.unsigned()
			.atMost(bytes.length - 2)
			.throwNot();
		return fpb16.fromBytesUnsafe(bytes, pos);
	},
};

export const fpb32 = {
	/**
	 * 2^-23 ~=E-7 = 1.1920928955078125e-7
	 */
	EPSILON: 1.1920928955078125e-7,

	/**
	 * 2^24 = 16777216
	 */
	MAX_INT: 16777216,

	/**
	 * Encode a binary floating point number to 32 bit precision IEEE754 (big endian) bytes
	 * @param float32
	 * @returns
	 */
	toBytes: function (float32: number): Uint8Array {
		//[1][8][23]
		const ret = new Uint8Array(4);
		//Catch -0 with the second part (1/-0 = -inf)
		const sign = float32 < 0 || (float32 === 0 && 1 / float32 < 0) ? 1 : 0;
		let mantissa = 0;
		let exponent = 0;
		//Make the value positive now
		float32 *= 1 - sign * 2;
		if (Number.isNaN(float32)) {
			//NaN cases
			//There are actually many NaN, the mantissa MSB indicates "quietness" the rest may
			// share clues, which are OOS here
			mantissa = fp32MaxMan;
			exponent = fp32MaxExp;
		} else if (float32 === Infinity) {
			//Infinities (and beyond)
			//mantissa=0;
			exponent = fp32MaxExp;
		} else {
			//Valid numbers
			exponent = Math.floor(Math.log2(float32));
			let c: number;
			// Math.log can be subject to floating point error
			if (float32 * (c = Math.pow(2, -exponent)) < 1) {
				exponent--;
				c *= 2;
			}
			if (exponent + fp32Bias > 0) {
				float32 += fp32round64Correction / c;
			} else {
				float32 += fp32round64Correction * Math.pow(2, 1 - fp32Bias);
			}
			if (float32 * c >= 2) {
				exponent++;
				c /= 2;
			}
			const unbiasExp = exponent + fp32Bias;
			if (unbiasExp >= fp32MaxExp) {
				mantissa = 0;
				exponent = fp32MaxExp;
			} else if (unbiasExp > 0) {
				mantissa = (float32 * c - 1) * Math.pow(2, fp32ManSize);
				exponent = unbiasExp;
			} else {
				mantissa =
					float32 * Math.pow(2, fp32Bias - 1) * Math.pow(2, fp32ManSize);
				exponent = 0;
			}
		}
		ret[0] = (sign << 7) | (exponent >> 1);
		ret[1] = (exponent << 7) | (mantissa >> 16);
		ret[2] = mantissa >> 8;
		ret[3] = mantissa;
		return ret;
	},

	/**
	 * Decode 32 bit IEEE754 (big endian) data into a floating point binary number
	 * DOESN'T confirm there's enough space in `bytes`
	 * @param bytes
	 * @param pos
	 * @returns
	 */
	fromBytesUnsafe: function (bytes: Uint8Array, pos: number): number {
		const sign = signMul(bytes[pos]);
		let exponent = ((bytes[pos] & last7Bits) << 1) | (bytes[pos + 1] >> 7);
		let mantissa =
			((bytes[pos + 1] & last7Bits) << 16) |
			(bytes[pos + 2] << 8) |
			bytes[pos + 3];

		switch (exponent) {
			case fp32MaxExp:
				//Catch infinities and NaN
				return mantissa ? NaN : sign * Infinity;
			case 0:
				//Subnormal numbers (no implicit leading 1)
				exponent += 1;
				break;
			default:
				//Implicit leading 1
				mantissa |= 0x800000;
		}
		return sign * mantissa * Math.pow(2, exponent - fp32Bias - fp32ManSize);
	},

	/**
	 * Decode 32 bit IEEE754 (big endian) data into a floating point binary number
	 * @param bytes
	 * @param pos
	 * @throws {SizeError} If there aren't enough bytes defined
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array, pos = 0): number {
		sNum('pos', pos)
			.unsigned()
			.atMost(bytes.length - 4)
			.throwNot();
		return fpb32.fromBytesUnsafe(bytes, pos);
	},
};

export const fpb64 = {
	/**
	 * 2^-52 ~=2E-16 = 2.2204460492503130808472633361816 x 10‍−‍16
	 */
	EPSILON: Number.EPSILON,

	/**
	 * 2^53 = 9007199254740992
	 * **Note** this isn't the same as JS "MAX_SAFE_INTEGER" (it's 1 more)
	 */
	MAX_INT: 9007199254740992,

	/**
	 * Encode a binary floating point number to 64 bit precision IEEE754 (big endian) bytes
	 * @param float64
	 * @returns
	 */
	toBytes: function (float64: number): Uint8Array {
		const ret = new Uint8Array(8);
		//Catch -0 with the second part (1/-0 = -inf)
		const sign = float64 < 0 || (float64 === 0 && 1 / float64 < 0) ? 1 : 0;
		let mantissa = 0;
		let exponent = 0;
		//Make the value positive now
		float64 *= 1 - sign * 2;
		if (Number.isNaN(float64)) {
			//NaN cases
			//There are actually many NaN, the mantissa MSB indicates "quietness" the rest may
			// share clues, which are OOS here
			mantissa = fp64MaxMan;
			exponent = fp64MaxExp;
		} else if (float64 === Infinity) {
			//Infinities (and beyond)
			//mantissa=0;
			exponent = fp64MaxExp;
		} else {
			//Valid numbers
			exponent = Math.floor(Math.log2(float64));
			//If log2 isn't available:
			//exponent = Math.floor(Math.log(float64) / Math.LN2);
			let c: number;
			// Math.log can be subject to floating point error
			if (float64 * (c = Math.pow(2, -exponent)) < 1) {
				exponent--;
				c *= 2;
			}
			if (float64 * c >= 2) {
				exponent++;
				c /= 2;
			}
			const unbiasExp = exponent + fp64Bias;
			if (unbiasExp >= fp64MaxExp) {
				mantissa = 0;
				exponent = fp64MaxExp;
			} else if (unbiasExp > 0) {
				mantissa = (float64 * c - 1) * Math.pow(2, fp64ManSize);
				exponent = unbiasExp;
			} else {
				mantissa =
					float64 * Math.pow(2, fp64Bias - 1) * Math.pow(2, fp64ManSize);
				exponent = 0;
			}
		}
		const mantissaHigh = (mantissa / 16777216) | 0;
		ret[0] = (sign << 7) | (exponent >> 4);
		ret[1] = (exponent << 4) | (mantissaHigh >> 24);
		ret[2] = mantissaHigh >> 16;
		ret[3] = mantissaHigh >> 8;
		ret[4] = mantissaHigh;
		ret[5] = mantissa >> 16;
		ret[6] = mantissa >> 8;
		ret[7] = mantissa;
		return ret;
	},

	/**
	 * Decode 64 bit IEEE754 (big endian) data into a floating point binary number
	 * @param bytes
	 * @param pos
	 * @returns
	 */
	fromBytesUnsafe: function (bytes: Uint8Array, pos: number): number {
		const sign = signMul(bytes[pos]);
		let exponent = ((bytes[pos] & last7Bits) << 4) | (bytes[pos + 1] >> 4);
		//Let's split mantissa into  4*8bit + 3*8bit parts.. the first only uses 29 bits (no sign issues)
		let mantissaHigh =
			((bytes[pos + 1] & last4Bits) << 24) |
			(bytes[pos + 2] << 16) |
			(bytes[pos + 3] << 8) |
			bytes[pos + 4];
		const mantissaLow =
			(bytes[pos + 5] << 16) | (bytes[pos + 6] << 8) | bytes[pos + 7];

		switch (exponent) {
			case fp64MaxExp:
				//Catch infinities and NaN
				return mantissaHigh || mantissaLow ? NaN : sign * Infinity;
			case 0:
				//Subnormal numbers (no implicit leading 1)
				exponent += 1;
				break;
			default:
				//Implicit leading 1
				mantissaHigh |= 0x10000000;
		}
		const eHigh = Math.pow(2, exponent - fp64Bias - fp64ManSize + 24);
		return (
			sign * (mantissaHigh * eHigh + mantissaLow * eHigh * Math.pow(2, -24))
		);
	},

	/**
	 * Decode 64 bit IEEE754 (big endian) data into a floating point binary number
	 * @param bytes
	 * @param pos
	 * @throws {SizeError} If there aren't enough bytes defined
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array, pos = 0): number {
		sNum('pos', pos)
			.unsigned()
			.atMost(bytes.length - 8)
			.throwNot();
		return fpb64.fromBytesUnsafe(bytes, pos);
	},
};
