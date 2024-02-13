/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { hex } from '../codec/Hex.js';
import { ZeroError } from '../primitive/ErrorExt.js';
import { safety } from '../primitive/Safety.js';
import { ContentError } from '../error/ContentError.js';

//https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction
//Some source from: https://github.com/zxing/zxing
//https://merricx.github.io/qrazybox/help/extension-tools/reed-solomon-decoder.html
//https://downloads.bbc.co.uk/rd/pubs/whp/whp-pdf-files/WHP031.pdf
let _qrCode: IGf<Uint8Array> | undefined;
let _aztecData6: IGf<Uint8Array> | undefined;
let _aztecData10: IGf<Uint16Array> | undefined;
let _aztecData12: IGf<Uint16Array> | undefined;
let _aztecParam: IGf<Uint8Array> | undefined;
let _dataMatrix: IGf<Uint8Array> | undefined;

interface EuclideanResponse<T> {
	sigma: T;
	omega: T;
}

interface DivideResponse<T> {
	quotient: T;
	remainder: T;
}

export class ReedSolomonError extends Error {
	constructor(reason: string) {
		super(reason);
	}
}

export type UIntArray = Uint8Array | Uint16Array | Uint32Array;

/**
 * Galois Field
 */
export interface IGf<T extends UIntArray> {
	get primitive(): number;
	get base(): number;
	get zero(): GfPoly<T>;
	get one(): GfPoly<T>;
	get size(): number;

	/**
	 * Build a new polynomial with the given coefficients
	 * @param coefficients
	 */
	newPoly(coefficients: T): GfPoly<T>;

	/**
	 * Build a new polynomial with the given array-like coefficients (see constructor of T, or T.from(ArrayLike))
	 * @param coefficients
	 */
	newPolyArr(coefficients: Iterable<number>): GfPoly<T>;

	/**
	 * Build a new array of given size
	 * @param size
	 */
	newArr(size: number): T;

	/**
	 * Build a monomial given degree and coefficient
	 * @param degree
	 * @param coefficient
	 */
	buildMonomial(degree: number, coefficient: number): GfPoly<T>;

	/**
	 * Retrieve exponent at given position
	 * @param pos
	 */
	exp(pos: number): number;

	/**
	 * Lookup the log table at given position
	 * @param pos 1-(@see this.size-1)
	 * @throws ZeroError pos=0
	 * @returns number
	 */
	log(pos: number): number;

	/**
	 * Multiplicative inverse of a
	 * @param a number 1-(@see this.size-1)
	 * @throws ZeroError a=0
	 * @returns
	 */
	inverse(a: number): number;

	/**
	 * Product of @param a and @param b in GF
	 * @param a number 0-(@see this.size-1)
	 * @param b number 0-(@see this.size-1)
	 * @returns number
	 */
	mul(a: number, b: number): number;

	toString(): string;
}

/**
 * Galois Field Polynomial
 */
interface GfPoly<T extends UIntArray> {
	get coefficients(): T;
	get degree(): number;
	get degreeCoefficient(): number;
	get isZero(): boolean;

	coefficient(degree: number): number;
	evalAt(a: number): number;
	addOrSubtract(other: GfPoly<T>): GfPoly<T>;
	mulPoly(other: GfPoly<T>): GfPoly<T>;
	mulScalar(scalar: number): GfPoly<T>;
	mulMonomial(degree: number, coefficient: number): GfPoly<T>;
	div(other: GfPoly<T>): DivideResponse<GfPoly<T>>;
	toString(): string;
}

/**
 * Galois Fields Uint8
 */
class Gf8 implements IGf<Uint8Array> {
	readonly primitive: number;
	readonly base: number;
	readonly zero: GfPoly<Uint8Array>;
	readonly one: GfPoly<Uint8Array>;
	private readonly _lastSpot: number;
	private readonly _expTable: Uint8Array;
	private readonly _logTable: Uint8Array;

