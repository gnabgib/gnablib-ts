import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import {  U64 } from '../../../src/primitive/number';
import util from 'util';
import { U128, U128Mut } from '../../../src/primitive/number/U128';

const tsts = suite('U128Mut');

// prettier-ignore
const xorTests:[string,string,string][]=[
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    ['00000000000000000000000000000001','00000000000000000000000000000002','00000000000000000000000000000003'],
    ['00000000000000000000000000000003','00000000000000000000000000000002','00000000000000000000000000000001'],
];
for (const [a,b,expect] of xorTests) {
    //We're mostly just checking that a is mutated and b isn't.. see U128.test.ts for comprehensive xor
	tsts(`${a} ^= ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
        aUint.xorEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
        assert.is(hex.fromBytes(bUint.toBytesBE()), b);
	});
}

// prettier-ignore
const orTests:[string,string,string][]=[
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    ['00000000000000000000000000000001','00000000000000000000000000000002','00000000000000000000000000000003'],
    ['00000000000000000000000000000003','00000000000000000000000000000002','00000000000000000000000000000003'],
];
for (const [a,b,expect] of orTests) {
    //We're mostly just checking that a is mutated and b isn't.. see U128.test.ts for comprehensive xor
	tsts(`${a} |= ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
        aUint.orEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
        assert.is(hex.fromBytes(bUint.toBytesBE()), b);
	});
}

// prettier-ignore
const andTests:[string,string,string][]=[
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF','00000000000000000000000000000000'],
    ['00000000000000000000000000000001','00000000000000000000000000000002','00000000000000000000000000000000'],
    ['00000000000000000000000000000003','00000000000000000000000000000002','00000000000000000000000000000002'],
];
for (const [a,b,expect] of andTests) {
    //We're mostly just checking that a is mutated and b isn't.. see U128.test.ts for comprehensive xor
	tsts(`${a} &= ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
        aUint.andEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
        assert.is(hex.fromBytes(bUint.toBytesBE()), b);
	});
}

// prettier-ignore
const notTests:[string,string][]=[
    ['00000000000000000000000000000000','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
];
for (const [a,expect] of notTests) {
	tsts(`~${a}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
        aUint.notEq();
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect,'1st (Invert)');
        aUint.notEq();
        assert.is(hex.fromBytes(aUint.toBytesBE()), a,'2nd (Return)');
	});
}

