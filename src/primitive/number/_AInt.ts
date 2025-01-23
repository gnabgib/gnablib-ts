/*! Copyright 2025 the gnablib contributors MPL-1.1 */
import { hex } from '../../codec/Hex.js';
import { asBE } from '../../endian/platform.js';
import { sInt, sLen, sNum } from '../../safe/safe.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export abstract class AInt {
	protected constructor(
		protected _arr: Uint32Array,
		protected _pos: number,
		/** Number of 32bit elements required */
		readonly size32: number,
		protected readonly _name: string
	) {}

	protected _setValue(n: AInt) {
		/*DEBUG*/ if (this.size32 != n.size32) throw new Error('Size mismatch');
		//Assumption: b is same size as this (lib-dev to solve), size is multiple of 2*n*u32 (64,128,256,512 but not 96)
		let i = 0;
		do {
			this._arr[this._pos + i] = n._arr[n._pos + i++];
			this._arr[this._pos + i] = n._arr[n._pos + i++];
		} while (i < this.size32);
	}

	protected _setZero() {
		this._arr.fill(0, this._pos, this._pos + this.size32);
	}

	/** Create a **copy** of this element */
	abstract clone(): AInt;

	/** Create a **copy** of the `Uint32Array` within, little endian order */
	clone32() {
		return this._arr.slice(this._pos, this._pos + this.size32);
	}

	//#region Builds
	protected static _fromInt(size32: number, i52: number): Uint32Array {
		sInt('i52', i52)
			.atLeast(Number.MIN_SAFE_INTEGER)
			.atMost(Number.MAX_SAFE_INTEGER)
			.throwNot();
		const arr = new Uint32Array(size32);
		arr[0] = i52;
		//We need to use Math.floor such that negative numbers become more negative
		// rather than getting truncated
		arr[1] = Math.floor(i52 / 4294967296);
		return arr;
	}
	protected static _fromSignedSet(size32: number, ns: number[]): Uint32Array {
		sLen('ns', ns).atMost(size32).throwNot();
		const arr = new Uint32Array(size32);
		arr.set(ns);
		if (ns.length > 0 && ns[ns.length - 1] < 0) arr.fill(0xffffffff, ns.length);
		return arr;
	}
	protected static _fromSet(size32: number, ns: number[]): Uint32Array {
		sLen('ns', ns).atMost(size32).throwNot();
		const arr = new Uint32Array(size32);
		arr.set(ns);
		return arr;
	}
	protected static _fromBytesBE(
		size8: number,
		src: Uint8Array,
		pos: number
	): Uint32Array {
		const end = pos + size8;
		sLen('src', src).atLeast(end).throwNot();
		const cpy = src.slice(pos, end);
		asBE.bytes(cpy, size8);
		return new Uint32Array(cpy.buffer);
	}
	//#endregion

	//#region LogicOps
	protected _xorEq(o: AInt) {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		let i = 0;
		do {
			this._arr[this._pos + i] ^= o._arr[o._pos + i++];
			this._arr[this._pos + i] ^= o._arr[o._pos + i++];
		} while (i < this.size32);
	}
	protected _orEq(o: AInt) {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		let i = 0;
		do {
			this._arr[this._pos + i] |= o._arr[o._pos + i++];
			this._arr[this._pos + i] |= o._arr[o._pos + i++];
		} while (i < this.size32);
	}
	protected _andEq(o: AInt) {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		let i = 0;
		do {
			this._arr[this._pos + i] &= o._arr[o._pos + i++];
			this._arr[this._pos + i] &= o._arr[o._pos + i++];
		} while (i < this.size32);
	}
	protected _notEq() {
		let i = 0;
		do {
			this._arr[this._pos + i] = ~this._arr[this._pos + i++];
			this._arr[this._pos + i] = ~this._arr[this._pos + i++];
		} while (i < this.size32);
	}
	//#endregion

	//#region ShiftOps
	protected _lShiftEq(by: number) {
		const by32 = by & 0x1f; //aka mod 32
		const byPos = Math.min(by >>> 5, this.size32); //aka divide by 32, but max at all els
		const invBy32 = 32 - by32; //Inverse (for the second shift)

		// Detect by32 being 0, or more accurately invBy32 being 32.. which is treated
		// as 0 in JS and leads to elements ORing and merging (a right mess) - we need
		// to zero the shift in that case.
		const zeroRshift = 1 - (invBy32 >>> 5);
		/* DEBUG [size32]<<by=[by32 byPos]: 
            [n]=([n-byPos]<<by32)|([n-byPos-1]>>>invByPos)
            [n]=[n-byPos]<<by32
            [n..0]=0
         */
		// /*DEBUG*/let d = `[${this.size32}]<<${by}=[${by32} ${byPos}]: `;

		//Reverse order (to not lose data)
		let i = this.size32 - 1;
		for (; i > byPos; i--) {
			// /*DEBUG*/d += `[${this._pos+i}]=([${this._pos+i-byPos}]<<${by32})|(${zeroRshift}*[${this._pos + i - 1 - byPos}]>>>${invBy32}) `;
			this._arr[this._pos + i] =
				(this._arr[this._pos + i - byPos] << by32) |
				((zeroRshift * this._arr[this._pos + i - 1 - byPos]) >>> invBy32);
		}
		//Last one is only one shift
		if (byPos < this.size32) {
			// /*DEBUG*/d += `[${this._pos+i}]=([${this._pos+i-byPos}]<<${by32}) `;
			this._arr[this._pos + i] = this._arr[this._pos + i - byPos] << by32;
			i--;
		}
		//Rem get zeroed
		if (i >= 0) {
			// /*DEBUG*/d += `[${i}..0]=0 `;
			//Because fill.end is effectively a size, we add one to index
			this._arr.fill(0, this._pos, this._pos + i + 1);
		}
		// /*DEBUG*/console.log(d);
	}

	protected _rShiftEq(by: number, last = 0) {
		const by32 = by & 0x1f; //aka mod 32
		const byPos = Math.min(by >>> 5, this.size32); //aka divide by 32, but max at all els
		const invBy32 = 32 - by32; //Inverse (for the second shift)

		// Detect by32 being 0, or more accurately invBy32 being 32.. which is treated
		// as 0 in JS and leads to elements ORing and merging (a right mess) - we need
		// to zero the shift in that case.
		const zeroRshift = 1 - (invBy32 >>> 5);
		/* DEBUG [size32]>>by,l=last=[by32 byPos]: 
            [n]=([n-byPos]<<by32)|([n-byPos-1]>>>invByPos)
            [n]=[n-byPos]<<by32
            [n..0]=0
         */
		// /*DEBUG*/let d = `[${this.size32}]>>${by},l=${last}=[${by32} ${byPos}]: `;

		let i = 0;
		const n = this.size32 - byPos - 1;
		//While we can pull down from higher in the number
		for (; i < n; i++) {
			// /*DEBUG*/d += `[${this._pos+i}]=([${this._pos+i+byPos}]>>>${by32})|(${zeroRshift}*[${this._pos + i+byPos+1}]<<${invBy32}) `;
			this._arr[this._pos + i] =
				(this._arr[this._pos + i + byPos] >>> by32) |
				((zeroRshift * this._arr[this._pos + i + byPos + 1]) << invBy32);
		}
		//If we were pulling down, there's one more available, this time using `last` for the merge
		if (byPos < this.size32) {
			// /*DEBUG*/d += `[${this._pos+i}]=([${this._pos+i+byPos}]>>>${by32})|(${zeroRshift}*last<<${invBy32}) `;
			this._arr[this._pos + i] =
				(this._arr[this._pos + i + byPos] >>> by32) |
				((zeroRshift * last) << invBy32);
			i++;
		}
		//Finally any remaining high numbers are set to 0/-1 (last)
		this._arr.fill(last, this._pos + i, this._pos + this.size32);
		// /*DEBUG*/if (i<this.size32) d+=`[${i}..${this.size32-1}]=last`;
		// /*DEBUG*/console.log(d);
	}
	protected _lRotEq(by: number) {
		const by32 = by & 0x1f; //aka mod 32
		const byPos = (by >>> 5) % this.size32; //aka divide by 32 /w wrap
		const invBy32 = 32 - by32; //Inverse (for the second shift)

		// Detect by32 being 0, or more accurately invBy32 being 32.. which is treated
		// as 0 in JS and leads to elements ORing and merging (a right mess) - we need
		// to zero the shift in that case.
		const zeroRshift = 1 - (invBy32 >>> 5);
		// /*DEBUG*/ let d = `[${this.size32}] lRot ${by}=[${by32} ${byPos}]\n`;

		//First move U32s
		// /*DEBUG*/ d += ` shift U32 by ${byPos}`;
		this._arr.subarray(this._pos, this._pos + this.size32).reverse();
		this._arr.subarray(this._pos, this._pos + byPos).reverse();
		this._arr.subarray(this._pos + byPos, this._pos + this.size32).reverse();
		// /*DEBUG*/d += ` =${this}\n`;

		//Now do any bit shifting
		let back = this._arr[this._pos];
		// /*DEBUG*/ d += ` [${this._pos}]=[${this._pos}]<<${by32}|(${zeroRshift}*[${this._pos + this.size32 - 1}]>>>${invBy32})\n`;
		this._arr[this._pos] =
			(this._arr[this._pos] << by32) |
			((zeroRshift * this._arr[this._pos + this.size32 - 1]) >>> invBy32);
		let i = 1;
		for (; i < this.size32; i++) {
			// /*DEBUG*/ d += ` [${this._pos + i}]=[${this._pos + i}]<<${by32}|(${zeroRshift}*[${this._pos + i - 1}]>>>${invBy32})\n`;
            const b=this._arr[this._pos + i];
			this._arr[this._pos + i] =
				(this._arr[this._pos + i] << by32) |
				((zeroRshift * back) >>> invBy32);
            back=b;
		}
		// /*DEBUG*/ console.log(d);
	}
	//#endregion

	//#region Arithmetic
	protected _addEq(o: AInt) {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		let i = 0;
		let carry = 0;
		do {
			const sum = this._arr[this._pos + i] + o._arr[o._pos + i] + carry;
			carry = sum > 4294967295 ? 1 : 0;
			this._arr[this._pos + i] = sum;
		} while (++i < this.size32);
	}
	protected _negEq() {
		this._notEq();
		//Simplified addEq since we're only adding 1
		let i = 0;
		do {
			this._arr[this._pos + i] += 1;
			//If the above add overflowed, the resulting number will now be zero
			if (this._arr[this._pos + i] != 0) break;
		} while (++i < this.size32);
	}
	protected _subEq(o: AInt) {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		let i = 0;
		let borrow = 0;
		// /*DEBUG*/let d = `-:`;
		do {
			// /*DEBUG*/d+=`[${this._pos+i}]-o-${borrow}`;
			const sub = this._arr[this._pos + i] - o._arr[o._pos + i] - borrow;
			borrow = sub < 0 ? 1 : 0;
			// /*DEBUG*/d+=`=${sub}, ${borrow}`;
			this._arr[this._pos + i] = sub;
		} while (++i < this.size32);
		// /*DEBUG*/console.log(d);
	}
	protected _mul(o: AInt): Uint32Array {
		/*DEBUG*/ if (this.size32 != o.size32) throw new Error('Size mismatch');
		const t16 = new Uint16Array(
			this._arr.subarray(this._pos, this._pos + this.size32).buffer
		);
		const o16 = new Uint16Array(
			o._arr.subarray(o._pos, o._pos + this.size32).buffer
		);
		const m16 = new Uint16Array(t16.length);
		let carry = 0;
		let i = 0;
		let im = 0;
		// /*DEBUG*/let d = `${this} x ${o}:\n`;
		do {
			let m = 0;
			// /*DEBUG*/d+=`m[${im}]=`;
			for (let it = i * 2; it >= 0; it--) {
				for (let io = i * 2 - it; io >= 0; io--) {
					if (it + io < i * 2) continue;
					// /*DEBUG*/d+=`t16[${it}]*o16[${io}]+`;
					m += t16[it] * o16[io];
				}
			}
			// /*DEBUG*/d+=`carry\n`;
			m += carry;
			m16[im++] = m;
			carry = (m / 0x10000) | 0;
			m = 0;
			// /*DEBUG*/d+=`m[${im}]=`;
			for (let it = i * 2 + 1; it >= 0; it--) {
				for (let io = i * 2 + 1 - it; io >= 0; io--) {
					if (it + io < i * 2 + 1) continue;
					// /*DEBUG*/d+=`t16[${it}]*o16[${io}]+`;
					m += t16[it] * o16[io];
				}
			}
			// /*DEBUG*/d+=`carry\n`;
			m += carry;
			m16[im++] = m;
			carry = (m / 0x10000) | 0;
		} while (++i < this.size32);
		// /*DEBUG*/console.log(d);
		return new Uint32Array(m16.buffer);
	}
	//#endregion

	//#region Comparable
	/** Whether `this` == `o` */
	eq(o: AInt) {
		let i = 0;
		do {
			if (this._arr[this._pos + i] != o._arr[o._pos + i]) return false;
		} while (++i < this.size32);
		return true;
	}
	/** Whether `this` > `o` */
	gt(o: AInt) {
		let i = this.size32 - 1;
		do {
			if (this._arr[this._pos + i] != o._arr[o._pos + i])
				return this._arr[this._pos + i] > o._arr[o._pos + i];
		} while (--i > 0);
		return this._arr[this._pos] > o._arr[o._pos];
	}
	/** Whether `this` >= `o` */
	gte(o: AInt) {
		let i = this.size32 - 1;
		do {
			if (this._arr[this._pos + i] != o._arr[o._pos + i])
				return this._arr[this._pos + i] > o._arr[o._pos + i];
		} while (--i > 0);
		return this._arr[this._pos] >= o._arr[o._pos];
	}
	/** Whether `this` < `o` */
	lt(o: AInt) {
		let i = this.size32 - 1;
		do {
			if (this._arr[this._pos + i] != o._arr[o._pos + i])
				return this._arr[this._pos + i] < o._arr[o._pos + i];
		} while (--i > 0);
		return this._arr[this._pos] < o._arr[o._pos];
	}
	/** Whether `this` <= `o` */
	lte(o: AInt) {
		let i = this.size32 - 1;
		do {
			if (this._arr[this._pos + i] != o._arr[o._pos + i])
				return this._arr[this._pos + i] < o._arr[o._pos + i];
		} while (--i > 0);
		return this._arr[this._pos] <= o._arr[o._pos];
	}
	//#endregion

	/** Create a **copy** of internal value as a big-endian stream of bytes */
	toBytesBE(): Uint8Array {
		const ret = new Uint8Array(
			this._arr.slice(this._pos, this._pos + this.size32).buffer
		);
		asBE.bytes(ret, 4 * this.size32);
		return ret;
	}

	/**
	 * Get the least significant byte
	 * @throws Error if byteIdx is out of range
	 */
	getByte(byteIdx = 0): number {
		sNum('idx', byteIdx)
			.unsigned()
			.atMost(this.size32 * 4 - 1)
			.throwNot();
		const low = 8 * (byteIdx & 3); //Limit to 0-3, then convert to bytes (0,8,16,24)
		const shift = byteIdx >>> 2;
		return (this._arr[this._pos + shift] >>> low) & 0xff;
	}

	/** String version of this value, as hex, in big endian */
	toString(): string {
		return hex.fromBytes(this.toBytesBE());
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return this._name;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${this._name}(${this.toString()})`;
	}
}
