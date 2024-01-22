import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Sha256 } from '../../../src/crypto/hash';
import { Hmac } from '../../../src/crypto/mac';

const tsts = suite('HMAC/RFC 2104 (Sha256)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const sha256Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'F7BC83F430538424B13298E6AA6FB143EF4D59A14946175997479DBC2D1A3CD8'},
    //https://www.liavaag.org/English/SHA-Generator/HMAC/
    {
        key:'key',
        data:'gnabgib',
        expect:'16C0E2E85B5E9E2BFB002EA89F7B53617821C125E2D1BD7E86AB74999A824456'
    },
];
for (const test of sha256Hex) {
    //Note we reuse the hash object
    const hash=new Sha256();
    tsts('hmac-sha256: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
