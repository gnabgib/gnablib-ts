import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { fpb16,hex } from '../../src/codec';
import { U16 } from '../../src/primitive';

const tsts = suite('IEEE754/Float Binary16');

const encode16Pairs:[number,number][] = [
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
	[fpb16.MAX_INT, 0x6800],
	[-fpb16.MAX_INT, 0xe800],
	[fpb16.MAX_INT - 1, 0x67ff],
	[1 - fpb16.MAX_INT, 0xe7ff],
	[fpb16.MAX_INT - 2, 0x67fe],
	[2 - fpb16.MAX_INT, 0xe7fe],

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

for (const [fp,enc] of encode16Pairs) {
	tsts('decode: ' + enc.toString(16), () => {
		const b = U16.toBytesBE(enc);
		assert.is(fpb16.fromBytes(b), fp);
	});
	tsts('encode: ' + fp, () => {
		const b = fpb16.toBytes(fp);
		const expHex = hex.fromBytes(U16.toBytesBE(enc));
		assert.is(hex.fromBytes(b), expHex);
	});
}

const nanHex = '7FFF';
const nanBytes = hex.toBytes(nanHex);

tsts(`decode: ${nanHex} (NaN)`, () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(Number.isNaN(fpb16.fromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = fpb16.toBytes(NaN);
	assert.is(hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(Number.isNaN(fpb16.fromBytes(hex.toBytes('7C01'))), true);
	assert.is(Number.isNaN(fpb16.fromBytes(hex.toBytes('7E00'))), true);
	assert.is(Number.isNaN(fpb16.fromBytes(hex.toBytes('7C10'))), true);
});

tsts('encode oversized', () => {
	const enc = fpb16.toBytes(66000);
	const dec = fpb16.fromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts(`inexact number`,()=> {
	//Shows floating point error

	// 0x3266 -> 0.199951171875 (under .2)
	assert.is(fpb16.fromBytes(U16.toBytesBE(0x3266)),0.199951171875);
	// 0x3267 -> 0.199951171875 (over .2)
	assert.is(fpb16.fromBytes(U16.toBytesBE(0x3267)),0.2000732421875);

	//0.2 -> 0x3266
	const e=fpb16.toBytes(0.2);
	assert.is(hex.fromBytes(e),'3266');
})

tsts.run();
