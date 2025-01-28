import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { bfloat16, hex } from '../../src/codec';

const tsts = suite('bfloat16');

const encode16Pairs:[number,string][] = [
	[0, '0000'],
	[-0, '8000'],

	[1, '3F80'],
	[-1, 'BF80'],

	[Infinity, '7F80'],//0_11111111_0000000
	[-Infinity, 'FF80'],//1_11111111_0000000
];

for (const [fp,encHex] of encode16Pairs) {
	tsts(`encode(${fp})`,()=>{
		const b = bfloat16.toBytes(fp);
		assert.is(hex.fromBytes(b), encHex);
	})
	tsts(`decode(${encHex})`, () => {
		assert.is(bfloat16.fromBytes(hex.toBytes(encHex)), fp);
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
