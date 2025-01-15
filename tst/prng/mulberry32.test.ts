
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Mulberry32 } from '../../src/prng/mulberry32';

const tsts = suite('Mulberry32');

//Just to show with no seed, reasonable random
const seq_def: number[] = [
    1144304738,
    1416247,
    958946056,
    627933444,
];
const rng_def=Mulberry32.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Mulberry32().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

//From other reference implementation
const seq_1985: number[] = [
    3527837133,
    3112574143,
];
const rng_1985=Mulberry32.seed(1985);
i=0;
for (const expect of seq_1985) {
	const act = rng_1985.rawNext();
	tsts(`Mulberry32(1985).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Mulberry32(,false) save returns empty, restore throws`,()=>{
    const r=Mulberry32.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Mulberry32.restore(sav));
})

tsts(`Mulberry32().save/restore loop`,()=>{
    const r=Mulberry32.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,4,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Mulberry32.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("mulberry32")>0,true,'toString is set');
});


tsts.run();