// Extensive testing is in U128.test.ts which this mostly shares code with, the only difference
// being this modifies internal state
// prettier-ignore
const lShiftEqTests:[string,number,string][]=[
    ['FEDCBA9876543210FEDCBA9876543210', 31, '3B2A19087F6E5D4C3B2A190800000000'],
];
for (const [start,by,expect] of lShiftEqTests) {
	tsts(`${start} <<= ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U128Mut.fromBytesBE(aBytes);
		a.lShiftEq(by);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

// Extensive testing is in U128.test.ts
// prettier-ignore
const lRotEqTests:[string,number,string][]=[
    ['FEDCBA9876543210FEDCBA9876543210', 31, '3B2A19087F6E5D4C3B2A19087F6E5D4C'],
    //We can exceed
    ['0123456789ABCDEF0123456789ABCDEF', 129, '02468ACF13579BDE02468ACF13579BDE'],
    ['0123456789ABCDEF0123456789ABCDEF', -1, '8091A2B3C4D5E6F78091A2B3C4D5E6F7'],
];
for (const [start,by,expect] of lRotEqTests) {
	tsts(`${start} ROL= ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U128Mut.fromBytesBE(aBytes);
		a.lRotEq(by);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

// Extensive testing is in U128.test.ts
// prettier-ignore
const rShiftEqTests:[string,number,string][] = [
    ['0123456789ABCDEFFEDCBA9876543210', 31, '0000000002468ACF13579BDFFDB97530'],
];
for (const [start,by,expect] of rShiftEqTests) {
	//Note JS has >> (sign aware) and >>> (zero fill) right shift,
	// but since this is an unsigned int, they have the same meaning
	tsts(`${start} >>>= ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U128Mut.fromBytesBE(aBytes);
		a.rShiftEq(by);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

// prettier-ignore
const rRotEqTests:[string,number,string][] = [
    ['0123456789ABCDEFFEDCBA9876543210', 31, 'ECA8642002468ACF13579BDFFDB97530'],    
	//We can exceed
    ['0123456789ABCDEFFEDCBA9876543210', 129, '0091A2B3C4D5E6F7FF6E5D4C3B2A1908'],//=1
    ['0123456789ABCDEFFEDCBA9876543210', -1, '02468ACF13579BDFFDB97530ECA86420'],//=127
];
for (const [start,by,expect] of rRotEqTests) {
	tsts(`${start} ROR= ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U128Mut.fromBytesBE(aBytes);
		a.rRotEq(by);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

// prettier-ignore
const addEqTests:[string,string,string][]=[
    ['C3A5A5A5A5A5A5A5A5A5A5A5A5A5A53C','C3A5A5A5A5A5A5A5A5A5A5A5A5A5A53C','874B4B4B4B4B4B4B4B4B4B4B4B4B4A78'],
];
for (const [a,b,expect] of addEqTests) {
	tsts(`${a} += ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
		aUint.addEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
	});
}

// prettier-ignore
const subEqTests:[string,string,string][]=[
    ['00000000000000000000000000000001','00000000000000000000000000000003','FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE'],
    ['00000000000000000000000000000003','00000000000000000000000000000001','00000000000000000000000000000002'],
];
for (const [a,b,expect] of subEqTests) {
	tsts(`${a} -= ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
		aUint.subEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
	});
}

// prettier-ignore
const mulEqTests:[string,string,string][]=[
    ['000000000000000FFFFFFFFFFFFFFFFF','000000000000000FFFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFE00000000000000001'],
];
for (const [a,b,expect] of mulEqTests) {
	tsts(`${a} *= ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U128Mut.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U128.fromBytesBE(bBytes);
		aUint.mulEq(bUint);
		assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
	});
}

tsts(`clone`,()=>{
	const a=U128Mut.fromInt(1);
	const b=a.clone();
	assert.equal(a.eq(U128.fromInt(1)),true);
    assert.equal(b.eq(U128.fromInt(1)),true);
	
	b.set(U128.fromInt(2));
	assert.equal(a.eq(U128.fromInt(1)),true);
	assert.equal(b.eq(U128.fromInt(2)),true);
});

tsts(`set`,()=>{
	const a=U128Mut.fromInt(1);
	assert.equal(a.eq(U128.fromInt(1)),true);
	
	a.set(U128.fromInt(2));
	assert.equal(a.eq(U128.fromInt(2)),true);
});

tsts(`zero`,()=>{
    //Note mut.zero sets internal content to zero (find better name?)
    //While U.zero is a constant that represents... zero
	const a=U128Mut.fromUint32Quad(0xFFFFFFFF,0xFFFFFFFF,0xFFFFFFFF,0xFFFFFFFF);
    a.zero();
	assert.equal(a.eq(U128.zero),true);
});

tsts('[Symbol.toStringTag]', () => {
    const o=U128Mut.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U128Mut') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U128Mut.fromInt(1);
    const u=util.inspect(o);
    assert.is(u.startsWith('U128Mut('),true);
});

tsts(`fromIntUnsafe`,()=>{
    const a=U128Mut.fromIntUnsafe(0);
    assert.instance(a,U128Mut)
	assert.equal(a.eq(U128.zero),true,'0');
    assert.equal(U128Mut.fromIntUnsafe(0xffffffff).eq(U128.fromIntUnsafe(0xffffffff)),true,'0xffffffff');
    assert.equal(U128Mut.fromIntUnsafe(9.5e15).eq(U128.fromUint32Quad(0x1D5DC000,0x21C033,0,0)),true,'9.5e15 truncates');
    assert.equal(U128Mut.fromIntUnsafe(-1).eq(U128.fromIntUnsafe(0xffffffff)),true,'-1 becomes unsigned (0xffffffff)');
});

tsts(`fromInt`,()=>{
	assert.equal(U128Mut.fromInt(0).eq(U128.zero),true,'0');
    assert.equal(U128Mut.fromInt(0xffffffff).eq(U128.fromIntUnsafe(0xffffffff)),true,'0xffffffff');
    assert.throws(()=>{const c=U128Mut.fromInt(9.5e15);})
    assert.throws(()=>{const d=U128Mut.fromInt(-1);})
});

tsts(`fromUint32Quad`,()=>{
    const a=U128Mut.fromUint32Quad(1,2,3,4);
	assert.equal(a.toString(),"00000004000000030000000200000001");//Note endian
});

tsts(`fromU64Pair`,()=>{
    const a=U128Mut.fromU64Pair(U64.fromInt(1),U64.fromInt(2));
	assert.equal(a.toString(),"00000000000000020000000000000001");//Note endian
});

// prettier-ignore
const testsFromBytes:[Uint8Array,string][]=[
    [Uint8Array.of(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16),'0102030405060708090A0B0C0D0E0F10'],
];
for (const [bytes,expect] of testsFromBytes) {
	tsts(`fromBytesBE(${expect})`, () => {
		const aUint = U128Mut.fromBytesBE(bytes);
        assert.is(hex.fromBytes(aUint.toBytesBE()), expect);
	});
	tsts(`fromBytesLE(${expect})`, () => {
		const aUint = U128Mut.fromBytesLE(bytes);
        assert.is(hex.fromBytes(aUint.toBytesLE()), expect);
	});
}

tsts.run();
