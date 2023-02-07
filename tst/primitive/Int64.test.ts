import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import { Int64 } from '../../src/primitive/Int64';

const tsts = suite('Int64');

// prettier-ignore
const ltSet = [
    ['0000000000000000', '0000000000000001', true, false], // 0<1
	['0000000000000001', '0000000000000002', true, false], // 1<2
	['7FFFFFFFFFFFFFFE', '7FFFFFFFFFFFFFFF', true, false], // 9223372036854775806 <  9223372036854775807
	['8000000000000000', '7FFFFFFFFFFFFFFF', true, false], //-9223372036854775808 <  9223372036854775807
	['8000000000000000', '8000000000000001', true, false], //-9223372036854775808 < -9223372036854775807
	['FFFFFFFFFFFFFFFF', '0000000000000000', true, false], //-1 < 0
	['FFFFFFFFFFFFFFFF', '7FFFFFFFFFFFFFFF', true, false], //-1 < 9223372036854775807
	['FFFFFFFFFFFFFFFE', 'FFFFFFFFFFFFFFFF', true, false], //-2 < -1
	['FFFFFFFFFFFFFF80', 'FFFFFFFFFFFFFFFF', true, false], //-128 < -1
    ['FFE0000000000001', 'FFFFFF8000000001', true, false], //-9007199254740991 < -549755813887
	//EQ
	['7FFFFFFFFFFFFFFF', '7FFFFFFFFFFFFFFF', false, true],
	['FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', false, true],
	['8000000000000000', '8000000000000000', false, true],
	['8000000000000001', '8000000000000001', false, true],
    ['FFFFFFFFFFFFFF80','FFFFFFFFFFFFFFFF',true,false],//-128 < -1    
];

