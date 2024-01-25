import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { marsaglia } from '../../src/prng/marsaglia';

const tsts = suite('marsaglia');
const set: [number, number[]][] = [
	[23, [0, 2, 2, 3, 9, 5, 5]],
	[
		1,
		[
			6, 6, 9, 7, 7, 6, 0, 4, 4, 6, 8, 1, 1, 7, 2, 6, 7, 5, 4, 7, 4, 8, 0, 5, 0,
			3, 8, 9, 8, 3, 3, 0, 2, 2, 3, 9, 5, 5, 3, 1, 8, 8, 2, 7, 3, 2, 4, 5, 2, 5,
			1, 9, 4, 9, 6, 1, 0, 1,/*end of period, repeats*/
		],
	],
];

for (const [seed, expect] of set) {
	tsts(`marsaglia(${seed})`, () => {
		const r = marsaglia(seed);
		for (let i = 0; i < expect.length; i++) {
			assert.equal(r(), expect[i], 'r' + i);
		}
	});
}

tsts.run();
