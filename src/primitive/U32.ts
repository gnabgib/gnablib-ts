import * as intExt from './IntExt.js';
import * as hex from '../encoding/Hex.js';
import { asE } from '../endian/platform.js';

const maxU32=0xffffffff;
const maxU16=0xffff;
const sizeBytes=4;
const sizeBits=32;
const rotMask=0x1f;

export type U32ish = U32|Uint32Array|number;


function coerceU32(uint32:U32ish):number {
    if (uint32 instanceof U32) {
        return uint32.value;
    } else if (uint32 instanceof Uint32Array) {
        return uint32[0];
    } else {
        intExt.inRangeInclusive(uint32, 0, maxU32,'uint32');
        return uint32;
    }        
}

function xor(a:Uint32Array,b:U32ish):number {return a[0]^coerceU32(b);}
function or(a:Uint32Array,b:U32ish):number {return a[0]|coerceU32(b);}
function and(a:Uint32Array,b:U32ish):number {return a[0]&coerceU32(b);}
function shl(v:Uint32Array,by:number):number {intExt.inRangeInclusive(by, 0, sizeBits);return v[0]<<by;}
function shr(v:Uint32Array,by:number):number {intExt.inRangeInclusive(by, 0, sizeBits);return v[0]>>>=by;}
function add(a:Uint32Array,b:U32ish):number {return a[0]+coerceU32(b);}
function sub(a:Uint32Array,b:U32ish):number {return a[0]-coerceU32(b);}
function mul(a:Uint32Array,b:U32ish):number {
    const _b=U32Mut.coerce(b).value;
    //Can merge a1+a0 actions since JS supports 51 bits and at most 32x16 would need 48bits
	const b0=_b & maxU16;
	const b1=(_b>>>16)&maxU16;
    // a*b0 = [a1*b0 | a0*b0]
    // a*b1 = [a1*b1 | a1*b0]
    return (a[0]*b0 + ((a[0]*b1)<<16));
}

/**
 * Treat i32 as a signed/unsigned 32bit number, and rotate left
 * NOTE: JS will sign the result, (fix by `>>>0`)
 * NOTE: If you're using with UInt32Array you don't need to worry about sign
 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
 * @param by amount to rotate 0-31 (%32 if oversized)
 * @returns Left rotated number, NOTE you may wish to `>>>0`
 */
export function rol32(i32:number,by:number):number {
    //No need to truncate input (bitwise is only 32bit)
    by&=rotMask;
    return (i32 << by) | (i32 >>> (sizeBits - by));
}

/**
 * Treat i32 as a signed/unsigned 32bit number, and rotate right
 * NOTE: JS will sign the result, (fix by `>>>0`)
 * NOTE: If you're using with UInt32Array you don't need to worry about sign
 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
 * @param by amount to rotate 0-31 (%32 if oversized)
 * @returns Right rotated number 
 */
export function ror32(i32:number,by:number):number {
    //No need to truncate input (bitwise is only 32bit)
    by&=rotMask;
    return (i32 >>> by) | (i32 << (sizeBits - by));
}

/**
 * U32/U32Mut are designed to be projections down onto a Uint32Array
 * - when built from a number a new one element array is built
 * - when built from a buffer or array, the memory is linked, which brings the risk of external changes, but
 *   the benefit of reduced memory allocation
 * 
 * U32 cannot be mutated in place (doesn't support an *Eq methods), however
 *  if it's generated from a buffer or array external process can mutate
 * 
 * U32Mut has memory allocation benefits (when using *Eq methods) since it doesn't allocate for each op,
 *  the best pattern is manually cloning (.mut for either, .clone for U32Mut) and the *Eq() methods whereever possible
 */

export class U32 {
    protected v:Uint32Array;
    protected constructor(data:ArrayBuffer,pos=0) {
        this.v=new Uint32Array(data,pos,1);
    }

    get value():number {return this.v[0];}

    /**
     * @see value ⊕ @param uint32
     * @param uint32 number 0-0xffffff, or Uint32, or first el of Uint32Array
     * @returns @see value ⊕ @param uint32
     */
    xor(uint32:U32ish):U32 {
        return U32.fromIntUnsafe(xor(this.v,uint32));
    }

    /**
     * @see value ∨ @param uint32
     * @param uint32 number 0-0xffffff, or Uint32, or first el of Uint32Array
     * @returns @see value ∨ @param uint32
     */
    or(uint32:U32ish):U32 {
        return U32.fromIntUnsafe(or(this.v,uint32));
    }

