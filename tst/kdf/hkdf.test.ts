import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { hkdf } from '../../src/kdf/Hkdf';
import { Sha1 } from '../../src/hash/Sha1';
import { Sha256 } from '../../src/hash/Sha2';

const tsts = suite('HKDF/RFC 5869');

type hkdfTest = {
    ikm:string,
    salt?:string,
    info?:string,
    len:number,
    expect:string
};

const sha256Hex:hkdfTest[]=[
    //RFC 5869: test case 1
    {
        ikm:'0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
        salt:'000102030405060708090a0b0c',
        info:'f0f1f2f3f4f5f6f7f8f9',
        len:42,
        expect:'3CB25F25FAACD57A90434F64D0362F2A2D2D0A90CF1A5A4C5DB02D56ECC4C5BF34007208D5B887185865'},
    //RFC 5869: test case 2
    {
        ikm:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f',
        salt:'606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf',
        info:'b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
        len:82,
        expect:'B11E398DC80327A1C8E7F78C596A49344F012EDA2D4EFAD8A050CC4C19AFA97C59045A99CAC7827271CB41C65E590E09DA3275600C2F09B8367793A9ACA3DB71CC30C58179EC3E87C14C01D5C1F3434F1D87'},
    //RFC 5869: test case 3
    {
        ikm:'0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
        len:42,
        expect:'8DA4E775A563C18F715F802A063C5A31B8A11F5C5EE1879EC3454E5F3C738D2D9D201395FAA4B61A96C8'},
];
for (const test of sha256Hex) {
    //Note we reuse the hash object
    const hash=new Sha256();
    tsts('hkdf-sha256: '+test.ikm+'->'+test.len,()=>{
        const ikm=hex.toBytes(test.ikm);
        const salt=test.salt?hex.toBytes(test.salt):new Uint8Array();
        const info=test.info?hex.toBytes(test.info):new Uint8Array();
        const found=hkdf(hash,ikm,test.len,salt,info);
        assert.is(hex.fromBytes(found),test.expect);
    });
}

const sha1Hex:hkdfTest[]=[
    //RFC 5869: test case 4
    {
        ikm:'0b0b0b0b0b0b0b0b0b0b0b',
        salt:'000102030405060708090a0b0c',
        info:'f0f1f2f3f4f5f6f7f8f9',
        len:42,
        expect:'085A01EA1B10F36933068B56EFA5AD81A4F14B822F5B091568A9CDD4F155FDA2C22E422478D305F3F896'},
    //RFC 5869: test case 5
    {
        ikm:'000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f',
        salt:'606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf',
        info:'b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
        len:82,
        expect:'0BD770A74D1160F7C9F12CD5912A06EBFF6ADCAE899D92191FE4305673BA2FFE8FA3F1A4E5AD79F3F334B3B202B2173C486EA37CE3D397ED034C7F9DFEB15C5E927336D0441F4C4300E2CFF0D0900B52D3B4'
    },
    //RFC 5869: test case 6
    {
        ikm:'0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
        len:42,
        expect:'0AC1AF7002B3D761D1E55298DA9D0506B9AE52057220A306E07B6B87E8DF21D0EA00033DE03984D34918'},
    //RFC 5869: test case 7
    {
        ikm:'0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c',
        len:42,
        expect:'2C91117204D745F3500D636A62F64F0AB3BAE548AA53D423B0D1F27EBBA6F5E5673A081D70CCE7ACFC48'},
];
for (const test of sha1Hex) {
    //Note we reuse the hash object
    const hash=new Sha1();
    tsts('hkdf-sha1: '+test.ikm+'->'+test.len,()=>{
        const ikm=hex.toBytes(test.ikm);
        const salt=test.salt?hex.toBytes(test.salt):new Uint8Array();
        const info=test.info?hex.toBytes(test.info):new Uint8Array();
        const found=hkdf(hash,ikm,test.len,salt,info);
        assert.is(hex.fromBytes(found),test.expect);
    });
}



tsts.run();
