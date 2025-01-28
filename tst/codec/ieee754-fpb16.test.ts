import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { fpb16,hex } from '../../src/codec';

const tsts = suite('IEEE754/Float Binary16');

const encode16Pairs:[number,string][] = [
	[0, '0000'],
	[-0, '8000'],
	//Smallest subnormal
	[0.00000005960464477539063, '0001'],
	//Largest subnormal
	[0.00006097555160522461, '03FF'],
	//Smallest normal
	[0.00006103515625, '0400'],
	//Largest <1
	[0.99951171875, '3BFF'],
	//Largest representable int
	[fpb16.MAX_INT, '6800'],
	[-fpb16.MAX_INT, 'E800'],
	[fpb16.MAX_INT - 1, '67FF'],
	[1 - fpb16.MAX_INT, 'E7FF'],
	[fpb16.MAX_INT - 2, '67FE'],
	[2 - fpb16.MAX_INT, 'E7FE'],

	[1, '3C00'],
	[-1, 'BC00'],

	[2, '4000'],
	[-2, 'C000'],

	[100, '5640'],
	[-100, 'D640'],

	//Extremes
	[65504, '7BFF'],
	[-65504, 'FBFF'],

	[Infinity, '7C00'],
	[-Infinity, 'FC00'],
];
for (const [fp,encHex] of encode16Pairs) {
	tsts(`encode(${fp})`,()=>{
		const b = fpb16.toBytes(fp);
		assert.is(hex.fromBytes(b), encHex);
	})
	tsts(`decode(${encHex})`, () => {
		assert.is(fpb16.fromBytes(hex.toBytes(encHex)), fp);
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
	assert.is(fpb16.fromBytes(hex.toBytes('3266')),0.199951171875);
	// 0x3267 -> 0.199951171875 (over .2)
	assert.is(fpb16.fromBytes(hex.toBytes('3267')),0.2000732421875);

	//0.2 -> 0x3266
	const e=fpb16.toBytes(0.2);
	assert.is(hex.fromBytes(e),'3266');
})

tsts.run();
