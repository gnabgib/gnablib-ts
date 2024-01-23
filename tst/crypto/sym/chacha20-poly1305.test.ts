import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { ChaCha20_Poly1305 } from '../../../src/crypto/sym';


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
    [
        'RFC7539-Section A.5 test vector',
        '1C9240A5EB55D38AF333888604F6B5F0473917C1402B80099DCA5CBC207075C0',
        '000000000102030405060708',
        'F33388860000000000004E91',
        '496E7465726E65742D4472616674732061726520647261667420646F63756D656E74732076616C696420666F722061206D6178696D756D206F6620736978206D6F6E74687320616E64206D617920626520757064617465642C207265706C616365642C206F72206F62736F6C65746564206279206F7468657220646F63756D656E747320617420616E792074696D652E20497420697320696E617070726F70726961746520746F2075736520496E7465726E65742D447261667473206173207265666572656E6365206D6174657269616C206F7220746F2063697465207468656D206F74686572207468616E206173202FE2809C776F726B20696E2070726F67726573732E2FE2809D',
        '64A0861575861AF460F062C79BE643BD5E805CFD345CF389F108670AC76C8CB24C6CFC18755D43EEA09EE94E382D26B0BDB7B73C321B0100D4F03B7F355894CF332F830E710B97CE98C8A84ABD0B948114AD176E008D33BD60F982B1FF37C8559797A06EF4F0EF61C186324E2B3506383606907B6A7C02B0F9F6157B53C867E4B9166C767B804D46A59B5216CDE7A4E99040C5A40433225EE282A1B0A06C523EAF4534D7F83FA1155B0047718CBC546A0D072B04B3564EEA1B422273F548271A0BB2316053FA76991955EBD63159434ECEBB4E466DAE5A1073A6727627097A1049E617D91D361094FA68F0FF77987130305BEABA2EDA04DF997B714D6C6F2C29A6AD5CB4022B02709B',
        'EEAD9D67890CBB22392336FEA1851F38'
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