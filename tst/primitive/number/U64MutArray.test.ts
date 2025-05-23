import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U64,U64Mut, U64MutArray } from '../../../src/primitive/number/U64';
import util from 'util';

const tsts = suite('U64MutArray');


tsts('fromLen',()=>{
    const len=3;
    const a=U64MutArray.fromLen(len);
    assert.is(a.length,len);
    for(let i=0;i<len;i++) assert.is(a.at(i).eq(U64.zero),true,'=0');

    a.at(0).addEq(U64Mut.fromInt(11));
    a.at(1).addEq(U64Mut.fromInt(13));
    a.at(2).addEq(U64Mut.fromInt(17));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');

    a.at(1).xorEq(U64Mut.fromBytesBE(hex.toBytes('C3A5A5A5A5A5A53C')));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'C3A5A5A5A5A5A531'+'0000000000000011');

    //Double xor is like an undo
    a.at(1).xorEq(U64Mut.fromBytesBE(hex.toBytes('C3A5A5A5A5A5A53C')));
    assert.is(hex.fromBytes(a.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');
});

tsts('fromU64s',()=> {
    const u64_1=U64.fromInt(1);
    const u64_10k=U64.fromInt(10000);
    const u64a=U64MutArray.fromU64s(u64_1,u64_10k);
    assert.is(u64a.length,2);
    assert.is(u64a.toString(),'00000000000000010000000000002710')
});


tsts('array copy by El',()=>{
    const len=3;
    const a=U64MutArray.fromLen(len);
    a.at(0).addEq(U64Mut.fromInt(11));
    a.at(1).addEq(U64Mut.fromInt(13));
    a.at(2).addEq(U64Mut.fromInt(17));
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

tsts('fromBytes',()=> {
    const u8=hex.toBytes('0B00000000000000'+'0D00000000000000'+'1100000000000000');
    assert.is(u8.length,24);
    const u64=U64MutArray.fromBytes(u8.buffer);
    assert.is(u64.length,3,'u64 len');
    assert.is(hex.fromBytes(u64.toBytesBE()),'000000000000000B'+'000000000000000D'+'0000000000000011');
});

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

const el2_lRot15_tests:[Uint32Array,string][]=[
    [Uint32Array.of(1,2,3,4,5,6),'000000020000000100020000000180000000000600000005'],
    [Uint32Array.of(1,2,-1,-1,5,6),'0000000200000001FFFFFFFFFFFFFFFF0000000600000005'],
];
for(const [start,expect] of el2_lRot15_tests) {
    tsts(`lRot(${start},15)`,()=>{
        const u64=U64MutArray.mount(start);
        u64.at(1).lRotEq(15);
        assert.is(hex.fromBytes(u64.toBytesBE()),expect,'lRot');
    });
}

tsts(`el2_set_test`,()=>{
    const u32=Uint32Array.of(1,2,3,4,5,6);
    const u64=U64MutArray.mount(u32);
    u64.at(1).set(U64.fromI32s(-1,-1));
    assert.is(hex.fromBytes(u64.toBytesBE()),'0000000200000001FFFFFFFFFFFFFFFF0000000600000005')
})

tsts(`at.mulEq()`,()=>{
    const u64=U64MutArray.fromLen(3);
    u64.at(0).set(U64.fromI32s(1,0));
    u64.at(1).set(U64.fromI32s(2,0));
    u64.at(2).set(U64.fromI32s(0,1));
    assert.equal(hex.fromBytes(u64.toBytesBE()),'000000000000000100000000000000020000000100000000');
    u64.at(0).mulEq(U64.fromI32s(2,0));
    assert.equal(hex.fromBytes(u64.toBytesBE()),'000000000000000200000000000000020000000100000000','[0]*2');

    u64.at(1).mulEq(U64.fromI32s(2,0));
    assert.equal(hex.fromBytes(u64.toBytesBE()),'000000000000000200000000000000040000000100000000','[1]*2');
});
tsts(`at.mulEq2`,()=>{
    const u0=U64.fromBytesBE(hex.toBytes('3837363534333231'));
    const u1=U64.fromBytesBE(hex.toBytes('3635343332313139'));

    const u64=U64MutArray.fromLen(3);
    u64.at(0).set(u0);
    u64.at(1).set(u1);
    const p=U64.fromBytesBE(hex.toBytes('C2B2AE3D27D4EB4F'));

    assert.is(hex.fromBytes(u64.at(0).mulEq(p).toBytesBE()),'4B31DC0E2273781F','0')
    assert.is(hex.fromBytes(u64.at(1).mulEq(p).toBytesBE()),'6930A2B117918397','1')
})

// tsts('zero',()=>{
//     const a=U64MutArray.fromLen(3);
//     a.at(0).set(U64.fromInt(1));
//     a.at(1).set(U64.fromInt(2));
//     a.at(2).set(U64.fromInt(4));
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
//     a.zero();
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000000000000000000000000000000000000')
// });

// tsts('mut',()=>{
//     const a=U64MutArray.fromLen(3);
//     a.at(0).set(U64.fromInt(1));
//     a.at(1).set(U64.fromInt(2));
//     a.at(2).set(U64.fromInt(4));
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
//     const b=a.mut();
//     assert.equal(hex.fromBytes(b.toBytesBE()),'000000000000000100000000000000020000000000000004')
//     b.at(2).set(U64.fromInt(8));
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004')
//     assert.equal(hex.fromBytes(b.toBytesBE()),'000000000000000100000000000000020000000000000008')
// });

// tsts('span',()=>{
//     const a=U64MutArray.fromLen(3);
//     a.at(0).set(U64.fromInt(1));
//     a.at(1).set(U64.fromInt(2));
//     a.at(2).set(U64.fromInt(4));
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004');
//     const b=a.span(1,1);
//     b.at(0).set(U64.fromInt(8));
//     assert.equal(hex.fromBytes(b.toBytesBE()),'0000000000000008');
//     assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000080000000000000004');

//     const c=a.span(undefined,1);
//     c.at(0).set(U64.fromInt(0xffffffff));
//     assert.equal(hex.fromBytes(a.toBytesBE()),'00000000FFFFFFFF00000000000000080000000000000004');
// });

tsts('toBytesLE',()=>{
    const a=U64MutArray.fromLen(3);
    a.at(0).set(U64.fromInt(1));
    a.at(1).set(U64.fromInt(2));
    a.at(2).set(U64.fromInt(4));
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000100000000000000020000000000000004','be')
    assert.equal(hex.fromBytes(a.toBytesLE()),'010000000000000002000000000000000400000000000000','le')
});

// tsts('toU32arr',()=>{
//     const a=U64MutArray.fromU32s(2,1,4,3);
//     assert.equal(a.at(0).toString(),'0000000100000002');
//     assert.equal(a.at(1).toString(),'0000000300000004');
//     const arr=a.toU32arr();
//     assert.equal(hex.fromU32s(arr),'00000002000000010000000400000003');
//     //Prove that changing the original doesn't change the copy
//     a.at(0).set(U64.fromUint32Pair(0x1111,0));
//     assert.equal(a.at(0).toString(),'0000000000001111');
//     assert.equal(hex.fromU32s(arr),'00000002000000010000000400000003');
//     //assert.equal(a.length,2);

// });

tsts('mount',()=>{
    const u32=Uint32Array.of(2,1,4,3);
    const a=U64MutArray.mount(u32);
    assert.equal(a.at(0).toString(),'0000000100000002');
    assert.equal(a.at(1).toString(),'0000000300000004');
    assert.equal(a.length,2);
});

tsts('mount odd throws',()=>{
    const u32=Uint32Array.of(2,1,4,3);
    assert.throws(()=>U64MutArray.mount(u32,1,2));
});

// tsts('fromU64s',()=>{
//     const a=U64MutArray.fromU64s(U64.fromUint32Pair(2,1),U64.fromUint32Pair(4,3),U64.fromUint32Pair(5,6))
//     assert.equal(a.length,3);
//     assert.equal(a.at(0).toString(),'0000000100000002');
//     assert.equal(a.at(1).toString(),'0000000300000004');
//     assert.equal(a.at(2).toString(),'0000000600000005');
// });

// tsts('general',()=>{
//     const o=U64MutArray.fromLen(2);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();