for (const test of ltSet) {
	const av = Int64.fromBytes(hex.toBytes(test[0] as string));
	const bv = Int64.fromBytes(hex.toBytes(test[1] as string));

	tsts(av.toString() + '==' + bv.toString(), () => {
		assert.equal(av.equals(bv), test[3] as boolean);
	});

	tsts(av.toString() + '<' + bv.toString(), () => {
		assert.equal(av.lt(bv), test[2] as boolean);
	});

	tsts(av.toString() + '<=' + bv.toString(), () => {
		const expLt = test[2] as boolean;
		const expEq = test[3] as boolean;

		assert.equal(av.lte(bv), expLt || expEq);
	});

	tsts(bv.toString() + '>' + av.toString(), () => {
		assert.equal(bv.gt(av), test[2] as boolean);
	});

	tsts(bv.toString() + '>=' + av.toString(), () => {
		const expGt = test[2] as boolean;
		const expEq = test[3] as boolean;

		assert.equal(bv.gte(av), expGt || expEq);
	});
}
const ltNum = [
	[0, 1, true, false],
	[1, 2, true, false],
	[-128, -1, true, false],
	[-128, -128, false, true],
	[-549755813888, -549755813887, true, false],
	[-9007199254740991, -549755813887, true, false],
];
for (const test of ltNum) {
	const av = Int64.fromNumber(test[0] as number);
	const bv = Int64.fromNumber(test[1] as number);
	const expEq = test[3] as boolean;
	//console.log(`${av.toString()} < ${bv.toString()}`);

	tsts(test[0] + ' == ' + test[1], () => {
		assert.equal(av.equals(bv), expEq);
	});
	tsts(test[0] + ' < ' + test[1] + ':', () => {
		assert.equal(av.lt(bv), test[2]);
	});
	tsts(test[0] + '<=' + test[1], () => {
		const expLt = test[2] as boolean;
		assert.equal(av.lte(bv), expLt || expEq);
	});
	tsts(test[1] + ' > ' + test[0] + ':', () => {
		assert.equal(bv.gt(av), test[2]);
	});
	tsts(test[1] + '>=' + test[0], () => {
		const expGt = test[2] as boolean;
		assert.equal(bv.gte(av), expGt || expEq);
	});
}
const safeNum = [
	//num, negative
	[0, false],
	[1, false],
	[2, false],
	[127, false],
	[128, false],
	[32768, false],
	[8388607, false],
	[2147483647, false],
	[549755813887, false],
	[140737488355327, false],
	[Number.MAX_SAFE_INTEGER, false],
	//Negative
	[-1, true],
	[-127, true],
	[-128, true],
	[-32767, true],
	[-32768, true],
	[-8388607, true],
	[-8388608, true],
	[-2147483647, true],
	[-2147483648, true],
	[-2147483649, true],
	[-4294967296, true],
	[-549755813887, true], //            FFFFFF80_00000001
	[-549755813888, true], //            FFFFFF80_00000000
	[-140737488355327, true], //         FFFF8000_00000001
	[-140737488355328, true], //         FFFF8000_00000000
	[Number.MIN_SAFE_INTEGER, true], //  FFE00000_00000001
];
for (const test of safeNum) {
	const i64 = Int64.fromNumber(test[0] as number);
	tsts(
		'fromNumber ' + test[0] + ' (' + hex.fromBytes(i64.toBytes()) + '):',
		() => {
			//es2020 only
			//assert.equal(i64.toBigInt(), BigInt(test[0]), 'toBigInt');
			assert.equal(i64.toSafeInt(), test[0], 'toSafeInt');
			assert.equal(i64.negative, test[1] as boolean, 'negative');
		}
	);
}
const absSet = [
	[0, 0],
	[1, 1],
	[2, 2],
	[127, 127],
	[128, 128],
	[32768, 32768],
	[8388607, 8388607],
	[2147483647, 2147483647],
	[549755813887, 549755813887],
	[140737488355327, 140737488355327],
	[9007199254740991, 9007199254740991], //MAX_SAFE_INT
	[-1, 1],
	[-127, 127],
	[-128, 128],
	[-32767, 32767],
	[-32768, 32768],
	[-8388607, 8388607],
	[-8388608, 8388608],
	[-2147483647, 2147483647],
	[-2147483648, 2147483648],
	[-4294967296, 4294967296],
	[-549755813887, 549755813887],
	[-549755813888, 549755813888],
	[-140737488355327, 140737488355327],
	[-140737488355328, 140737488355328],
	[-9007199254740991, 9007199254740991], //MIN_SAFE_INT
];
for (const test of absSet) {
	const i64 = Int64.fromNumber(test[0]);
	tsts('abs ' + test[0] + ':', () => {
		assert.equal(i64.abs().toSafeInt(), test[1]);
	});
}
//ES2020 only
// const absBigIntSet = [
// 	[36028797018963967n, 36028797018963967n],
// 	[1311768467463790321n, 1311768467463790321n],
// 	[9223372036854775807n, 9223372036854775807n], //largest int64
// 	[-36028797018963968n, 36028797018963968n],
// 	[-7460683158431872087n, 7460683158431872087n],
// 	[-9223372036854775807n, 9223372036854775807n], //second lowest int64
// 	//This is a special case.. the lowest i64 is one larger in magnitude than can
// 	// be represented in positive numbers.  The ABS algo leads to the same answer
// 	// back.  The "right" answer could be undefined?  Hard to say
// 	[-9223372036854775808n, -9223372036854775808n], //smallest int64
// ];
// for (const test of absBigIntSet) {
// 	const i64 = Int64.fromBigInt(test[0]);
// 	tsts('abs ' + test[0] + ':', () => {
// 		assert.equal(i64.abs().toBigInt(), test[1]);
// 	});
// }

//ES2020 only
// const hexSet = [
// 	['0000000000000000', 0n],
// 	['0000000000000001', 1n],
// 	['0000000000000002', 2n],
// 	['000000000000007F', 127n],
// 	['0000000000000080', 128n],
// 	['0000000000007FFF', 32767n],
// 	['0000000000008000', 32768n],
// 	['00000000007FFFFF', 8388607n],
// 	['000000007FFFFFFF', 2147483647n],
// 	['0000007FFFFFFFFF', 549755813887n],
// 	['00007FFFFFFFFFFF', 140737488355327n],
// 	['001FFFFFFFFFFFFF', 9007199254740991n], //MAX_SAFE_INT
// 	['007FFFFFFFFFFFFF', 36028797018963967n],
// 	['123456789ABCDEF1', 1311768467463790321n],
// 	['7FFFFFFFFFFFFFFF', 9223372036854775807n], //largest int64
// 	// negative
// 	['FFFFFFFFFFFFFFFF', -1n],
// 	['FFFFFFFFFFFFFF80', -128n],
// 	['FFFFFFFFFFFF8000', -32768n],
// 	['FFFFFFFFFF800000', -8388608n],
// 	['FFFFFFFF80000000', -2147483648n],
// 	['FFFFFFFF00000000', -4294967296n],
// 	['FFFFFF8000000000', -549755813888n],
// 	['FFFF800000000000', -140737488355328n],
// 	['FFE0000000000001', -9007199254740991n], //MIN_SAFE_INT
// 	['FF80000000000000', -36028797018963968n],
// 	['987654321FEDCBA9', -7460683158431872087n], //6789 ABCD
// 	['8000000000000000', -9223372036854775808n], //smallest int64
// ];
// for (const test of hexSet) {
// 	const bytes = hex.toBytes(test[0] as string);
// 	const i64 = Int64.fromBytes(bytes);
// 	//ES2020 only
// 	tsts('fromBytes (' + test[0] + ')', () => {
// 		assert.equal(test[1] as bigint, i64.toBigInt());
// 	});
// 	tsts('fromBigInt (' + test[1] + ')', () => {
// 		const bi = Int64.fromBigInt(test[1] as bigint);
// 		assert.equal(bi.equals(i64), true);
// 	});
// }

