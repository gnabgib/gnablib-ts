import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { base64 } from '../../../src/encoding/Base64';
import { utf8 } from '../../../src/encoding/Utf8';
import { Salsa20 } from '../../../src/crypt/sym/Salsa';
import { U64 } from '../../../src/primitive/U64';


const tsts = suite('Salsa20');


const testEnc:[string,string,string,U64,string,string][]=[
    [
        'salsafamily Section 4.1',
        '0102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20',
        '0301040105090206',
        U64.fromInt(7),
        '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        //Note the docs show U32 in little endian (reverse each 4 byte set)
        'A305A2B950E195061A8894AA2CB1B7ADD442897916701026A4B1ED643F17272DFAF1C7B1DC6E066223FA35E0046F49C4B3E6312128DE0B8107B42CF63DDEDE6B'
    ],
    [
        'SS(The quick brown fox)',
        hex.fromBytes(base64.toBytes('WTeEmfKonMWESy6xHvt7Eqi0WJQkUmlbNC19EXI8M3k=')),
        hex.fromBytes(base64.toBytes('uNKaHLTbpZs=')),
        U64.zero,
        hex.fromBytes(utf8.toBytes('The quick brown fox')),
        hex.fromBytes(base64.toBytes('IHYd4zVfLYsMaOFVKVeebWSp4g=='))
    ],
    [
        'SS(gnablib)',
        hex.fromBytes(base64.toBytes('WTeEmfKonMWESy6xHvt7Eqi0WJQkUmlbNC19EXI8M3k=')),
        hex.fromBytes(base64.toBytes('mOLXlxDSoyA=')),
        U64.zero,
        hex.fromBytes(utf8.toBytes('gnablib')),
        hex.fromBytes(base64.toBytes('MD7mzTLsNQ=='))
    ],
    [
        'gnablib, short key - calculated',
        '000102030405060708090a0b0c0d0e0f',
        '0000000000000000',
        U64.zero,
        hex.fromBytes(utf8.toBytes('gnablib')),
        '073BCAD3C46E50'
    ]
];
for(const [descr,key,nonce,counter,plain,enc] of testEnc) {
    tsts(`enc(${descr})`,()=>{
        const cc=new Salsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);
        cc.encryptInto(eBytes,pBytes);
        assert.equal(hex.fromBytes(eBytes),enc);
    });
    tsts(`dec(${descr})`,()=>{
        const cc=new Salsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);
        cc.decryptInto(pBytes,eBytes);
        assert.equal(hex.fromBytes(pBytes),plain);
    });
}

tsts(`Encrypt size matches plaintext`,()=>{
    var cc=new Salsa20(new Uint8Array(32),new Uint8Array(8));
    assert.is(cc.encryptSize(13),13);
});

tsts(`Invalid keysize throws size matches plaintext`,()=>{
    assert.throws(()=>new Salsa20(new Uint8Array(0),new Uint8Array(0)));
});

tsts.run();