
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sfc32 } from '../../src/prng/sfc';

const tsts = suite('sfc32');

//Just to show with no seed, reasonable random
const seq0: number[] = [
    3483439874,
    813757616,
    3322532406,
    3395545402,
    1431711397,
    65584628,
    1725561925,
    384450757
];
const rng0=sfc32();
let i=0;
for (const expect of seq0) {
	const act = rng0();
	tsts(`sfc32()[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const throwSeeds:Uint32Array[]=[
    new Uint32Array(0),
    new Uint32Array(1),
    new Uint32Array(4),//Exceed, use subarray
];
for(const ea of throwSeeds) {
    tsts(`sfc32.seed(len=${ea.length}) throws`,()=>{
        assert.throws(()=>sfc32(ea));
    })
}

//Todo find a viable testing source of a 2 part key
const key_1_2=Uint32Array.of(1,2);
const rng_1_2=sfc32(key_1_2);
const seq_1_2:number[]=[
    3921474818,
    1956182856,
    3568291541
];
i=0;
for (const expect of seq_1_2) {
	const act = rng_1_2();
	tsts(`sfc32(key_1_2)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Todo find a viable testing source of a 3 part key
const key_1_2_3=Uint32Array.of(1,2,3);
const rng_1_2_3=sfc32(key_1_2_3);
const seq_1_2_3:number[]=[
    3987121759,
    92551270,
    1122162139
];
i=0;
for (const expect of seq_1_2_3) {
	const act = rng_1_2_3();
	tsts(`sfc32(key_1_2_3)[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}


tsts.run();