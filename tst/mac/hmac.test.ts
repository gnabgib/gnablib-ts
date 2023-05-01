import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import * as utf8 from '../../src/encoding/Utf8';
import { Hmac } from '../../src/mac/Hmac';
import { Md5 } from '../../src/hash/Md5';
import { Sha1 } from '../../src/hash/Sha1';

const tsts = suite('HMAC/RFC 2104');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const md5Hex:hashHex[]=[
    //From RFC 2104
    {
        key:hex.toBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b'),
        data:'Hi There',
        expect:'9294727A3638BB1C13F48EF8158BFC9D'},
    {
        key:'Jefe',
        data:'what do ya want for nothing?',
        expect:'750C783E6AB0B503EAA86E310A5DB738'},
    {
        key:hex.toBytes('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        data:hex.toBytes('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'),
        expect:'56BE34521D144C88DBB8C733F0E8B3F6'},
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'80070713463E7749B90C2DC24911E275'},
];

for (const test of md5Hex) {
    //Note we reuse the hash object
    const hash=new Md5();
    tsts('hmac-md5: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

const sha1Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'DE7C9B85B8B78AA6BC8A7A36F70A90701C9DB4D9'},
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

const sha256Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'F7BC83F430538424B13298E6AA6FB143EF4D59A14946175997479DBC2D1A3CD8'},
];
const sha512Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'B42AF09057BAC1E2D41708E48A902E09B5FF7F12AB428A4FE86653C73DD248FB82F948A549F7B791A5B41915EE4D1EC3935357E4E2317250D0372AFA2EBEEB3A'},
];

tsts.run();
