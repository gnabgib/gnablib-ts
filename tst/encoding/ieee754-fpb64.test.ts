import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { fpb64 } from '../../src/encoding/ieee754-fpb';

const tsts = suite('IEEE754/Float64');

//https://en.wikipedia.org/wiki/Double-precision_floating-point_format
//https://www.h-schmidt.net/FloatConverter/IEEE754.html
//http://weitz.de/ieee/
const encode64Pairs = [
	[0, '0000000000000000'],
	[-0, '8000000000000000'],
	//Smallest subnormal
	[
		4.9406564584124654e-324, //5E-324
		'0000000000000001',
	],
	//Largest subnormal
	[
		2.2250738585072009e-308, //2.225073858507201E-308,
		'000FFFFFFFFFFFFF',
	],
	//Smallest normal
	[2.2250738585072014e-308, '0010000000000000'],
	//Largest <1
	[0.9999999999999999, '3FEFFFFFFFFFFFFF'],
	//Largest representable int (2^53)
	[fpb64.MAX_INT, '4340000000000000'],
	[-fpb64.MAX_INT, 'C340000000000000'],
	[fpb64.MAX_INT - 1, '433FFFFFFFFFFFFF'],
	[1 - fpb64.MAX_INT, 'C33FFFFFFFFFFFFF'],
	[fpb64.MAX_INT - 2, '433FFFFFFFFFFFFE'],
	[2 - fpb64.MAX_INT, 'C33FFFFFFFFFFFFE'],

	[1, '3FF0000000000000'],
	[-1, 'BFF0000000000000'],

	[2, '4000000000000000'],
	[-2, 'C000000000000000'],

	[100, '4059000000000000'],
	[-100, 'C059000000000000'],

	//Extremes
	[1.7976931348623157e308, '7FEFFFFFFFFFFFFF'],
	[-1.7976931348623157e308, 'FFEFFFFFFFFFFFFF'],

	[Infinity, '7FF0000000000000'],
	[-Infinity, 'FFF0000000000000'],

	//~PI!
	[3.141592653589793, '400921FB54442D18'],

	//Since NaN!==NaN you cannot do this here
];

for (const test of encode64Pairs) {
	tsts('decode: ' + test[1].toString(16), () => {
		const b = hex.toBytes(test[1] as string);
		assert.is(fpb64.fromBytes(b), test[0]);
	});
	tsts('encode: ' + test[0], () => {
		const b = fpb64.toBytes(test[0] as number);
		assert.is(hex.fromBytes(b), test[1] as string);
	});
}

const nanHex = '7FFFFFFFFFFFFFFF';
const nanBytes = hex.toBytes(nanHex);

tsts(`decode: 0x${nanHex} (NaN)`, () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(Number.isNaN(fpb64.fromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = fpb64.toBytes(NaN);
	assert.is(hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(
		Number.isNaN(fpb64.fromBytes(hex.toBytes('7FF0000000000001'))),
		true
	);
	assert.is(
		Number.isNaN(fpb64.fromBytes(hex.toBytes('7FF8000000000000'))),
		true
	); //JS uses this
	assert.is(
		Number.isNaN(fpb64.fromBytes(hex.toBytes('7FF0000001000000'))),
		true
	);
});

tsts('encode oversized', () => {
	// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
	const enc = fpb64.toBytes(1e340);
	const dec = fpb64.fromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts.run();
