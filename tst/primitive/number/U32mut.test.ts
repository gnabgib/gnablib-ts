import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U32, U32Mut, U32ish } from '../../../src/primitive/number';
import { asBE, asLE } from '../../../src/endian';
import util from 'util';

const tsts = suite('Uint32Mut');

const xor=[
    // A^0=A: Anything xor zero is anything
    [0x00000000,0xffffffff,0xffffffff],
    [0x00000000,0x01234567,0x01234567],
    [0x00000000,0x76543210,0x76543210],
    [0x00000000,0x00000000,0x00000000],
    // A^1=~A:  Anything XOR 1 is its compliment
    [0xffffffff,0xffffffff,0x00000000],
    [0xffffffff,0x01234567,0xFEDCBA98],
    [0xffffffff,0x76543210,0x89ABCDEF],
    // A^~A=1 Anything xor its compliment is 1
    [0x0000FFFF,0xFFFF0000,0xFFFFFFFF],
    [0xC3A5A53C,0x3C5A5AC3,0xFFFFFFFF],
    [0xC35A5A3C,0x3CA5A5C3,0xFFFFFFFF],
    [0xFEDCBA98,0x01234567,0xFFFFFFFF],
    // A^A=A Anything xor itself is 0
    [0x0000FFFF,0x0000FFFF,0x00000000],
    [0xC3A5A53C,0xC3A5A53C,0x00000000],
    [0xC35A5A3C,0xC35A5A3C,0x00000000],
    [0xFEDCBA98,0xFEDCBA98,0x00000000],
    // Other cases
    [0x00000001,0x00000002,0x00000003],
    [0x00000001,0xFFFFFFFF,0xFFFFFFFE],
];
for (const [a,b,result] of xor) {
	tsts(a + ' ^ ' + b, () => {
        const u=U32Mut.fromInt(a);
        u.xorEq(U32Mut.fromInt(b));
        assert.is(u.value,result);
	});
}

const or=[
    // A|0=A: Anything or zero is anything
    [0x00000000,0xFFFFFFFF,0xFFFFFFFF],
    [0x00000000,0x01234567,0x01234567],
    [0x00000000,0x76543210,0x76543210],
    [0x00000000,0x00000000,0x00000000],
    // A|1=1:  Anything or 1 is 1
    [0xFFFFFFFF,0xFFFFFFFF,0xFFFFFFFF],
    [0xFFFFFFFF,0x01234567,0xFFFFFFFF],
    [0xFFFFFFFF,0x76543210,0xFFFFFFFF],
    // A|~A=1: Anything or its compliment is 1
    [0x0000FFFF,0xFFFF0000,0xFFFFFFFF],
    [0xC3A5A53C,0x3C5A5AC3,0xFFFFFFFF],
    [0xC35A5A3C,0x3CA5A5C3,0xFFFFFFFF],
    [0x76543210,0x01234567,0x77777777],
    // A|A=A: Anything or itself is itself
    [0x0000FFFF,0x0000FFFF,0x0000FFFF],
    [0xC3A5A53C,0xC3A5A53C,0xC3A5A53C],
    [0xC35A5A3C,0xC35A5A3C,0xC35A5A3C],
    [0x76543210,0x76543210,0x76543210],
    // Any bits set override the other value (form of masking)
    [0x76543210,0x000FFFFF,0x765FFFFF],
    [0xC3A5A53C,0x000FFFFF,0xC3AFFFFF],
    [0x76543210,0xFFFFF000,0xFFFFF210],
    [0xC3A5A53C,0xFFFFF000,0xFFFFF53C],
    [0x00000001,0x00000002,0x00000003],
    [0x00000001,0xFFFFFFFF,0xFFFFFFFF],
];
for (const [a,b,result] of or) {
	tsts(a + ' | ' + b, () => {
        const u=U32Mut.fromInt(a);
        u.orEq(U32Mut.fromInt(b));
        assert.is(u.value,result);
	});
}

