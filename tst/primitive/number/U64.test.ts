import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U64 } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U64');

tsts(`U64.low|high`,()=>{
	const u=U64.fromBytesBE(hex.toBytes('FEDCBA9876543210'));
	assert.equal(u.low,0x76543210);
	assert.equal(u.high,0xFEDCBA98);
})

// prettier-ignore
const xorTest=[
    // A^0=A: Anything xor zero is anything
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A^1=~A:  Anything XOR 1 is its compliment
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','0000000000000000'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','FEDCBA9876543210'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','0123456789ABCDEF'],
    // A^~A=1 Anything xor its compliment is 1
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A^A=A Anything xor itself is 0
    ['00000000FFFFFFFF','00000000FFFFFFFF','0000000000000000'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','0000000000000000'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','0000000000000000'],
    ['FEDCBA9876543210','FEDCBA9876543210','0000000000000000'],
    // Other cases
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBA9789ABCDEF'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5AA5A5A5AC3'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','0123456786543210'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','3C5A5A5A55A5A53C'],
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFE'],
];
for (const [a,b,expect] of xorTest) {
	tsts(`${a} ^ ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U64.fromBytesBE(bBytes);
		const res = aUint.xor(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

// prettier-ignore
const orTest=[
    // A|0=A: Anything or zero is anything
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A|1=1:  Anything or 1 is 1
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FFFFFFFFFFFFFFFF'],
    // A|~A=1: Anything or its compliment is 1
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A|A=A: Anything or itself is itself
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000000FFFFFFFF'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C'],
    ['FEDCBA9876543210','FEDCBA9876543210','FEDCBA9876543210'],
    // Any bits set override the other value (form of masking)
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBA9FFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5AFFFFFFFFF'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FFFFFFFFF6543210'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','FFFFFFFFF5A5A53C'],
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
];
for (const [a,b,expect] of orTest) {
	tsts(`${a} | ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U64.fromBytesBE(bBytes);
		const res = aUint.or(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

// prettier-ignore
const andTest=[
    // A&0=0: Zero and anything is zero
    ['0000000000000000','FFFFFFFFFFFFFFFF','0000000000000000'],
    ['0000000000000000','0123456789ABCDEF','0000000000000000'],
    ['0000000000000000','FEDCBA9876543210','0000000000000000'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A&1=A:  All set and anything is anything
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','0123456789ABCDEF'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FEDCBA9876543210'],
    // A&~A=0: Anything and its compliment is 0
    ['00000000FFFFFFFF','FFFFFFFF00000000','0000000000000000'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','0000000000000000'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','0000000000000000'],
    ['FEDCBA9876543210','0123456789ABCDEF','0000000000000000'],
    // A&A=A: Anything and itself is itself
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000000FFFFFFFF'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C'],
    ['FEDCBA9876543210','FEDCBA9876543210','FEDCBA9876543210'],
    // Only bits set to true in both survive (form of masking)
    ['FEDCBA9876543210','0000000FFFFFFFFF','0000000876543210'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','00000005A5A5A53C'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FEDCBA9870000000'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','C3A5A5A5A0000000'],
    ['0000000000000001','0000000000000002','0000000000000000'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','0000000000000001'],
];
for (const [a,b,expect] of andTest) {
	tsts(`${a} & ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U64.fromBytesBE(bBytes);
		const res = aUint.and(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const notTest = [
	['0000000000000000', 'FFFFFFFFFFFFFFFF'],
	['00000000FFFFFFFF', 'FFFFFFFF00000000'],
	['FFFFFFFF00000000', '00000000FFFFFFFF'],
	['FFFFFFFFFFFFFFFF', '0000000000000000'],
	['C3A5A5A5A5A5A53C', '3C5A5A5A5A5A5AC3'], //A=1010, 5=0101, C=1100, 3=0011
	['C35A5A5A5A5A5A3C', '3CA5A5A5A5A5A5C3'],
	['FEDCBA9876543210', '0123456789ABCDEF'],
	['0123456789ABCDEF', 'FEDCBA9876543210'],
];
for (const [start,expect] of notTest) {
	tsts(`~${start}`, () => {
		const aBytes = hex.toBytes(start);
		const aUint = U64.fromBytesBE(aBytes);
		const res = aUint.not();
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const lShiftTest:[string,number,string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],

	['FFFFFFFFFFFFFFFF', 0, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 1, 'FFFFFFFFFFFFFFFE'],
	['FFFFFFFFFFFFFFFF', 13, 'FFFFFFFFFFFFE000'],
	['FFFFFFFFFFFFFFFF', 32, 'FFFFFFFF00000000'],
	['FFFFFFFFFFFFFFFF', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, 'FDB97530ECA86420'],
	['FEDCBA9876543210', 4, 'EDCBA98765432100'],
	['FEDCBA9876543210', 8, 'DCBA987654321000'],
	['FEDCBA9876543210', 16, 'BA98765432100000'],
	['FEDCBA9876543210', 24, '9876543210000000'],
	['FEDCBA9876543210', 28, '8765432100000000'],
	['FEDCBA9876543210', 31, '3B2A190800000000'],
	['FEDCBA9876543210', 32, '7654321000000000'],
	['FEDCBA9876543210', 33, 'ECA8642000000000'],
	['FEDCBA9876543210', 36, '6543210000000000'],
	['FEDCBA9876543210', 48, '3210000000000000'],
	['FEDCBA9876543210', 63, '0000000000000000'],
	['FEDCBA9876543210', 64, '0000000000000000'],
    //['FEDCBA9876543210', -1, '7F6E5D4C3B2A1908'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '02468ACF13579BDE'],
	['0123456789ABCDEF', 4, '123456789ABCDEF0'],
	['0123456789ABCDEF', 8, '23456789ABCDEF00'],
	['0123456789ABCDEF', 16, '456789ABCDEF0000'],
	['0123456789ABCDEF', 24, '6789ABCDEF000000'],
	['0123456789ABCDEF', 28, '789ABCDEF0000000'],
	['0123456789ABCDEF', 31, 'C4D5E6F780000000'],
	['0123456789ABCDEF', 32, '89ABCDEF00000000'],
	['0123456789ABCDEF', 33, '13579BDE00000000'],
	['0123456789ABCDEF', 48, 'CDEF000000000000'],
	['0123456789ABCDEF', 64, '0000000000000000'],

	['8765432112345678', 8, '6543211234567800'],
	['8765432112345678', 44, '4567800000000000'],
	
	//We can exceed size with shifts
	['0123456789ABCDEF', 65, '0000000000000000'],
	['0123456789ABCDEF', 96, '0000000000000000'],
	['0123456789ABCDEF', 128, '0000000000000000'],
];
for (const [start,by,expect] of lShiftTest) {
	tsts(`${start} << ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U64.fromBytesBE(aBytes);
		const res = a.lShift(by);
		//console.log('start',start,'res',res);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const lRotTest:[string,number,string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, 'FDB97530ECA86421'],
	['FEDCBA9876543210', 4, 'EDCBA9876543210F'],
	['FEDCBA9876543210', 8, 'DCBA9876543210FE'],
	['FEDCBA9876543210', 12, 'CBA9876543210FED'],
	['FEDCBA9876543210', 16, 'BA9876543210FEDC'],
	['FEDCBA9876543210', 20, 'A9876543210FEDCB'],
	['FEDCBA9876543210', 24, '9876543210FEDCBA'],
	['FEDCBA9876543210', 28, '876543210FEDCBA9'],
	['FEDCBA9876543210', 31, '3B2A19087F6E5D4C'],
	['FEDCBA9876543210', 32, '76543210FEDCBA98'],
	['FEDCBA9876543210', 33, 'ECA86421FDB97530'],
	['FEDCBA9876543210', 36, '6543210FEDCBA987'],
	['FEDCBA9876543210', 40, '543210FEDCBA9876'],
	['FEDCBA9876543210', 44, '43210FEDCBA98765'],
	['FEDCBA9876543210', 48, '3210FEDCBA987654'],
	['FEDCBA9876543210', 52, '210FEDCBA9876543'],
	['FEDCBA9876543210', 56, '10FEDCBA98765432'],
	['FEDCBA9876543210', 60, '0FEDCBA987654321'],
	['FEDCBA9876543210', 63, '7F6E5D4C3B2A1908'],
	['FEDCBA9876543210', 64, 'FEDCBA9876543210'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '02468ACF13579BDE'],
	['0123456789ABCDEF', 4, '123456789ABCDEF0'],
	['0123456789ABCDEF', 8, '23456789ABCDEF01'],
	['0123456789ABCDEF', 12, '3456789ABCDEF012'],
	['0123456789ABCDEF', 16, '456789ABCDEF0123'],
	['0123456789ABCDEF', 20, '56789ABCDEF01234'],
	['0123456789ABCDEF', 24, '6789ABCDEF012345'],
	['0123456789ABCDEF', 28, '789ABCDEF0123456'],
	['0123456789ABCDEF', 31, 'C4D5E6F78091A2B3'],
	['0123456789ABCDEF', 32, '89ABCDEF01234567'],
	['0123456789ABCDEF', 33, '13579BDE02468ACF'],
	['0123456789ABCDEF', 36, '9ABCDEF012345678'],
	['0123456789ABCDEF', 40, 'ABCDEF0123456789'],
	['0123456789ABCDEF', 44, 'BCDEF0123456789A'],
	['0123456789ABCDEF', 48, 'CDEF0123456789AB'],
	['0123456789ABCDEF', 52, 'DEF0123456789ABC'],
	['0123456789ABCDEF', 56, 'EF0123456789ABCD'],
	['0123456789ABCDEF', 60, 'F0123456789ABCDE'],
	['0123456789ABCDEF', 63, '8091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 64, '0123456789ABCDEF'],
	//We can exceed
	['0123456789ABCDEF', 65, '02468ACF13579BDE'],//Same as 1
	['0123456789ABCDEF', -1, '8091A2B3C4D5E6F7'],//Same as 63
];
for (const [start,by,expect] of lRotTest) {
	tsts(`${start} ROL ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U64.fromBytesBE(aBytes);
		const res = a.lRot(by);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const rShiftTest:[string,number,string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['FFFFFFFFFFFFFFFF', 0, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 1, '7FFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 13, '0007FFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 32, '00000000FFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, '7F6E5D4C3B2A1908'],
	['FEDCBA9876543210', 4, '0FEDCBA987654321'],
	['FEDCBA9876543210', 8, '00FEDCBA98765432'],
	['FEDCBA9876543210', 16, '0000FEDCBA987654'],
	['FEDCBA9876543210', 24, '000000FEDCBA9876'],
	['FEDCBA9876543210', 28, '0000000FEDCBA987'],
	['FEDCBA9876543210', 31, '00000001FDB97530'],
	['FEDCBA9876543210', 32, '00000000FEDCBA98'],
	['FEDCBA9876543210', 33, '000000007F6E5D4C'],
	['FEDCBA9876543210', 36, '000000000FEDCBA9'],
	['FEDCBA9876543210', 48, '000000000000FEDC'],
	['FEDCBA9876543210', 63, '0000000000000001'],
	['FEDCBA9876543210', 64, '0000000000000000'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '0091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 4, '00123456789ABCDE'],
	['0123456789ABCDEF', 8, '000123456789ABCD'],
	['0123456789ABCDEF', 16, '00000123456789AB'],
	['0123456789ABCDEF', 24, '0000000123456789'],
	['0123456789ABCDEF', 28, '0000000012345678'],
	['0123456789ABCDEF', 31, '0000000002468ACF'],
	['0123456789ABCDEF', 32, '0000000001234567'],
	['0123456789ABCDEF', 33, '000000000091A2B3'],
	['0123456789ABCDEF', 48, '0000000000000123'],
	['0123456789ABCDEF', 63, '0000000000000000'],
	['0123456789ABCDEF', 64, '0000000000000000'],

	//We can exceed size with shifts
	['0123456789ABCDEF', 65, '0000000000000000'],
	['0123456789ABCDEF', 96, '0000000000000000'],
	['0123456789ABCDEF', 128, '0000000000000000'],
];
for (const [start,by,expect] of rShiftTest) {
	//Note JS has >> (sign aware) and >>> (zero fill) right shift,
	// but since this is an unsigned int, they have the same meaning
	tsts(`${start} >>> ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U64.fromBytesBE(aBytes);
		const res = a.rShift(by);
		//console.log('start',start,'res',res);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const rRotTest:[string,number,string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, '7F6E5D4C3B2A1908'],
	['FEDCBA9876543210', 4, '0FEDCBA987654321'],
	['FEDCBA9876543210', 8, '10FEDCBA98765432'],
	['FEDCBA9876543210', 12, '210FEDCBA9876543'],
	['FEDCBA9876543210', 16, '3210FEDCBA987654'],
	['FEDCBA9876543210', 20, '43210FEDCBA98765'],
	['FEDCBA9876543210', 24, '543210FEDCBA9876'],
	['FEDCBA9876543210', 28, '6543210FEDCBA987'],
	['FEDCBA9876543210', 31, 'ECA86421FDB97530'],
	['FEDCBA9876543210', 32, '76543210FEDCBA98'],
	['FEDCBA9876543210', 33, '3B2A19087F6E5D4C'],
	['FEDCBA9876543210', 36, '876543210FEDCBA9'],
	['FEDCBA9876543210', 40, '9876543210FEDCBA'],
	['FEDCBA9876543210', 44, 'A9876543210FEDCB'],
	['FEDCBA9876543210', 48, 'BA9876543210FEDC'],
	['FEDCBA9876543210', 52, 'CBA9876543210FED'],
	['FEDCBA9876543210', 56, 'DCBA9876543210FE'],
	['FEDCBA9876543210', 60, 'EDCBA9876543210F'],
	['FEDCBA9876543210', 63, 'FDB97530ECA86421'],
	['FEDCBA9876543210', 64, 'FEDCBA9876543210'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '8091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 4, 'F0123456789ABCDE'],
	['0123456789ABCDEF', 8, 'EF0123456789ABCD'],
	['0123456789ABCDEF', 12, 'DEF0123456789ABC'],
	['0123456789ABCDEF', 16, 'CDEF0123456789AB'],
	['0123456789ABCDEF', 20, 'BCDEF0123456789A'],
	['0123456789ABCDEF', 24, 'ABCDEF0123456789'],
	['0123456789ABCDEF', 28, '9ABCDEF012345678'],
	['0123456789ABCDEF', 31, '13579BDE02468ACF'],
	['0123456789ABCDEF', 32, '89ABCDEF01234567'],
	['0123456789ABCDEF', 33, 'C4D5E6F78091A2B3'],
	['0123456789ABCDEF', 36, '789ABCDEF0123456'],
	['0123456789ABCDEF', 40, '6789ABCDEF012345'],
	['0123456789ABCDEF', 44, '56789ABCDEF01234'],
	['0123456789ABCDEF', 48, '456789ABCDEF0123'],
	['0123456789ABCDEF', 52, '3456789ABCDEF012'],
	['0123456789ABCDEF', 56, '23456789ABCDEF01'],
	['0123456789ABCDEF', 60, '123456789ABCDEF0'],
	['0123456789ABCDEF', 63, '02468ACF13579BDE'],
	['0123456789ABCDEF', 64, '0123456789ABCDEF'],
	//We can exceed
	['0123456789ABCDEF', 65, '8091A2B3C4D5E6F7'],//Same as 1
	['0123456789ABCDEF', -1, '02468ACF13579BDE'],//Same as 63	
];
for (const [start,by,expect] of rRotTest) {
	tsts(`${start} ROR ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = U64.fromBytesBE(aBytes);
		const res = a.rRot(by);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const toStrTest=[
	'0000000000000000',
	'0000000000000001',
	'1000000000000000',
	'FEDCBA9876543210',
	'C4D5E6F78091A2B3',
];
for(const expect of toStrTest) {
	tsts(`${expect}.toString`,()=>{
		const aBytes=hex.toBytes(expect);
		const a64=U64.fromBytesBE(aBytes);
		assert.is(a64.toString(),expect);
	});
}

// prettier-ignore
const addTest=[
    // A+0=A: Anything plus zero is anything (like or)
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A+1=A:  Anything plus 1 overflows
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFE'],//Overflow
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','0123456789ABCDEE'],//Overflow
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FEDCBA987654320F'],//Overflow
    ['FFFFFFFFFFFFFFFF','0000000000000000','FFFFFFFFFFFFFFFF'],
    // A+~A .. is 1 (like or)
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A+A=2A
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000001FFFFFFFE'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','874B4B4B4B4B4A78'],//Overflow
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','86B4B4B4B4B4B478'],//Overflow
    ['FEDCBA9876543210','FEDCBA9876543210','FDB97530ECA86420'],//Overflow
    // Others
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBAA87654320F'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5B5A5A5A53B'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FEDCBA9866543210'],//Overflow
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','C3A5A5A595A5A53C'],//Overflow
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','0000000000000000'],//Overflow
];
for (const [a,b,expect] of addTest) {
	tsts(`${a} + ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U64.fromBytesBE(bBytes);
		const res = aUint.add(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const subTest:[number,number,string][]=[
	[1,1,'0000000000000000'],
	[2,1,'0000000000000001'],
	[0,2,'FFFFFFFFFFFFFFFE'],
	[0xffffffff,1,'00000000FFFFFFFE'],
	[1,0,'0000000000000001'],
];
for (const [a,b,expect] of subTest) {
	tsts(`${a} - ${b}`, () => {
		const aUint = U64.fromInt(a);
		const bUint = U64.fromInt(b);
		const res = aUint.sub(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

// prettier-ignore
const mulTest=[
	['0000000000000001','0000000000000002','0000000000000002'],
	['000000000000FFFF','000000000000FFFF','00000000FFFE0001'],
	['00000000000FFFFF','00000000000FFFFF','000000FFFFE00001'],
	['0000000000FFFFFF','0000000000FFFFFF','0000FFFFFE000001'],
	['000000000FFFFFFF','000000000FFFFFFF','00FFFFFFE0000001'],
	['00000000FFFFFFFF','00000000FFFFFFFF','FFFFFFFE00000001'],
	['0000000FFFFFFFFF','0000000FFFFFFFFF','FFFFFFE000000001'],
	['000000FFFFFFFFFF','000000FFFFFFFFFF','FFFFFE0000000001'],
	['00000FFFFFFFFFFF','00000FFFFFFFFFFF','FFFFE00000000001'],
	['0000FFFFFFFFFFFF','0000FFFFFFFFFFFF','FFFE000000000001'],
	['000FFFFFFFFFFFFF','000FFFFFFFFFFFFF','FFE0000000000001'],
	['00FFFFFFFFFFFFFF','00FFFFFFFFFFFFFF','FE00000000000001'],
	['0FFFFFFFFFFFFFFF','0FFFFFFFFFFFFFFF','E000000000000001'],
	['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','0000000000000001'],
	['000000000000FFFF','0000000000000003','000000000002FFFD'],
	['00000000000FFFFF','0000000000000035','00000000034FFFCB'],
	['0000000000FFFFFF','0000000000000357','0000000356FFFCA9'],
	['000000000FFFFFFF','000000000000357B','00000357AFFFCA85'],
	['00000000FFFFFFFF','00000000000357BD','000357BCFFFCA843'],
	['0000000FFFFFFFFF','0000000000357BDB','0357BDAFFFCA8425'],
	['000000FFFFFFFFFF','000000000357BDB7','57BDB6FFFCA84249'],
	['00000FFFFFFFFFFF','00000000357BDB75','BDB74FFFCA84248B'],
	['0000FFFFFFFFFFFF','0000000357BDB753','B752FFFCA84248AD'],
	['000FFFFFFFFFFFFF','000000357BDB7535','534FFFCA84248ACB'],
	['00FFFFFFFFFFFFFF','00000357BDB75357','56FFFCA84248ACA9'],
	['0FFFFFFFFFFFFFFF','0000357BDB75357B','AFFFCA84248ACA85'],
	['FFFFFFFFFFFFFFFF','000357BDB75357BD','FFFCA84248ACA843'],
	['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
	['00000000EE6B2800','000000000000000D','0000000C1B710800'],//4B*13 =52B
	['000000003B9ACA00','000000003B9ACA00','0DE0B6B3A7640000'],//1B*1B=1x10^18
	['0000000ABCDEF123','000000000BEBA7E9','7FFFFFFF32584DDB'],
	['7FFFFFFFFFFFFFFF','0000000000000010','FFFFFFFFFFFFFFF0'],//Prove it is unsigned
	['1111111111111111','000000000000000F','FFFFFFFFFFFFFFFF'],
	['1111111111111111','00000000000000EE','DDDDDDDDDDDDDDCE'],
	['1111111111111111','0000000000000DDD','99999999999998AD'],
	['1111111111111111','000000000000CCCC','333333333333258C'],
	['1111111111111111','00000000000BBBBB','AAAAAAAAAAA9E26B'],
	['1111111111111111','0000000000AAAAAA','FFFFFFFFFFF49F4A'],
	['1111111111111111','0000000009999999','33333333328F5C29'],
	['1111111111111111','0000000088888888','444444443B2A1908'],
	['1111111111111111','0000000777777777','33333332B3C4D5E7'],
	['1111111111111111','0000006666666666','FFFFFFF92C5F92C6'],
	['1111111111111111','0000055555555555','AAAAAA4FA4FA4FA5'],
	['1111111111111111','0000444444444444','33332EA61D950C84'],
	['1111111111111111','0003333333333333','999962FC962FC963'],
	['1111111111111111','0022222222222222','DDDB97530ECA8642'],
	['1111111111111111','0111111111111111','FFEDCBA987654321'],
];
for (const [a,b,expect] of mulTest) {
	tsts(`${a} * ${b}`, () => {
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		const bBytes = hex.toBytes(b);
		const bUint = U64.fromBytesBE(bBytes);
		const res = aUint.mul(bUint);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
	});
}

const eqTest:[number,number,boolean][]=[
	[0,0,true],
	[0,1,false],
	[0,0xffffffff,false],

	[1,0,false],
	[1,1,true],
	[1,0xffffffff,false],

	[0xffffffff,0,false],
	[0xffffffff,1,false],
	[0xffffffff,0xffffffff,true],

	//0x00000001 00000001 = 4294967297
	[4294967297,0,false],
	[4294967297,1,false],
	[4294967297,4294967296,false],
	[4294967297,4294967297,true],

];
for(const [a,b,expect] of eqTest) {
	tsts(`u64{${a}}==u64{${b}}`,()=>{
		const a64=U64.fromInt(a);
		const b64=U64.fromInt(b);
		assert.is(a64.eq(b64),expect);
	})
}

const lastByteBETest:[number,number][]=[
	[0,0],
	[1,1],
	[0x1122,0x22],
];
for(const [a,expect] of lastByteBETest) {
	tsts(`lsb(${a})`,()=>{
		const a64=U64.fromInt(a);
		assert.is(a64.lsb(),expect);
	})
}

const lsbTest:[string,number,number][]=[
	['0102030405060708',0,8],
	['0102030405060708',1,7],
	['0102030405060708',2,6],
	['0102030405060708',3,5],
	['0102030405060708',4,4],
	['0102030405060708',5,3],
	['0102030405060708',6,2],
	['0102030405060708',7,1],
	['0102030405060708',8,8],//Same as 0 because of &7
]
for(const [a,lsb,expect] of lsbTest){
	tsts(`lsb(${a},$lsb)`,()=>{
		const aBytes = hex.toBytes(a);
		const aUint = U64.fromBytesBE(aBytes);
		assert.is(aUint.lsb(lsb),expect);
	})
}

const lt64Test:[string,string][]=[
	['0102030405060708','0102030405060709'],
	['0000000000000000','FFFFFFFFFFFFFFFF'],
	['0000000000000000','0000000000000001'],
	['FFFFFFFFFFFFFFF0','FFFFFFFFFFFFFFFF'],
];
for (const [aHex,bHex] of lt64Test) {
	const aBytes=hex.toBytes(aHex);
	const bBytes=hex.toBytes(bHex);
	const a=U64.fromBytesBE(aBytes);
	const b=U64.fromBytesBE(bBytes);

	tsts(`${aHex} < ${bHex}`,()=>{
		assert.is(a.lt(b),true);
	});
	tsts(`! ${bHex} < ${aHex}`,()=>{
		assert.is(b.lt(a),false);
	});

	tsts(`${aHex} <= ${bHex}`,()=>{
		assert.is(a.lte(b),true);
	});
	tsts(`! ${bHex} < ${aHex}`,()=>{
		assert.is(b.lte(a),false);
	});

	tsts(`${bHex} > ${aHex}`,()=>{
		assert.is(b.gt(a),true);
	});
	tsts(`! ${aHex} > ${bHex}`,()=>{
		assert.is(a.gt(b),false);
	});

	tsts(`${bHex} >= ${aHex}`,()=>{
		assert.is(b.gte(a),true);
	});
	tsts(`! ${aHex} >= ${bHex}`,()=>{
		assert.is(a.gte(b),false);
	});


	//Constant time
	tsts(`${aHex} <=.ct ${bHex}`,()=>{
		assert.is(a.ctLte(b),true);
	});
	tsts(`! ${bHex} <=.ct ${aHex}`,()=>{
		assert.is(b.ctLte(a),false);
	});

	tsts(`${aHex} <.ct ${bHex}`,()=>{
		assert.is(a.ctLt(b),true);
	});
	tsts(`! ${bHex} <.ct ${aHex}`,()=>{
		assert.is(b.ctLt(a),false);
	});


	tsts(`${bHex} >=.ct ${aHex}`,()=>{
		assert.is(b.ctGte(a),true);
	});
	tsts(`! ${aHex} >=.ct ${bHex}`,()=>{
		assert.is(a.ctGte(b),false);
	});

	tsts(`${bHex} >.ct ${aHex}`,()=>{
		assert.is(b.ctGt(a),true);
	});
	tsts(`! ${aHex} >.ct ${bHex}`,()=>{
		assert.is(a.ctGt(b),false);
	});

	tsts(`! ${aHex} ==.ct ${bHex}`,()=>{
		assert.is(a.ctEq(b),false);
	});
	tsts(`! ${bHex} ==.ct ${aHex}`,()=>{
		assert.is(b.ctEq(a),false);
	});

}


const eq64Test:string[]=[
	'0000000000000000',
	'0000000000000001',
	'0102030405060708',
	'0102030405060709',
	'FFFFFFFFFFFFFFF0',
	'FFFFFFFFFFFFFFFF'
];
for (const aHex of eq64Test) {
	const aBytes=hex.toBytes(aHex);
	const a=U64.fromBytesBE(aBytes);
	const b=U64.fromBytesBE(aBytes);

	tsts(`${aHex} == ${aHex}`,()=>{
		assert.is(a.eq(b),true);
	});

	tsts(`${aHex} <= ${aHex}`,()=>{
		assert.is(a.lte(b),true);
	});

	tsts(`! ${aHex} < ${aHex}`,()=>{
		assert.is(a.lt(b),false);
	});

	tsts(`${aHex} >= ${aHex}`,()=>{
		assert.is(b.gte(a),true);
	});

	tsts(`! ${aHex} > ${aHex}`,()=>{
		assert.is(b.gt(a),false);
	});


	//Constant time
	tsts(`${aHex} ==.ct ${aHex}`,()=>{
		assert.is(a.ctEq(b),true);
	});

	tsts(`${aHex} <=.ct ${aHex}`,()=>{
		assert.is(a.ctLte(b),true);
	});

	tsts(`! ${aHex} <.ct ${aHex}`,()=>{
		assert.is(a.ctLt(b),false);
	});
	
	tsts(`${aHex} >=.ct ${aHex}`,()=>{
		assert.is(a.ctGte(b),true);
	});

	tsts(`! ${aHex} >.ct ${aHex}`,()=>{
		assert.is(a.ctGt(b),false);
	});
}

tsts(`ctSelect`,()=>{
	const aHex='0102030405060708';
	const bHex='F0E0D0C0B0A09080';
	const aBytes=hex.toBytes(aHex);
	const bBytes=hex.toBytes(bHex);
	const a=U64.fromBytesBE(aBytes);
	const b=U64.fromBytesBE(bBytes);

	assert.equal(U64.ctSelect(a,b,true).toBytesBE(),aBytes);
	assert.equal(U64.ctSelect(a,b,false).toBytesBE(),bBytes);
})

tsts(`ctSwitch`,()=>{
	const aHex='0102030405060708';
	const bHex='F0E0D0C0B0A09080';
	const aBytes=hex.toBytes(aHex);
	const bBytes=hex.toBytes(bHex);
	const a=U64.fromBytesBE(aBytes);
	const b=U64.fromBytesBE(bBytes);

	assert.equal(a.ctSwitch(b,true).toBytesBE(),bBytes);
	assert.equal(a.ctSwitch(b,false).toBytesBE(),aBytes);
})

const toMinBytesTest:[string,Uint8Array,Uint8Array][]=[
	['0000000000000000',Uint8Array.of(0),Uint8Array.of(0)],
	['0000000000000001',Uint8Array.of(1),Uint8Array.of(1)],
	['0000000000000010',Uint8Array.of(16),Uint8Array.of(16)],
	['0000000000000100',Uint8Array.of(1,0),Uint8Array.of(0,1)],
	['0000000000001000',Uint8Array.of(16,0),Uint8Array.of(0,16)],
	['0000000000010000',Uint8Array.of(1,0,0),Uint8Array.of(0,0,1)],
	['0000000000100000',Uint8Array.of(16,0,0),Uint8Array.of(0,0,16)],
	['0000000001000000',Uint8Array.of(1,0,0,0),Uint8Array.of(0,0,0,1)],
	['0000000010000000',Uint8Array.of(16,0,0,0),Uint8Array.of(0,0,0,16)],
	['0000000100000000',Uint8Array.of(1,0,0,0,0),Uint8Array.of(0,0,0,0,1)],
	['0000001000000000',Uint8Array.of(16,0,0,0,0),Uint8Array.of(0,0,0,0,16)],
	['0000010000000000',Uint8Array.of(1,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,1)],
	['0000100000000000',Uint8Array.of(16,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,16)],
	['0001000000000000',Uint8Array.of(1,0,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,0,1)],
	['0010000000000000',Uint8Array.of(16,0,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,0,16)],
	['0100000000000000',Uint8Array.of(1,0,0,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,0,0,1)],
	['1000000000000000',Uint8Array.of(16,0,0,0,0,0,0,0),Uint8Array.of(0,0,0,0,0,0,0,16)],
	['0102030405060708',Uint8Array.of(1,2,3,4,5,6,7,8),Uint8Array.of(8,7,6,5,4,3,2,1)],
];
for(const [aHex,expectBE,expectLE] of toMinBytesTest) {
	const aBytes=hex.toBytes(aHex);
	const a=U64.fromBytesBE(aBytes);
	tsts(`U64(${aHex}).toMinBytesBE`,()=>{
		assert.equal(a.toMinBytesBE(),expectBE);
	});
	tsts(`U64(${aHex}).toMinBytesLE`,()=>{
		assert.equal(a.toMinBytesLE(),expectLE);
	});
}
tsts('fromBytesLE',()=>{
	const aBytes=hex.toBytes('0100000000000000');
	const a=U64.fromBytesLE(aBytes);
	assert.equal(a.toMinBytesLE(),Uint8Array.of(1));
});

tsts(`clone`,()=>{
	//Really just for coverage (since you cannot mutate, what's the value of a clone?)
	const a=U64.fromInt(1).clone();
	assert.equal(a.eq(U64.fromInt(1)),true);
});

tsts(`mut`,()=>{
	const a=U64.fromUint32Pair(1,2);
	const b=a.mut().add(a);
	assert.equal(b.eq(U64.fromUint32Pair(2,4)),true,'b changed');
	assert.equal(a.eq(U64.fromUint32Pair(1,2)),true,'a the same');
});

tsts(`mut32`,()=>{
	const a=U64.fromUint32Pair(1,2);
	assert.equal(a.toString(),'0000000200000001');
	const u32=a.mut32();
	u32[0]=3;
	u32[1]=4;
	assert.equal(u32[0],3,'mut32 has been modified');
	assert.equal(a.toString(),'0000000200000001','u64 is the same');
});


tsts(`fromArray`,()=>{
	const a=U64.fromArray(Uint32Array.of(1,0));
	assert.equal(a.eq(U64.fromInt(1)),true);
});

tsts(`fromBuffer`,()=>{
	const a=U64.fromBuffer(Uint32Array.of(1,0).buffer);
	assert.equal(a.eq(U64.fromInt(1)),true);
});

tsts(`constants`,()=>{
	assert.equal(U64.max.toBytesBE(),Uint8Array.of(0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff));
	assert.equal(U64.zero.toBytesBE(),Uint8Array.of(0,0,0,0,0,0,0,0));
});

tsts('[Symbol.toStringTag]', () => {
    const o=U64.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U64') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U64.fromInt(1);
    const u=util.inspect(o);
    assert.is(u.startsWith('U64('),true);
});

tsts(`fromInt`,()=>{
	assert.equal(U64.fromInt(0).eq(U64.zero),true,'0');
    assert.throws(()=>{U64.fromInt(9.5e15);})
    assert.throws(()=>{U64.fromInt(-1);})
});

// tsts('general',()=>{
//     const o=U64.fromInt(1);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();
