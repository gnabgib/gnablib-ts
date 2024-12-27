import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { splitMix32 } from '../../src/prng/splitMix';

const tsts = suite('splitMix32');
//https://gee.cs.oswego.edu/dl/papers/oopsla14.pdf
const seq0:number[] = [
    2462723854,
    1020716019,
    454327756,
    1275600319,
    1215922603,
    3678440605,
    2025593743,
    3627053797,
    1707859284,
    525044975,
    2440575920,
    36795291,
    715746768,
    3022766256,
    82381813,
    3803009466,
    2046231700,
    17524864,
    2756851765,
    3471521463,
    3644456808,
    2978767937,
    3713039170,
    1572180581,
    860263572,
    2791152506,
    1474083179,
    457728387,
    3826376129,
    1043132993,
];

const rng=splitMix32();
let i = 0;
for (const expect of seq0) {
	const act = rng();
	tsts(`splitMix32(0)[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

tsts.run();