	constructor(primitive: number, pow2Size: number, base: number) {
		safety.intInRangeInc(pow2Size, 1, 8, 'pow2Size');
		const size = 1 << pow2Size;
		this.primitive = primitive;
		this.base = base;
		this._lastSpot = size - 1;
		this._expTable = new Uint8Array(size);
		this._logTable = new Uint8Array(size);

		let x = 1;
		let i = 0;
		for (; i < this._lastSpot; i++) {
			this._expTable[i] = x;
			this._logTable[x] = i;
			x <<= 1; //Double
			if (x >= size) {
				x ^= primitive;
				x &= this._lastSpot;
			}
		}
		this._expTable[i] = x;
		this.zero = new GfPoly8(this, Uint8Array.from([0]));
		this.one = new GfPoly8(this, Uint8Array.from([1]));
	}

	newPoly(coefficients: Uint8Array): GfPoly<Uint8Array> {
		return new GfPoly8(this, coefficients);
	}

	newPolyArr(coefficients: Iterable<number>): GfPoly<Uint8Array> {
		return new GfPoly8(this, Uint8Array.from(coefficients));
	}

	newArr(size: number): Uint8Array {
		return new Uint8Array(size);
	}

	buildMonomial(degree: number, coefficient: number): GfPoly<Uint8Array> {
		safety.intGte(degree, 0, 'degree');
		if (coefficient === 0) {
			return this.zero;
		}
		const coefficients = new Uint8Array(degree + 1);
		coefficients[0] = coefficient;
		return new GfPoly8(this, coefficients);
	}

	get size(): number {
		return this._lastSpot + 1;
	}

	exp(pos: number): number {
		return this._expTable[pos];
	}

	log(pos: number): number {
		if (pos === 0) throw new ZeroError('a');
		return this._logTable[pos];
	}

	inverse(a: number): number {
		if (a === 0) throw new ZeroError('a');
		return this._expTable[this._lastSpot - this._logTable[a]];
	}

	mul(a: number, b: number): number {
		if (a === 0 || b === 0) return 0;
		return this._expTable[
			(this._logTable[a] + this._logTable[b]) % this._lastSpot
		];
	}

	toString(): string {
		return `GF(0x${hex.fromI32Compress(this.primitive)}, ${
			this._lastSpot + 1
		}, ${this.base})`;
	}
}

/**
 * Galois Field Polynomial Uint8
 */
class GfPoly8 implements GfPoly<Uint8Array> {
	private readonly _field: IGf<Uint8Array>;
	readonly coefficients: Uint8Array;

	constructor(field: IGf<Uint8Array>, coefficients: Uint8Array) {
		if (coefficients.length === 0)
			throw new ZeroError('Coefficients.length', '>');
		this._field = field;
		if (coefficients.length > 1 && coefficients[0] === 0) {
			// Leading term must be non-zero for anything except the constant polynomial "0"
			let nonZero = 0;
			for (; nonZero < coefficients.length; nonZero++) {
				if (coefficients[nonZero] !== 0) break;
			}
			if (nonZero == coefficients.length) {
				this.coefficients = Uint8Array.from([0]);
			} else {
				this.coefficients = coefficients.slice(nonZero);
			}
		} else {
			this.coefficients = coefficients;
		}
	}

	get degree(): number {
		return this.coefficients.length - 1;
	}

	coefficient(degree: number): number {
		return this.coefficients[this.coefficients.length - 1 - degree];
	}

	get degreeCoefficient(): number {
		return this.coefficients[0];
	}

	get isZero(): boolean {
		return this.coefficients[0] === 0;
	}

	evalAt(a: number): number {
		if (a === 0) return this.coefficients[this.coefficients.length - 1];
		const n = this.coefficients.length;
		let result: number;
		if (a == 1) {
			// Just the sum of the coefficients
			result = 0;
			for (let i = 0; i < n; i++) {
				result ^= this.coefficients[i];
			}
		} else {
			result = this.coefficients[0];
			for (let i = 1; i < n; i++) {
				result = this._field.mul(a, result) ^ this.coefficients[i];
			}
		}
		return result;
	}

	addOrSubtract(other: GfPoly8): GfPoly<Uint8Array> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (this.isZero) return other;
		if (other.isZero) return this;

