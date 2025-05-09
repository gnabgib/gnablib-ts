import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U16 } from '../../../src/primitive/number/U16Static';
import { ByteWriter } from '../../../src/primitive/ByteWriter';

const tsts = suite('U16Static');

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
	const left = U16.lRot(start, by);
	tsts(`rol16(${hex.fromI32(start)}, ${by})`, () => {
		assert.is(left, expectLeft);
	});

    tsts(`rol16(${hex.fromI32(left)}, ${by})`, () => {
		assert.is(U16.rRot(left, by), start);
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
    tsts(`rol16 (${hex.fromI32(start)},${by})`,()=>{
        const actual=U16.lRot(start,by)>>>0;
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
    tsts(`ror16 (${hex.fromI32(start)},${by})`,()=>{
        const actual=U16.rRot(start,by)>>>0;
        assert.is(actual,expect);
    })
}

// const bytesBETests:[Uint8Array,number,number][]=[
// 	[new Uint8Array(0),0,0],
// 	[Uint8Array.of(1),0,1],
// 	[Uint8Array.of(2,1),0,0x201],
// 	[Uint8Array.of(2,1),1,1],
// 	[Uint8Array.of(3,2,1),0,0x302],//Note source can be oversized (it's funny)
// 	[Uint8Array.of(3,2,1),1,0x201],
// 	[Uint8Array.of(3,2,1),2,1],
// 	[Uint8Array.of(3,2,1),3,0],//Note pos can be out of bounds
// ];
// for (const [src,pos,expect] of bytesBETests) {
//     tsts(`fromBytesBE(0x${hex.fromBytes(src)}, ${pos}):`,()=>{
// 		const actual=U16.fromBytesBE(src,pos);
//         assert.is(actual,expect);
//     })
// }

const bytesLE_tests:[number,number,string][]=[
	[2,0x201,'0102'],
	[4,0x201,'01020000'],
	[4,0x102,'02010000'],
];
for(const [size,u16,uHex] of bytesLE_tests) {
	tsts(`[${size}].intoBytesLE(${u16})`,()=>{
		const bytes=new Uint8Array(size);
		const bw=ByteWriter.mount(bytes);
		U16.intoBytesLE(u16,bw);
		assert.is(hex.fromBytes(bytes),uHex);
	});
	tsts(`fromBytesLE(${uHex})`,()=>{
		const bytes=hex.toBytes(uHex);
		assert.is(U16.fromBytesLE(bytes),u16);
	})
}

const bytesBE_tests:[number,number,string][]=[
	[2,0x201,'0201'],
	[4,0x201,'02010000'],
	[4,0x102,'01020000'],
];
for(const [size,u16,expect] of bytesBE_tests) {
	tsts(`[${size}].intoBytesBE(${u16})`,()=>{
		const bytes=new Uint8Array(size);
		const bw=ByteWriter.mount(bytes);
		U16.intoBytesBE(u16,bw);
		assert.is(hex.fromBytes(bytes),expect);
	});
	tsts(`fromBytesBE(${expect})`,()=>{
		const bytes=hex.toBytes(expect);
		assert.is(U16.fromBytesBE(bytes),u16);
	})
}

const ltTest:[number,number][]=[
	[0x0102,0x0103],
	[0x0000,0xFFFF],
	[0x0000,0x0001],
	[0xFFF0,0xFFFF],
];
for (const [a,b] of ltTest) {

	//Constant time
	tsts(`${a} <=.ct ${b}`,()=>{
		assert.is(U16.ctLte(a,b),true);
	});
	tsts(`! ${b} <=.ct ${a}`,()=>{
		assert.is(U16.ctLte(b,a),false);
	});

	tsts(`${a} <.ct ${b}`,()=>{
		assert.is(U16.ctLt(a,b),true);
	});
	tsts(`! ${b} <.ct ${a}`,()=>{
		assert.is(U16.ctLt(b,a),false);
	});


	tsts(`${b} >=.ct ${a}`,()=>{
		assert.is(U16.ctGte(b,a),true);
	});
	tsts(`! ${a} >=.ct ${b}`,()=>{
		assert.is(U16.ctGte(a,b),false);
	});

	tsts(`${b} >.ct ${a}`,()=>{
		assert.is(U16.ctGt(b,a),true);
	});
	tsts(`! ${a} >.ct ${b}`,()=>{
		assert.is(U16.ctGt(a,b),false);
	});

	tsts(`! ${a} ==.ct ${b}`,()=>{
		assert.is(U16.ctEq(a,b),false);
	});
	tsts(`! ${b} ==.ct ${a}`,()=>{
		assert.is(U16.ctEq(b,a),false);
	});
}

const eq64Test:number[]=[
	0x0000,
	0x0001,
	0x0102,
	0x0103,
	0xFFF0,
	0xFFFF
];
for (const a of eq64Test) {
    const b=a;

	//Constant time
	tsts(`${a} ==.ct ${a}`,()=>{
		assert.is(U16.ctEq(a,b),true);
	});

	tsts(`${a} <=.ct ${a}`,()=>{
		assert.is(U16.ctLte(a,b),true);
	});

	tsts(`! ${a} <.ct ${a}`,()=>{
		assert.is(U16.ctLt(a,b),false);
	});
	
	tsts(`${a} >=.ct ${a}`,()=>{
		assert.is(U16.ctGte(a,b),true);
	});

	tsts(`! ${a} >.ct ${a}`,()=>{
		assert.is(U16.ctGt(a,b),false);
	});
}

tsts(`ctSelect`,()=>{
	const a=0x0102;
	const b=0xF0E0;

	assert.equal(U16.ctSelect(a,b,true)>>>0,a);
	assert.equal(U16.ctSelect(a,b,false)>>>0,b);
})


tsts.run();
