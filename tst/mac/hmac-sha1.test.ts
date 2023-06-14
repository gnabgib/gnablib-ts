import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { utf8 } from '../../src/encoding/Utf8';
import { Hmac } from '../../src/mac/Hmac';
import { Sha1 } from '../../src/hash/Sha1';

const tsts = suite('HMAC/RFC 2104 (Sha1)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const sha1Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'DE7C9B85B8B78AA6BC8A7A36F70A90701C9DB4D9'},
    //https://www.liavaag.org/English/SHA-Generator/HMAC/
    {
        key:'key',
        data:'gnabgib',
        expect:'D33121BFC9B5023C60BEE5607AF3A7736C0EBE71'
    },
];

for (const test of sha1Hex) {
    //Note we reuse the hash object
    const hash=new Sha1();
    tsts('hmac-sha1: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