		let small = this.coefficients;
		let big = other.coefficients;
		if (small.length > big.length) {
			small = other.coefficients;
			big = this.coefficients;
		}
		const lenDiff = big.length - small.length;
		const sumDiff = new Uint8Array(big.length);
		sumDiff.set(big.subarray(0, lenDiff));
		for (let i = lenDiff; i < big.length; i++) {
			sumDiff[i] = small[i - lenDiff] ^ big[i];
		}

		return new GfPoly8(this._field, sumDiff);
	}

	mulPoly(other: GfPoly8): GfPoly<Uint8Array> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (this.isZero || other.isZero) return this._field.zero;

		const n = this.coefficients.length;
		const product = new Uint8Array(n + other.coefficients.length - 1);
		for (let i = 0; i < n; i++) {
			const coefficient = this.coefficients[i];
			for (let j = 0; j < other.coefficients.length; j++) {
				product[i + j] ^= this._field.mul(coefficient, other.coefficients[j]);
			}
		}
		return new GfPoly8(this._field, product);
	}

	mulScalar(scalar: number): GfPoly<Uint8Array> {
		if (scalar === 0) return this._field.zero;
		if (scalar == 1) return this;

		const n = this.coefficients.length;
		const product = new Uint8Array(n);
		for (let i = 0; i < n; i++) {
			product[i] = this._field.mul(this.coefficients[i], scalar);
		}
		return new GfPoly8(this._field, product);
	}

	mulMonomial(degree: number, coefficient: number): GfPoly<Uint8Array> {
		safety.intGte(degree, 0, 'degree');
		if (coefficient === 0) return this._field.zero;

		const n = this.coefficients.length;
		const product = new Uint8Array(n + degree);
		for (let i = 0; i < n; i++) {
			product[i] = this._field.mul(this.coefficients[i], coefficient);
		}
		return this._field.newPoly(product);
	}

	div(other: GfPoly8): DivideResponse<GfPoly<Uint8Array>> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (other.isZero) throw new ZeroError('other');

		let quotient = this._field.zero;
		//This isn't a pre ES6 practice - shut-up eslint
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let remainder: GfPoly<Uint8Array> = this;

		const denominatorLeadingTerm = other.degreeCoefficient;
		const inverseDenominatorLeadingTerm = this._field.inverse(
			denominatorLeadingTerm
		);
		let degreeDifference = this.degree - other.degree;
		while (degreeDifference >= 0 && !remainder.isZero) {
			const scale = this._field.mul(
				remainder.degreeCoefficient,
				inverseDenominatorLeadingTerm
			);
			const term = other.mulMonomial(degreeDifference, scale);
			const iterationQuotient = this._field.buildMonomial(
				degreeDifference,
				scale
			);
			quotient = quotient.addOrSubtract(iterationQuotient);
			remainder = remainder.addOrSubtract(term);
			degreeDifference = remainder.degree - other.degree;
		}

		return { quotient: quotient, remainder: remainder };
	}

	toString(): string {
		return `Poly(${this._field.toString()}, ${this.coefficients.toString()})`;
	}
}

/**
 * Galois Fields Uint16
 */
class Gf16 implements IGf<Uint16Array> {
	readonly primitive: number;
	readonly base: number;
	readonly zero: GfPoly<Uint16Array>;
	readonly one: GfPoly<Uint16Array>;
	private readonly _lastSpot: number;
	private readonly _expTable: Uint16Array;
	private readonly _logTable: Uint16Array;

	constructor(primitive: number, pow2Size: number, base: number) {
		safety.intInRangeInc(pow2Size, 1, 16, 'pow2Size');
		const size = 1 << pow2Size;
		this.primitive = primitive;
		this.base = base;
		this._lastSpot = size - 1;
		this._expTable = new Uint16Array(size);
		this._logTable = new Uint16Array(size);

		let x = 1;
		let i = 0;
		for (; i < this._lastSpot; i++) {
			this._expTable[i] = x;
			this._logTable[x] = i;
			x <<= 1; //Double
			if (x >= size) {
				x ^= primitive;
				x &= this._lastSpot;
			}
		}
		this._expTable[i] = x;
		this.zero = new GfPoly16(this, Uint16Array.from([0]));
		this.one = new GfPoly16(this, Uint16Array.from([1]));
	}

