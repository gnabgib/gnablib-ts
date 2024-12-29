import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoshiro128pp } from '../../src/prng/xoshiro128';
import { U128 } from '../../src/primitive/number';

const tsts = suite('xoshiro128++');
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
    384,
    524546,
    1075056769,
    2828078338,
    1617561924,
    3403628308,
    1563858755,
    3600111265,
    3629013629,
    1801479719,
    4063654329,
    144202860,
    3379844426,
    1967165921,
    356350240,
    3768476407,
    441311010,
    1660658250,
    2115519323,
    665052440,
    1052069458,
    282524233,
    1151236316,
    3319857069,
    4188762147,
    239429708,
    562243103,
    3489603266,
    4013708149,
    3013490719,
];

const rng1 = xoshiro128pp(U128.fromUint32Quad(0,1,2,3));
let i = 0;
for (const expect of seq_1) {
	const act = rng1();
	tsts(`xoshiro128++([0,1,2,3])[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}


tsts.run();
