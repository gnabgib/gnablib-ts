
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { pcg64 } from '../../src/prng/pcg64';
import { U128 } from '../../src/primitive/number/U128';

const tsts = suite('pcg64');

//Just to show with no seed, reasonable random
const seq0: string[] = [
    'A5306CE94FAA1570',
    '99EFF8A248D3D92B',
];
const rng0=pcg64();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`pcg64()[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

// These test vectors are provided in https://github.com/imneme/pcg-c/tree/master/test-high/expected/check-pcg64.out
const rng_seedInc0=pcg64(U128.fromInt(42),U128.fromInt(54));
const seq_seedInc0:string[]=[
    '86B1DA1D72062B68',
    '1304AA46C9853D39',
    'A3670E9E0DD50358',
	'F9090E529A7DAE00',
    'C85B9FD837996F2C',
    '606121F8E3919196',
];
i=0;
for (const expect of seq_seedInc0) {
	const act = rng_seedInc0();
	tsts(`pcg64(seedInc0)[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}


tsts.run();
