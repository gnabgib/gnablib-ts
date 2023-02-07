import { NotSupported } from './ErrorExt';
import {  strictParseDecUint } from './IntExt';

const defaultCap=4;
const linearSwitch=0x100000;
const emptyByteArray=new Uint8Array(0);

export class ScalingByteArray {
    private _locked=false;
	private _arr: Uint8Array;
    private _length:number;

	[index: number]: number;

	private static indexedHandler: ProxyHandler<ScalingByteArray> = {
		get(target, prop: string | symbol) {
			if (prop in target) {
				return target[prop as any];
			}

			// @ts-expect-error:  if prop is wrong, this still returns undefined, which works fine
            return target.at(prop);
            //return target._arr[prop];
			// const u=strictParseDecUint(prop as string??'')
			// if (u===undefined) return undefined;
			// return target._ba[u];
		},
		set(target, prop: string | symbol, value): boolean {
            if (prop in target) {
                target[prop as any]=value;
                return true;
            }
            const u=strictParseDecUint(prop as string??'')
            if (u!==undefined) {
                target.safeSet(u,value);
                return true;    
            }
            return false;
		},
	};

	constructor(length: number) {
		//Don't allow import of Buffer/Uint8Array because external mutation risk
        const trueLen=ScalingByteArray._goodSize(length);
        this._length=length;
        //this._buf=new ArrayBuffer(trueLen);
		this._arr = new Uint8Array(trueLen);
		return new Proxy(this, ScalingByteArray.indexedHandler);
	}

    /**
     * Find the next power of 2 that's at least `v` in magnitude
     * @param v 
     * @returns 
     */
    private static _nextPow2(v:number):number {
        //http://graphics.stanford.edu/%7Eseander/bithacks.html#RoundUpPowerOf2
        const start=v;
        if (v===0) return defaultCap;
        v--;
        v |= v >> 1;
        v |= v >> 2;
        v |= v >> 4;
        v |= v >> 8;
        v |= v >> 16;
        //console.log(`nextpow2 ${start} ${v+1}`);
        return v+1;
    }

    /**
     * When <1MB use powers of 2 to allocate memory, after that use nearest 1MB alignment (that's larger)
     * @param v 
     * @returns 
     */
    private static _goodSize(v:number):number {
        //After 1M (1<<21) let's linear increase size (vs exponent)
        if (v===0) return defaultCap;
        if (v<linearSwitch) {
            return ScalingByteArray._nextPow2(v);
        } else {
            //Round up to next multiple of linearSwitch to accommodate v
            return (v+linearSwitch)/linearSwitch;
        }
    }

    /**
	 * Shrink or enlarge the buffer, to `sizeBytes`
	 * WARN: Does MALLOC/DEALLOC/data copy (use sparingly) - calling this unnecessarily will bring demons
	 * @param sizeBytes Number of bytes the new buffer should be
	 */
	private _resize(sizeBytes: number) {
        if (this._locked) throw new NotSupported("This array is locked");
		const newB = new ArrayBuffer(sizeBytes);
		var dst = new Uint8Array(newB);
		dst.set(this._arr);
		this._arr = dst;
	}

    /**
	 * Make sure there is at least requiredBytes of space
	 * in the buffer currently, otherwise enlarge
	 * @param requiredLen
	 */
	private _assertSpace(requiredLen: number) {
        //If we have enough length.. we're good
        if (this._length>requiredLen) return;

        //Otherwise adjust the length
        this._length=requiredLen+1;

        //If we have enough capacity.. we're good
        if (this._arr.length>requiredLen) return;

        //Finally, adjust capacity if now required
        this._resize(ScalingByteArray._goodSize(requiredLen));
    }

	/**
	 * The size in bytes of each element in the array.
	 */
	get BYTES_PER_ELEMENT(): number {
		return 1;
	}

	/**
	 * The length in bytes of the array.
	 */
	get byteLength(): number {
		return this._length;
	}

	/**
	 * The offset in bytes of the array.
	 */
	get byteOffset(): number {
		//In this implementation this can only be zero
		return 0;
		//return this._ba.byteOffset;
	}

	/**
	 * The length of the array.
	 */
	get length(): number {
		return this._length;
	}

    /**
     * Get capacity, which will always be >=@see length
     * Any capacity beyond the length is allocated in memory and can be @see set or @see safeSet
     */
    get capacity(): number {
        return this._arr.length;
    }
    /**
     * Set capacity, if different from current this will reallocate the memory
     * to an array of the new size (larger or smaller)
     * NOTE: If smaller this will truncate data to `0..capacity`
     * NOTE: If larger this will extend array with empty bytes, but not change the @see length
     */
    set capacity(value:number) {
        //A capacity change doesn't change length
        if (value!=this._arr.length) {
            this._resize(value);
        }
    }

