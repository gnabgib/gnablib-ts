import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { U16 } from '../../src/primitive/U16';

const tsts = suite('U16');

tsts('max min zero',()=>{
	assert.is(U16.max,0xffff);
	assert.is(U16.min,0);
	assert.is(U16.zero,0);
});

const rot16 = [
	[0, 0, 0],
	[0, 1, 0],
	[0, 4, 0],
	[0, 7, 0],
	[0, 15, 0],

	[1, 0, 1],
	[1, 1, 2],
	[1, 2, 4],
	[1, 3, 8],
	[1, 4, 0x10],
	[1, 5, 0x20],
	[1, 6, 0x40],
	[1, 7, 0x80],
	[1, 8, 0x100],
	[1, 9, 0x200],
	[1, 10, 0x400],
	[1, 11, 0x800],
	[1, 12, 0x1000],
	[1, 13, 0x2000],
	[1, 14, 0x4000],
	[1, 15, 0x8000],
	[1, 16, 1],

	[2, 0, 2],
	[2, 1, 4],
	[2, 4, 0x20],
	[2, 7, 0x100],
	[2, 15, 1],

	[4, 0, 4],
	[4, 1, 0x8],
	[4, 4, 0x40],
	[4, 7, 0x200],
	[4, 15, 2],

	[8, 0, 8],
	[8, 1, 0x10],
	[8, 4, 0x80],
	[8, 7, 0x400],
	[8, 15, 4],

	[0x80, 0, 0x80],
	[0x80, 1, 0x100],
	[0x80, 4, 0x800],
	[0x80, 7, 0x4000],
	[0x80, 15, 0x40],

	[0x800, 0, 0x800],
	[0x800, 1, 0x1000],
	[0x800, 4, 0x8000],
	[0x800, 7, 0x4],
	[0x800, 15, 0x400],

	[0x8000, 0, 0x8000],
	[0x8000, 1, 1],
	[0x8000, 4, 8],
	[0x8000, 7, 0x40],
	[0x8000, 15, 0x4000],
];
for (const [start,by,expectLeft] of rot16) {
	const left = U16.rol(start, by);
	tsts(`rol16(${Hex.fromI32(start)}, ${by})`, () => {
		assert.is(left, expectLeft);
	});

    tsts(`rol16(${Hex.fromI32(left)}, ${by})`, () => {
		assert.is(U16.ror(left, by), start);
	});
}


const rol16OversizedTests=[
    [0xff00,1,0xfe01],
    //Oversized tests - make sure the input is truncated
    [0x1fffff1ff,3,0x8fff],
    [0x1fffff1ff,11,0xff8f],
    [0x1fffff1ff,31,0xf8ff],
    [0xf0f0f0f0f0,4,0x0f0f],
    [0xf0f0f0f0f0,8,0xf0f0],
];
for (const [start,by,expect] of rol16OversizedTests) {
    tsts(`rol16 (${Hex.fromI32(start)},${by})`,()=>{
        const actual=U16.rol(start,by)>>>0;
        assert.is(actual,expect);
    })
}

const ror16OversizedTests=[
    [0xff00,1,0x7f80],
    //Oversized tests - make sure the input is truncated
    [0x1fffff1ff,3,0xfe3f],
    [0x1fffff1ff,11,0x3ffe],
    [0x1fffff1ff,31,0xe3ff],
    [0xf0f0f0f0f0,4,0x0f0f],
    [0xf0f0f0f0f0,8,0xf0f0],
];
for (const [start,by,expect] of ror16OversizedTests) {
    tsts(`ror16 (${Hex.fromI32(start)},${by})`,()=>{
        const actual=U16.ror(start,by)>>>0;
        assert.is(actual,expect);
    })
}

const bytesLETests:[Uint8Array,number,number][]=[
	[new Uint8Array(0),0,0],
	[Uint8Array.of(1),0,1],
	[Uint8Array.of(2,1),0,0x102],
	[Uint8Array.of(2,1),1,1],
	[Uint8Array.of(3,2,1),0,0x203],//Note source can be oversized (it's funny)
	[Uint8Array.of(3,2,1),1,0x102],
	[Uint8Array.of(3,2,1),2,1],
	[Uint8Array.of(3,2,1),3,0],//Note pos can be out of bounds
];
for (const [src,pos,expect] of bytesLETests) {
    tsts(`iFromBytesLE(${Hex.fromBytes(src)}, ${pos}):`,()=>{
		const actual=U16.iFromBytesLE(src,pos);
        assert.is(actual,expect);
    })
}

const bytesBETests:[Uint8Array,number,number][]=[
	[new Uint8Array(0),0,0],
	[Uint8Array.of(1),0,1],
	[Uint8Array.of(2,1),0,0x201],
	[Uint8Array.of(2,1),1,1],
	[Uint8Array.of(3,2,1),0,0x302],//Note source can be oversized (it's funny)
	[Uint8Array.of(3,2,1),1,0x201],
	[Uint8Array.of(3,2,1),2,1],
	[Uint8Array.of(3,2,1),3,0],//Note pos can be out of bounds
];
for (const [src,pos,expect] of bytesBETests) {
    tsts(`iFromBytesBE(0x${Hex.fromBytes(src)}, ${pos}):`,()=>{
		const actual=U16.iFromBytesBE(src,pos);
        assert.is(actual,expect);
    })
}

tsts('toBytesLE',()=>{
	assert.equal(U16.toBytesLE(0x0201),Uint8Array.of(0x01,0x02));
});

tsts('toBytesBE',()=>{
	assert.equal(U16.toBytesBE(0x0201),Uint8Array.of(0x02,0x01));
});


tsts.run();
