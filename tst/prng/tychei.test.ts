
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Tychei } from '../../src/prng/tychei';

const tsts = suite('Tychei');

//Unsourced, just showing the default seed provides reasonable randomness
const seq_def:number[]=[
    699550068,
    1915753960,
    1728359319,
    3386243413,
    2946823904,
    1973207123,
    3326894554,
    3191394185
];
const rng_def=Tychei.new();
let i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`Tychei().rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

//Test vectors found in another implementation
const seq_1_2:number[] = [
    2108476295,
    2775575075
];
const rng_1_2=Tychei.seed(1,2)
i=0;
for (const expect of seq_1_2) {
    const act = rng_1_2.rawNext();
    tsts(`Tychei(1,2).rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts(`Tychei(,false) save returns empty, restore throws`,()=>{
    const r=Tychei.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Tychei.restore(sav));
})

tsts(`Tychei().save/restore loop`,()=>{
    const r=Tychei.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Tychei.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("tychei")>0,true,'toString is set');
});

tsts.run();