	newPoly(coefficients: Uint16Array): GfPoly<Uint16Array> {
		return new GfPoly16(this, coefficients);
	}

	newPolyArr(coefficients: Iterable<number>): GfPoly<Uint16Array> {
		return new GfPoly16(this, Uint16Array.from(coefficients));
	}

	newArr(size: number): Uint16Array {
		return new Uint16Array(size);
	}

	buildMonomial(degree: number, coefficient: number): GfPoly<Uint16Array> {
		safety.intGte(degree, 0, 'degree');
		if (coefficient === 0) {
			return this.zero;
		}
		const coefficients = new Uint16Array(degree + 1);
		coefficients[0] = coefficient;
		return new GfPoly16(this, coefficients);
	}

	get size(): number {
		return this._lastSpot + 1;
	}

	exp(pos: number): number {
		return this._expTable[pos];
	}

	/**
	 * Lookup the log table at given position
	 * @param pos 1-@see this.lastSpot
	 * @throws ZeroError pos=0
	 * @returns number
	 */
	log(pos: number): number {
		if (pos === 0) throw new ZeroError('a');
		return this._logTable[pos];
	}

	/**
	 * Multiplicative inverse of a
	 * @param a number 1-@see this.lastSpot
	 * @throws ZeroError a=0
	 * @returns
	 */
	inverse(a: number): number {
		if (a === 0) throw new ZeroError('a');
		return this._expTable[this._lastSpot - this._logTable[a]];
	}

	/**
	 * Product of @param a and @param b in GF
	 * @param a number 0-@see this.lastSpot
	 * @param b number 0-@see this.lastSpot
	 * @returns number
	 */
	mul(a: number, b: number): number {
		if (a === 0 || b === 0) return 0;
		return this._expTable[
			(this._logTable[a] + this._logTable[b]) % this._lastSpot
		];
	}

	toString(): string {
		return `GF(0x${hex.fromI32Compress(this.primitive)}, ${
			this._lastSpot + 1
		}, ${this.base})`;
	}
}

/**
 * Galois Field Polynomial Uint16
 */
class GfPoly16 implements GfPoly<Uint16Array> {
	private readonly _field: IGf<Uint16Array>;
	readonly coefficients: Uint16Array;

	constructor(field: Gf16, coefficients: Uint16Array) {
		if (coefficients.length === 0)
			throw new ZeroError('Coefficients.length', '>');
		this._field = field;
		if (coefficients.length > 1 && coefficients[0] === 0) {
			// Leading term must be non-zero for anything except the constant polynomial "0"
			let nonZero = 0;
			for (; nonZero < coefficients.length; nonZero++) {
				if (coefficients[nonZero] !== 0) break;
			}
			if (nonZero == coefficients.length) {
				this.coefficients = Uint16Array.from([0]);
			} else {
				this.coefficients = coefficients.slice(nonZero);
			}
		} else {
			this.coefficients = coefficients;
		}
	}

	get degree(): number {
		return this.coefficients.length - 1;
	}

	coefficient(degree: number): number {
		return this.coefficients[this.coefficients.length - 1 - degree];
	}

	get degreeCoefficient(): number {
		return this.coefficients[0];
	}

	get isZero(): boolean {
		return this.coefficients[0] === 0;
	}

	evalAt(a: number): number {
		if (a === 0) return this.coefficients[this.coefficients.length - 1];
		const n = this.coefficients.length;
		let result: number;
		if (a == 1) {
			// Just the sum of the coefficients
			result = 0;
			for (let i = 0; i < n; i++) {
				result ^= this.coefficients[i];
			}
		} else {
			result = this.coefficients[0];
			for (let i = 1; i < n; i++) {
				result = this._field.mul(a, result) ^ this.coefficients[i];
			}
		}
		return result;
	}

	addOrSubtract(other: GfPoly16): GfPoly<Uint16Array> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (this.isZero) return other;
		if (other.isZero) return this;

