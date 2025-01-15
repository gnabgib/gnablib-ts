
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Sfc16 } from '../../src/prng/sfc16';

const tsts = suite('Sfc16');

//Just to show with no seed, reasonable random
const seq_def: number[] = [
    5970,
    45774,
    35873,
    20708,
    4171,
    20100,
    47391,
    15716
];
const rng_def=Sfc16.new();
let i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`Sfc16().rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//Todo find a viable testing source of a 3 part key
const rng_1_2_3c=Sfc16.seed(1,2,3);
const seq_1_2_3:number[]=[
    64193,
    7508,
    29646
];
i=0;
for (const expect of seq_1_2_3) {
    const act = rng_1_2_3c.rawNext();
    tsts(`Sfc16(1,2,3).rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//Todo find a viable testing source of a 4 part key
const rng_1_2_3_4c=Sfc16.seed(1,2,3,4);
const seq_1_2_3_4:number[]=[
    48178,
    35254,
    52154
];
i=0;
for (const expect of seq_1_2_3_4) {
    const act = rng_1_2_3_4c.rawNext();
    tsts(`sfc16(1,2,3,4).rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts(`Sfc16(,false) save returns empty, restore throws`,()=>{
    const r=Sfc16.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Sfc16.restore(sav));
})

tsts(`Sfc16().save/restore loop`,()=>{
    const r=Sfc16.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,8,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Sfc16.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("sfc16")>0,true,'toString is set');
});


tsts.run();