/*! Copyright 2023 gnabgib MPL-2.0 */

import type { IHash } from "../hash/IHash.js";
import * as hex from "../encoding/Hex.js";
import { Hmac } from "../mac/Hmac.js";

//(HMAC-based Extract-and-Expand Key Derivation Function)[https://datatracker.ietf.org/doc/html/rfc5869]
export function extract(hash:IHash,ikm:Uint8Array,salt?:Uint8Array):Uint8Array {
    const mac=new Hmac(hash,salt??new Uint8Array(hash.blockSize));
    mac.write(ikm);
    return mac.sum();
}

export function expand(hash:IHash,prk:Uint8Array,lenBytes:number,info?:Uint8Array):Uint8Array {
    info=info??new Uint8Array(0);
    const n=Math.floor(lenBytes/hash.size);
    const ret=new Uint8Array(lenBytes);
    const msg=new Uint8Array(hash.size+1+info.length);
    //console.log(`n=${n} len=${lenBytes} hl=${hash.size} i.length=${info.length} msg.length=${msg.length}`)
    let t=new Uint8Array(0);
    let i=1;
    let pos=0;
    let mPos=0;
    const mac=new Hmac(hash,prk);
    for(;i<=n;) {
        //Note i is 1 based (hence <=)
        mPos=0;
        msg.set(t,mPos);
        mPos+=t.length;
        msg.set(info,mPos);
        mPos+=info.length;
        msg[mPos]=i;
        mPos+=1;
        mac.write(msg.slice(0,mPos));
        t=mac.sum();
        mac.reset();
        ret.set(t,pos);
        i++;
        pos+=hash.size;
    }
    const rem=lenBytes-pos;
    if (rem>0) {
        mPos=0;
        msg.set(t,mPos);
        mPos+=t.length;
        msg.set(info,mPos);
        mPos+=info.length;
        msg[mPos]=i;
        mPos+=1;
        mac.write(msg.slice(0,mPos));
        t=mac.sum();
        ret.set(t.slice(0,rem),pos);
    }
    return ret;
}

export function hkdf(hash:IHash,ikm:Uint8Array,lenBytes:number,salt?:Uint8Array,info?:Uint8Array):Uint8Array {
    const prk=extract(hash,ikm,salt);
    return expand(hash,prk,lenBytes,info);
}