
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro64ss } from '../../src/prng/xoroshiro64';

const tsts = suite('Xoroshiro64**');

const seq_def: number[] = [
    3183060286,
    3076213815,
    3271283110,
    3827435726,
];
const rng_def=Xoroshiro64ss.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoroshiro64**().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//Sourced from a rust impl - which ran the original C code
//https://github.com/vks/xoshiro/blob/master/src/xoroshiro64starstar.rs
const seq_1_2: number[] = [
    3802928447, 
    813792938, 
    1618621494, 
    2955957307, 
    3252880261,
    1129983909, 
    2539651700, 
    1327610908, 
    1757650787, 
    2763843748,
];
const rng_1_2=Xoroshiro64ss.seed(1,2);
i=0;
for (const expect of seq_1_2) {
	const act = rng_1_2.rawNext();
	tsts(`Xoroshiro64**(1,2).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Xoroshiro64**(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro64ss.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro64ss.restore(sav));
})

tsts(`Xoroshiro64**().save/restore loop`,()=>{
    const r=Xoroshiro64ss.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,8,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro64ss.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro64**")>0,true,'toString is set');
});

tsts.run();
