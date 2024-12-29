
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoroshiro64ss } from '../../src/prng/xoroshiro64';
import { U64 } from '../../src/primitive/number';

const tsts = suite('xoroshiro64**');

const seq0: number[] = [
    3183060286,
    3076213815,
    3271283110,
    3827435726,
];
const rng0=xoroshiro64ss();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoroshiro64**()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Sourced from a rust impl - which ran the original C code
//https://github.com/vks/xoshiro/blob/master/src/xoroshiro64starstar.rs
const seq_seed: number[] = [
    3802928447, 
    813792938, 
    1618621494, 
    2955957307, 
    3252880261,
    1129983909, 
    2539651700, 
    1327610908, 
    1757650787, 
    2763843748,
];
const rngSeed=xoroshiro64ss(U64.fromUint32Pair(1,2));
i=0;
for (const expect of seq_seed) {
	const act = rngSeed();
	tsts(`xoroshiro64**(seed)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts.run();
