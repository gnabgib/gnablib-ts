
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Sfc32 } from '../../src/prng/sfc32';

const tsts = suite('Sfc32');

//Just to show with no seed, reasonable random
const seq_def: number[] = [
    1338548054,
    2499804003,
    2743868851,
    1211391675,
    2275834961,
    2303145534,
    2702215350,
    1526814281
];
const rng_def=Sfc32.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Sfc32().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Todo find a viable testing source of a 2 part key
const seq_1_2:number[]=[
    3921474818,
    1956182856,
    3568291541
];
const rng_1_2=Sfc32.seed(1,2);
i=0;
for (const expect of seq_1_2) {
	const act = rng_1_2.rawNext();
	tsts(`Sfc32(1,2).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Todo find a viable testing source of a 3 part key
const seq_1_2_3:number[]=[
    3987121759,
    92551270,
    1122162139
];
const rng_1_2_3=Sfc32.seed(1,2,3);
i=0;
for (const expect of seq_1_2_3) {
	const act = rng_1_2_3.rawNext();
	tsts(`Sfc32(1,2,3).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Sfc32(,false) save returns empty, restore throws`,()=>{
    const r=Sfc32.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Sfc32.restore(sav));
})

tsts(`Sfc32().save/restore loop`,()=>{
    const r=Sfc32.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Sfc32.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("sfc32")>0,true,'toString is set');
});


tsts.run();