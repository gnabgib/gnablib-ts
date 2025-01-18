
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Pcg64 } from '../../src/prng/pcg64';
import { U128 } from '../../src/primitive/number/U128';

const tsts = suite('Pcg64');

//Just to show with no seed, reasonable random
const seq_def: string[] = [
    'A5306CE94FAA1570',
    '99EFF8A248D3D92B',
    'F6E800C7B7C1384B',
    '65C316CBF0124941',
];
const rng_def=Pcg64.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Pcg64().rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

// These test vectors are provided in https://github.com/imneme/pcg-c/tree/master/test-high/expected/check-pcg64.out
const seq_seedInc0:string[]=[
    '86B1DA1D72062B68',
    '1304AA46C9853D39',
    'A3670E9E0DD50358',
	'F9090E529A7DAE00',
    'C85B9FD837996F2C',
    '606121F8E3919196',
];
const rng_seedInc0=Pcg64.seed(U128.fromInt(42),U128.fromInt(54));
i=0;
for (const expect of seq_seedInc0) {
	const act = rng_seedInc0.rawNext();
	tsts(`Pcg64(42,54).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

//Unsourced, just proving default inc is sound
const seq_seed0:string[]=[
    'BA7DAB9FF920E11D',
    'F34CC37451080FAC',
];
const rng_seed0=Pcg64.seed(U128.fromInt(42));
i=0;
for (const expect of seq_seed0) {
	const act = rng_seed0.rawNext();
	tsts(`Pcg64(42).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
	});
	i++;
}

tsts(`Pcg64(,false) save returns empty, restore throws`,()=>{
    const r=Pcg64.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Pcg64.restore(sav));
})

tsts(`Pcg64().save/restore loop`,()=>{
    const r=Pcg64.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Pcg64.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("pcg64")>0,true,'toString is set');
});


tsts.run();
