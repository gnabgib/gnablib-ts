import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { U32MutArray } from '../../../src/primitive/number/U32MutArray';
import util from 'util';
import { hex } from '../../../src/codec/Hex';

const tsts = suite('U32MutArray');

tsts('gen',()=>{
    const len=3;
    const arr=U32MutArray.fromLen(len);
    assert.is(arr.length,len);
    for(let i=0;i<len;i++) assert.is(arr.at(i).value,0);
});

tsts('set',()=>{
    const arr=U32MutArray.fromLen(3);
    assert.equal(hex.fromBytes(arr.toBytesBE()),'000000000000000000000000')
    const b=U32MutArray.fromLen(1);
    b.at(0).set(0xbeef);
    assert.equal(hex.fromBytes(b.toBytesBE()),'0000BEEF')
    arr.set(b,1);
    assert.equal(hex.fromBytes(arr.toBytesBE()),'000000000000BEEF00000000')
});

tsts('xorEq',()=>{
    const a=U32MutArray.fromLen(3);
    a.at(0).set(1);
    a.at(1).set(2);
    a.at(2).set(4);
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000010000000200000004')
    const b=U32MutArray.fromLen(2);
    b.at(0).set(2);
    b.at(1).set(160);
    //b.barf();
    assert.equal(hex.fromBytes(b.toBytesBE()),'00000002000000A0')
    a.xorEq(b);
    assert.equal(hex.fromBytes(a.toBytesBE()),'00000003000000A200000004')
});

tsts('zero',()=>{
    const a=U32MutArray.fromLen(3);
    a.at(0).set(1);
    a.at(1).set(2);
    a.at(2).set(4);
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000010000000200000004')
    a.zero();
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000000000000000000000')
});

tsts('clone',()=>{
    const a=U32MutArray.fromLen(3);
    a.at(0).set(1);
    a.at(1).set(2);
    a.at(2).set(4);
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000010000000200000004')
    const b=a.clone();
    b.at(0).set(0xBE);
    assert.equal(hex.fromBytes(a.toBytesBE()),'000000010000000200000004')
    assert.equal(hex.fromBytes(b.toBytesBE()),'000000BE0000000200000004')
});

tsts('[Symbol.toStringTag]', () => {
    const o=U32MutArray.fromLen(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U32MutArray') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U32MutArray.fromLen(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('U32MutArray('),true);
});

const fromBytesTests:string[]=[
    '0123456789ABCDEF'
];
for (const hexVal of fromBytesTests) {
	tsts(`fromBytes(${hexVal}})`, () => {
        const b=hex.toBytes(hexVal);
        const v=U32MutArray.fromBytes(b.buffer);
        assert.equal(hex.fromBytes(v.toBytesLE()),hexVal)
	});
}

// tsts('general',()=>{
//     const o=U32MutArray.fromLen(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();