		let small = this.coefficients;
		let big = other.coefficients;
		if (small.length > big.length) {
			small = other.coefficients;
			big = this.coefficients;
		}
		const lenDiff = big.length - small.length;
		const sumDiff = new Uint16Array(big.length);
		sumDiff.set(big.subarray(0, lenDiff));
		for (let i = lenDiff; i < big.length; i++) {
			sumDiff[i] = small[i - lenDiff] ^ big[i];
		}

		return this._field.newPoly(sumDiff);
	}

	mulPoly(other: GfPoly16): GfPoly<Uint16Array> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (this.isZero || other.isZero) return this._field.zero;

		const n = this.coefficients.length;
		const product = new Uint16Array(n + other.coefficients.length - 1);
		for (let i = 0; i < n; i++) {
			const coefficient = this.coefficients[i];
			for (let j = 0; j < other.coefficients.length; j++) {
				product[i + j] ^= this._field.mul(coefficient, other.coefficients[j]);
			}
		}
		return this._field.newPoly(product);
	}

	mulScalar(scalar: number): GfPoly<Uint16Array> {
		if (scalar === 0) return this._field.zero;
		if (scalar == 1) return this;

		const n = this.coefficients.length;
		const product = new Uint16Array(n);
		for (let i = 0; i < n; i++) {
			product[i] = this._field.mul(this.coefficients[i], scalar);
		}
		return this._field.newPoly(product);
	}

	mulMonomial(degree: number, coefficient: number): GfPoly<Uint16Array> {
		safety.intGte(degree, 0, 'degree');
		if (coefficient === 0) return this._field.zero;

		const n = this.coefficients.length;
		const product = new Uint16Array(n + degree);
		for (let i = 0; i < n; i++) {
			product[i] = this._field.mul(this.coefficients[i], coefficient);
		}
		return this._field.newPoly(product);
	}

	div(other: GfPoly16): DivideResponse<GfPoly<Uint16Array>> {
		if (this._field !== other._field)
			throw new ContentError("fields don't match");
		if (other.isZero) throw new ZeroError('other');

		let quotient = this._field.zero;
		//This isn't a pre ES6 practice - shut-up eslint
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let remainder: GfPoly<Uint16Array> = this;

		const denominatorLeadingTerm = other.degreeCoefficient;
		const inverseDenominatorLeadingTerm = this._field.inverse(
			denominatorLeadingTerm
		);
		let degreeDifference = this.degree - other.degree;
		while (degreeDifference >= 0 && !remainder.isZero) {
			const scale = this._field.mul(
				remainder.degreeCoefficient,
				inverseDenominatorLeadingTerm
			);
			const term = other.mulMonomial(degreeDifference, scale);
			const iterationQuotient = this._field.buildMonomial(
				degreeDifference,
				scale
			);
			quotient = quotient.addOrSubtract(iterationQuotient);
			remainder = remainder.addOrSubtract(term);
			degreeDifference = remainder.degree - other.degree;
		}

		return { quotient: quotient, remainder: remainder };
	}

	toString(): string {
		return `Poly(${this._field.toString()}, ${this.coefficients.toString()})`;
	}
}

/**
 * Get the QR Code Galois Fields (x11d, 256, 0) (2^8)
 */
export function qrCode(): IGf<Uint8Array> {
	if (!_qrCode) {
		_qrCode = new Gf8(0x11d, 8, 0);
	}
	return _qrCode;
}

/**
 * Get the Data Matrix (256) Galois Fields (x12d,256,1) (2^8)
 * @returns
 */
export function dataMatrix(): IGf<Uint8Array> {
	if (!_dataMatrix) {
		_dataMatrix = new Gf8(0x012d, 8, 1);
	}
	return _dataMatrix;
}

/**
 * Get the Aztec Param Galois Fields (x13,16,1) (2^4)
 */
export function aztecParam(): IGf<Uint8Array> {
	if (!_aztecParam) {
		_aztecParam = new Gf8(0x13, 4, 1);
	}
	return _aztecParam;
}

/**
 * Get the Aztec Data 6 Galois Fields (x43,64,1) (2^6)
 */