tsts('max', () => {
	//ES2020 only
	//assert.equal(Int64.max.toBigInt(), 9223372036854775807n, 'toBigInt');
	assert.equal(Int64.min.toSafeInt(), undefined, 'toSafeInt');
});
tsts('min', () => {
	//ES2020 only
	//assert.equal(Int64.min.toBigInt(), -9223372036854775808n, 'toBigInt');
	assert.equal(Int64.min.toSafeInt(), undefined, 'toSafeInt');
});
tsts('maxSafe', () => {
	//ES2020 only
	//assert.equal(Int64.maxSafe.toBigInt(), 9007199254740991n, 'toBigInt');
	assert.equal(Int64.maxSafe.toSafeInt(), Number.MAX_SAFE_INTEGER, 'toSafeInt');
});
tsts('minSafe', () => {
	//ES2020 only
	//assert.equal(Int64.minSafe.toBigInt(), -9007199254740991n, 'toBigInt');
	assert.equal(Int64.minSafe.toSafeInt(), Number.MIN_SAFE_INTEGER, 'toSafeInt');
});

// prettier-ignore
const toMinBytes=[
    [0,                 '00',            '0000000000000000'],
    [1,                 '01',            '0000000000000001'],
    [100,               '64',            '0000000000000064'],
    [127,               '7F',            '000000000000007F'],
    [128,               '0080',          '0000000000000080'],//2^7
    [256,               '0100',          '0000000000000100'],
    [32767,             '7FFF',          '0000000000007FFF'],
    [32768,             '008000',        '0000000000008000'],//2^15
    [65536,             '010000',        '0000000000010000'],//2^16
    [8388607,           '7FFFFF',        '00000000007FFFFF'],
    [8388608,           '00800000',      '0000000000800000'],//2^23
    [16777216,          '01000000',      '0000000001000000'],//2^24
    [2147483647,        '7FFFFFFF',      '000000007FFFFFFF'],
    [2147483648,        '0080000000',    '0000000080000000'],//2^31
    [4294967296,        '0100000000',    '0000000100000000'],//2^32
    [549755813887,      '7FFFFFFFFF',    '0000007FFFFFFFFF'],
    [549755813888,      '008000000000',  '0000008000000000'],//2^39
    [1099511627776,     '010000000000',  '0000010000000000'],//2^40
    [140737488355327,   '7FFFFFFFFFFF',  '00007FFFFFFFFFFF'],
    [140737488355328,   '00800000000000','0000800000000000'],//2^47
    [281474976710656,   '01000000000000','0001000000000000'],//2^48
    [4503599627370496,  '10000000000000','0010000000000000'],//2^52
    [9007199254740991,  '1FFFFFFFFFFFFF','001FFFFFFFFFFFFF'],//2^53 | MAX_SAFE_INT

    // negative
    [-1,                'FF',            'FFFFFFFFFFFFFFFF'],
    [-100,              '9C',            'FFFFFFFFFFFFFF9C'],
    [-127,              '81',            'FFFFFFFFFFFFFF81'],
    [-128,              '80',            'FFFFFFFFFFFFFF80'],//-2^7
    [-129,              'FF7F',          'FFFFFFFFFFFFFF7F'],
    [-256,              'FF00',          'FFFFFFFFFFFFFF00'],
    [-32768,            '8000',          'FFFFFFFFFFFF8000'],//-2^15
    [-32769,            'FF7FFF',        'FFFFFFFFFFFF7FFF'],
    [-65536,            'FF0000',        'FFFFFFFFFFFF0000'],//-2^16
    [-8388608,          '800000',        'FFFFFFFFFF800000'],//-2^23
    [-8388609,          'FF7FFFFF',      'FFFFFFFFFF7FFFFF'],
    [-2147483648,       '80000000',      'FFFFFFFF80000000'],//-2^31
    [-2147483649,       'FF7FFFFFFF',    'FFFFFFFF7FFFFFFF'],
    [-549755813888,     '8000000000',    'FFFFFF8000000000'],//-2^39
    [-549755813889,     'FF7FFFFFFFFF',  'FFFFFF7FFFFFFFFF'],//FFFFFF7FFFFFFFFF
    [-140737488355328,  '800000000000',  'FFFF800000000000'],//-2^47
    [-140737488355329,  'FF7FFFFFFFFFFF','FFFF7FFFFFFFFFFF'],
    [-281474976710656,  'FF000000000000','FFFF000000000000'],//-2^48
    [-4503599627370496, 'F0000000000000','FFF0000000000000'],//-2^52
    [-9007199254740991, 'E0000000000001','FFE0000000000001'],//-2^53 | MIN_SAFE_INT
];
for (const test of toMinBytes) {
	const bytesAsHex = test[1] as string;
	const bytes = hex.toBytes(bytesAsHex);
	const i64 = Int64.fromNumber(test[0] as number);
	tsts('toBytes ' + test[0] + ':', () => {
		assert.equal(hex.fromBytes(i64.toBytes()), test[2] as string);
	});
	tsts('toMinBytes ' + test[0] + '/' + i64.toString() + ':', () => {
		const minBytes = i64.toMinBytes();
		//Compare as hex (easier to debug)
		assert.equal(hex.fromBytes(minBytes), bytesAsHex, 'hex');
		assert.equal(minBytes.length, bytesAsHex.length / 2, 'len');
	});
	tsts('fromMinBytes 0x' + test[1] + ':', () => {
		const fromMin = Int64.fromMinBytes(bytes, 0, bytes.length);
		assert.equal(
			i64.equals(fromMin),
			true,
			'i64(' + i64.toString() + ')==fromMin(' + fromMin.toString() + ')'
		);
	});
}

