import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { base32 } from '../../src/encoding/Base32';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';

const tsts = suite('Base32/RFC 4648');

const asciiTests:[string,string][]= [
	['', ''],
	['f', 'MY======'],
	['fo', 'MZXQ===='],
	['foo', 'MZXW6==='],
	['foob', 'MZXW6YQ='],
	['fooba', 'MZXW6YTB'],
	['foobar', 'MZXW6YTBOI======'],
	['Hello!', 'JBSWY3DPEE======'],
	['Hello, world!', 'JBSWY3DPFQQHO33SNRSCC==='],
];
//https://datatracker.ietf.org/doc/html/rfc4648#page-8

for (const [str,enc] of asciiTests) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(base32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = base32.toBytes(enc);
		assert.is(utf8.fromBytes(u), str);
	});
}

//Test the complete mapping (every char)
const hexTests:[string,string][] = [
	//Hex,                                              enc
	[
		'00443214C74254B635CF84653A56D7C675BE77DF',
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
	],
	[
		'FFBBCDEB38BDAB49CA307B9AC5A928398A418820',
		'765432ZYXWVUTSRQPONMLKJIHGFEDCBA',
	],
];

for (const [strHex,enc] of hexTests) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(base32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = base32.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

const asciiDecodeQuirkTests:[string,string][]=[
	//Lower case is ok
	['mzxw6ytboi','666F6F626172'],//foobar in ASCII
];
for(const [enc,strHex] of asciiDecodeQuirkTests) {
	tsts(`Decode(${enc})`, () => {
		const u = base32.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts('bad cases',()=>{
    //Bad character:
    assert.throws(()=>base32.toBytes('?'));
    //Data after padding:
    assert.throws(()=>base32.toBytes('MY======M',true));
    //Not enough characters
    assert.throws(()=>base32.toBytes('a',true));
    assert.throws(()=>base32.toBytes('aa',true));
    assert.throws(()=>base32.toBytes('aaa',true));
	assert.throws(()=>base32.toBytes('aaaa',true));
	assert.throws(()=>base32.toBytes('aaaaa',true));
	assert.throws(()=>base32.toBytes('aaaaaa',true));
	assert.throws(()=>base32.toBytes('aaaaaaa',true));
    //Not enough chars+pad
    assert.throws(()=>base32.toBytes('a======',true));
    assert.throws(()=>base32.toBytes('aa=====',true));
    assert.throws(()=>base32.toBytes('aaa====',true));
	assert.throws(()=>base32.toBytes('aaaa===',true));
	assert.throws(()=>base32.toBytes('aaaaa==',true));
	assert.throws(()=>base32.toBytes('aaaaaa=',true));
    //Too much padding
    assert.throws(()=>base32.toBytes('MY=======',true));
    assert.throws(()=>base32.toBytes('MZXQ=====',true));
    assert.throws(()=>base32.toBytes('MZXW6====',true));
    assert.throws(()=>base32.toBytes('MZXW6YQ==',true));
	assert.throws(()=>base32.toBytes('MZXW6YTB=',true));
});


tsts.run();