export function aztecData6(): IGf<Uint8Array> {
	if (!_aztecData6) {
		_aztecData6 = new Gf8(0x43, 6, 1);
	}
	return _aztecData6;
}

/**
 * Get the Aztec Data 8 (same Matrix Field) Galois Fields (x12d,256,1) (2^8)
 */
export function aztecData8(): IGf<Uint8Array> {
	return dataMatrix();
}

/**
 * Get the Aztec Data 10 Galois Fields (x409,1024,1) (2^10)
 */
export function aztecData10(): IGf<Uint16Array> {
	if (!_aztecData10) {
		_aztecData10 = new Gf16(0x409, 10, 1);
	}
	return _aztecData10;
}

/**
 * Get the Aztec Data 12 Galois Fields (x1069,4096,1) (2^14)
 */
export function aztecData12(): IGf<Uint16Array> {
	if (!_aztecData12) {
		_aztecData12 = new Gf16(0x1069, 12, 1);
	}
	return _aztecData12;
}

/**
 * Get the Maxicode Field (same as Aztec Data 6) Galois Fields (x43,64,1) (2^6)
 */
export function maxicodeField(): IGf<Uint8Array> {
	return aztecData6();
}

/**
 * Reed Solomon encoder/decoder
 */
export class ReedSolomon<T extends UIntArray> {
	private readonly _field: IGf<T>;
	private readonly _cache: Array<GfPoly<T>> = [];

	constructor(field: IGf<T>) {
		this._field = field;
		this._cache.push(field.one); // new GenericGFPoly2(field, new Int32Array([1])));
	}

	//-- -- -- Encode -- -- --
	private _generator(degree: number): GfPoly<T> {
		if (degree >= this._cache.length) {
			let last = this._cache[this._cache.length - 1];
			for (let d = this._cache.length; d <= degree; d++) {
				const next = last.mulPoly(
					this._field.newPolyArr([1, this._field.exp(d - 1 + this._field.base)])
				);
				this._cache.push(next);
				last = next;
			}
		}
		return this._cache[degree];
	}

	encode(value: T, ecLen: number): void {
		if (ecLen === 0) throw new ZeroError('ecByteLen');

		const dataLen = value.length - ecLen;
		if (dataLen <= 0) throw new ContentError('Missing data bytes');

		const gen = this._generator(ecLen);

		//Possibly+clone
		let info = this._field.newPolyArr(value.subarray(0, dataLen));
		info = info.mulMonomial(ecLen, 1);
		const { remainder } = info.div(gen);
		const n = ecLen - remainder.coefficients.length;
		for (let i = 0; i < n; i++) {
			value[dataLen + i] = 0;
		}
		value.set(remainder.coefficients, dataLen + n);
	}

	//-- -- -- Decode -- -- --
	private _findErrorMagnitudes(
		errorEvaluator: GfPoly<T>,
		errorLocations: T
	): T {
		// Forney's Formula
		const n = errorLocations.length;
		const ret = this._field.newArr(n);
		for (let i = 0; i < n; i++) {
			const xiInverse = this._field.inverse(errorLocations[i]);
			let denominator = 1;
			for (let j = 0; j < n; j++) {
				if (i !== j) {
					denominator = this._field.mul(
						denominator,
						1 ^ this._field.mul(errorLocations[j], xiInverse)
					);
				}
			}
			ret[i] = this._field.mul(
				errorEvaluator.evalAt(xiInverse),
				this._field.inverse(denominator)
			);
			if (this._field.base !== 0) {
				ret[i] = this._field.mul(ret[i], xiInverse);
			}
		}
		return ret;
	}

	/**
	 *
	 * @param errorLocator
	 * @throws ReedSolomonError Error locator degree does not match number of roots
	 * @returns
	 */
	private _findErrorLocations(errorLocator: GfPoly<T>): T {
		// Chien's search
		const eDegree = errorLocator.degree;
		const ret = this._field.newArr(eDegree);
		if (eDegree === 1) {
			ret[0] = errorLocator.coefficient(1);
			return ret;
		}
		let rootCount = 0;
		const fieldSize = this._field.size;
		for (let i = 1; i < fieldSize; i++) {
			if (errorLocator.evalAt(i) === 0) {
				ret[rootCount] = this._field.inverse(i);
				rootCount++;
				if (rootCount >= eDegree) return ret;
			}
		}
		throw new ReedSolomonError(
			'Error locator degree does not match number of roots'
		);
	}

