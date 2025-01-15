import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XorShift32 } from '../../src/prng/xorShift32';

const tsts = suite('XorShift32');
//https://www.jstatsoft.org/article/view/v008i14
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
	270369, 67634689, 2647435461, 307599695, 2398689233, 745495504, 632435482,
	435756210, 2005365029, 2916098932, 2657092299, 1495045943, 3031976842,
	82049198, 87470069, 3385103793, 891394312, 3323190024, 321008529, 4283899417,
];
const rng_1=XorShift32.seed(1);
let i = 0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`XorShift32(1).rawNext[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

const seq_11234: number[] = [
	2867938012, 3623547561, 3160234430, 4198028139, 3941444449, 2947887233,
  1023909427, 385004339, 1376427097, 834023353, 2087700153, 330053701, 4100343, 2518885639,
  2733913222, 2834837556, 1898057259, 738835800, 1878303145, 2214491497,
];
const rng_11234=XorShift32.seed(11234);
i = 0;
for (const expect of seq_11234) {
	const act = rng_11234.rawNext();
	tsts(`XorShift32(11234).rawNext[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

const seq_def:number[]=[
	723471715,
	2497366906,
	2064144800,
	2008045182
];
const rng_def=XorShift32.new();
i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`XorShift32().rawNext[${i}]`, () => {
		assert.equal(act,expect);
	});
	i++;
}

tsts(`XorShift32(,false) save returns empty, restore throws`,()=>{
	const r=XorShift32.new();
	const sav=r.save();
	assert.equal(sav.length,0);
	assert.throws(()=>XorShift32.restore(sav));
})

tsts(`XorShift32().save/restore loop`,()=>{
	const r=XorShift32.new(true);
	assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
	const sav=r.save();
	assert.equal(sav.length,4,'save length');
	assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
	assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

	const r2=XorShift32.restore(sav);    
	assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
	assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

	assert.is(Object.prototype.toString.call(r).indexOf("xorshift32")>0,true,'toString is set');
});

tsts.run();
