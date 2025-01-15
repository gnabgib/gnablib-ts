import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro128pp } from '../../src/prng/xoshiro128';

const tsts = suite('Xoshiro128++');
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
    384,
    524546,
    1075056769,
    2828078338,
    1617561924,
    3403628308,
    1563858755,
    3600111265,
    3629013629,
    1801479719,
    4063654329,
    144202860,
    3379844426,
    1967165921,
    356350240,
    3768476407,
    441311010,
    1660658250,
    2115519323,
    665052440,
    1052069458,
    282524233,
    1151236316,
    3319857069,
    4188762147,
    239429708,
    562243103,
    3489603266,
    4013708149,
    3013490719,
];
const rng_1=Xoshiro128pp.seed(0,1,2,3);
let i = 0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`Xoshiro128++([0,1,2,3]).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

//No corroboration for these vectors, but show it works with default seed
const seq_0:number[]=[
    6320181,
    3694401605,
    591767346,
    2919232099
];
const rng_0=Xoshiro128pp.new();
i=0;
for (const expect of seq_0) {
	const act = rng_0.rawNext();
	tsts(`Xoshiro128++().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Xoshiro128++().save/restore loop`,()=>{
    const r=Xoshiro128pp.new(true);
    //Read the first number
    assert.equal(r.rawNext(),6320181);
    const sav=r.save();
    assert.equal(sav.length,16);
    //Read the next two numbers after the save
    assert.equal(r.rawNext(),3694401605);
    assert.equal(r.rawNext(),591767346);
    //r2 should still be 1 number in
    const r2=Xoshiro128pp.restore(sav);    
    assert.equal(r2.rawNext(),3694401605);

    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro128++")>0,true,'toString is set');
});

tsts.run();
