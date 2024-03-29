import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { KmacXof256 } from '../../../src/crypto/xof';

const tsts = suite('KMacXof256');

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
        data:hex.toBytes('00010203'),
        size:512/8,
        customize:'My Tagged Application',
        expect:'1755133F1534752AAD0748F2C706FB5C784512CAB835CD15676B16C0C6647FA96FAA7AF634A0BF8FF6DF39374FA00FAD9A39E322A7C92065A64EB1FB0801EB2B'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'),
        size:512/8,
        expect:'FF7B171F1E8A2B24683EED37830EE797538BA8DC563F6DA1E667391A75EDC02CA633079F81CE12A25F45615EC89972031D18337331D24CEB8F8CA8E6A19FD98B'
    },
    {
        key:'@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_',
        data:hex.toBytes('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7'),
        size:512/8,
        customize:'My Tagged Application',
        expect:'D5BE731C954ED7732846BB59DBE3A8E30F83E77A4BFF4459F2F1C2B4ECEBB8CE67BA01C62E8AB8578D2D499BD1BB276768781190020A306A97DE281DCC30305D'
    },

];

let count=0;
for (const test of tests) {
    tsts(`mac[${count++}]`,()=>{
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new KmacXof256(test.size,test.key,test.customize);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts.run();
