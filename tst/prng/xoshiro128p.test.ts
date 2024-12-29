import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoshiro128p } from '../../src/prng/xoshiro128';
import { U128 } from '../../src/primitive/number';

const tsts = suite('xoshiro128+');
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
    3,
    4098,
    8398849,
    22028806,
    2160079882,
    580154890,
    2188909838,
    706519639,
    1959711752,
    1044417639,
    1377895525,
    1383819037,
    4190575430,
    3702202053,
    3499793018,
    1460919382,
    1999355645,
    2146148053,
    2824266627,
    489658741,
    1682959723,
    1919046744,
    1177607637,
    3199579655,
    3921860424,
    1925758241,
    1801294532,
    2041637679,
    2265703464,
    1471426682,
];

const rng1 = xoshiro128p(U128.fromUint32Quad(0,1,2,3));
let i = 0;
for (const expect of seq_1) {
	const act = rng1();
	tsts(`xoshiro128+([0,1,2,3])[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

//No corroboration for these vectors, but proving xoshiro128 works well without seeding
const seq0:number[]=[
    49376,
    95971011,
    3157991041,
    4193534618,
];
const rng0=xoshiro128p();
i = 0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoshiro128+()[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}


tsts.run();