    /**
     * @see value ∧ @param uint32
     * @param uint32 number 0-0xffffff, or Uint32, or first el of Uint32Array
     * @returns @see value ∧ @param uint32
     */
    and(uint32:U32ish):U32 {
        return U32.fromIntUnsafe(and(this.v,uint32));
    }

    /**
     * ¬ @see value
     * @returns ¬ @see value
     */
    not():U32 {
        return U32.fromIntUnsafe(~this.v[0]);
    }

    /**
     * @see value ROL @param by
     * @param by Integer 0-31
     * @returns @see value ROL @see param
     */
    lRot(by:number):U32 {
        return U32.fromIntUnsafe(rol32(this.v[0],by));
    }

    /**
     * @see value << @param by - zeros are brought in
     * @param by integer 0-32
     * @returns @see value << @param by
     */
    lShift(by:number):U32 {
        return U32.fromIntUnsafe(shl(this.v,by));
    }

    /**
     * @see value ROR @param by
     * @param by integer 0-31
     * @returns @see value ROR  @param by
     */
    rRot(by:number):U32 {
        return U32.fromIntUnsafe(ror32(this.v[0],by));
    }

    /**
     * @see value >> @param by - zeros are brought in
     * @param by integer 0-32
     * @returns @see value >> @param by
     */
    rShift(by:number):U32 {
        return U32.fromIntUnsafe(shr(this.v,by));
    }

    /**
     * @see value + @param uint32
     * @param uint32 number 0-0xffffff, or Uint32, or first el of Uint32Array
     * @returns @see value + @param uint32
     */
    add(uint32:U32ish):U32 {
        return U32.fromIntUnsafe(add(this.v,uint32));
    }

    /**
     * @see value * @param uint32
     * @param uint32 number 0-0xffffff, or Uint32, or first el of Uint32Array
     * @returns @see value * @param uint32
     */
    mul(uint32:U32ish):U32 {
        return U32.fromIntUnsafe(mul(this.v,uint32));
    }

    /**
     * Create a copy of this Uint32 (also possible with `Uint32.coerce(this)`)
     * @returns 
     */
    clone():U32 {
        const cpy=this.v.slice(0,1);
        return new U32(cpy.buffer,cpy.byteOffset);
    }

    /**
     * Mutate - create a new Uint32Mut with a copy of this value
     */
    mut():U32Mut {
        return U32Mut.fromArray(this.v.slice(0,1));
    }

    toString(): string {
		return 'u32{' + hex.fromI32(this.v[0]) + '}';
	}

    /**
     * Get a *copy* of the internal state as bytes (O)
     * @returns 
     */
    toBytes():Uint8Array {
        const cpy=this.v.slice(0,1);
        return new Uint8Array(cpy.buffer,cpy.byteOffset);
    }

    /**
     * Build a Uint32 from an integer - there's no range check (JS default) so:
     * - Oversized numbers will be truncated
     * - Negative numbers will be treated as large (2s compliment)
     * @param uint32 
     * @returns 
     */
    static fromIntUnsafe(uint32:number):U32 {
        return new U32(Uint32Array.of(uint32).buffer,0);   
    }

    /**
     * Build a Uint32 from an integer
     * @param uint32 Integer 0-0xFFFFFFFF (4294967295)
     * @returns 
     */
    static fromInt(uint32:number):U32 {
        intExt.inRangeInclusive(uint32, 0, maxU32,'uint32');
        return new U32(Uint32Array.of(uint32).buffer,0);   
    }

    /**
     * Created a "view" into an existing Uint32Array
     * **NOTE** the memory is shared, changing a value in @param source will mutate the state
     * @param source
     * @param pos Position to link (default 0), note this is an array-position not bytes
     * @returns 
     */
    static fromArray(source:Uint32Array,pos=0):U32 {
        return new U32(source.buffer,source.byteOffset+pos*sizeBytes);
    }

    /**
     * Build a Uint32 from a byte array
     * **NOTE** This uses the endianness of the platform (varies but generally little endian)
     * @param source Source bytes, platform endianness
     * @param pos Position in the byte stream to consume (pos%4 must =0)
     * @returns 
     */
    static fromBytes(source:Uint8Array,pos=0):U32 {
        return new U32(source.buffer,source.byteOffset+pos);
    }

    /**
     * A new Uint32 with value 4294967295 (the maximum uint32)
     */
    static get max(): U32 {
        return max;
	}

    /**
     * A new Uint32 with value 0 (the minimum uint32)
     */
	static get min(): U32 {
        return zero;
	}

    /**
     * A new Uint32 with value 0
     */
    static get zero():U32 {
        return zero;
    }

