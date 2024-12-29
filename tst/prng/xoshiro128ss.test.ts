import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoshiro128ss } from '../../src/prng/xoshiro128';
import { U128 } from '../../src/primitive/number';

const tsts = suite('xoshiro128**');
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
    5760,
    17280,
    2966400,
    32451840,
    2604340873,
    3891234569,
    1254043636,
    216095511,
    3291724652,
    2070429911,
    3403762308,
    371730125,
    2871333640,
    1107719891,
    407174912,
    2984142590,
    3931454317,
    988064505,
    139866493,
    1642526786,
    2209862179,
    1349487243,
    1285712680,
    615038681,
    3943957616,
    1212430137,
    2007351553,
    492343048,
    3280648624,
    35038342,
];

const rng1 = xoshiro128ss(U128.fromUint32Quad(0,1,2,3));
let i = 0;
for (const expect of seq_1) {
	const act = rng1();
	tsts(`xoshiro128++([0,1,2,3])[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}


tsts.run();
