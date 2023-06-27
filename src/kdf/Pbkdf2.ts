/*! Copyright 2023 gnabgib MPL-2.0 */

//import { hex } from "../encoding/Hex.js";
import { utf8 } from "../encoding/Utf8.js";
import type { IHash } from "../hash/IHash.js";
import { Sha1 } from "../hash/Sha1.js";
import { Sha256, Sha512 } from "../hash/Sha2.js";
import { Hmac } from "../mac/Hmac.js";
import { safety } from "../primitive/Safety.js";
import { U32 } from "../primitive/U32.js";

//(PKCS #5: Password-Based Cryptography Specification Version 2.1)[https://www.rfc-editor.org/rfc/rfc8018] (2017)
//(Wiki: PBKDF2)[https://en.wikipedia.org/wiki/PBKDF2]
// RFC 8018 (2017), 6070 (2011) 2898 (2000)

/**
 * Generate a key from a password
 * @param hash Underlying hash to use (within an HMAC construct)
 * @param password string (will be utf8 encoded) or bytes
 * @param salt string (will be utf8 encoded) or bytes
 * @param count Number of iterations, in 2000 this was 1000, in 2005: 4096, 2023: 600000 (SHA256), 210000 (SHA512)
 * @param keySize Desired bit-length of the resulting key 
 */
export function pbkdf2(hash:IHash,password:Uint8Array|string,salt:Uint8Array|string,count:number,keySize:number):Uint8Array {
    //  PBKDF2 (<PRF>, P, S, c, dkLen)
    safety.intInRangeInc(keySize,1,0xffffffff,'keySize');
    safety.intGte(count,1,'count');//Lock the original value as the minimum complexity
    const pBytes=password instanceof Uint8Array?password:utf8.toBytes(password);
    const sBytes=salt instanceof Uint8Array?salt:utf8.toBytes(salt);
    const n=Math.ceil(keySize/hash.size);
    const ret=new Uint8Array(n*hash.size);
    const hmac=new Hmac(hash,pBytes);
    
    let ptr=0;
    for(let i=1;i<=n;i++) {
        hmac.write(sBytes);
        hmac.write(U32.toBytesBE(i));
        const u=hmac.sumIn();
        hmac.reset();
        let ui=u;
        for(let j=1;j<count;j++) {
            hmac.write(ui);
            ui=hmac.sumIn();
            hmac.reset();
            //Xor round-u into total-u
            for(let b=0;b<ui.length;b++) u[b]^=ui[b];
        }
        ret.set(u,ptr);
        ptr+=hash.size;
    }
    return ret.subarray(0,keySize);
}

/** Generate a key from a password using HMAC-SHA1 */
export function pbkdf2_hmac_sha1(password:Uint8Array|string,salt:Uint8Array|string,count:number,keySize:number):Uint8Array {
    return pbkdf2(new Sha1(),password,salt,count,keySize);
}
export function pbkdf2_hmac_sha256(password:Uint8Array|string,salt:Uint8Array|string,count:number,keySize:number):Uint8Array {
    return pbkdf2(new Sha256(),password,salt,count,keySize);
}
export function pbkdf2_hmac_sha512(password:Uint8Array|string,salt:Uint8Array|string,count:number,keySize:number):Uint8Array {
    return pbkdf2(new Sha512(),password,salt,count,keySize);
}