    /**
     * Given a number create a new Uint32 (will throw if <0 >0xffffffff)
     * Given a Uint32Array link to the first element (linked memory)
     * Given a Uint32 return it
     * 
     * If you have a Uint32Array and want something beyond the first element (index 0)
     * @see fromArray
	 * @param uint32 
	 * @returns 
	 */
    static coerce(uint32:U32ish):U32 {
		if (uint32 instanceof U32) {
			return uint32;
        } else if (uint32 instanceof Uint32Array) {
            return new U32(uint32.buffer,uint32.byteOffset);
		} else {
            intExt.inRangeInclusive(uint32, 0, maxU32,'uint32');
            return new U32(Uint32Array.of(uint32),0);
		}        
    }
}
const zero=U32.fromIntUnsafe(0);
const max=U32.fromIntUnsafe(0xffffffff);

export class U32Mut extends U32 {
    //For some reason we have to redefine the getter here (it doesn't inherit from Uint32) - can't find an
    // MDN doc that explains this behaviour
    get value():number {return this.v[0];}
    set value(uint32:number) {
        intExt.inRangeInclusive(uint32, 0, maxU32);
        this.v[0]=uint32;
    }

    /**
     * @see value ⊕= @param uint32
     * @param uint32 number 0-0xffffff, or Uint32Mut, or first el of Uint32Array
     * @returns this (chainable)
     */
    xorEq(uint32:U32ish):U32Mut {
        this.v[0]=xor(this.v,uint32);
        return this;
    }

    /**
     * @see value ∨= @param uint32
     * @param uint32 number 0-0xffffff, or Uint32Mut, or first el of Uint32Array
     * @returns this (chainable)
     */
    orEq(uint32:U32ish):U32Mut {
        this.v[0]=or(this.v,uint32);
        return this;
    }

    /**
     * @see value ∧= @param uint32
     * @param uint32 number 0-0xffffff, or Uint32Mut, or first el of Uint32Array
     * @returns this (chainable)
     */
    andEq(uint32:U32ish):U32Mut {
        this.v[0]=and(this.v,uint32);
        return this;
    }

    /**
     * ¬= @see value
     * @returns this (chainable)
	 */
    notEq():U32Mut {
        this.v[0]=~this.v[0];
        return this;
    }

    /**
     * @see value ROL @param by
     * @param by integer 0-32
     * @returns this (chainable)
     */
    lRotEq(by:number):U32Mut {
        this.v[0]=rol32(this.v[0],by);
        return this;
    }

    /**
     * @see value <<= @param by - zeros are brought in
     * @param by integer 0-32
     * @returns this (chainable)
     */
    lShiftEq(by:number):U32Mut {
        this.v[0]=shl(this.v,by);
        return this;
    }

    /**
     * @see value ROR @param by
     * @param by integer 0-31
     * @returns this (chainable)
     */
    rRotEq(by:number):U32Mut {
        this.v[0]=ror32(this.v[0],by);
        return this;
    }

    /**
     * @see value >>= @param by - zeros are brought in
     * @param by integer 0-32
     * @returns this (chainable)
     */
    rShiftEq(by:number):U32Mut {
        this.v[0]=shr(this.v,by);
        return this;
    }

    /**
     * @see value += @param uint32
     * @param uint32 number 0-0xffffff, or Uint32Mut, or first el of Uint32Array
     * @returns this (chainable)
     */
    addEq(uint32:U32ish):U32Mut {
        this.v[0]=add(this.v,uint32);
        return this;
    }

    /**
     * @see value *= @param uint32
     * @param uint32 number 0-0xffffff, or Uint32Mut, or first el of Uint32Array
     * @returns this (chainable)
     */
    mulEq(uint32:U32ish):U32Mut {
        this.v[0]=mul(this.v,uint32);
        return this;
    }

    clone():U32Mut {
        const cpy=this.v.slice(0,1);
        return new U32Mut(cpy.buffer,cpy.byteOffset);
    }

    /**
     * Build a Uint32 from an integer - there's no range check (JS default) so:
     * - Oversized numbers will be truncated
     * - Negative numbers will be treated as large (2s compliment)
     * @param uint32 
     * @returns 
     */
    static fromIntUnsafe(uint32:number):U32Mut {
        return new U32Mut(Uint32Array.of(uint32).buffer,0);   
    }
    
    /**
     * Build a Uint32 from an integer
     * @param uint32 Integer 0-0xFFFFFFFF (4294967295)
     * @returns 
     */
    static fromInt(uint32:number):U32Mut {
        intExt.inRangeInclusive(uint32, 0, maxU32,'uint32');
        return new U32Mut(Uint32Array.of(uint32).buffer,0);   
    }

