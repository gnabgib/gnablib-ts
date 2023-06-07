import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { Murmur3_32 } from '../../src/hash/Murmur3';
import * as utf8 from '../../src/encoding/Utf8';

const tsts = suite('Murmur3 (32)');

const tests:[
    Uint8Array,
    number,
    number
][]=[
    //https://www.pelock.com/products/hash-calculator
    [new Uint8Array(),0,0],
    [new Uint8Array(),1,0x514E28B7],
    [new Uint8Array(),0xffffffff,0x81F16F39],
    [new Uint8Array(),0x2a,0x087FCD5C],
    //https://stackoverflow.com/questions/14747343/murmurhash3-test-vectors
    [Uint8Array.from([0]),0,0x514E28B7],
    [Uint8Array.from([0,0]),0,0x30F4C306],
    [Uint8Array.from([0,0,0]),0,0x85F0B427],
    [Uint8Array.from([0,0,0,0]),0,0x2362F9DE],
    [Uint8Array.from([0x21]),0,0x72661CF4],
    [Uint8Array.from([0x21,0x43]),0,0xA0F7B07A],
    [Uint8Array.from([0x21,0x43,0x65]),0,0x7E4A8634],
    [Uint8Array.from([0x21,0x43,0x65,0x87]),0,0xF55B516B],
    [Uint8Array.from([0x21,0x43,0x65,0x87]),0x5082EDEE,0x2362F9DE],
    [Uint8Array.from([0xff,0xff,0xff,0xff]),0,0x76293B50],
    //https://github.com/spaolacci/murmur3/blob/master/murmur_test.go
    [utf8.toBytes('hello'),0,0x248BFA47],
    [utf8.toBytes('hello, world'),0,0x149BBB7F],
    [utf8.toBytes('The quick brown fox jumps over the lazy dog.'),0,0xD5C48BFC],
    [utf8.toBytes('hello'),1,0xBB4ABCAD],
    [utf8.toBytes('hello, world'),1,0x6F5CB2E9],
    [utf8.toBytes('The quick brown fox jumps over the lazy dog.'),1,0x846F6A36],
    [utf8.toBytes('hello'),0x2a,0xE2DBD2E1],
    [utf8.toBytes('hello, world'),0x2a,0x7EC7C6C2],
    [utf8.toBytes('The quick brown fox jumps over the lazy dog.'),0x2a,0xC02D1434],
    //Amazing test vectors
    //https://github.com/pid/murmurHash3js/blob/master/test/test-server.js
    [utf8.toBytes('I will not buy this record, it is scratched.'),0,0xA8D02B9A],
    [utf8.toBytes('My hovercraft is full of eels.'),0,0xB00AC145],
];

let count=0;
for (const [data,seed,expect] of tests) {
    tsts(`Murmur3-32[${count++}]`,()=>{
		const hash=new Murmur3_32(seed);
		hash.write(data);
        const sum=hash.sum32();
        assert.is(sum,expect);
	});
}


tsts.run();
