
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro64s } from '../../src/prng/xoroshiro64';

const tsts = suite('Xoroshiro64*');

const seq_def: number[] = [
    932574677,
    1495621344,
    1899493711,
    3084085671,
];
const rng_def=Xoroshiro64s.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoroshiro64*().rawNext[${i}]`, () => {
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
const rng_1_2=Xoroshiro64s.seed(1,2);
i=0;
for (const expect of seq_seed) {
	const act = rng_1_2.rawNext();
	tsts(`Xoroshiro64*(1,2).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Xoroshiro64*(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro64s.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro64s.restore(sav));
})

tsts(`Xoroshiro64*().save/restore loop`,()=>{
    const r=Xoroshiro64s.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,8,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro64s.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro64*")>0,true,'toString is set');
});

tsts.run();
