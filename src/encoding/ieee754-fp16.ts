import { SizeError } from '../primitive/ErrorExt.js';
import { signMul } from './_ieee754.js';
const last2Bits = 0x3;
const last5Bits = 0x1f;

//Big endian
//[S][E][E][E][E][E][M][M] [M][M][M][M][M][M][M][M]
const fp16ManSize = 10;
//const fp16ExpSize = 5;
const fp16MaxMan = 0x7ff;
const fp16MaxExp = 0x1f;
const fp16Bias = 15; //fp16MaxExp>>1
const fp16round64Correction = Math.pow(2, -1 - fp16ManSize) - Math.pow(2, -77);
export const FP16_EPSILON = 9.765625e-4; //2^-10 ~-=E-3
export const FP16_MAX_INT = 2048; //2^11

/**
 * Encode a floating point number to 16 bit precision IEEE754
 * @param float16
 * @returns
 */
export function fp16ToBytes(float16: number): Uint8Array {
	const ret = new Uint8Array(2);
	const sign = float16 < 0 || (float16 === 0 && 1 / float16 < 0) ? 1 : 0;
	let mantissa = 0;
	let exponent = 0;
	//Make the value positive now
	float16 *= 1 - sign * 2;
	if (isNaN(float16)) {
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
		exponent = Math.floor(Math.log(float16) / Math.LN2);
		let c: number;
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
			mantissa = float16 * Math.pow(2, fp16Bias - 1) * Math.pow(2, fp16ManSize);
			exponent = 0;
		}
	}
	ret[0] = (sign << 7) | (exponent << 2) | (mantissa >> 8);
	ret[1] = mantissa;

	return ret;
}

export function fp16FromBytesUnsafe(bytes: Uint8Array, pos: number): number {
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
	//console.log('fp16','n=',sign,'m=',mantissa.toString(16),'e=',exponent,exponent.toString(16));
	return sign * mantissa * Math.pow(2, exponent - fp16Bias - fp16ManSize);
}

/**
 * Decode 16 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @throws SizeError If there aren't enough bytes defined
 * @returns
 */
export function fp16FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 2 > bytes.length)
		throw new SizeError('bytes', bytes.length, pos + 2);
	return fp16FromBytesUnsafe(bytes, pos);
}
