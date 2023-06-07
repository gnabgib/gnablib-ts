import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import {
	toDense2,
	toDense2Unsafe,
	toDense3,
	fromDense2,
	push2DigitsToBytes,
	fromDense3,
	toDense3Unsafe,
	fromDense3Unsafe,
} from '../../src/encoding/DenselyPackedDecimal';

const tsts = suite('Densely packed decimal');

//Set this to true if you want to test all values of DPD3, DPD2
const deep = false;

const dense3Tests = [
	//Zero large
	[0, 0, 0, 0x000],
	[1, 1, 1, 0x091], //001 001 0 001
	[1, 2, 3, 0x0a3], //001 010 0 011
	[7, 7, 7, 0x3f7], //111 111 0 111
	//One large
	[8, 2, 4, 0x22c], //100 010 110 0
	[1, 8, 4, 0x0ca], //001 100 101 0
	[1, 2, 8, 0x0a8], //001 010 100 0
	[9, 2, 4, 0x2ac], //101 010 110 0
	[1, 9, 4, 0x0da], //001 101 101 0
	[1, 2, 9, 0x0a9], //001 010 100 1
	//Two oversized
	[8, 8, 7, 0x30f], //110 000 111 1
	[3, 8, 8, 0x1ce], //011 100 111 0
	[8, 5, 8, 0x23e], //100 011 111 0
	[9, 9, 7, 0x39f], //111 001 111 1
	[3, 9, 9, 0x1df], //011 101 111 1
	[9, 5, 9, 0x2bf], //101 011 111 1
	//Three oversized
	[8, 8, 8, 0x06e], //xx0 110 111 0

	//Wikipedia https://en.wikipedia.org/wiki/Densely_packed_decimal
	[0, 0, 5, 0x005],
	[0, 0, 9, 0x009],
	[0, 5, 5, 0x055],
	[0, 7, 9, 0x079],
	[0, 8, 0, 0x00a],
	[0, 9, 9, 0x05f],
	[5, 5, 5, 0x2d5],
	[9, 9, 9, 0x0ff], //xx1 111 111 1

	//Ran 0-999 check and this caused issues:
	[9, 7, 7, 0x3fd], //111 111 110 1 <--issues
];

for (const test of dense3Tests) {
	tsts(`toDense3: ${test[0]},${test[1]},${test[2]}`, () => {
		assert.is(toDense3(test[0], test[1], test[2]), test[3]);
	});
	tsts(
		`fromDense3: ${test[0]},${test[1]},${test[2]}/0x${test[3].toString(16)}`,
		() => {
			const bcd = fromDense3(test[3]);
			assert.is(bcd >> 8, test[0], 'd0');
			assert.is((bcd >> 4) & 0xf, test[1], 'd1');
			assert.is(bcd & 0xf, test[2], 'd2');
		}
	);
}

const dense3DecodeSpecialCases = [
	//for l-l-l only two nibbles are used (others ignored)
	[0x1ff, 9, 9, 9],
	[0x2ff, 9, 9, 9],
	[0x3ff, 9, 9, 9],
	[0x16e, 8, 8, 8],
	[0x26e, 8, 8, 8],
	[0x36e, 8, 8, 8],
];

for (const test of dense3DecodeSpecialCases) {
	tsts(`fromDense3 variants: ${test[0].toString(16)}`, () => {
		const bcd = fromDense3(test[0]);
		assert.is(bcd >> 8, test[1], 'd0');
		assert.is((bcd >> 4) & 0xf, test[2], 'd1');
		assert.is(bcd & 0xf, test[3], 'd2');
	});
}

tsts(`fromDense3Unsafe variants: 0xFFF`, () => {
	//Beyond bit range is ignored
	const bcd = fromDense3Unsafe(0xfff);
	assert.is(bcd >> 8, 9, 'd0');
	assert.is((bcd >> 4) & 0xf, 9, 'd1');
	assert.is(bcd & 0xf, 9, 'd2');
});

