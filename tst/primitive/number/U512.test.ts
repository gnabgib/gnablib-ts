import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U512 } from '../../../src/primitive/number/U512';
import util from 'util';

const tsts = suite('U512');

const h0='00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const h1='00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';
const hMax='FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
const hNum='0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F41424344';
// - binary -
// 0000000100000010000000110000010000000101000001100000011100001000
// 0000100100001010000010110000110000001101000011100000111100010001
// 0001001000010011000101000001010100010110000101110001100000011001
// 0001101000011011000111000001110100011110000111110010000100100010
// 0010001100100100001001010010011000100111001010000010100100101010
// 0010101100101100001011010010111000101111001100010011001000110011
// 0011010000110101001101100011011100111000001110010011101000111011
// 0011110000111101001111100011111101000001010000100100001101000100
// - decimal -
// 52785833603464895924505196455835395789417618063395375742788273238449007348396981891622245221846591767286403849414931512938953864592384794924881505567556
const hNNum='FEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EEEDECEBEAE9E8E7E6E5E4E3E2E1E0DEDDDCDBDAD9D8D7D6D5D4D3D2D1D0CECDCCCBCAC9C8C7C6C5C4C3C2C1C0BEBDBCBB';
const hexBuild=(h:string)=>U512.fromBytesBE(hex.toBytes(h));

const toStrTest = [
	h0,
	h1,
	'10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
	'FEDCBA98765432100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
	'00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000FEDCBA987654321',
	'C4D5E6F78091A2B30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
	'0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000C4D5E6F78091A2B3',
    hNum,
];
for (const expect of toStrTest) {
	tsts(`${expect}.toString`, () => {
		const u = hexBuild(expect)
		assert.is(u.toString(), expect);
	});
}

const u32le_hex_tests: [number[], string][] = [
	[
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ,14, 15, 16],
		'000000100000000F0000000E0000000D0000000C0000000B0000000A000000090000000800000007000000060000000500000004000000030000000200000001',
	],
];
for (const [u32s, expect] of u32le_hex_tests) {
	const fromUints = U512.fromI32s(...u32s);
	tsts(`fromUints(${u32s})`, () => {
		assert.is(fromUints.toString(), expect);
	});

	const fromBytesBE = hexBuild(expect);
	tsts(`fromBytesBE(${expect})`, () => {
		assert.is(fromBytesBE.toString(), expect, 'fromBytesBE');
	});

    tsts(`mount(${expect})`, () => {
        const arr=Uint32Array.from(u32s);
		const u = U512.mount(arr);
		assert.is(u.toString(), expect);
	});
}

const fromIntTests: [number, string][] = [
	[1, h1],
];
for (const [int, expect] of fromIntTests) {
	tsts(`fromInt(${int})`, () => {
		const u = U512.fromInt(int);
		assert.is(u.toString(), expect);
	});
}

