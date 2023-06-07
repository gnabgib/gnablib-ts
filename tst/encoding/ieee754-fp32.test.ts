import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import * as ieee754 from '../../src/encoding/ieee754-fp32';
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
	[ieee754.FP32_MAX_INT, 0x4b800000],
	[-ieee754.FP32_MAX_INT, 0xcb800000],
	[ieee754.FP32_MAX_INT - 1, 0x4b7fffff],
	[1 - ieee754.FP32_MAX_INT, 0xcb7fffff],
	[ieee754.FP32_MAX_INT - 2, 0x4b7ffffe],
	[2 - ieee754.FP32_MAX_INT, 0xcb7ffffe],

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
		assert.is(ieee754.fp32FromBytes(b), test[0]);
	});
	tsts('encode: ' + test[0], () => {
		const b = ieee754.fp32ToBytes(test[0]);
		const expHex = Hex.fromBytes(U32.toBytesBE(test[1]));
		assert.is(Hex.fromBytes(b), expHex);
	});
}

const nanHex = '7FFFFFFF';
const nanBytes = Hex.toBytes(nanHex);

tsts('decode: 0x7fffffff (NaN)', () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(isNaN(ieee754.fp32FromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = ieee754.fp32ToBytes(NaN);
	assert.is(Hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(isNaN(ieee754.fp32FromBytes(Hex.toBytes('7F800001'))), true);
	assert.is(isNaN(ieee754.fp32FromBytes(Hex.toBytes('7FC00000'))), true); //JS uses this form
	assert.is(isNaN(ieee754.fp32FromBytes(Hex.toBytes('7F801000'))), true);
});

tsts('encode oversized', () => {
	const enc = ieee754.fp32ToBytes(1e39);
	const dec = ieee754.fp32FromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts.run();
