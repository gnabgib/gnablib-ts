import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { SplitMix32 } from '../../src/prng/splitMix32';

const tsts = suite('SplitMix32');
//https://gee.cs.oswego.edu/dl/papers/oopsla14.pdf
const seq_def:number[] = [
    2462723854,
    1020716019,
    454327756,
    1275600319,
    1215922603,
    3678440605,
    2025593743,
    3627053797,
    1707859284,
    525044975,
    2440575920,
    36795291,
    715746768,
    3022766256,
    82381813,
    3803009466,
    2046231700,
    17524864,
    2756851765,
    3471521463,
    3644456808,
    2978767937,
    3713039170,
    1572180581,
    860263572,
    2791152506,
    1474083179,
    457728387,
    3826376129,
    1043132993,
];
const rng_def=SplitMix32.new();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`SplitMix32().rawNext[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

const seq_1:number[]=[
    2527132011,
    314344336,
];
const rng_1=SplitMix32.seed(1);
i = 0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`SplitMix32(1).rawNext[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

tsts(`SplitMix32(,false) save returns empty, restore throws`,()=>{
    const r=SplitMix32.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>SplitMix32.restore(sav));
})

tsts(`SplitMix32().save/restore loop`,()=>{
    const r=SplitMix32.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,4,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=SplitMix32.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("splitmix32")>0,true,'toString is set');
});

tsts.run();