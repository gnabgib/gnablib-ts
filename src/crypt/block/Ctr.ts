import { InvalidLengthError } from "../../primitive/ErrorExt.js";
import { ICrypt } from "../sym/ICrypt.js";
import { IBlockMode } from "./IBlockMode.js";

export enum CountMode {
    /** Increment IV by 1 after each round, IV should be `blockSize` bytes */
    Incr,
    /** Concatenate IV with a 4 byte counter, IV should be `blockSize-4` bytes  */
    Concat32,
}

/**
 * [Counter (CTR)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Counter_(CTR))
 * 
 * Counter (CTR) mode turns a block cipher into a stream cipher. 
 * It generates the next keystream block by encrypting successive values of a "counter". 
 * The counter can be any function which produces a sequence which is guaranteed not to repeat 
 * for a long time, although an actual increment-by-one counter is the simplest and most popular.
 * 
 * See {@link Ctr.incrIv} for a counter based on an IV/nonce that increments by 1 after each round
 * See {@link Ctr.concat32} for a counter based on the concatenation of an IV/nonce with 4 bytes holding size
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
    private readonly _iv:Uint8Array;
    private readonly _mode:CountMode;

    constructor(crypt: ICrypt, iv:Uint8Array, mode:CountMode) {
        this._crypt = crypt;
        this._iv=iv;
        this._mode=mode;
        if (mode === CountMode.Incr) {
            if (iv.length!=crypt.blockSize)
                throw new InvalidLengthError('iv.length',`to be ${crypt.blockSize}`,''+iv.length);
        } else {
            if (iv.length+4!=crypt.blockSize)
                throw new InvalidLengthError('iv.length',`to be ${crypt.blockSize-4}`,''+iv.length);
        }
    }

    /** Increment an arbitrarily large set of bytes by one big-endian with wrap around  */
    private static _incrBytes(b:Uint8Array):void {
        let ptr=b.length-1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            b[ptr]+=1;
            //Detect byte-overflow
            if (b[ptr]==0) {
                ptr=(ptr-1)%b.length;
            } else break;
        }
    }

    /**
     * Increment `iv` by 1 after each round.
     * **NOTE** The IV must be random to prevent breaking security
     * @param iv Initialization vector/nonce, should same number of bytes as `blockSize`
     */
    private static* incrIv(iv:Uint8Array):Iterable<Uint8Array> {
        //Copy the IV
        const start=iv.slice();
        while (true) {
            yield start.slice();
            Ctr._incrBytes(start);
        }
    }

    /**
     * Concatenate the `iv` with a 32 bit incrementing counter
     * **NOTE** Should only be used 4294967296 times (2**32)
     * @param iv Initialization vector/nonce, should same 4 bytes less than `blockSize`
     * @param incr Increment amount (default 1)
     */
    private static* concat32(iv:Uint8Array):Iterable<Uint8Array> {
        const start=new Uint8Array(iv.length+4);
        start.set(iv);
        while (true) {
            yield start.slice();
            //Only increment the last 4 bytes
            Ctr._incrBytes(start.subarray(iv.length));
        }
    }

    private gen():Iterable<Uint8Array> {
        if (this._mode===CountMode.Incr){
            return Ctr.incrIv(this._iv);
        } else {
            return Ctr.concat32(this._iv);
        }
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
        const gen=this.gen();
        for (const eBlock of gen) {
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
        const gen=this.gen();
        for (const eBlock of gen) {
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