//#region ShiftOps
// prettier-ignore
const lShift_tests: [string, number, string][] = [
    [h0, 0, h0],
    [h0, 1, h0],
    [h0, 13, h0],
    [h0, 32, h0],

    [hMax, 0, hMax],
    [hMax, 1, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE'],
    [hMax, 13, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE000'],
    [hMax, 32, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000'],
    [hMax, 64, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000'],

    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E222426282A2C2E30323436383A3C3E424446484A4C4E50525456585A5C5E626466686A6C6E70727476787A7C7E82848688'],
    [hNum, 2, '04080C1014181C2024282C3034383C44484C5054585C6064686C7074787C84888C9094989CA0A4A8ACB0B4B8BCC4C8CCD0D4D8DCE0E4E8ECF0F4F8FD05090D10'],
    [hNum, 16, '030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F414243440000'],
    [hNum, 32, '05060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F4142434400000000'],
    [hNum, 65, '121416181A1C1E222426282A2C2E30323436383A3C3E424446484A4C4E50525456585A5C5E626466686A6C6E70727476787A7C7E828486880000000000000000'],
    [hNum, 120, '1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F41424344000000000000000000000000000000'],
    [hNum, 240, '2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F41424344000000000000000000000000000000000000000000000000000000000000'],
    //Can exceed size
    [hNum, 600, h0],
];
for (const [start, by, expect] of lShift_tests) {
    tsts(`${start} << ${by}`, () => {
        const a = hexBuild(start);
        const b = a.lShift(by);
        assert.is(hex.fromBytes(b.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
    });
}
// prettier-ignore
const rShift_tests: [string, number, string][] = [
    [h0, 0, h0],
    [h0, 1, h0],
    [h0, 13, h0],
    [h0, 32, h0],

    [hMax, 0, hMax],
    [hMax, 1, '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 13, '0007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 32, '00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 64, '0000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],

    [hNum, 0, hNum],
    [hNum, 1, '0081018202830384048505860687078889098A0A8B0B8C0C8D0D8E0E8F0F9091119212931394149515961697179899199A1A9B1B9C1C9D1D9E1E9F1FA0A121A2'],
    [hNum, 2, '004080C1014181C2024282C3034383C44484C5054585C6064686C7074787C84888C9094989CA0A4A8ACB0B4B8BCC4C8CCD0D4D8DCE0E4E8ECF0F4F8FD05090D1'],
    [hNum, 16, '00000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F4142'],
    [hNum, 32, '000000000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F'],
    [hNum, 65, '00000000000000000081018202830384048505860687078889098A0A8B0B8C0C8D0D8E0E8F0F9091119212931394149515961697179899199A1A9B1B9C1C9D1D'],
    [hNum, 120, '0000000000000000000000000000000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F31323334'],
    [hNum, 240, '0000000000000000000000000000000000000000000000000000000000000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F21222324'],
    //Can exceed size
    [hNum, 600, h0],
];
for (const [start, by, expect] of rShift_tests) {
    tsts(`${start} >> ${by}`, () => {
        const a = hexBuild(start);
        const b = a.rShift(by);
        assert.is(hex.fromBytes(b.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
    });
}
//https://onlinetools.com/binary/rotate-binary-bits
//https://www.rapidtables.com/convert/number/binary-to-hex.html
// prettier-ignore
const lRot_tests: [string, number, string][] = [
    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E222426282A2C2E30323436383A3C3E424446484A4C4E50525456585A5C5E626466686A6C6E70727476787A7C7E82848688'],
    [hNum, 2, '04080C1014181C2024282C3034383C44484C5054585C6064686C7074787C84888C9094989CA0A4A8ACB0B4B8BCC4C8CCD0D4D8DCE0E4E8ECF0F4F8FD05090D10'],
    [hNum, 16, '030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F414243440102'],
    [hNum, 32, '05060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F4142434401020304'],
    [hNum, 65, '121416181A1C1E222426282A2C2E30323436383A3C3E424446484A4C4E50525456585A5C5E626466686A6C6E70727476787A7C7E82848688020406080A0C0E10'],
    [hNum, 120, '1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F414243440102030405060708090A0B0C0D0E0F'],
    [hNum, 240, '2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F414243440102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F'],
    //Can exceed size
    [hNum, 600, '0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F414243440102030405060708090A0B'],
];
for (const [start, by, expect] of lRot_tests) {
    tsts(`${start} ROL ${by}`, () => {
        const a = hexBuild(start);
        const b = a.lRot(by);
        assert.is(hex.fromBytes(b.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
    });
}
//Note these are the same as lRot(256-#)
// prettier-ignore
const rRot_tests: [string, number, string][] = [
    [hNum, 0, hNum],
    [hNum, 1, '0081018202830384048505860687078889098A0A8B0B8C0C8D0D8E0E8F0F9091119212931394149515961697179899199A1A9B1B9C1C9D1D9E1E9F1FA0A121A2'],
];
for (const [start, by, expect] of rRot_tests) {
    tsts(`${start} ROR ${by}`, () => {
        const a = hexBuild(start);
        const b = a.rRot(by);
        assert.is(hex.fromBytes(b.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
    });
}
//#endregion

//#region LogicOps
const xor_tests=[
    // A^0=A: Anything xor zero is anything
    [h0, hNum, hNum],
    // A^1=~A:  Anything XOR 1 is its compliment
    [hMax, hNum, hNNum],
    // A^~A=1 Anything xor its compliment is 1
    [hNum, hNNum, hMax],
    // A^A=A Anything xor itself is 0
    [hNum, hNum, h0],
];
for (const [aHex, bHex, expect] of xor_tests) {
    tsts(`${aHex} ^ ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex);
        const res = a.xor(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
    });
}

const or_tests=[
    // A|0=A: Anything or zero is anything
    [hNum,h0,hNum],
    // A|1=1:  Anything or 1 is 1
    [hNum,hMax,hMax],
    // A|~A=1: Anything or its compliment is 1
    [hNum,hNNum,hMax],
    // A|A=A: Anything or itself is itself
    [hNum,hNum,hNum],
];
for (const [aHex, bHex, expect] of or_tests) {
    tsts(`${aHex} | ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex);
        const res = a.or(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
    });
}

const and_tests=[
    // A&0=0: Zero and anything is zero
    [h0, hNum, h0],
    // A&1=A:  All set and anything is anything
    [hMax,hNum,hNum],
    // A&~A=0: Anything and its compliment is 0
    [hNum,hNNum,h0],
    // A&A=A: Anything and itself is itself
    [hNum,hNum,hNum],
];
for (const [aHex, bHex, expect] of and_tests) {
    tsts(`${aHex} & ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex);
        const res = a.and(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
    });
}

const not_tests = [
    [h0, hMax],
    [hNum, hNNum],
];
for (const [start, expect] of not_tests) {
    tsts(`~${start}`, () => {
        const a = hexBuild(start);
        const res = a.not();
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
    });
}
//#endregion

//#region Arithmetic

// prettier-ignore
const add_tests=[
    // A+0=A: Anything plus zero is anything (like or)
    [hNum,h0,hNum],
    [hMax,h1,h0],
    [hMax,hNum,'0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F41424343'],
];
for (const [aHex, bHex, expect] of add_tests) {
    tsts(`${aHex} + ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex);
        const res = a.add(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
        assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
    });
}

// prettier-ignore
const sub_tests:[string,string,string][]=[
    [h1,h1,h0],
    [h0,h1,hMax],
    [hNum,h1,'0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122232425262728292A2B2C2D2E2F3132333435363738393A3B3C3D3E3F41424343'],
];
for (const [aHex, bHex, expect] of sub_tests) {
    tsts(`${aHex} - ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex);
        const res = a.sub(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
        assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
    });
}

// // prettier-ignore
const mul_tests=[
    //https://www.dcode.fr/big-numbers-multiplication
    [h0,hNum,h0],
    [h1,hNum,hNum],
    [hNum,hNum,'A869E9251CCF3B603CD01916CC344E1807A3EBDE7ABFAC3F7855D6FDC62F37540C5F4BD0EDA0E9C7383BD2FAB1F740137055C2B62F2CADB1363CC2C748BCAA10'],
    //full result: 1040A1423385478A5DD1F6DC932AB35D3854C291D294E8DE85EF2A475667BB513984418153C8F0DB9939CD640E1B7C40783382751B85C3E5FC1644976EAA5A869E9251CCF3B603CD01916CC344E1807A3EBDE7ABFAC3F7855D6FDC62F37540C5F4BD0EDA0E9C7383BD2FAB1F740137055C2B62F2CADB1363CC2C748BCAA10
];
for (const [aHex, bHex, expect] of mul_tests) {
    tsts(`${aHex} * ${bHex}`, () => {
        const a = hexBuild(aHex);
        const b = hexBuild(bHex)
        const res = a.mul(b);
        assert.is(hex.fromBytes(res.toBytesBE()), expect);
        assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
        assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
    });
}
//#endregion

//#region Comparable
const neq_tests:[string,string][]=[
    [h0,h1],
    [hNum,h0],
    [hNum,h1],
    [hNum,hMax]
];
for(const [aHex,bHex] of neq_tests) {
    const a=hexBuild(aHex);
    const b=hexBuild(bHex);
    tsts(`${aHex} != ${bHex}`,()=>{
        assert.is(a.eq(b),false);
    });
    tsts(`${bHex} != ${aHex}`,()=>{
        assert.is(b.eq(a),false);
    });
}

const eq_set: string[] = [
    h0,
    h1,
    hNum,
    hMax
];
for (const aHex of eq_set) {
    const bHex = aHex;
    const a = hexBuild(aHex);
    const b = hexBuild(bHex);
    tsts(`${aHex} == ${aHex}`, () => {
        assert.is(a.eq(b), true);
    });
    tsts(`${aHex} <= ${bHex}`, () => {
        assert.is(a.lte(b), true);
    });
    tsts(`${aHex} >= ${bHex}`, () => {
        assert.is(a.gte(b), true);
    });
}

// prettier-ignore
const lt_set:[string,string][]=[
    [h0,h1],
    [h1,hNum],
    [hNum,hMax]
];
for (const [aHex, bHex] of lt_set) {
    const a = hexBuild(aHex);
    const b = hexBuild(bHex);
    tsts(`${aHex} < ${bHex}`, () => {
        assert.is(a.lt(b), true);
    });
    tsts(`${bHex} > ${aHex}`, () => {
        assert.is(b.gt(a), true);
    });
    tsts(`${aHex} <= ${bHex}`, () => {
        assert.is(a.lte(b), true);
    });
    tsts(`${bHex} >= ${aHex}`, () => {
        assert.is(b.gte(a), true);
    });
}
//#endregion


tsts(`clone`, () => {
    //Really just for coverage (since you cannot mutate, what's the value of a clone?)
    const a = U512.fromInt(1);
    const b = a.clone();
    //Object eq tests
    assert.is(a, a);
    assert.is.not(a, b);
});

tsts(`zero`, () => {
	assert.equal(U512.zero.toBytesBE(), new Uint8Array(64));
});

tsts('[Symbol.toStringTag]', () => {
	const o = U512.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U512') > 0, true);
});

tsts('util.inspect', () => {
	const o = U512.fromInt(1);
	const u = util.inspect(o);
	assert.is(u.startsWith('U512('), true);
});

tsts.run();