const and=[
    // A&0=0: Zero and anything is zero
    [0x00000000,0xFFFFFFFF,0x00000000],
    [0x00000000,0x01234567,0x00000000],
    [0x00000000,0x76543210,0x00000000],
    [0x00000000,0x00000000,0x00000000],
    // A&1=A:  All set and anything is anything
    [0xFFFFFFFF,0xFFFFFFFF,0xFFFFFFFF],
    [0xFFFFFFFF,0x01234567,0x01234567],
    [0xFFFFFFFF,0x76543210,0x76543210],
    // A&~A=0: Anything and its compliment is 0
    [0x0000FFFF,0xFFFF0000,0x00000000],
    [0xC3A5A53C,0x3C5A5AC3,0x00000000],
    [0xC35A5A3C,0x3CA5A5C3,0x00000000],
    [0x76543210,0x01234567,0x00000000],
    // A&A=A: Anything and itself is itself
    [0x0000FFFF,0x0000FFFF,0x0000FFFF],
    [0xC3A5A53C,0xC3A5A53C,0xC3A5A53C],
    [0xC35A5A3C,0xC35A5A3C,0xC35A5A3C],
    [0x76543210,0x76543210,0x76543210],
    // Only bits set to true in both survive (form of masking)
    [0x76543210,0x000FFFFF,0x00043210],
    [0xC3A5A53C,0x000FFFFF,0x0005A53C],
    [0x76543210,0xFFFFF000,0x76543000],
    [0xC3A5A53C,0xFFFFF000,0xC3A5A000],
    [0x00000001,0x00000002,0x00000000],
    [0x00000001,0xFFFFFFFF,0x00000001],
];
for (const [a,b,result] of and) {
	tsts(a + ' & ' + b, () => {
        const u=U32Mut.fromInt(a);
        u.andEq(U32Mut.fromInt(b));
        assert.is(u.value,result);
	});
}

const not = [
	[0x00000000, 0xFFFFFFFF],
	[0x0000FFFF, 0xFFFF0000],
	[0xFFFF0000, 0x0000FFFF],
	[0xFFFFFFFF, 0x00000000],
	[0xC3A5A53C, 0x3C5A5AC3], //A=1010, 5=0101, C=1100, 3=0011
	[0xC35A5A3C, 0x3CA5A5C3],
	[0x76543210, 0x89ABCDEF],
	[0x01234567, 0xFEDCBA98],
];
for (const [start,result] of not) {
	tsts('~'+start, () => {
        const u=U32Mut.fromInt(start);
        u.notEq();
        assert.is(u.value,result);
	});
}

const lRot=[
    [0x00000000,0,0x00000000],
    [0x00000000,1,0x00000000],
    [0x00000000,3,0x00000000],
    [0x00000000,13,0x00000000],
    [0x00000000,29,0x00000000],

    [0x00000001,0,0x00000001],
    [0x00000001,1,0x00000002],
    [0x00000001,3,0x00000008],
    [0x00000001,13,0x00002000],
    [0x00000001,29,0x20000000],

    [0x0F0F0F0F,0,0x0F0F0F0F],
    [0x0F0F0F0F,1,0x1E1E1E1E],
    [0x0F0F0F0F,2,0x3C3C3C3C],
    [0x0F0F0F0F,3,0x78787878],
    [0x0F0F0F0F,4,0xF0F0F0F0],
    [0x0F0F0F0F,13,0xE1E1E1E1],
    [0x0F0F0F0F,29,0xE1E1E1E1],

    [0xF0F0F0F0,0,0xF0F0F0F0],
    [0xF0F0F0F0,1,0xE1E1E1E1],
    [0xF0F0F0F0,2,0xC3C3C3C3],
    [0xF0F0F0F0,3,0x87878787],
    [0xF0F0F0F0,4,0x0F0F0F0F],
    [0xF0F0F0F0,13,0x1E1E1E1E],
    [0xF0F0F0F0,29,0x1E1E1E1E],
    
    [0x0000FFFF,0,0x0000FFFF],
    [0x0000FFFF,1,0x0001FFFE],
    [0x0000FFFF,3,0x0007FFF8],
    [0x0000FFFF,13,0x1FFFE000],
    [0x0000FFFF,29,0xE0001FFF],
    [0x0000FFFF,32,0x0000FFFF],

    [0xFFFFFFFF,0,0xFFFFFFFF],
    [0xFFFFFFFF,1,0xFFFFFFFF],
    [0xFFFFFFFF,3,0xFFFFFFFF],
    [0xFFFFFFFF,13,0xFFFFFFFF],
    [0xFFFFFFFF,29,0xFFFFFFFF],
    [0xFFFFFFFF,32,0xFFFFFFFF],

    [0x12345678, 1, 0x2468ACF0],
	[0x12345678, 31, 0x91A2B3C],
	[0x12345678, 32, 0x12345678],
	[0x12345678, 33, 0x2468ACF0],
];
for (const [start,by,result] of lRot) {
	tsts(start + ' rol ' + by, () => {
        const u=U32Mut.fromInt(start);
        u.lRotEq(by);
        assert.is(u.value,result);
	});
}

