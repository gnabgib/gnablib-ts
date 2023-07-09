import { InvalidLengthError } from "../../primitive/ErrorExt.js";
import { U32 } from "../../primitive/U32.js";
import { uint8ArrayExt } from "../../primitive/UInt8ArrayExt.js";
import { ICrypt } from "../sym/ICrypt.js";
import { IBlockMode } from "./IBlockMode.js";

export interface ICountMode extends Iterable<Uint8Array> {
    /** Length of hte counter block (in bytes) */
    get length():number;
}

export class IncrBytes implements ICountMode {
    private readonly _iv:Uint8Array;
    
    /**
     * Increment IV by 1 after each round
     * @param iv initialization vector - final counter will be this size
     */
    constructor(iv:Uint8Array) {
        this._iv=iv;
    }

    get length():number {
        return this._iv.length;
    }

    [Symbol.iterator](): Iterator<Uint8Array> {
        //Runtime copy of IV
        const run=this._iv.slice();
        return {
            next():IteratorResult<Uint8Array> {
                //Return (we want it in new memory)
                const ret=run.slice();
                uint8ArrayExt.incrBE(run);
                return {
                    done:false,
                    value:ret
                }
            }
        }
    }
}

export class Concat32 implements ICountMode {
    private readonly _iv:Uint8Array;
    private readonly _count:number;

    /**
     * Build a counter out of `IV`+(count in 4 bytes)
     * @param iv initialization vector - final counter will be this size + 4
     * @param count Starting count (default 0)
     */
    constructor(iv:Uint8Array,count=0) {
        this._iv=iv;
        this._count=count;
    }

    get length():number {
        return this._iv.length+4;
    }

    [Symbol.iterator](): Iterator<Uint8Array> {
        //Runtime copy of IV
        const run=new Uint8Array(this._iv.length+4);
        let count=this._count;
        const offset=this._iv.length;
        run.set(this._iv);
        return {
            next():IteratorResult<Uint8Array> {
                run.set(U32.toBytesBE(count++),offset);
                return {
                    done:false,
                    value:run.slice()
                }
            }
        }
    }
}

/**
 * [Counter (CTR)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR))
 * 
 * Counter (CTR) mode turns a block cipher into a stream cipher. 
 * It generates the next keystream block by encrypting successive values of a "counter". 
 * The counter can be any function which produces a sequence which is guaranteed not to repeat 
 * for a long time, although an actual increment-by-one counter is the simplest and most popular.
 * 
 * Also known as: integer counter mode (ICM), segmented integer counter (SIC) mode
 * 
 * Parallelizable encryption: **Yes**  
 * Parallelizable decryption: **Yes**  
 * Random Read Access: **Yes**  
 * 
 * Specified in 
 * [NIST 800-38A](http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf)
 */
export class Ctr implements IBlockMode {
    private readonly _crypt: ICrypt;
    private readonly _counter:ICountMode;

    /**
     * Build a new Counter based block algo using the given algo and counter method
     * @param crypt Block encryption/decryption algorithm
     * @param counter Counter method
     */
    constructor(crypt: ICrypt, counter:ICountMode) {
        this._crypt = crypt;
        this._counter=counter;
        if (counter.length!=crypt.blockSize)
            throw new InvalidLengthError('counter.length',`to be ${crypt.blockSize}`,''+counter.length);
    }

    get blockSize(): number {
        return this._crypt.blockSize;
    }

    decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		const bsb = this._crypt.blockSize;
        const rem = enc.length % bsb;
		const safeLen = enc.length - rem;

        plain.set(enc);
        let ptr = 0;
        //const gen=this.gen();
        for (const eBlock of this._counter) {
            if (ptr<safeLen) {
                this._crypt.encryptBlock(eBlock);
                for (let i=0;i<bsb;i++) plain[ptr+i] ^=eBlock[i];
                ptr += bsb;
                continue;
            }
            if (rem>0) {
                this._crypt.encryptBlock(eBlock);
                for (let i=0;i<rem;i++) plain[ptr+i] ^=eBlock[i];
            }
            break;
        }
    }

    encryptInto(enc: Uint8Array, plain: Uint8Array): void {
        const bsb = this._crypt.blockSize;
		const rem = plain.length % bsb;
		const safeLen = plain.length - rem;

		enc.set(plain);

		let ptr = 0;
        //const gen=this.gen();
        for (const eBlock of this._counter) {
            if (ptr<safeLen) {
                this._crypt.encryptBlock(eBlock);
                for (let i=0;i<bsb;i++) enc[ptr+i] ^=eBlock[i];
                ptr += bsb;
                continue;
            }
            if (rem>0) {
                this._crypt.encryptBlock(eBlock);
                for (let i=0;i<rem;i++) enc[ptr+i] ^=eBlock[i];
            }
            break;
        }
    }

    encryptSize(plainLen: number): number {
        //No padding is required
        return plainLen;
    }
}