//ES2020 only
// // prettier-ignore
// const bigToMinBytes=[
//     [1n,                   '01',              '0000000000000001'],
//     [36028797018963967n,   '7FFFFFFFFFFFFF',  '007FFFFFFFFFFFFF'],
//     [1311768467463790321n, '123456789ABCDEF1','123456789ABCDEF1'],
//     [9223372036854775807n, '7FFFFFFFFFFFFFFF','7FFFFFFFFFFFFFFF'],//largest int64
//     [-1n,                  'FF',              'FFFFFFFFFFFFFFFF'],
//     [-36028797018963968n,  '80000000000000',  'FF80000000000000'],
//     [-7460683158431872087n,'987654321FEDCBA9','987654321FEDCBA9'],
//     [-9223372036854775807n,'8000000000000001','8000000000000001'],//second lowest int64
//     [-9223372036854775808n,'8000000000000000','8000000000000000']//smallest int64
// ];
// for (const test of bigToMinBytes) {
// 	const bytesAsHex = test[1] as string;
// 	const bytes = hex.toBytes(bytesAsHex);
// 	const i64 = Int64.fromBigInt(test[0] as bigint);
// 	tsts('bigToBytes ' + test[0] + ':', () => {
// 		assert.equal(hex.fromBytes(i64.toBytes()), test[2] as string);
// 	});
// 	tsts('bigToMinBytes ' + test[0].toString() + ':', () => {
// 		const minBytes = i64.toMinBytes();
// 		//Compare as hex (easier to debug)
// 		assert.equal(hex.fromBytes(minBytes), bytesAsHex, 'hex');
// 		assert.equal(minBytes.length, bytesAsHex.length / 2, 'len');
// 	});
// 	tsts('bigFromMinBytes 0x' + test[1] + ':', () => {
// 		const fromMin = Int64.fromMinBytes(bytes, 0, bytes.length);
// 		assert.equal(
// 			i64.equals(fromMin),
// 			true,
// 			'i64(' + i64.toString() + ')==fromMin(' + fromMin.toString() + ')'
// 		);
// 	});
// }

tsts.run();
