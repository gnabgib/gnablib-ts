
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sfc16 } from '../../src/prng/sfc';

const tsts = suite('sfc16');

//Just to show with no seed, reasonable random
const seq0: number[] = [
    53153,
    12518,
    46960,
    58926,
    44733,
    15961,
    36576,
    55492
];
const rng0=sfc16();
let i=0;
for (const expect of seq0) {
    const act = rng0();
    tsts(`sfc16()[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const throwSeeds:Uint16Array[]=[
    new Uint16Array(0),
    new Uint16Array(1),
    new Uint16Array(2),
    new Uint16Array(5),//Exceed, use subarray
];
for(const ea of throwSeeds) {
    tsts(`sfc16.seed(len=${ea.length}) throws`,()=>{
        assert.throws(()=>sfc16(ea));
    })
}

//Todo find a viable testing source of a 3 part key
const key_1_2_3=Uint16Array.of(1,2,3);
const rng_1_2_3=sfc16(key_1_2_3);
const seq_1_2_3:number[]=[
    64193,
    7508,
    29646
];
i=0;
for (const expect of seq_1_2_3) {
    const act = rng_1_2_3();
    tsts(`sfc16(key_1_2_3)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//Todo find a viable testing source of a 4 part key
const key_1_2_3_4=Uint16Array.of(1,2,3,4);
const rng_1_2_3_4=sfc16(key_1_2_3_4);
const seq_1_2_3_4:number[]=[
    48178,
    35254,
    52154
];
i=0;
for (const expect of seq_1_2_3_4) {
    const act = rng_1_2_3_4();
    tsts(`sfc16(key_1_2_3_4)[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}


tsts.run();