import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro128ss } from '../../src/prng/xoshiro128';

const tsts = suite('Xoshiro128**');
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

const rng_1=Xoshiro128ss.seed(0,1,2,3);
let i = 0;
for (const expect of seq_1) {
    const act = rng_1.rawNext();
    tsts(`Xoshiro128**([0,1,2,3]).rawNext[${i}]`, () => {
        assert.equal(act, expect);
    });
    i++;
}

//No corroboration for these vectors, but show it works with default seed
const seq_0:number[]=[
    174533760,
    519914880,
    3368477458,
    3801424930
];
const rng_0=Xoshiro128ss.new();
i=0;
for (const expect of seq_0) {
    const act = rng_0.rawNext();
    tsts(`Xoshiro128**().rawNext[${i}]`, () => {
        assert.equal(act, expect);
    });
    i++;
}

tsts(`Xoshiro128**().save/restore loop`,()=>{
    const r=Xoshiro128ss.new(true);
    //Read the first number
    assert.equal(r.rawNext(),seq_0[0]);
    const sav=r.save();
    assert.equal(sav.length,16);
    //Read the next two numbers after the save
    assert.equal(r.rawNext(),seq_0[1]);
    assert.equal(r.rawNext(),seq_0[2]);
    //r2 should still be 1 number in
    const r2=Xoshiro128ss.restore(sav);    
    assert.equal(r2.rawNext(),seq_0[1]);
    
    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro128**")>0,true,'toString is set');
});


tsts.run();
