import { SizeError } from '../primitive/ErrorExt';
import { signMul } from './_ieee754';
const last4Bits = 0xf;
const last7Bits = 0x7f;

//Big endian
//[S][E][E][E][E][E][E][E] [E][E][E][E][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//[M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//https://en.wikipedia.org/wiki/IEEE_754
const fp64ManSize = 52;
const fp64ExpSize = 11;
const fp64MaxMan = 0xfffffffffffff;
const fp64MaxExp = 0x7ff;
const fp64Bias = 1023; //fp64MaxExp>>1
export const FP64_EPSILON = Number.EPSILON; //2^-52 ~=2E-16
export const FP64_MAX_INT = 9007199254740992; //2^53 - Note this isn't the same as JS "MAX_SAFE_INTEGER" (it's 1 more)

/**
 * Encode a floating point number to 64 bit precision IEEE754
 * @param float64
 * @returns
 */
export function fp64ToBytes(float64: number): Uint8Array {
	const ret = new Uint8Array(8);
	//Catch -0 with the second part (1/-0 = -inf)
	const sign = float64 < 0 || (float64 === 0 && 1 / float64 < 0) ? 1 : 0;
	let mantissa = 0;
	let exponent = 0;
	//Make the value positive now
	float64 *= 1 - sign * 2;
	if (isNaN(float64)) {
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
		exponent = Math.floor(Math.log(float64) / Math.LN2);
		let c: number;
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
			mantissa = float64 * Math.pow(2, fp64Bias - 1) * Math.pow(2, fp64ManSize);
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
}

export function fp64FromBytesUnsafe(bytes: Uint8Array, pos: number): number {
	const sign = signMul(bytes[pos]);
	let exponent = ((bytes[pos] & last7Bits) << 4) | (bytes[pos + 1] >> 4);
	//Let's split mantissa into  4*8bit + 3*8bit parts.. the first only uses 29 bits (no sign issues)
	let mantissaHigh =
		((bytes[pos + 1] & last4Bits) << 24) |
		(bytes[pos + 2] << 16) |
		(bytes[pos + 3] << 8) |
		bytes[pos + 4];
	const mantissaLow = (bytes[pos + 5] << 16) | (bytes[pos + 6] << 8) | bytes[pos + 7];

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
	//console.log('fp64','n=',sign,'m=',mantissaHigh.toString(16),mantissaLow.toString(16),'e=',exponent,exponent.toString(16));
	const eHigh = Math.pow(2, exponent - fp64Bias - fp64ManSize + 24);
	return sign * (mantissaHigh * eHigh + mantissaLow * eHigh * Math.pow(2, -24));
}

/**
 * Decode 64 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @returns
 */
export function fp64FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 8 > bytes.length) throw new SizeError('bytes', bytes.length, pos + 8);
	return fp64FromBytesUnsafe(bytes, pos);
}