const lShift=[
    [0x00000000,0,0x00000000],
    [0x00000000,1,0x00000000],
    [0x00000000,3,0x00000000],
    [0x00000000,13,0x00000000],
    [0x00000000,29,0x00000000],

    [0x00000001,0,0x00000001],
    [0x00000001,1,0x00000002],
    [0x00000001,3,0x00000008],
    [0x00000001,13,0x00002000],
    [0x00000001,29,0x20000000],

    [0x0F0F0F0F,0,0x0F0F0F0F],
    [0x0F0F0F0F,1,0x1E1E1E1E],
    [0x0F0F0F0F,3,0x78787878],
    [0x0F0F0F0F,13,0xE1E1E000],
    [0x0F0F0F0F,29,0xE0000000],

    [0xFFFFFFFF,0,0xFFFFFFFF],
    [0xFFFFFFFF,1,0xFFFFFFFE],
    [0xFFFFFFFF,3,0xFFFFFFF8],
    [0xFFFFFFFF,13,0xFFFFE000],
    [0xFFFFFFFF,29,0xE0000000],

    //Can exceed
	[0xffffffff, 32, 0],
	[0xffffffff, 33, 0],

];
for (const [start,by,result] of lShift) {
	tsts(start + ' << ' + by, () => {
        const u=U32Mut.fromInt(start);
        u.lShiftEq(by);
        assert.is(u.value,result);
	});
}

const rShift=[
    [0x00000000,0,0x00000000],
    [0x00000000,1,0x00000000],
    [0x00000000,3,0x00000000],
    [0x00000000,13,0x00000000],
    [0x00000000,29,0x00000000],

    [0x00000001,0,0x00000001],
    [0x00000001,1,0x00000000],
    [0x00000001,3,0x00000000],
    [0x00000001,13,0x00000000],
    [0x00000001,29,0x00000000],

    [0x0F0F0F0F,0,0x0F0F0F0F],
    [0x0F0F0F0F,1,0x07878787],
    [0x0F0F0F0F,3,0x01E1E1E1],
    [0x0F0F0F0F,13,0x00007878],
    [0x0F0F0F0F,29,0x00000000],

    [0xFFFFFFFF,0,0xFFFFFFFF],
    [0xFFFFFFFF,1,0x7FFFFFFF],
    [0xFFFFFFFF,3,0x1FFFFFFF],
    [0xFFFFFFFF,13,0x0007FFFF],
    [0xFFFFFFFF,29,0x00000007],

    //Can exceed
	[0xffffffff, 32, 0],
	[0xffffffff, 33, 0],
];
for (const [start,by,result] of rShift) {
	tsts(start + ' >> ' + by, () => {
        const u=U32Mut.fromInt(start);
        u.rShiftEq(by);
        assert.is(u.value,result);
	});
}

const rRot=[
    [0x00000000,0,0x00000000],
    [0x00000000,1,0x00000000],
    [0x00000000,3,0x00000000],
    [0x00000000,13,0x00000000],
    [0x00000000,29,0x00000000],

    [0x00000001,0,0x00000001],
    [0x00000001,1,0x80000000],
    [0x00000001,3,0x20000000],
    [0x00000001,13,0x00080000],
    [0x00000001,29,0x00000008],

    [0x0F0F0F0F,0,0x0F0F0F0F],
    [0x0F0F0F0F,1,0x87878787],
    [0x0F0F0F0F,2,0xC3C3C3C3],
    [0x0F0F0F0F,3,0xE1E1E1E1],
    [0x0F0F0F0F,4,0xF0F0F0F0],
    [0x0F0F0F0F,13,0x78787878],
    [0x0F0F0F0F,29,0x78787878],

    [0xF0F0F0F0,0,0xF0F0F0F0],
    [0xF0F0F0F0,1,0x78787878],
    [0xF0F0F0F0,2,0x3C3C3C3C],
    [0xF0F0F0F0,3,0x1E1E1E1E],
    [0xF0F0F0F0,4,0x0F0F0F0F],

    [0x0000FFFF,0,0x0000FFFF],
    [0x0000FFFF,1,0x80007FFF],
    [0x0000FFFF,3,0xE0001FFF],
    [0x0000FFFF,13,0xFFF80007],
    [0x0000FFFF,29,0x0007FFF8],
    [0x0000FFFF,32,0x0000FFFF],

    [0xFFFFFFFF,0,0xFFFFFFFF],
    [0xFFFFFFFF,1,0xFFFFFFFF],
    [0xFFFFFFFF,3,0xFFFFFFFF],
    [0xFFFFFFFF,13,0xFFFFFFFF],
    [0xFFFFFFFF,29,0xFFFFFFFF],
    [0xFFFFFFFF,32,0xFFFFFFFF],

    [0x12345678, 1, 0x91A2B3C],
	[0x12345678, 31, 0x2468ACF0],
	[0x12345678, 32, 0x12345678],
	[0x12345678, 33, 0x91A2B3C],
];
for (const [start,by,result] of rRot) {
	tsts(start + ' ror ' + by, () => {
        const u=U32Mut.fromInt(start);
        u.rRotEq(by);
        assert.is(u.value,result);
	});
}

