
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { mulberry32 } from '../../src/prng/mulberry32';

const tsts = suite('mulberry32');

//Just to show with no seed, reasonable random
const seq0: number[] = [
    1144304738,
    1416247,
    958946056,
    627933444,
];
const rng0=mulberry32();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`mulberry32()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//From other reference implementation
const seqSeed: number[] = [
    3527837133,
    3112574143,
];
const rngSeed=mulberry32(1985);
i=0;
for (const expect of seqSeed) {
	const act = rngSeed();
	tsts(`mulberry32(seed)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}


tsts.run();