	/**
	 *
	 * @param a
	 * @param b
	 * @param R
	 * @throws Error Algo failure
	 * @throws ReedSolomonError rLast went to zero, sigmaTilde(0) is zero
	 * @returns
	 */
	private _runEuclideanAlgorithm(
		a: GfPoly<T>,
		b: GfPoly<T>,
		R: number
	): EuclideanResponse<GfPoly<T>> {
		//Divide R by two,
		//const rOver2=(R/2)|0;
		const rOver2 = R >> 1;
		let rLast = a;
		let r = b;
		if (a.degree < b.degree) {
			rLast = b;
			r = a;
		}
		let tLast = this._field.zero;
		let t = this._field.one;

		// Run Euclidean algorithm until r's degree is less than R/2
		while (r.degree >= rOver2) {
			const rLastLast = rLast;
			const tLastLast = tLast;
			rLast = r;
			tLast = t;

			// Divide rLastLast by rLast, with quotient in q and remainder in r
			if (rLast.isZero) throw new ReedSolomonError('rLast is zero');
			r = rLastLast;
			let q = this._field.zero;
			const denominatorLeadingTerm = rLast.coefficient(rLast.degree);
			const dltInverse = this._field.inverse(denominatorLeadingTerm);
			while (r.degree >= rLast.degree && !r.isZero) {
				const degreeDiff = r.degree - rLast.degree;
				const scale = this._field.mul(r.degreeCoefficient, dltInverse);
				q = q.addOrSubtract(this._field.buildMonomial(degreeDiff, scale));
				r = r.addOrSubtract(rLast.mulMonomial(degreeDiff, scale));
			}

			t = q.mulPoly(tLast).addOrSubtract(tLastLast);

			if (r.degree >= rLast.degree) {
				throw new Error('Division algorithm failed to reduce polynomial');
			}
		}

		const sigmaTildeAtZero = t.coefficient(0);
		if (sigmaTildeAtZero === 0) {
			throw new ReedSolomonError('sigmaTilde(0) is zero');
		}

		const inverse = this._field.inverse(sigmaTildeAtZero);
		const sigma = t.mulScalar(inverse);
		const omega = r.mulScalar(inverse);
		return { sigma: sigma, omega: omega };
	}

	/**
	 *
	 * @param received
	 * @param ecLen
	 * @throws ReedSolomonError Bad error location
	 * @throws Error Algo failure
	 * @throws ReedSolomonError rLast went to zero, sigmaTilde(0) is zero
	 * @throws ReedSolomonError Error locator degree does not match number of roots
	 * @returns
	 */
	public decode(received: T, ecLen: number): void {
		const poly = this._field.newPoly(received);
		const syndromeCoefficients = this._field.newArr(ecLen);
		let allZero = 0;
		for (let i = 0; i < ecLen; i++) {
			const evalResult = poly.evalAt(this._field.exp(i + this._field.base));
			syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalResult;
			//We need at least one non-zero
			allZero |= evalResult;
		}
		//The only way for this to stay at zero is if all evaluations are zero
		if (allZero === 0) return;
		const syndrome = this._field.newPoly(syndromeCoefficients);
		const { sigma, omega } = this._runEuclideanAlgorithm(
			this._field.buildMonomial(ecLen, 1),
			syndrome,
			ecLen
		);
		const errorLocations = this._findErrorLocations(sigma);
		const errorMagnitudes = this._findErrorMagnitudes(omega, errorLocations);
		for (let i = 0; i < errorLocations.length; i++) {
			const position = received.length - 1 - this._field.log(errorLocations[i]);
			if (position < 0) {
				throw new ReedSolomonError('Bad error location');
			}
			received[position] ^= errorMagnitudes[i];
		}
	}
}
