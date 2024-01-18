/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { NotEnoughSpaceError } from '../../primitive/ErrorExt.js';
import { safety } from '../../primitive/Safety.js';
import { U64Mut } from '../../primitive/U64.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

// https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf
// - has an implementation mistake saying the key has two 06 bytes, when the second should be a 07

class Simon_32bit implements IBlockCrypt {
    constructor(
        readonly blockSize:number, 
        private readonly keySize:number, 
        private readonly rounds:number, key:Uint8Array) {
        safety.lenExactly(key,keySize,'key');        

        //keySchedule
        const c=0xfffffffc;
        const z=U64Mut.fromUint32Pair(0x192c0ef5,0x7369f885);
    }

    keySchedule(key:Uint8Array):void {}

    /**
	 * {@inheritDoc IBlockCrypt.encryptBlock}
	 *
	 * @throws {@link ../primitive/NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
     */
    encryptBlock(block: Uint8Array, offset=0): void {
        const byteStart=offset*this.blockSize;
        if (block.length<byteStart+this.blockSize) 
            throw new NotEnoughSpaceError('block.length',byteStart+this.blockSize,block.length);
        const b32 = new Uint32Array(block.buffer,byteStart,2);

        throw new Error('Method not implemented.');
    }

    decryptBlock(block: Uint8Array, offset=0): void {
        const byteStart=offset*this.blockSize;
        if (block.length<byteStart+this.blockSize) 
            throw new NotEnoughSpaceError('block.length',byteStart+this.blockSize,block.length);
        const b32 = new Uint32Array(block.buffer,byteStart,2);
    }


}

/**
 * [Simon](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 * 
 * First Published: *2013*  
 * Block Size: *4, 6, 8, 12, 16 bytes*  
 * Key size: *8, 9, 12, 16, 18, 24, 32*  
 * Rounds: *32, 36, 42, 44, 52, 54, 68, 69, 72*  
 * 
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon32 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(32/8, 64/8, 32, key);
    }
}
export class Simon48_72 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(48/8, 72/8, 36, key);
    }
}
export class Simon48_96 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(48/8, 96/8, 36, key);
    }
}
export class Simon64_96 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(64/8, 96/8, 42, key);
    }
}
export class Simon64_128 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(64/8, 128/8, 44, key);
    }
}
export class Simon96_96 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(96/8, 96/8, 52, key);
    }
}
export class Simon96_144 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(96/8, 144/8, 54, key);
    }
}
//u64:
export class Simon128_128 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(128/8, 128/8, 68, key);
    }
}
export class Simon128_192 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(128/8, 192/8, 69, key);
    }
}
export class Simon128_256 extends Simon_32bit {
    constructor(key:Uint8Array) {
        super(128/8, 256/8, 72, key);
    }
}
/**
 * [Speckn](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)))
 * 
 * Specified in:
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck {

}
