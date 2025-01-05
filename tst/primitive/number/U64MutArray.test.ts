import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U64,U64Mut, U64MutArray } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U64MutArray');


tsts('fromLen',()=>{
    const len=3;
    const a=U64MutArray.fromLen(len);
    assert.is(a.length,len);
    for(let i=0;i<len;i++) assert.is(a.at(i).eq(U64.zero),true,'=0');

    assert.is(a.toString(),'len=3')

    a.at(0).addEq(U64Mut.coerce(11));
    a.at(1).addEq(U64Mut.coerce(13));
    a.at(2).addEq(U64Mut.coerce(17));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');

    a.at(1).xorEq(U64Mut.fromBytesBE(hex.toBytes('C3A5A5A5A5A5A53C')));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'C3A5A5A5A5A5A531'+'0000000000000011');

    //Double xor is like an undo
    a.at(1).xorEq(U64Mut.fromBytesBE(hex.toBytes('C3A5A5A5A5A5A53C')));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');
});

tsts('add stays in bounds',()=>{
    const len=3;
    const a=U64MutArray.fromLen(len);
    assert.is(a.length,len);
    assert.is(hex.fromBytes(a.toBytesBE()),'0000000000000000'+'0000000000000000'+'0000000000000000');

    a.at(1).addEq(U64Mut.fromUint32Pair(0xffffffff,0xffffffff));
    assert.is(hex.fromBytes(a.toBytesBE()),'0000000000000000'+'FFFFFFFFFFFFFFFF'+'0000000000000000');

    //Adding 1 should foll over to 0 and NOT update a[0]
    a.at(1).addEq(U64Mut.fromInt(1));
    assert.is(hex.fromBytes(a.toBytesBE()),'0000000000000000'+'0000000000000000'+'0000000000000000');
});

tsts('array copy by El',()=>{
    const len=3;
    const a=U64MutArray.fromLen(len);
    a.at(0).addEq(U64Mut.coerce(11));
    a.at(1).addEq(U64Mut.coerce(13));
    a.at(2).addEq(U64Mut.coerce(17));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');

    const b=U64MutArray.fromLen(len);
    b.at(0).set(U64Mut.fromInt(69));//THis will be ignored
    for(let i=0;i<a.length;i++) b.at(i).set(a.at(i));
    assert.is(hex.fromBytes(b.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');
})

tsts('array clone',()=>{
    const u32= Uint32Array.of(0xff,0xffff,0xffffff,0xffffffff,0xf,0xfff,0xfffff,0xfffffff);
    const a=U64MutArray.fromBytes(u32.buffer,8);
    assert.is(a.length,3);
    assert.is(hex.fromBytes(a.toBytesBE()),'FFFFFFFF00FFFFFF'+'00000FFF0000000F'+'0FFFFFFF000FFFFF');

    const b=a.clone();
    assert.is(hex.fromBytes(b.toBytesBE()),'FFFFFFFF00FFFFFF'+'00000FFF0000000F'+'0FFFFFFF000FFFFF');
})

tsts('set',()=>{
    const u32= Uint32Array.of(0xff,0xffff,0xffffff,0xffffffff,0xf,0xfff,0xfffff,0xfffffff);
    const a=U64MutArray.fromBytes(u32.buffer,8);
    assert.is(a.length,3);
    assert.is(hex.fromBytes(a.toBytesBE()),'FFFFFFFF00FFFFFF'+'00000FFF0000000F'+'0FFFFFFF000FFFFF');

    const b=U64MutArray.fromLen(2);
    b.at(0).set(U64Mut.fromInt(11));
    b.at(1).set(U64Mut.fromInt(13));
    a.set(b);
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0FFFFFFF000FFFFF');

})

// tsts('out of bounds access',()=>{
//     const a=new Uint32Array(3);
//     console.log(a[10]);
//     console.log(a.length);

//     const b=new Uint32Array(a.buffer,0,3);
//     console.log(b.length);
// });

tsts('fromBytes',()=> {
    const u8=hex.toBytes('0B00000000000000'+'0D00000000000000'+'1100000000000000');
    assert.is(u8.length,24);
    const u64=U64MutArray.fromBytes(u8.buffer);
    assert.is(u64.length,3,'u64 len');
    assert.is(hex.fromBytes(u64.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');
});

// prettier-ignore
const xorTest:[string,string,number,string][]=[
    // A^0=A: Anything xor zero is anything
    [
        'FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF',
        'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        1,
        'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000'
    ],
    [
        'FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF',
        'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        0,
        '0000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
    ]
];
let count=0;
for (const [a,b,startAt,expect] of xorTest) {
	tsts(`xorEq ${count++}`, () => {
		const aBytes = hex.toBytes(a);
        const aArr=U64MutArray.fromBytes(aBytes.buffer);
		const bBytes = hex.toBytes(b);
		const bArr=U64MutArray.fromBytes(bBytes.buffer);
        aArr.xorEq(bArr,startAt);
		assert.is(hex.fromBytes(aArr.toBytesBE()), expect);
	});
}

tsts('[Symbol.toStringTag]', () => {
    const o=U64MutArray.fromLen(2);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U64MutArray') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U64MutArray.fromLen(2);
    const u=util.inspect(o);
    assert.is(u.startsWith('U64MutArray('),true);
});

tsts('zero',()=>{
    const a=U64MutArray.fromLen(3);
    a.at(0).set(U64.fromInt(1));
    a.at(1).set(U64.fromInt(2));
    a.at(2).set(U64.fromInt(4));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
    a.zero();
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000000000000000000000000000000000000')
});

tsts('mut',()=>{
    const a=U64MutArray.fromLen(3);
    a.at(0).set(U64.fromInt(1));
    a.at(1).set(U64.fromInt(2));
    a.at(2).set(U64.fromInt(4));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
    const b=a.mut();
    assert.equal(hex.fromBytes(b.toBytesBE()),'000000000000000100000000000000020000000000000004')
    b.at(2).set(U64.fromInt(8));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
    assert.equal(hex.fromBytes(b.toBytesBE()),'000000000000000100000000000000020000000000000008')
});

tsts('span',()=>{
    const a=U64MutArray.fromLen(3);
    a.at(0).set(U64.fromInt(1));
    a.at(1).set(U64.fromInt(2));
    a.at(2).set(U64.fromInt(4));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004');
    const b=a.span(1,1);
    b.at(0).set(U64.fromInt(8));
    assert.equal(hex.fromBytes(b.toBytesBE()),'0000000000000008');
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000080000000000000004');

    const c=a.span(undefined,1);
    c.at(0).set(U64.fromInt(0xffffffff));
    assert.equal(hex.fromBytes(a.toBytesBE()),'00000000FFFFFFFF00000000000000080000000000000004');
});

tsts('toBytesLE',()=>{
    const a=U64MutArray.fromLen(3);
    a.at(0).set(U64.fromInt(1));
    a.at(1).set(U64.fromInt(2));
    a.at(2).set(U64.fromInt(4));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
    assert.equal(hex.fromBytes(a.toBytesLE()),'010000000000000002000000000000000400000000000000')
});

tsts('fromU32s',()=>{
    const a=U64MutArray.fromU32s(2,1,4,3);
    assert.equal(a.at(0).toString(),'0000000100000002');
    assert.equal(a.at(1).toString(),'0000000300000004');
    assert.equal(a.length,2);
});

tsts('fromU32s odd throws',()=>{
    assert.throws(()=>U64MutArray.fromU32s(1));
});

// tsts('general',()=>{
//     const o=U64MutArray.fromLen(2);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();
