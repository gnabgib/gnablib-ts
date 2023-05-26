import * as intExt from '../primitive/IntExt.js';
import * as hex from '../encoding/Hex.js';
import { OutOfRangeError } from './ErrorExt.js';

const maxU32=0xffffffff;
const maxU16=0xffff;
const sizeBytes=16;
const sizeBits=sizeBytes<<3;

export type Uint128ish = Uint128|number;

export class Uint128 {
    #value:number;
    constructor(uint32:number) {
        this.#value=uint32>>>0;
    }

    get value():number {return this.#value;}

    xorEq(uint32:number|Uint32):Uint32 {
        let u:number;
        if (uint32 instanceof Uint32) {
            u=uint32.value;
        } else {
            u=uint32>>>0;
            if (u!=uint32) throw new OutOfRangeError('uint32',uint32,0,maxU32);
        }
        this.#value^=u;
        return this;
    }

    orEq(uint32:number):Uint32 {
        const u=uint32>>>0;
        if (u!=uint32) throw new OutOfRangeError('uint32',uint32,0,maxU32);
        this.#value|=uint32;
        return this;
    }

    andEq(uint32:number):Uint32 {
        const u=uint32>>>0;
        if (u!=uint32) throw new OutOfRangeError('uint32',uint32,0,maxU32);
        this.#value&=uint32;
        return this;
    }

    /**
	 * Invert each bit (0 becomes 1, 1 becomes 0)
	 */
    notEq():Uint32 {
        this.#value=~this.#value;
        return this;
    }

    /**
     * Rotate bits left
     * @param by 0-32 integer
     * @throws EnforceTypeError $by not an int
     * @throws OutOfRangeError $by <0 or >32
     */
    lRotEq(by:number):Uint32 {
        intExt.inRangeInclusive(by, 0, sizeBits);
        this.#value=(this.#value << by) | (this.#value >>> (sizeBits - by));
        return this;
    }

    /**
     * Shift bits left, zeros are brought in
     * @param by number 0-32
     * @returns self (chain)
     */
    lShiftEq(by:number):Uint32 {
        intExt.inRangeInclusive(by, 0, sizeBits);
        this.#value<<=by;
        return this;
    }

    /**
     * Rotate bits right
     * @param by 0-32 integer
     * @throws EnforceTypeError $by not an int
     * @throws OutOfRangeError $by <0 or >32
     */
    rRotEq(by:number):Uint32 {
        intExt.inRangeInclusive(by, 0, sizeBits);
	    this.#value=(this.#value >>> by) | (this.#value << (sizeBits - by));
        return this;
    }

    /**
     * Shift bits right, zeros are brought in
     * @param by number 0-32
     * @returns self (chain)
     */
    rShiftEq(by:number):Uint32 {
        intExt.inRangeInclusive(by, 0, sizeBits);
        this.#value>>>=by;
        return this;
    }

    addEq(uint32:number):Uint32 {
        const u=uint32>>>0;
        if (u!=uint32) throw new OutOfRangeError('uint32',uint32,0,maxU32);
        this.#value=(this.#value+uint32)&maxU32;
        return this;
    }

    mulEq(uint32:number):Uint32 {
        const u=uint32>>>0;
        if (u!=uint32) throw new OutOfRangeError('uint32',uint32,0,maxU32);

        const a0=this.#value & maxU16;
	    const a1=this.#value>>>16;
	    const b0=uint32 & maxU16;
	    const b1=(uint32>>>16)&maxU16;
	    const m0=a0*b0;
	    const c0=m0>>>16;
	    const m1=a0*b1+a1*b0+c0;
        this.#value=m0&maxU16 | ((m1&maxU16)<<16);
        return this;
    }

    toString(): string {
		return 'u32{' + hex.fromI32(this.#value) + '}';
	}

    static get max(): Uint32 {
		return new Uint32(maxU32);
	}

	static get min(): Uint32 {
		return zero;
	}

    static get zero(): Uint32 {
		return zero;
	}

    /**
	 * Coerce a Uint32 or number into a Uint32 if it isn't already
	 * @param value 
	 * @returns 
	 */
    static coerce(value:Uint32ish):Uint32 {
		if (value instanceof Uint32) {
			return value;
		} else {
			return new this(value);
		}        
    }
}
const zero=new Uint128(0);