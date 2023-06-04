import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { Murmur3_32 } from '../../src/hash/Murmur3';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('Murmur3 (32)');

const tests:{
    data:Uint8Array,
    seed:number,
    expectHex:string
}[]=[
    //https://www.pelock.com/products/hash-calculator
    {
        data:new Uint8Array(),
        seed:0,
        expectHex:'00000000'
    },
    {
        data:new Uint8Array(),
        seed:1,
        expectHex:'514E28B7'
    },
    {
        data:new Uint8Array(),
        seed:0xffffffff,
        expectHex:'81F16F39'
    },
    {
        data:new Uint8Array(),
        seed:0x2a,
        expectHex:'087FCD5C'
    },
    //https://stackoverflow.com/questions/14747343/murmurhash3-test-vectors
    {
        data:Uint8Array.from([0]),
        seed:0,
        expectHex:'514E28B7'
    },
    {
        data:Uint8Array.from([0,0]),
        seed:0,
        expectHex:'30F4C306'
    },
    {
        data:Uint8Array.from([0,0,0]),
        seed:0,
        expectHex:'85F0B427'
    },
    {
        data:Uint8Array.from([0,0,0,0]),
        seed:0,
        expectHex:'2362F9DE'
    },
    {
        data:Uint8Array.from([0x21]),
        seed:0,
        expectHex:'72661CF4'
    },
    {
        data:Uint8Array.from([0x21,0x43]),
        seed:0,
        expectHex:'A0F7B07A'
    },
    {
        data:Uint8Array.from([0x21,0x43,0x65]),
        seed:0,
        expectHex:'7E4A8634'
    },
    {
        data:Uint8Array.from([0x21,0x43,0x65,0x87]),
        seed:0,
        expectHex:'F55B516B'
    },
    {
        data:Uint8Array.from([0x21,0x43,0x65,0x87]),
        seed:0x5082EDEE,
        expectHex:'2362F9DE'
    },
    {
        data:Uint8Array.from([0xff,0xff,0xff,0xff]),
        seed:0,
        expectHex:'76293B50'
    },
    //https://github.com/spaolacci/murmur3/blob/master/murmur_test.go
    {
        data:utf8.toBytes('hello'),
        seed:0,
        expectHex:'248BFA47'
    },
    {
        data:utf8.toBytes('hello, world'),
        seed:0,
        expectHex:'149BBB7F'
    },
    {
        data:utf8.toBytes('The quick brown fox jumps over the lazy dog.'),
        seed:0,
        expectHex:'D5C48BFC'
    },
    {
        data:utf8.toBytes('hello'),
        seed:1,
        expectHex:'BB4ABCAD'
    },
    {
        data:utf8.toBytes('hello, world'),
        seed:1,
        expectHex:'6F5CB2E9'
    },
    {
        data:utf8.toBytes('The quick brown fox jumps over the lazy dog.'),
        seed:1,
        expectHex:'846F6A36'
    },
    {
        data:utf8.toBytes('hello'),
        seed:0x2a,
        expectHex:'E2DBD2E1'
    },
    {
        data:utf8.toBytes('hello, world'),
        seed:0x2a,
        expectHex:'7EC7C6C2'
    },
    {
        data:utf8.toBytes('The quick brown fox jumps over the lazy dog.'),
        seed:0x2a,
        expectHex:'C02D1434'
    },
    //Amazing test vectors
    //https://github.com/pid/murmurHash3js/blob/master/test/test-server.js
    {
        data:utf8.toBytes('I will not buy this record, it is scratched.'),
        seed:0,
        expectHex:'A8D02B9A'
    },
    {
        data:utf8.toBytes('My hovercraft is full of eels.'),
        seed:0,
        expectHex:'B00AC145'
    },
];

let count=0;
for (const test of tests) {
    tsts(`Murmur3-32[${count++}]`,()=>{
		const hash=new Murmur3_32(test.seed);
		hash.write(test.data);
		//const sum=hash.sum();
		//assert.is(hex.fromBytes(sum), test.expectHex);
        assert.is(hex.fromI32(hash.sum32()),test.expectHex);
	});
}


tsts.run();