    /**
     * Created a "view" into an existing Uint32Array
     * **NOTE** the memory is shared, changing a value in @param source will mutate the return, and
     *  changes to the Uint32Mut will alter the @param source
     * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
     * @param source
     * @param pos Position to link (default 0), note this is an array-position not bytes
     * @returns 
     */
    static fromArray(source:Uint32Array,pos=0):U32Mut {
        return new U32Mut(source.buffer,source.byteOffset+pos*sizeBytes);
    }

    /**
     * Build a Uint32Mut from a byte array
     * **NOTE** This uses the endianness of the platform (varies but generally little endian)
     * @param source Source bytes, platform endianness
     * @param pos Position in the byte stream to consume (pos%4 must =0)
     * @returns 
     */
    static fromBytes(source:Uint8Array,pos=0):U32Mut {
        return new U32Mut(source.buffer,source.byteOffset+pos);
    }

    /**
     * Create a view into an ArrayBuffer.  Note this relies on platform endian (likely little endian)
     * **NOTE** Memory is shared (like @see fromArray)
     * **NOTE** Subject to the same JS limitation that bytePos must be a multiple of element-size (4)
     * @param source 
     * @param bytePos 
     * @returns 
     */
    static fromBuffer(source:ArrayBuffer,bytePos=0):U32Mut {
        return new U32Mut(source,bytePos);
    }

    /**
     * Given a number create a new Uint32Mut (will throw if <0 >0xffffffff)
     * Given a Uint32Array link to the first element (linked memory)
     * Given a U32 mutate it (memory copy)
     * 
     * If you have a Uint32Array and want something beyond the first element (index 0)
     * @see fromArray
	 * @param uint32 
	 * @returns 
	 */
    static coerce(uint32:U32ish):U32Mut {
		if (uint32 instanceof U32) {
            return uint32.mut();
        } else if (uint32 instanceof Uint32Array) {
            return new U32Mut(uint32.buffer,uint32.byteOffset);
		} else {
            intExt.inRangeInclusive(uint32, 0, maxU32,'uint32');
            return new U32Mut(Uint32Array.of(uint32),0);
		}        
    }
}

export class U32MutArray {
    [index: number]: U32Mut;

    protected a:Array<U32Mut>;
    protected constructor(a:Array<U32Mut>) {
        this.a=a;
        return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return target[prop as any];
				}

				// @ts-expect-error:  if prop is wrong, this still returns undefined, which works fine
				return target.at(prop);
			},
			set(target, prop, value): boolean {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					target[prop as any] = value;
					return true;
				}
				const u = intExt.strictParseDecUint((prop as string) ?? '');
				if (u !== undefined) {
					target.setEl(u, value);
					return true;
				}
				return false;
			},
		});
    }

    get length():number {
        return this.a.length;
    }

    /**
	 * Get the item at given index, if negative it's used as the distance
	 * back from the end (-1 will return the last element).
	 * @param idx -length - length-1
	 * @returns Element at position, or undefined if `index` is out of range
	 */
	at(idx: number): U32Mut | undefined {
		if (idx < 0) idx += this.a.length;
		if (idx < 0 || idx >= this.a.length) return undefined;
		return this.a[idx];
	}

    /**
	 * Set the value at `idx`
	 * NOTE: The value is truncated, so
	 * @param idx
	 * @param value
	 */
	setEl(idx: number, value: U32ish): void {
        this.a[idx].value=coerceU32(value);
	}

    static fromLen(len:number):U32MutArray {
        const mem=new Uint32Array(len);
        const els=new Array<U32Mut>(len);
        for(let i=0;i<len;i++) els[i]=U32Mut.fromArray(mem,i);
        return new U32MutArray(els);
    }

    static fromArray(arr:Uint32Array,start=0,len=-1):U32MutArray {
        if (len<0) len=arr.length-start;
        const els=new Array<U32Mut>(len);
        for(let i=0;i<len;i++) els[i]=U32Mut.fromArray(arr,start++);
        return new U32MutArray(els);
    }

    static fromBytes(b:Uint8Array,isBE:boolean,startEl=0,lenEls=-1):U32MutArray {
        if (lenEls<0) lenEls=(b.length/sizeBytes)-startEl;
        const els=new Array<U32Mut>(lenEls);
        for(let i=0;i<lenEls;i++) {
            asE(isBE).i32(b,i*sizeBytes+startEl);
            els[i]=U32Mut.fromBytes(b,i*sizeBytes+startEl);//fromArray(arr,startEl++);
        }
        return new U32MutArray(els);
    }
}


//const zero=new Uint32Mut(0);