const add=[
    // A+0=A: Anything plus zero is anything (like or)
    [0x00000000,0xFFFFFFFF,0xFFFFFFFF],
    [0x00000000,0x01234567,0x01234567],
    [0x00000000,0x76543210,0x76543210],
    [0x00000000,0x00000000,0x00000000],
    // A+1=A:  Anything plus 1 overflows
    [0xFFFFFFFF,0xFFFFFFFF,0xFFFFFFFE],//Overflow
    [0xFFFFFFFF,0x01234567,0x01234566],//Overflow
    [0xFFFFFFFF,0x76543210,0x7654320F],//Overflow
    [0xFFFFFFFF,0x00000000,0xFFFFFFFF],
    // A+~A .. is 1 (like or)
    [0x0000FFFF,0xFFFF0000,0xFFFFFFFF],
    [0xC3A5A53C,0x3C5A5AC3,0xFFFFFFFF],
    [0xC35A5A3C,0x3CA5A5C3,0xFFFFFFFF],
    [0x76543210,0x89ABCDEF,0xFFFFFFFF],
    // A+A=2A
    [0x0000FFFF,0x0000FFFF,0x0001FFFE],
    [0xC3A5A53C,0xC3A5A53C,0x874B4A78],//Overflow
    [0xC35A5A3C,0xC35A5A3C,0x86B4B478],//Overflow
    [0x76543210,0x76543210,0xECA86420],//Overflow
    // Others
    [0x76543210,0xFFFFFFFF,0x7654320F],
    [0xC3A5A53C,0x000FFFFF,0xC3B5A53B],
    [0x00000001,0x00000002,0x00000003],
    [0x00000001,0xFFFFFFFF,0x00000000],//Overflow
];
for (const [a,b,result] of add) {
	tsts(a + ' + ' + b, () => {
        const u=U32Mut.fromInt(a);
        u.addEq(U32Mut.fromInt(b));
        assert.is(u.value,result);
	});
}

const mul=[
	[0x00000001,0x00000002,0x00000002],
	[0x0000FFFF,0x0000FFFF,0xFFFE0001],
	[0x000FFFFF,0x000FFFFF,0xFFE00001],
	[0x00FFFFFF,0x00FFFFFF,0xFE000001],
	[0x0FFFFFFF,0x0FFFFFFF,0xE0000001],
	[0xFFFFFFFF,0xFFFFFFFF,0x00000001],
	[0x0000FFFF,0x00000003,0x0002FFFD],
	[0x000FFFFF,0x00000035,0x034FFFCB],
	[0x00FFFFFF,0x00000357,0x56FFFCA9],
	[0x0FFFFFFF,0x0000357B,0xAFFFCA85],
	[0xFFFFFFFF,0x000357BD,0xFFFCA843],
	[0x00000001,0xFFFFFFFF,0xFFFFFFFF],
	[0xEE6B2800,0x0000000D,0x1B710800],//4B*13 =52B
	[0x3B9ACA00,0x3B9ACA00,0xA7640000],//1B*1B=1x10^18
	[0xBCDEF123,0x0BEBA7E9,0x32584DDB],
	[0x7FFFFFFF,0x00000010,0xFFFFFFF0],//Prove it is unsigned
	[0x11111111,0x0000000F,0xFFFFFFFF],
	[0x11111111,0x000000EE,0xDDDDDDCE],
	[0x11111111,0x00000DDD,0x999998AD],
	[0x11111111,0x0000CCCC,0x3333258C],
	[0x11111111,0x000BBBBB,0xAAA9E26B],
	[0x11111111,0x00AAAAAA,0xFFF49F4A],
	[0x11111111,0x09999999,0x328F5C29],
	[0x11111111,0x88888888,0x3B2A1908],
	[0x11111111,0x77777777,0xB3C4D5E7],
	[0x11111111,0x66666666,0x2C5F92C6],
	[0x11111111,0x55555555,0xA4FA4FA5],
];
for (const [a,b,result] of mul) {
	tsts(a + ' * ' + b, () => {
        const u=U32Mut.fromInt(a);
        u.mulEq(U32Mut.fromInt(b));
        assert.is(u.value,result);
	});
}

