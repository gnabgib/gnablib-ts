import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import * as utf8 from '../../src/encoding/Utf8';
import { KmacXof128 } from '../../src/mac/Kmac';

const tsts = suite('KMacXof128');

type hashHex={
    key:string,
    data:string|Uint8Array,
    size:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //https://csrc.nist.gov/csrc/media/projects/cryptographic-standards-and-guidelines/documents/examples/kmacxof_samples.pdf
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:Hex.toBytes('00010203'),
        size:256/8,
        expect:'CD83740BBD92CCC8CF032B1481A0F4460E7CA9DD12B08A0C4031178BACD6EC35'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:Hex.toBytes('00010203'),
        size:256/8,
        customize:'My Tagged Application',
        expect:'31A44527B4ED9F5C6101D11DE6D26F0620AA5C341DEF41299657FE9DF1A3B16C'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:Hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'),
        size:256/8,
        customize:'My Tagged Application',
        expect:'47026C7CD793084AA0283C253EF658490C0DB61438B8326FE9BDDF281B83AE0F'
    },

];

let count=0;
for (const test of tests) {
    tsts(`mac[${count++}]`,()=>{
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new KmacXof128(test.size,test.key,test.customize);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(Hex.fromBytes(found),test.expect);
    });
}

tsts.run();