	/**
	 * Get the item at given index, if negative it's used as the distance
	 * back from the end (-1 will return the last element).
	 * @param idx -length - length-1
	 * @returns Element at position, or undefined if `index` is out of range
	 */
	at(idx: number): number | undefined {
		if (idx < 0) idx += this._length;
		if (idx < 0 || idx >= this._length) return undefined;
		return this._arr[idx];
	}

    /**
     * Set the byte at `idx` to `byte`
     * NOTE: The value is truncated, so 
     * @param idx 
     * @param byte 
     */
    safeSet(idx:number,byte:number):void {
        this._assertSpace(idx);
        this._arr[idx]=byte;
    }

    /**
     * Returns an array of key, value pairs for every entry in the array
     * @returns 
     */
    entries(): IterableIterator<[number, number]> {
        return this._arr.slice(0,this._length).entries();
	}
    
    /**
     * Determines whether all the members of an array satisfy the specified test
     * @param predicate A function that accepts up to three arguments. The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     */
    every(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): boolean {
        return this._arr.slice(0,this._length).every(predicate,thisArg);
	}

	/**
	 * Changes all array elements from start to end index to a static value and returns the modified array
	 * @param value — value to fill array section with
	 * @param start index to start filling the array at. If start is negative, it is treated as length+start where length is the length of the array.
	 * @param end index to stop filling the array at. If end is negative, it is treated as length+end.
	 * @returns
	 */
	fill(
		value: number,
		start?: number | undefined,
		end?: number | undefined
	): ScalingByteArray {
		this._arr.slice(0,this._length).fill(value, start, end);
		return this;
	}

	/**
	 * Returns the index of the first element in the array where predicate is true, and -1 otherwise.
	 * @param predicate find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, findIndex immediately returns that element index. Otherwise, findIndex returns -1.
	 * @param thisArg If provided, it will be used as the this value for each invocation of predicate. If it is not provided, undefined is used instead.
	 * @returns
	 */
	findIndex(
		predicate: (value: number, index: number, obj: Uint8Array) => boolean,
		thisArg?: any
	): number {
		return this._arr.slice(0,this._length).findIndex(predicate, thisArg);
	}

    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement — The element to search for.
     * @param fromIndex — The position in this array at which to begin searching for searchElement.
     * @returns 
     */
    includes(searchElement: number, fromIndex?: number | undefined): boolean {
        return this._arr.slice(0,this._length).includes(searchElement,fromIndex);
	}

	/**
	 * Returns the index of the first occurrence of a value in an array.
	 * @param searchElement — The value to locate in the array.
	 * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
	 * @returns
	 */
	indexOf(searchElement: number, fromIndex?: number | undefined): number {
		return this._arr.slice(0,this._length).indexOf(searchElement, fromIndex);
	}

    /**
     * Returns the index of the last occurrence of a value in an array.
     * @param searchElement — The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     * @returns 
     */
    lastIndexOf(searchElement: number, fromIndex?: number | undefined): number {
        return this._arr.slice(0,this._length).lastIndexOf(searchElement,fromIndex);
	}

    /**
     * Returns an list of keys in the array
     * @returns 
     */
    keys(): IterableIterator<number> {
        return this._arr.slice(0,this._length).keys();
	}


	/**
	 * Performs the specified action for each element in an array.
	 * @param callbackfn A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
	 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
	 */
	forEach(
		callbackfn: (value: number, index: number, array: Uint8Array) => void,
		thisArg?: any
	): void {
		this._arr.slice(0,this._length).forEach(callbackfn, thisArg);
	}

	/**
	 * Reverses the elements in an Array in place
	 * @returns
	 */
	reverse(): Uint8Array {
		return this._arr.slice(0,this._length).reverse();
	}

    /**
     * Sets a value or an array of values.  If the underlying buffer is too small, it will scale
     * @param array — A typed or untyped array of values to set.
     * @param offset — The index in the current array at which the values are to be written.
     */
	set(array: ArrayLike<number>, offset?: number | undefined): void {
        this._assertSpace((offset??0)+array.length);
		this._arr.set(arguments, offset);
	}

    /**
     * Returns a section of an array, note this locks the buffer (preventing further resize)
     * @param start — The beginning of the specified portion of the array.
     * @param end — The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
     * @returns 
     */
	slice(start?: number | undefined, end?: number | undefined): Uint8Array {
        this._locked=true;
        return this._arr.slice(start,end);
	}

    /**
     * Determines whether the specified callback function returns true for any element of an array.
     * @param predicate A function that accepts up to three arguments. The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value true, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
     * @returns 
     */
    some(predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): boolean {
        return this._arr.slice(0,this._length).some(predicate,thisArg);
	}

	toString(): string {
        return this._arr.slice(0,this._length).toString();
	}

	values(): IterableIterator<number> {
        return this._arr.slice(0,this._length).values();
	}

	[Symbol.iterator](): IterableIterator<number> {
		return this._arr.slice(0,this._length)[Symbol.iterator]();
	}

	get [Symbol.toStringTag](): string {
		return 'ScalingByteArray'; //"Uint8Array"
	}

	//

	
}