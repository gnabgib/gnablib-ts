import { SizeError } from '../primitive/ErrorExt.js';
import { signMul } from './_ieee754.js';
const last7Bits = 0x7f;

//Big endian
//[S][E][E][E][E][E][E][E] [E][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M] [M][M][M][M][M][M][M][M]
//https://en.wikipedia.org/wiki/IEEE_754
const fp32ManSize = 23;
//const fp32ExpSize = 8;
const fp32MaxMan = 0x7fffff;
const fp32MaxExp = 0xff;
const fp32Bias = 127; //fp32MaxExp>>1
const fp32round64Correction = Math.pow(2, -1 - fp32ManSize) - Math.pow(2, -77);
export const FP32_EPSILON = 1.1920928955078125e-7; //2^-23 ~=E-7
export const FP32_MAX_INT = 16777216; //2^24

/**
 * Encode a floating point number to 32 bit precision IEEE754
 * @param float32
 * @returns
 */
export function fp32ToBytes(float32: number): Uint8Array {
	//[1][8][23]
	const ret = new Uint8Array(4);
	//Catch -0 with the second part (1/-0 = -inf)
	const sign = float32 < 0 || (float32 === 0 && 1 / float32 < 0) ? 1 : 0;
	let mantissa = 0;
	let exponent = 0;
	//Make the value positive now
	float32 *= 1 - sign * 2;
	if (isNaN(float32)) {
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
		exponent = Math.floor(Math.log(float32) / Math.LN2);
		let c: number;
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
			mantissa = float32 * Math.pow(2, fp32Bias - 1) * Math.pow(2, fp32ManSize);
			exponent = 0;
		}
	}
	ret[0] = (sign << 7) | (exponent >> 1);
	ret[1] = (exponent << 7) | (mantissa >> 16);
	ret[2] = mantissa >> 8;
	ret[3] = mantissa;
	return ret;
}

export function fp32FromBytesUnsafe(bytes: Uint8Array, pos: number): number {
	const sign = signMul(bytes[pos]);
	let exponent = ((bytes[pos] & last7Bits) << 1) | (bytes[pos + 1] >> 7);
	let mantissa = ((bytes[pos + 1] & last7Bits) << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];

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
	//console.log('ie','n=',negative,'m=',mantissa.toString(16),'e=',exponent,exponent.toString(16));
	return sign * mantissa * Math.pow(2, exponent - fp32Bias - fp32ManSize);
}

/**
 * Decode 32 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @returns
 */
export function fp32FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 4 > bytes.length) throw new SizeError('bytes', bytes.length, pos + 4);
	return fp32FromBytesUnsafe(bytes, pos);
}
