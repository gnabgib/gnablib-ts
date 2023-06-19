import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { fpb32 } from '../../src/encoding/ieee754-fpb';
import { U32 } from '../../src/primitive/U32';

const tsts = suite('IEEE754/Float32');

const encode32Pairs = [
	[0, 0x00000000],
	[-0, 0x80000000],
	//Smallest subnormal
	[1.401298464324817e-45, 0x00000001],
	//Largest subnormal
	[1.1754942106924411e-38, 0x007fffff],
	//Smallest normal
	[1.1754943508222875e-38, 0x00800000],
	//Largest <1
	[0.9999999403953552, 0x3f7fffff],
	//Largest representable int (2^24)
	[fpb32.MAX_INT, 0x4b800000],
	[-fpb32.MAX_INT, 0xcb800000],
	[fpb32.MAX_INT - 1, 0x4b7fffff],
	[1 - fpb32.MAX_INT, 0xcb7fffff],
	[fpb32.MAX_INT - 2, 0x4b7ffffe],
	[2 - fpb32.MAX_INT, 0xcb7ffffe],

	[1, 0x3f800000],
	[-1, 0xbf800000],

	[2, 0x40000000],
	[-2, 0xc0000000],

	[100, 0x42c80000],
	[-100, 0xc2c80000],

	[2.8088085651397705, 0x4033c385],

	//Extremes
	[3.4028234663852886e38, 0x7f7fffff],
	[-3.4028234663852886e38, 0xff7fffff],

	[Infinity, 0x7f800000],
	[-Infinity, 0xff800000],

	//Since NaN!==NaN you cannot do this here
	//[NaN,0x7fffffff],
];

for (const test of encode32Pairs) {
	tsts('decode: ' + test[1].toString(16), () => {
		const b = U32.toBytesBE(test[1]);
		assert.is(fpb32.fromBytes(b), test[0]);
	});
	tsts('encode: ' + test[0], () => {
		const b = fpb32.toBytes(test[0]);
		const expHex = hex.fromBytes(U32.toBytesBE(test[1]));
		assert.is(hex.fromBytes(b), expHex);
	});
}

const nanHex = '7FFFFFFF';
const nanBytes = hex.toBytes(nanHex);

tsts('decode: 0x7fffffff (NaN)', () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(Number.isNaN(fpb32.fromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = fpb32.toBytes(NaN);
	assert.is(hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(Number.isNaN(fpb32.fromBytes(hex.toBytes('7F800001'))), true);
	assert.is(Number.isNaN(fpb32.fromBytes(hex.toBytes('7FC00000'))), true); //JS uses this form
	assert.is(Number.isNaN(fpb32.fromBytes(hex.toBytes('7F801000'))), true);
});

tsts('encode oversized', () => {
	const enc = fpb32.toBytes(1e39);
	const dec = fpb32.fromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts.run();
