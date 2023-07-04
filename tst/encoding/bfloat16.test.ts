import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { bfloat16 } from '../../src/encoding/bfloat16';
import { hex } from '../../src/encoding/Hex';
import { U16 } from '../../src/primitive/U16';
import { fpb16 } from '../../src/encoding/ieee754-fpb';

const tsts = suite('bfloat16');

const encode16Pairs:[number,number][] = [
	[0, 0x0000],
	[-0, 0x8000],
	// //Smallest subnormal
	// [0.00000005960464477539063, 0x0001],
	// //Largest subnormal
	// [0.00006097555160522461, 0x03ff],
	// //Smallest normal
	// [0.00006103515625, 0x0400],
	// //Largest <1
	// [0.99951171875, 0x3bff],

	[1, 0x3f80],
	[-1, 0xbf80],

	// [2, 0x4000],
	// [-2, 0xc000],

	// [100, 0x5640],
	// [-100, 0xd640],

	// //Extremes
	// [65504, 0x7bff],
	// [-65504, 0xfbff],

	[Infinity, 0x7f80],//0_11111111_0000000
	[-Infinity, 0xff80],//1_11111111_0000000
];

for (const [fp,enc] of encode16Pairs) {
	tsts('decode: ' + enc.toString(16), () => {
		const b = U16.toBytesBE(enc);
		assert.is(bfloat16.fromBytes(b), fp);
	});
	tsts('encode: ' + fp, () => {
		const b = bfloat16.toBytes(fp);
		const expHex = hex.fromBytes(U16.toBytesBE(enc));
		assert.is(hex.fromBytes(b), expHex);
	});
}

const nanHex = '7FFF';
const nanBytes = hex.toBytes(nanHex);

tsts(`decode: ${nanHex} (NaN)`, () => {
	//NaN!==NaN, so we need to use a specialized test
	assert.is(Number.isNaN(bfloat16.fromBytes(nanBytes)), true);
});

tsts('encode: NaN', () => {
	const ie = bfloat16.toBytes(NaN);
	assert.is(hex.fromBytes(ie), nanHex);
});

tsts(`decode other NaNs:`, () => {
    //0_11111111_klmnopq
	//As long as mantissa>0 then it's NaN so there are quite a few variants
	assert.is(Number.isNaN(bfloat16.fromBytes(hex.toBytes('7F81'))), true);
    assert.is(Number.isNaN(bfloat16.fromBytes(hex.toBytes('7F88'))), true);
    assert.is(Number.isNaN(bfloat16.fromBytes(hex.toBytes('7FFF'))), true);
});

tsts('encode oversized', () => {
	const enc = bfloat16.toBytes(1e39);
	const dec = bfloat16.fromBytes(enc);
	assert.is(isFinite(dec), false);
});

tsts.run();
