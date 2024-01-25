import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/codec';
import { U64, U64MutArray } from '../../src/primitive';

const tsts = suite('Hex/RFC 4648');

const byteTests:[number,string][] = [
	[0, '00'],
	[1, '01'],
	[2, '02'],
	[3, '03'],
	[4, '04'],
	[5, '05'],
	[10, '0A'],
	[11, '0B'],
	[12, '0C'],
	[13, '0D'],
	[14, '0E'],
	[15, '0F'],
	[20, '14'],
	[21, '15'],
	[22, '16'],
	[23, '17'],
	[24, '18'],
	[25, '19'],
	[31, '1F'],
	[63, '3F'],
	[100, '64'],
	[200, 'C8'],
	[255, 'FF'],
];

for (const [num,str] of byteTests) {
	tsts('fromByte: ' + num, () => {
		assert.is(hex.fromByte(num), str);
	});

	tsts('toByte: ' + str, () => {
		assert.is(hex.toByte(str), num);
	});
}

const i32Tests:[number,string][]=[
	[1,'00000001'],
	[255,'000000FF'],
	[256,'00000100'],
	[65535,'0000FFFF'],
	[65536,'00010000'],
	[0xffffff,'00FFFFFF'],
	[16777216,'01000000'],
];

for (const [num,str] of i32Tests) {
	tsts('fromI32: ' + num, () => {
		assert.is(hex.fromI32(num), str);
	});
}

const i32CompressTests:[number,string][]=[
	[1,'01'],
	[255,'FF'],
	[256,'0100'],
	[65535,'FFFF'],
	[65536,'010000'],
	[0xffffff,'FFFFFF'],
	[16777216,'01000000'],
];
for (const [num,str] of i32CompressTests) {
	tsts('fromI32Compress: ' + num, () => {
		assert.is(hex.fromI32Compress(num), str);
	});
}

const fromBytesTests:[Uint8Array,string][]=[
	[Uint8Array.of(1,2),'0102'],
];
for (const [arr,str] of fromBytesTests) {
	tsts('fromBytes: ' + str, () => {
		assert.is(hex.fromBytes(arr), str);
	});
}

const toBytesTests:[string,Uint8Array|undefined][]=[
	['01',Uint8Array.of(1)],
	['0102',Uint8Array.of(1,2)],
	['010203',Uint8Array.of(1,2,3)],
	['01020304',Uint8Array.of(1,2,3,4)],
	['0',undefined],
	['',new Uint8Array(0)],
];
for (const [str,arr] of toBytesTests) {
	tsts('toBytes: ' + str, () => {
		if (arr===undefined) {
			assert.throws(()=>hex.toBytes(str));
		} else {
			assert.equal(hex.toBytes(str),arr);	
		}
	});
}

const fromU16sTests:[Uint16Array,string][]=[
	[Uint16Array.of(1,2),'00010002'],
];
for (const [arr,str] of fromU16sTests) {
	tsts('fromU16s: ' + str, () => {
		assert.is(hex.fromU16s(arr), str);
	});
}

const fromU32sTests:[Uint32Array,string][]=[
	[Uint32Array.of(1,2),'0000000100000002'],
];
for (const [arr,str] of fromU32sTests) {
	tsts('fromU32s: ' + str, () => {
		assert.is(hex.fromU32s(arr), str);
	});
}

const fromU64Tests:[U64,string][]=[
	[U64.fromInt(2),'0000000000000002'],
];
for (const [num,str] of fromU64Tests) {
	tsts('fromU64: ' + str, () => {
		assert.is(hex.fromU64(num), str);
	});
}

const fromU64aTests:[U64MutArray,string][]=[
	[U64MutArray.fromBytes(Uint8Array.of(1,0,0,0,0,0,0,0).buffer),'0000000000000001'],
];
for (const [arr,str] of fromU64aTests) {
	tsts('fromU64a: ' + str, () => {
		assert.is(hex.fromU64a(arr), str);
	});
}

const badHexTests:string[]=[
	'/',
	'G',
	'g',
	//' ',Whitespace is default ignored
	'@',
	'`'
];
for (const str of badHexTests) {
	tsts(`bad hex '${str}'`, () => {
		assert.throws(()=>hex.toBytes(str));
	});
}

tsts('ignore',()=>{
	assert.equal(hex.toBytes('A A',' '),Uint8Array.of(0xAA));
})

tsts.run();
