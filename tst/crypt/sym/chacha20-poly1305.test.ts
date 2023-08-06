import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { ChaCha20_Poly1305 } from '../../../src/mac/Poly1305';


const tsts = suite('ChaCha20-Poly1305/RFC 8439 (7539)');

const tests:[string,string,string,string,string,string,string][]=[
    [
        'RFC7539-Section 2.8.2 test vector',
        '808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F',
        '07000000'+'4041424344454647',
        '50515253C0C1C2C3C4C5C6C7',
        '4C616469657320616E642047656E746C656D656E206F662074686520636C617373206F66202739393A204966204920636F756C64206F6666657220796F75206F6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73637265656E20776F756C642062652069742E',
        'D31A8D34648E60DB7B86AFBC53EF7EC2A4ADED51296E08FEA9E2B5A736EE62D63DBEA45E8CA9671282FAFB69DA92728B1A71DE0A9E060B2905D6A5B67ECD3B3692DDBD7F2D778B8C9803AEE328091B58FAB324E4FAD675945585808B4831D7BC3FF4DEF08E4B7A9DE576D26586CEC64B6116',
        '1AE10B594F09E26A7E902ECBD0600691'
    ],
]
for(const [descr,key,nonce,aad,plain,enc,tag] of tests) {
    tsts(`enc(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new ChaCha20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);

        cp.encryptInto(eBytes,pBytes);
        const foundTag=cp.finalize();
        assert.equal(hex.fromBytes(eBytes),enc,'enc');
        assert.equal(hex.fromBytes(foundTag),tag,'tag');
    });

    tsts(`dec(${descr})`,()=>{
        const kBytes=hex.toBytes(key);
        const nBytes=hex.toBytes(nonce);
        const aBytes=hex.toBytes(aad);

        const cp=new ChaCha20_Poly1305(kBytes,nBytes);
        cp.writeAD(aBytes);
        
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);

        cp.decryptInto(pBytes,eBytes);

        assert.equal(hex.fromBytes(pBytes),plain,'dec');
        assert.equal(cp.verify(hex.toBytes(tag)),true,'verified');
    });
}

tsts(`AD after finalize throws`,()=>{
    var c=new ChaCha20_Poly1305(new Uint8Array(32),new Uint8Array(12));
    c.finalize();
    assert.throws(()=>c.writeAD(new Uint8Array(0)));

})

tsts(`encrypt after finalize throws`,()=>{
    var c=new ChaCha20_Poly1305(new Uint8Array(32),new Uint8Array(12));
    c.finalize();
    assert.throws(()=>c.encryptInto(new Uint8Array(0),new Uint8Array(0)));
});

tsts(`decrypt after finalize throws`,()=>{
    var c=new ChaCha20_Poly1305(new Uint8Array(32),new Uint8Array(12));
    c.finalize();
    assert.throws(()=>c.decryptInto(new Uint8Array(0),new Uint8Array(0)));
});

tsts(`Coverage`,()=>{
    var c=new ChaCha20_Poly1305(new Uint8Array(32),new Uint8Array(12));
    //Encrypt size is the same as plain
    assert.is(c.encryptSize(13),13);
    //Block size is 64
    assert.is(c.blockSize,64);
    //Skip straight to verify is ok (but pointless)
    c.verify(new Uint8Array(16));
});


tsts.run();