tsts('clone',()=>{
    const u=U32Mut.fromInt(1);
    const u2=u.clone();

    assert.is(u.value,1,'Starting original');
    assert.is(u.value,1,'Starting clone');

    u.addEq(U32.fromInt(5));
    assert.is(u.value,6,'Original after add');
    assert.is(u2.value,1,'Clone after original-add (unchanged)');
    
    u2.addEq(U32.fromInt(3));
    assert.is(u.value,6,'Original after clone-add (unchanged)');
    assert.is(u2.value,4,'Clone after add');
});

tsts('toString',()=>{
    const u=U32Mut.fromInt(0x123456);
    assert.is(u.toString(),'00123456')
});

tsts('toBytesLE',()=> {
    const u=U32Mut.fromInt(0x01020304);
    assert.is(hex.fromBytes(u.toBytesLE()),'04030201');
});
tsts('toBytesBE',()=> {
    const u=U32Mut.fromInt(0x01020304);
    assert.is(hex.fromBytes(u.toBytesBE()),'01020304');
});

const fromInt:[number,number|undefined][]=[
    [0,0],
    [1,1],
    [0xffffffff,0xffffffff],
    [-1,undefined],
    [0x1ffffffff,undefined]
];
for (const [start,expect] of fromInt) {
    tsts(`fromInt(${start})`,()=> {
        if (expect===undefined) {
            assert.throws(()=>U32Mut.fromInt(start));
        } else {
            assert.is(U32Mut.fromInt(start).value,expect);
        }
    });
}

tsts('fromArray',()=> {
    const src=new Uint32Array([13,29]);
    const u0=U32Mut.fromArray(src,0);
    const u1=U32Mut.fromArray(src,1);
    assert.is(u0.value,13);
    assert.is(u1.value,29);

    //Confirm u0 is just a view onto src - change to src effect u0
    src[0]=44;
    assert.is(u0.value,44);//changed by src update
    assert.is(u1.value,29);//no change

    //Confirm src is tied to u0 - change u0
    u0.addEq(U32.fromInt(11));
    assert.is(src[0],55);//changed by u0 update
    assert.is(u1.value,29);//no change
});

tsts('fromBuffer-8',()=> {
    const src=new Uint8Array([0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80]);
    asBE.i32(src,0);
    asLE.i32(src,4);
    const u0=U32Mut.fromBuffer(src.buffer,0);
    const u1=U32Mut.fromBuffer(src.buffer,4);
    assert.is(u0.value,0x01020408);
    assert.is(u1.value,0x80402010);

    //Confirm u0 is just a view onto src, changes to either affect the other
    src[0]^=0xff;
    //We have to do this (vs precise) because we don't know if runner is 
    // big or little endian (and it's not important)
    assert.not.equal(u0.value,0x01020408);
    u0.value=0;
    assert.is(src[0],0);
});

tsts('fromBuffer-9',()=> {
    const src=new Uint8Array([0,1,2,3,4,5,6,7,8,9]);
    const u0=U32Mut.fromBuffer(src.buffer,4);
    assert.is(u0.value,0x07060504);

    //Confirm just a view
    src[7]=0x1f;
    assert.is(u0.value,0x1f060504);
    u0.value=0x70060504;
    assert.is(src[7],0x70);
});

const coerces:{
    v:U32ish,
    expect?:number
}[]=[
    //Numbers
    {
        v:-1 //Negative
    },
    {
        v:0x1ffffffff //Too big
    },
    {
        v:0x32,
        expect:0x32,
    },
    //Uint32Array
    {
        v:Uint32Array.of(0x32),
        expect:0x32,
    },
    {
        v:Uint32Array.of(3,2,1),
        expect:3,
    },
    //Uint32Mut
    {
        v:U32Mut.fromInt(0x32),
        expect:0x32,
    },
    {
        v:U32Mut.fromArray(Uint32Array.of(3,2,1),1),
        expect:2,
    }
];
for(const test of coerces) {
    tsts(`coerce(${test.v})`,()=>{
        
        if (test.expect===undefined) {
            assert.throws(()=>U32Mut.coerce(test.v));
        } else {
            const u=U32Mut.coerce(test.v);
            assert.is(u.value,test.expect);
        }
    });
}

tsts('[Symbol.toStringTag]', () => {
    const o=U32Mut.fromInt(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U32Mut') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U32Mut.fromInt(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('U32Mut('),true);
});

// tsts('general',()=>{
//     const o=U32Mut.fromInt(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();