const toDense3UnsafeSpecialCases = [
	//9=1001
	//a=1010
	//b=1011
	//c=1100
	//d=1101
	//e=1110
	//f=1111
	//999=0xff, 899=0x7f
	[0xa, 9, 9, 0x7f], //a treated like 8
	[0xb, 9, 9, 0xff], //b treated like 9
	[0xc, 9, 9, 0x7f], //c treated like 8
	[0xd, 9, 9, 0xff], //d treated like 9
	[0xe, 9, 9, 0x7f], //e treated like 8
	[0xf, 9, 9, 0xff], //f treated like 9

	//989=0xef
	[9, 0xa, 9, 0xef], //a treated like 8
	[9, 0xb, 9, 0xff], //b treated like 9
	[9, 0xf, 9, 0xff], //f treated like 9

	//998=0xfe
	[9, 9, 0xa, 0xfe], //a treated like 8
	[9, 9, 0xb, 0xff], //b treated like 9
	[9, 9, 0xf, 0xff], //f treated like 9

	//Try and overlap other commands
	[1, 0xf, 0, 0x9a], //001 001 101 0
	[1, 1, 0xf, 0x99], //001 001 100 1
];
for (const test of toDense3UnsafeSpecialCases) {
	tsts(
		`toDense3Unsafe variants: ${test[0]},${test[1]},${
			test[2]
		}/${test[3].toString(16)}`,
		() => {
			assert.is(toDense3Unsafe(test[0], test[1], test[2]), test[3]);
		}
	);
}

const dense3BadEncodes = [
	[0, -1, 0],
	[0, 10, 0],
	[-1, 0, 0],
	[10, 0, 0],
	[0, 0, -1],
	[0, 0, 10],
];
for (const test of dense3BadEncodes) {
	tsts(`toDense3 bad encode: ${test[0]},${test[1]},${test[2]}`, () => {
		assert.throws(() => toDense3(test[0], test[1], test[2]));
	});
}

const dense2Tests = [
	//Zero large
	[0, 0, 0x00], //000 0 000
	[0, 1, 0x01], //000 0 001
	[1, 0, 0x10], //001 0 000
	[1, 1, 0x11], //001 0 001
	[3, 5, 0x35], //011 0 101
	[5, 3, 0x53], //101 0 011
	[7, 7, 0x77], //111 0 111
	//One large
	[0, 8, 0x08], //000 10x 0
	[5, 8, 0x58], //101 10x 0
	[7, 8, 0x78], //111 10x 0
	[0, 9, 0x09], //000 10x 1
	[5, 9, 0x59], //101 10x 1
	[7, 9, 0x79], //111 10x 1
	[8, 0, 0x0c], //000 110 0
	[8, 5, 0x4d], //100 110 1
	[8, 7, 0x6d], //110 110 1
	[9, 0, 0x1c], //001 110 0
	[9, 5, 0x5d], //101 110 1
	[9, 7, 0x7d], //111 110 1
	//Two large (all)
	[8, 8, 0x0e], //xx0 111 0
	[8, 9, 0x0f], //xx0 111 1
	[9, 8, 0x1e], //xx1 111 0
	[9, 9, 0x1f], //xx1 111 1
	//Note the x can be zero or 1, should be 0 (encode) can be 1 (decode)
	//.. which also allows data smuggling
];

for (const test of dense2Tests) {
	tsts(`toDense2: ${test[0]},${test[1]}`, () => {
		assert.is(toDense2(test[0], test[1]), test[2]);
	});
	tsts(`fromDense2: ${test[0]},${test[1]}/${test[2]}`, () => {
		const bcd = fromDense2(test[2]);
		assert.is(bcd >> 4, test[0], 'd0');
		assert.is(bcd & 0xf, test[1], 'd1');
		//assert.is(fromDense2(test[0],test[1]),test[2]);
	});
}

const dense2DecodeSpecialCases = [
	//Masked with 0x7f, and when so many 1s.. the first is ignored
	[0xff, 9, 9],
	[0xef, 8, 9],
	[0x8f, 8, 9],
	//When oversized, first two bits are ignored
	[0x7f, 9, 9],
	[0x4f, 8, 9],
	[0x3f, 9, 9],
	[0x2f, 8, 9],
	//Because of the second last x, two values overlap
	// abc10xf
	[0x7a, 7, 8], //=78
	[0x7b, 7, 9], //=79
];

for (const test of dense2DecodeSpecialCases) {
	tsts(`dense2 out of range decodes: ${test[0].toString(16)}`, () => {
		const bcd = fromDense2(test[0]);
		assert.is(bcd >> 4, test[1], 'd0');
		assert.is(bcd & 0xf, test[2], 'd1');
	});
}

const dense2BadEncodes = [
	[0, -1],
	[0, 10],
	[-1, 0],
	[10, 0],
];
for (const test of dense2BadEncodes) {
	tsts(`dense2 bad encode: ${test[0]},${test[1]}`, () => {
		assert.throws(() => toDense2(test[0], test[1]));
	});
}

