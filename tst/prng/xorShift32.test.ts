import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xorShift32 } from '../../src/prng/xorShift';

const tsts = suite('xorShift32');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
	270369, 67634689, 2647435461, 307599695, 2398689233, 745495504, 632435482,
	435756210, 2005365029, 2916098932, 2657092299, 1495045943, 3031976842,
	82049198, 87470069, 3385103793, 891394312, 3323190024, 321008529, 4283899417,
];

const rng_1 = xorShift32(1);
let i = 0;
for (const expect of seq_1) {
	const act = rng_1();
	tsts(`xorShift32(1)[${i}]`, () => {
		//todo: U64 comparison in assert
		assert.equal(act,expect);
	});
	i++;
}

const seq_11234: number[] = [
	2867938012, 3623547561, 3160234430, 4198028139, 3941444449, 2947887233,
  1023909427, 385004339, 1376427097, 834023353, 2087700153, 330053701, 4100343, 2518885639,
  2733913222, 2834837556, 1898057259, 738835800, 1878303145, 2214491497,
];

const rng_11234 = xorShift32(11234);
i = 0;
for (const expect of seq_11234) {
	const act = rng_11234();
	tsts(`xorShift32(11234)[${i}]`, () => {
		//todo: U64 comparison in assert
		assert.equal(act,expect);
	});
	i++;
}

tsts.run();
