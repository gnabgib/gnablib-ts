import { suite } from 'uvu';
import { nextPow2 } from '../../src/algo';
import * as assert from 'uvu/assert';

const tsts = suite('nextPow2');

const tests: [number, number][] = [
	[0, 0],
	[1, 1],
	[2, 2],
	[3, 4],
	[4, 4],
	[5, 8],
	[6, 8],
	[7, 8],
	[8, 8],
	[63, 64],
	[64, 64],
	[65, 128],
];
for (const [n, expect] of tests) {
	tsts(`nextPow2(${n})`, () => {
		const found = nextPow2(n);
		assert.equal(found, expect);
	});
}

tsts.run();
