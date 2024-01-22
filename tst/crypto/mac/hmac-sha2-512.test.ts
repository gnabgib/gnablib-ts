import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Sha512 } from '../../../src/crypto/hash';
import { Hmac } from '../../../src/crypto/mac';

const tsts = suite('HMAC/RFC 2104 (Sha512)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const sha512Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'B42AF09057BAC1E2D41708E48A902E09B5FF7F12AB428A4FE86653C73DD248FB82F948A549F7B791A5B41915EE4D1EC3935357E4E2317250D0372AFA2EBEEB3A'},
    //https://www.liavaag.org/English/SHA-Generator/HMAC/
    {
        key:'key',
        data:'gnabgib',
        expect:'8C181CC0267E7A91B8E37721ACCF93A4CD689CB42B2BA4C9A22DA83F04AA421636880387F89C58FD4EFBDF830B0BA0FD08B66FE35F135217109B26DAE5E00D06'
    },        
];
for (const test of sha512Hex) {
    //Note we reuse the hash object
    const hash=new Sha512();
    tsts('hmac-sha512: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
