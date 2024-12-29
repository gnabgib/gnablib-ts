
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { xoroshiro64s } from '../../src/prng/xoroshiro64';
import { U64 } from '../../src/primitive/number';

const tsts = suite('xoroshiro64*');

const seq0: number[] = [
    932574677,
    1495621344,
    1899493711,
    3084085671,
];
const rng0=xoroshiro64s();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`xoroshiro64*()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Sourced from a rust impl - which ran the original C code
//https://github.com/vks/xoshiro/blob/master/src/xoroshiro64star.rs
const seq_seed: number[] = [
    2654435771,
    327208753, 
    4063491769, 
    4259754937, 
    261922412, 
    168123673,
    552743735, 
    1672597395, 
    1031040050, 
    2755315674,
];
const rngSeed=xoroshiro64s(U64.fromUint32Pair(1,2));
i=0;
for (const expect of seq_seed) {
	const act = rngSeed();
	tsts(`xoroshiro64*(seed)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts.run();
