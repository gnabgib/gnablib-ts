
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { sfc64 } from '../../src/prng/sfc64';

const tsts = suite('sfc64');

//Just to show with no seed, reasonable random
const seq0: string[] = [
    '509946A41CD733A4',
    '3CE745DC80536FC9',
    'B1E3CF34CACDB80C',
    '58EC42788FA0D1DC',
    'B991E9ACFA9464AC',
    'CD48EAA1B860F2A5',
    '27D998076F04D2F9',
    '3EFF44826F906165'
];
const rng0=sfc64();
let i=0;
for (const expect of seq0) {
    const act = rng0();
    tsts(`sfc64()[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

const throwSeeds:Uint32Array[]=[
    new Uint32Array(0),
    new Uint32Array(1),
    new Uint32Array(3),
    new Uint32Array(4),
    new Uint32Array(5),
    new Uint32Array(7),//Exceed, use subarray
];
for(const ea of throwSeeds) {
    tsts(`sfc64.seed(len=${ea.length}) throws`,()=>{
        assert.throws(()=>sfc64(ea));
    })
}

//Todo find a viable testing source of a 2 part (1 U64) key
const key_1_2=Uint32Array.of(1,2);
//s1=s2=s3:0000000200000001 | 8589934593
const rng_1_2=sfc64(key_1_2);
const seq_1_2:string[]=[
    '7C0ACB6F88B52BF7',
    'C2B84D8F374F9F68',
    'EB98768B2F214403'
];
i=0;
for (const expect of seq_1_2) {
    const act = rng_1_2();
    tsts(`sfc64(key_1_2)[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Todo find a viable testing source of a 6 part (3 U64) key
const key_1_2_3_4_5_6=Uint32Array.of(1,2,3,4,5,6);
//s1:0000000200000001 | 8589934593
//s2:0000000400000003 | 17179869187
//s3:0000000600000005 | 25769803781
const rng_1_2_3_4_5_6=sfc64(key_1_2_3_4_5_6);
const seq_1_2_3_4_5_6:string[]=[
    'BD2CBADC9DD7D15F',
    '28F734DE11AC1CF6',
    '84A43DDE75BF539C'
];
i=0;
for (const expect of seq_1_2_3_4_5_6) {
    const act = rng_1_2_3_4_5_6();
    tsts(`sfc64(key_1_2_3_4_5_6)[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}


tsts.run();