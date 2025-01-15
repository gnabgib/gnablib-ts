import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XorShift128 } from '../../src/prng/xorShift128';

const tsts = suite('XorShift128');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_def: number[] = [
	3701687786, 458299110, 2500872618, 3633119408, 516391518, 2377269574,
	2599949379, 717229868, 137866584, 395339113, 1301295572, 1728310821,
	3538670320, 1187274473, 2316753268, 4061953237, 2129415220, 448488982,
	643481932, 934407046,
];
const rng_def=XorShift128.new();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`XorShift128().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

const seq_2579111315: number[] = [
	1280753804, 2342814110, 98946252, 1215862728, 3000003819, 500671326,
	914329476, 3124074580, 2343767245, 736002998, 3776391910, 4160158120,
	3828373247, 992787196, 1664411493, 592406802, 1169048618, 453766457,
	3753914098, 2275396577,
];
const rng_2579111315=XorShift128.seed(2579111315, 362436069, 521288629, 88675123);
i = 0;
for (const expect of seq_2579111315) {
	const act = rng_2579111315.rawNext();
	tsts(`XorShift128(2579111315).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`XorShift128(,false) save returns empty, restore throws`,()=>{
	const r=XorShift128.new();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>XorShift128.restore(sav));
})

tsts(`XorShift128().save/restore loop`,()=>{
	const r=XorShift128.new(true);
	assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
	const sav=r.save();
	assert.equal(sav.length,16,'save length');
	assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
	assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

	const r2=XorShift128.restore(sav);    
	assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
	assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

	assert.is(Object.prototype.toString.call(r).indexOf("xorshift128")>0,true,'toString is set');
});

tsts.run();
