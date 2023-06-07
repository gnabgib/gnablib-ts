import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import { asLE} from '../../src/endian/platform';
import { U32, U32Mut } from '../../src/primitive/U32';

const tsts = suite('Uint32');

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
        const u=U32.fromInt(a);
        assert.is(u.xor(U32.fromInt(b)).value,result);
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
        const u=U32.fromInt(a);        
        assert.is(u.or(U32.fromInt(b)).value,result);
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
        const u=U32.fromInt(a);
        assert.is(u.and(U32.fromInt(b)).value,result);
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
        const u=U32.fromInt(start);
        assert.is(u.not().value,result);
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
];
for (const [start,by,result] of lRot) {
	tsts(start + ' rol ' + by, () => {
        const u=U32.fromInt(start);
        assert.is(u.lRot(by).value,result);
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
];
for (const [start,by,result] of lShift) {
	tsts(start + ' << ' + by, () => {
        const u=U32.fromInt(start);
        assert.is(u.lShift(by).value,result);
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
];
for (const [start,by,result] of rShift) {
	tsts(start + ' >> ' + by, () => {
        const u=U32.fromInt(start);
        assert.is(u.rShift(by).value,result);
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
];
for (const [start,by,result] of rRot) {
	tsts(start + ' ror ' + by, () => {
        const u=U32.fromInt(start);
        assert.is(u.rRot(by).value,result);
	});
}

const addTest=[
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
for (const [a,b,result] of addTest) {
	tsts(a + ' + ' + b, () => {
        const u=U32.fromInt(a);
        assert.is(u.add(U32.fromInt(b)).value,result);
	});
}

const subTest=[
    [1,1,0],
    [2,1,1],
    [0,1,0xFFFFFFFF],
    [0,2,0xFFFFFFFE]
];
for(const [a,b,result] of subTest) {
	tsts(a + ' - ' + b, () => {
        const u=U32.fromInt(a);
        assert.is(u.sub(U32.fromInt(b)).value,result);
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
        const u=U32.fromInt(a);
        assert.is(u.mul(U32.fromInt(b)).value,result);
	});
}

tsts('toString',()=>{
    const u=U32.fromInt(0x12345678);
    //endian isn't relevant
    assert.is(u.toString(),'u32{12345678}')
});

tsts('toBytesLE',()=> {
    //littleEndian
    const u=U32.fromInt(0x01020304);
    assert.is(u.value,0x01020304);
    const b=u.toBytesLE();
    //Because toBytes is PLATFORM encoded, let's fix
    asLE.i32(b);
    assert.is(u.value,0x01020304);
    assert.is(Hex.fromBytes(b),'04030201');
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
            assert.throws(()=>U32.fromInt(start));
        } else {
            assert.is(U32.fromInt(start).value,expect);
        }
    });
}

tsts('fromArray',()=> {
    const src=new Uint32Array([13,29]);
    const u0=U32.fromArray(src,0);
    const u1=U32.fromArray(src,1);
    assert.is(u0.value,13);
    assert.is(u1.value,29);

    //Confirm u0 is just a view onto src - change to src effect u0
    src[0]=44;
    assert.is(u0.value,44);//changed by src update
    assert.is(u1.value,29);//no change
});

tsts('zero/min/max',()=> {
    assert.is(U32.zero.value,0,'zero');
    assert.is(U32.min.value,0,'min');
    assert.is(U32.max.value,0xffffffff,'max');
});



const coerces:[number|Uint32Array|U32|U32Mut,number|undefined][]=[
    //Numbers
    [-1,undefined],//Negative, would fit in an i32
    [0x1ffffffff,undefined],//Too large
    [1,1],//Goldilocks
    [0x32,0x32],//Goldilocks
    //Uint32Array
    [Uint32Array.of(0x32),0x32],
    [Uint32Array.of(3,2,1),3],
    //Uint32
    [U32.fromInt(0x32),0x32],
    [U32.fromArray(Uint32Array.of(3,2,1),1),2],
    //Uint32Mut - note these are treated the same as Uint32 because of inheritance
    [U32Mut.fromInt(0x43),0x43],
    [U32Mut.fromArray(Uint32Array.of(5,7,22),2),22],
];
for(const [start,expect] of coerces) {
    tsts(`coerce(${start})`,()=>{
        if (expect===undefined) {
            assert.throws(()=>U32.coerce(start));
        } else {
            const u=U32.coerce(start);
            assert.instance(u,U32);
            assert.is(u.value,expect);
        }
    });
}

const rot32 = [
	//Start, left, end
	[0, 0, 0],
	[0, 1, 0],
	[0, 4, 0],
	[0, 7, 0],
	[0, 15, 0],
	[0, 31, 0],

	[1, 0, 1],
	[1, 1, 2],
	[1, 4, 0x10],
	[1, 7, 0x80],
	[1, 15, 0x8000],
	[1, 31, 0x80000000],
	[1, 32, 1],

	[2, 0, 2],
	[2, 1, 4],
	[2, 4, 0x20],
	[2, 7, 0x100],
	[2, 15, 0x10000],
	[2, 31, 1],

	[4, 0, 4],
	[4, 1, 0x8],
	[4, 4, 0x40],
	[4, 7, 0x200],
	[4, 15, 0x20000],
	[4, 31, 2],

	[8, 0, 8],
	[8, 1, 0x10],
	[8, 4, 0x80],
	[8, 7, 0x400],
	[8, 15, 0x40000],
	[8, 31, 4],

	[0x80, 0, 0x80],
	[0x80, 1, 0x100],
	[0x80, 4, 0x800],
	[0x80, 7, 0x4000],
	[0x80, 15, 0x400000],
	[0x80, 31, 0x40],

	[0x800, 0, 0x800],
	[0x800, 1, 0x1000],
	[0x800, 4, 0x8000],
	[0x800, 7, 0x40000],
	[0x800, 15, 0x4000000],
	[0x800, 31, 0x400],

	[0x8000, 0, 0x8000],
	[0x8000, 1, 0x10000],
	[0x8000, 4, 0x80000],
	[0x8000, 7, 0x400000],
	[0x8000, 15, 0x40000000],
	[0x8000, 31, 0x4000],

	[0x80000, 0, 0x80000],
	[0x80000, 1, 0x100000],
	[0x80000, 4, 0x800000],
	[0x80000, 7, 0x4000000],
	[0x80000, 15, 4],
	[0x80000, 31, 0x40000],
	
	[0x800000, 0, 0x800000],
	[0x800000, 1, 0x1000000],
	[0x800000, 4, 0x8000000],
	[0x800000, 7, 0x40000000],
	[0x800000, 15, 0x40],
	[0x800000, 31, 0x400000],

	[0x8000000, 0, 0x8000000],
	[0x8000000, 1, 0x10000000],
	[0x8000000, 4, 0x80000000],
	[0x8000000, 7, 0x4],
	[0x8000000, 15, 0x400],
	[0x8000000, 31, 0x4000000],

	[0x10000000, 0, 0x10000000],
	[0x10000000, 1, 0x20000000],
	[0x10000000, 4, 1],
	[0x10000000, 7, 8],
	[0x10000000, 15, 0x800],
	[0x10000000, 31, 0x8000000],
	
	[0x20000000, 0, 0x20000000],
	[0x20000000, 1, 0x40000000],
	[0x20000000, 4, 2],
	[0x20000000, 7, 0x10],
	[0x20000000, 15, 0x1000],
	[0x20000000, 31, 0x10000000],

	[0x40000000, 0, 0x40000000],
	[0x40000000, 1, 0x80000000],
	[0x40000000, 4, 4],
	[0x40000000, 7, 0x20],
	[0x40000000, 15, 0x2000],
	[0x40000000, 31, 0x20000000],

	[0x80000000, 0, 0x80000000],
	[0x80000000, 1, 1],
	[0x80000000, 4, 8],
	[0x80000000, 7, 0x40],
	[0x80000000, 15, 0x4000],
	[0x80000000, 31, 0x40000000],

	//1010=a, 0101=5, odd shift=switch, even shift=other
	[0xaaaaaaaa, 0, 0xaaaaaaaa],
	[0xaaaaaaaa, 1, 0x55555555],
	[0xaaaaaaaa, 4, 0xaaaaaaaa],
	[0xaaaaaaaa, 7, 0x55555555],
	[0xaaaaaaaa, 15, 0x55555555],
	[0xaaaaaaaa, 31, 0x55555555],

	//1000=8 move 1 0001, move 2 0010 move 3 0100, move 4=1000
	[0x88888888, 0, 0x88888888],
	[0x88888888, 1, 0x11111111],
	[0x88888888, 4, 0x88888888],
	[0x88888888, 7, 0x44444444],
	[0x88888888, 15, 0x44444444],
	[0x88888888, 31, 0x44444444],

	//=0100 1001 0010 0100 1001 0010 0100 1001
	[0x49249249, 0, 0x49249249],
	[0x49249249, 1, 0x92492492],
	[0x49249249, 4, 0x92492494],
	[0x49249249, 7, 0x924924a4],
	[0x49249249, 15, 0x4924a492],
	[0x49249249, 31, 0xa4924924],

	[0x01234567, 0, 0x01234567],
	[0x01234567, 1, 0x02468ace],
	[0x01234567, 4, 0x12345670],
	[0x01234567, 7, 0x91a2b380],
	[0x01234567, 15, 0xa2b38091],
	[0x01234567, 31, 0x8091a2b3],

	[0x0a442081, 0, 0x0a442081],
	[0x0a442081, 1, 0x14884102],
	[0x0a442081, 4, 0xa4420810],
	[0x0a442081, 7, 0x22104085],
	[0x0a442081, 15, 0x10408522],
	[0x0a442081, 31, 0x85221040],

	[0x0103070f, 0, 0x0103070f],
	[0x0103070f, 1, 0x02060e1e],
	[0x0103070f, 4, 0x103070f0],
	[0x0103070f, 7, 0x81838780],
	[0x0103070f, 15, 0x83878081],
	[0x0103070f, 31, 0x80818387],
];

for (const [start,by,expectLeft] of rot32) {
	const left = U32.rol(start, by) >>> 0;
	tsts('rol32:' + start + ',' + by, () => {
		assert.is(left, expectLeft);
	});

	tsts('ror32:' + left + ',' + by, () => {
		assert.is(U32.ror(left, by) >>> 0, start);
	});
}


const rol32OversizedTests=[
    [0xffff0000,1,0xfffe0001],//Would catch an unsigned right shift
    //Oversized tests - make sure the input is truncated
    [0x1fffff1ff,3,0xffff8fff],
    [0x1fffff1ff,11,0xff8fffff],
    [0x1fffff1ff,31,0xfffff8ff],
    [0xf0f0f0f0f0,4,0x0f0f0f0f],
    [0xf0f0f0f0f0,8,0xf0f0f0f0],
];
for (const [start,by,expect] of rol32OversizedTests) {
    tsts(`rol32 (${Hex.fromI32(start)},${by})`,()=>{
        const actual=U32.rol(start,by)>>>0;
        assert.is(actual,expect);
    })
}

const ror32OversizedTests=[
    [0xffff0000,1,0x7fff8000],//Would catch an unsigned right shift
    //Oversized tests - make sure the input is truncated
    [0x1fffff1ff,3,0xfffffe3f],
    [0x1fffff1ff,11,0x3ffffffe],
    [0x1fffff1ff,31,0xffffe3ff],
    [0xf0f0f0f0f0,4,0x0f0f0f0f],
    [0xf0f0f0f0f0,8,0xf0f0f0f0],
];
for (const [start,by,expect] of ror32OversizedTests) {
    tsts(`ror32 (${Hex.fromI32(start)},${by})`,()=>{
        const actual=U32.ror(start,by)>>>0;
        assert.is(actual,expect);
    })
}

tsts.run();