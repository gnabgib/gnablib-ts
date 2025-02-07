import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Adler32 } from '../../src/checksum/adler';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Adler');

const sum_abcd = 0x03d8018b;
const sum_abcdefgh = 0x0e000325;

//https://md5calc.com/hash/adler32
const string_tests: [string, number][] = [
	//Wiki
	['Wikipedia', 0x11e60398],
	//Others
	['abcde', 0x05c801f0],
	['abcdef', 0x081e0256],
	['abcdefgh', sum_abcdefgh],
	['\x01', 0x20002],
	['\x01\x02', 0x60004],
	['\x01\x02\x03', 0xd0007],
	['a', 0x00620062],
	['a\x00', 0xc40062],
	['a\x00\x00', 0x01260062],
	['a\x00\x00\x00', 0x01880062],
	['ab', 0x012600c4],
	['abc', 0x024d0127],
	['abcd', sum_abcd],
	['f', 0x00670067],
	['fo', 0x013d00d6],
	['foo', 0x02820145],
	['foob', 0x042901a7],
	['fooba', 0x06310208],
	['foobar', 0x08ab027a],
	['123456789', 0x091e01de],
	['foo bar baz٪☃🍣', 0x5c010a36],
	['gnabgib', 0x0b4202cb],
	['message digest',0x29750586],
];

for (const [str, expect] of string_tests) {
	tsts(`Adler32b(${str})`, () => {
		const b = utf8.toBytes(str);
		const cs = new Adler32();
		cs.write(b);
		assert.is(cs.sum32(), expect);
	});
}

const b1k = new Uint8Array(1000);
const byte_tests: [Uint8Array, number][] = [
	[new Uint8Array(0), 1],
	[new Uint8Array(1), 0x10001],
	[new Uint8Array(2), 0x20001],
	[new Uint8Array(3), 0x30001],
	[new Uint8Array(4), 0x40001],
	[b1k, 0x3e80001],
];
for (const [data, expect] of byte_tests) {
	tsts(`Adler32(bytes[${data.length}])`, () => {
		const cs = new Adler32();
		cs.write(data);
		assert.is(cs.sum32(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Adler32();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '00620062');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Adler32();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum32(), 294453262);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Adler32();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

// tsts(`Adler(70K bytes)`,()=>{
// 	const cs=new Adler32();
// 	for(let i=0;i<70;i++) cs.write(b1k);
// 	//70000 = 11170 mod = 117F
// 	assert.is(hex.fromBytes(cs.sum()),'117F0001');
// })

tsts.run();
