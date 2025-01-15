import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mcg } from '../../src/prng/';

const tsts = suite('Mcg.msvc');

//Unsourced
const seq_def: number[] = [
	2745024, 1210316419, 415139642, 1736732949, 1256316804, 1030492215,
];
const rng_def = Mcg.newMsvc();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mcg.msvc().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

// source: https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/rand?view=msvc-170
const seq_1792: number[] = [
	5890, 1279, 19497, 1207, 11420, 3377, 15317, 29489, 9716, 23323,
];
const rng_1792 = Mcg.seedMsvc(1792);
i = 0;
for (const expect of seq_1792) {
	const act = rng_1792.rawNext();
	tsts(`Mcg.msvc(1792).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts.run();
