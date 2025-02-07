import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lookup2 } from '../../src/checksum/Lookup2';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Lookup2');

const sum_abcd = 1525030821;
const sum_abcdefgh = 88045406;

const string_tests:[string,number][]=[
    ['a',703514648],
    ['ab',2558110785],
    ['abc',622741395],
    ['abcd',sum_abcd],
    ['abcdefgh',sum_abcdefgh],
    ['hello',3070638494],
    ['hello, world',933292425],//Exactly 12 bytes (more than one hash)
    ['My hovercraft is full of eels.',2243816318],//More than one hash
    ['message digest',1183305218],
];
for(const [src,expect] of string_tests) {
    tsts(`Lookup2(${src})`,()=>{
		const hash=new Lookup2();
		hash.write(utf8.toBytes(src));
        assert.is(hash.sum32(),expect);
	});
}

const byte_tests:[Uint8Array,number][]=[
    [new Uint8Array(),3175731469],
    [new Uint8Array(1),1843378377],
    [new Uint8Array(2),1948748577],
    [new Uint8Array(3),49118037],
    [new Uint8Array(4),2305145833],
    [Uint8Array.of(1),3107525544],
];
for(const [bytes,expect] of byte_tests) {
    tsts(`Lookup2([${bytes.length}])`,()=>{
		const hash=new Lookup2();
		hash.write(bytes);
        assert.is(hash.sum32(),expect);
	});
}

const tests:[Uint8Array,number,number][]=[
    [Uint8Array.of(0),1,1948748577],
    [Uint8Array.of(0,0),1,49118037],
];
for (const [data,seed,expect] of tests) {
    tsts(`Lookup2([${data.length}],${seed})`,()=>{
		const hash=new Lookup2(seed);
		hash.write(data);
        assert.is(hash.sum32(),expect);
	});
}

tsts(`sum()`,()=>{
    const hash=new Lookup2(0);
    hash.write(Uint8Array.of(0));
    const sum=hash.sum();
    assert.is(sum.length,hash.size);
    assert.is(hash.blockSize>0,true);
    assert.is(hex.fromBytes(sum),'6DDFB8C9');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
    const s = new Lookup2();
    s.write(Uint8Array.of(13));
    for (let i = 0; i < 5; i++) s.write(b1K);
    assert.is(s.sum32(), 2563276869);
});

tsts(`reading sum doesn't mutate state`, () => {
    const s = new Lookup2();
    s.write(ascii_abcd);
    assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
    s.write(ascii_efgh);
    assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();