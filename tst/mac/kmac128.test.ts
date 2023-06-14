import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { utf8 } from '../../src/encoding/Utf8';
import { Kmac128 } from '../../src/mac/Kmac';

const tsts = suite('KMAC128');

type hashHex={
    key:string,
    data:string|Uint8Array,
    size?:number,
    customize?:string,
    expect:string
};

const tests:hashHex[]=[
    //http://csrc.nist.gov/groups/ST/toolkit/documents/Examples/KMAC_samples.pdf
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:hex.toBytes('00010203'),
        expect:'E5780B0D3EA6F7D3A429C5706AA43A00FADBD7D49628839E3187243F456EE14E'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:hex.toBytes('00010203'),
        customize:'My Tagged Application',
        expect:'3B1FBA963CD8B0B59E8C1A6D71888B7143651AF8BA0A7070C0979E2811324AA5'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'),
        customize:'My Tagged Application',
        expect:'1F5B4E6CCA02209E0DCB5CA635B89A15E271ECC760071DFD805FAA38F9729230'
    },
    //echo -n "hello" | openssl mac -macopt key:test -macopt size:64 KMAC128
    {
        key:'test',
        data:'hello',
        expect:'91C4A9B17311D480239EC449E6504E60B9A02EB134DD86763A300BF4580BAE7A'
    },
    {
        key:'gnabgib',
        data:'Hello',
        expect:'A50B5405F168E3C16CA1677FB76BAA82B257ACB470E524A7E041D33881BAB924'
    },
    {
        key:'gnabgib',
        data:'Hello',
        size:33,
        expect:'CE0082D5BCAE721B2C085238187BE9CC65C679F94E614180FFCAA646798E14816F'
    },
    {
        key:'gnabgib',
        data:'Hello',
        size:64,
        expect:'FA756A9BE1B27275A39ECB0AA095D85B7E6FBA3232C7815BC50797F9B9870D265EB0D9FCFC773DB3EE4909F9D89EE9A549C2791DC96D9970A55BD2547ACD71B1'
    },
];

let count=0;
for (const test of tests) {
    tsts(`mac[${count++}]`,()=>{
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Kmac128(test.size??32,test.key,test.customize);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
