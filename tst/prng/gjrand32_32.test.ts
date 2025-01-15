
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Gjrand32_32 } from '../../src/prng/gjrand32';

const tsts = suite('Gjrand32_32');

//Note despite the similar name, these tests which match include some of the same seeds
// `gjrand32`, produce different numbers.

//Can't find a reasonable testing source for these numbers, plus it's a slightly modified form
// of a GIST of a modified form.. but; we can how that reasonable random sequences are generated
// and the results are different from the 256 state version

const seq_def:number[]=[
    3549022456,
    2524684144,
    155375143,
    3949942373,
    3808574447,
    3502790569,
    1423479935,
    2012571532
];
const rng_def=Gjrand32_32.new();
let i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`Gjrand32_32().rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const seq_42:number[] = [
    2277141955,
    1806337049
];
const rng_42=Gjrand32_32.seed(42);
i=0;
for (const expect of seq_42) {
    const act = rng_42.rawNext();
    tsts(`Gjrand32_32(42).rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

const seq_64:number[] = [
    1300271190, 
    805416957
];
const rng_64=Gjrand32_32.seed(987654321,123456789);
i=0;
for (const expect of seq_64) {
    const act = rng_64.rawNext();
    tsts(`Gjrand32_32(987654321,123456789).rawNext[${i}]`, () => {
        assert.equal(act,expect);
    });
    i++;
}

tsts(`Gjrand32_32(,false) save returns empty, restore throws`,()=>{
    const r=Gjrand32_32.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Gjrand32_32.restore(sav));
})

tsts(`Gjrand32_32().save/restore loop`,()=>{
    const r=Gjrand32_32.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Gjrand32_32.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("gjrand32_32")>0,true,'toString is set');
});

tsts.run();