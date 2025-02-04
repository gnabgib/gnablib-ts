import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Adler32 } from '../../src/checksum/adler';


const tsts = suite('Adler/RFC 1950');

//https://md5calc.com/hash/adler32
const string_tests:[string,number][] = [
	//Wiki
    ['Wikipedia',0x11E60398],
    //Others
    ['abcde', 0x05C801F0],
	['abcdef', 0x081E0256],
	['abcdefgh', 0x0E000325],
	['\x01', 0x20002],
	['\x01\x02', 0x60004],
	['\x01\x02\x03', 0xD0007],
	['a', 0x00620062],
	['a\x00', 0xC40062],
	['a\x00\x00', 0x01260062],
	['a\x00\x00\x00', 0x01880062],
	['ab', 0x012600C4],
	['abc', 0x024D0127],
	['abcd', 0x03D8018B],
	['f', 0x00670067],
	['fo', 0x013D00D6],
	['foo', 0x02820145],
	['foob', 0x042901A7],
	['fooba', 0x06310208],
	['foobar', 0x08AB027A],
    ['123456789', 0x091E01DE],
	['foo bar baz٪☃🍣', 0x5c010a36],
	['gnabgib', 0x0B4202CB]
];

for (const [str,expect] of string_tests) {
	tsts(`Adler32(${str})`, () => {
		const b = utf8.toBytes(str);
		const cs=new Adler32();
		cs.write(b);
		assert.is(cs.sum32(),expect);
	});
}

const b1k=new Uint8Array(1000);
const byte_tests:[Uint8Array,number][]=[
	[new Uint8Array(0),1],
	[new Uint8Array(1),0x10001],
	[new Uint8Array(2),0x20001],
	[new Uint8Array(3),0x30001],
	[new Uint8Array(4),0x40001],
	[b1k,0x3E80001],
];
for(const [data,expect] of byte_tests) {
	tsts(`Adler32(bytes[${data.length}])`, () => {
		const cs=new Adler32();
		cs.write(data);
		assert.is(cs.sum32(),expect);
	});
}

tsts(`Adler(70K bytes)`,()=>{
	const cs=new Adler32();
	for(let i=0;i<70;i++) cs.write(b1k);
	//70000 = 11170 mod = 117F
	assert.is(hex.fromBytes(cs.sum()),'117F0001');
})

tsts(`Reset`,()=>{
	const cs=new Adler32();
	assert.is(cs.sum32(),1);
	cs.write(b1k);
	assert.is(cs.sum32(),0x3E80001);
	cs.reset();
	assert.is(cs.sum32(),1);
})

tsts(`newEmpty`,()=>{
	const cs=new Adler32();
	cs.write(b1k);
	assert.is(cs.sum32(),0x3E80001);
	const cs2=cs.newEmpty();
	assert.is(cs.sum32(),0x3E80001);
	assert.is(cs2.sum32(),1);
})

tsts(`clone`,()=>{
	const cs=new Adler32();
	cs.write(b1k);
	const cs2=cs.clone();
	assert.is(cs.sum32(),0x3E80001,'cs sums correctly');
	assert.is(cs2.sum32(),0x3E80001,'cs2 has the same sum');
	cs.write(b1k);
	assert.is(cs.sum32(),0x7D00001,'cs updated with second write');
	assert.is(cs2.sum32(),0x3E80001,'write to cs didn\'t change cs2');
});

tsts.run();
