import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { fp16 } from '../../src/encoding/ieee754-fp16';
import { U16 } from '../../src/primitive/U16';

const tsts = suite('IEEE754/Float16');

const encode16Pairs = [
	[0, 0x0000],
	[-0, 0x8000],
	//Smallest subnormal
	[0.00000005960464477539063, 0x0001],
	//Largest subnormal
	[0.00006097555160522461, 0x03ff],
	//Smallest normal
	[0.00006103515625, 0x0400],
	//Largest <1
	[0.99951171875, 0x3bff],
	//Largest representable int
	[fp16.MAX_INT, 0x6800],
	[-fp16.MAX_INT, 0xe800],
	[fp16.MAX_INT - 1, 0x67ff],
	[1 - fp16.MAX_INT, 0xe7ff],
	[fp16.MAX_INT - 2, 0x67fe],
	[2 - fp16.MAX_INT, 0xe7fe],

	[1, 0x3c00],
	[-1, 0xbc00],

	[2, 0x4000],
	[-2, 0xc000],

	[100, 0x5640],
	[-100, 0xd640],

	//Extremes
	[65504, 0x7bff],
	[-65504, 0xfbff],

	[Infinity, 0x7c00],
	[-Infinity, 0xfc00],
];

for (const test of encode16Pairs) {
	tsts('decode: ' + test[1].toString(16), () => {
		const b = U16.toBytesBE(test[1]);
		assert.is(fp16.fromBytes(b), test[0]);
	});
	tsts('encode: ' + test[0], () => {
		const b = fp16.toBytes(test[0]);
		const expHex = hex.fromBytes(U16.toBytesBE(test[1]));
		assert.is(hex.fromBytes(b), expHex);
	});
}

const nanHex = '7FFF';
const nanBytes = hex.toBytes(nanHex);

tsts('decode: 0x7fffffff (NaN)', () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(isNaN(fp16.fromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = fp16.toBytes(NaN);
	assert.is(hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(isNaN(fp16.fromBytes(hex.toBytes('7C01'))), true);
	assert.is(isNaN(fp16.fromBytes(hex.toBytes('7E00'))), true);
	assert.is(isNaN(fp16.fromBytes(hex.toBytes('7C10'))), true);
});

tsts('encode oversized', () => {
	const enc = fp16.toBytes(66000);
	const dec = fp16.fromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts.run();