const toDense2UnsafeSpecialCases = [
	//9=1001
	//a=1010
	//b=1011
	//c=1100
	//d=1101
	//e=1110
	//f=1111
	//89=0x0F, 99=0x1f
	[0xa, 9, 0x0f], //a treated like 8
	[0xb, 9, 0x1f], //b treated like 9
	[0xc, 9, 0x0f], //c treated like 8
	[0xd, 9, 0x1f], //d treated like 9
	[0xe, 9, 0x0f], //e treated like 8
	[0xf, 9, 0x1f], //f treated like 9

	//98=0x1e
	[9, 0xa, 0x1e], //a treated like 8
	[9, 0xb, 0x1f], //b treated like 9
	[9, 0xf, 0x1f], //f treated like 9

	//Try and overlap other commands
	[0xf, 0, 0x1c], //001 1 100
	[0, 0xf, 0x9], //000 1 001
];

for (const test of toDense2UnsafeSpecialCases) {
	tsts(
		`toDense2Unsafe variants: ${test[0]},${test[1]}/${test[2].toString(16)}`,
		() => {
			assert.is(toDense2Unsafe(test[0], test[1]), test[2]);
		}
	);
}

//Optional
if (deep) {
	for (let i = 0; i < 1000; i++) {
		const d0 = ((i % 1000) / 100) | 0;
		const d1 = ((i % 100) / 10) | 0;
		const d2 = i % 10;

		tsts(`Round trip DPD3: ${i} (${d0}/${d1}/${d2})`, () => {
			const enc = toDense3Unsafe(d0, d1, d2);
			const dec = fromDense3(enc);
			assert.is(dec >> 8, d0, 'd0');
			assert.is((dec >> 4) & 0xf, d1, 'd1');
			assert.is(dec & 0xf, d2, 'd2');
		});
	}
	for (let i = 0; i < 100; i++) {
		const d0 = ((i % 100) / 10) | 0;
		const d1 = i % 10;

		tsts(`Round trip DPD2: ${i} (${d0}/${d1})`, () => {
			const enc = toDense2Unsafe(d0, d1);
			const dec = fromDense2(enc);
			assert.is(dec >> 4, d0, 'd0');
			assert.is(dec & 0xf, d1, 'd1');
		});
	}
}

const push2digits = [
	//99=1100011
	[99, 0, 'C600', 7],
	[99, 1, '6300', 8],
	[99, 2, '3180', 9],
	[99, 3, '18C0', 10],
	[99, 4, '0C60', 11],
	[99, 5, '0630', 12],
	[99, 6, '0318', 13],
	[99, 7, '018C', 14],
	[99, 8, '00C6', 15],
	//63=0111111
	[63, 0, '7E00', 7],
	[63, 1, '3F00', 8],
	[63, 2, '1F80', 9],
	[63, 3, '0FC0', 10],
	[63, 4, '07E0', 11],
	[63, 5, '03F0', 12],
	[63, 6, '01F8', 13],
	[63, 7, '00FC', 14],
	[63, 8, '007E', 15],
];

for (const test of push2digits) {
	const bytes = new Uint8Array(2);
	tsts('push2DigitsToBytes: ' + test[0] + '@' + test[1], () => {
		const size = push2DigitsToBytes(
			test[0] as number,
			bytes,
			test[1] as number
		);
		assert.is(size, test[3]);
		assert.is(Hex.fromBytes(bytes), test[2]);
	});
}

const push3digits = [
	//TODO: This (figure out encoding 111/999/119/191/911/199/991/919)
	//99=1111100111
	[999, 0, 'C60000', 7],
	[999, 1, '630000', 8],
	[999, 2, '318000', 9],
	[999, 3, '18C000', 10],
	[999, 4, '0C6000', 11],
	[999, 5, '063000', 12],
	[999, 6, '031800', 13],
	[999, 7, '018C00', 14],
	[999, 8, '00C600', 15],
	//63=0111111
	[63, 0, '7E00', 7],
	[63, 1, '3F00', 8],
	[63, 2, '1F80', 9],
	[63, 3, '0FC0', 10],
	[63, 4, '07E0', 11],
	[63, 5, '03F0', 12],
	[63, 6, '01F8', 13],
	[63, 7, '00FC', 14],
	[63, 8, '007E', 15],
];

// const t0 = performance.now();
// for(let i=0;i<1000000000;i++)
//     fromDense2(0x5d);
// const t1 = performance.now();
// console.log(`1B fromDense2 took ${t1 - t0} milliseconds.`);

// const t0 = performance.now();
// for(let i=0;i<100000000;i++)
// dense3(1,2,3);
// const t1 = performance.now();
// console.log(`1G nestIf took ${t1 - t0} milliseconds.`);

tsts.run();
