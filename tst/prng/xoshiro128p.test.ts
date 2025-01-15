import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro128p } from '../../src/prng/xoshiro128';

const tsts = suite('Xoshiro128+');
//These test vectors were found in another library, sourced from the CPP reference impl
const seq_1: number[] = [
    3,
    4098,
    8398849,
    22028806,
    2160079882,
    580154890,
    2188909838,
    706519639,
    1959711752,
    1044417639,
    1377895525,
    1383819037,
    4190575430,
    3702202053,
    3499793018,
    1460919382,
    1999355645,
    2146148053,
    2824266627,
    489658741,
    1682959723,
    1919046744,
    1177607637,
    3199579655,
    3921860424,
    1925758241,
    1801294532,
    2041637679,
    2265703464,
    1471426682,
];
const rng_1=Xoshiro128p.seed(0,1,2,3);
let i = 0;
for (const expect of seq_1) {
	const act = rng_1.rawNext();
	tsts(`Xoshiro128+([0,1,2,3]).rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

//No corroboration for these vectors, but show it works with default seed
const seq_def:number[]=[
    49376,
    95971011,
    3157991041,
    4193534618,
];
const rng_def=Xoshiro128p.new();
i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoshiro128+().rawNext[${i}]`, () => {
		assert.equal(act, expect);
	});
	i++;
}

tsts(`Xoshiro128+(,false) save returns empty, restore throws`,()=>{
    const r=Xoshiro128p.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoshiro128p.restore(sav));
})

tsts(`Xoshiro128+().save/restore loop`,()=>{
    const r=Xoshiro128p.new(true);
    //Read the first number
    assert.equal(r.rawNext(),seq_def[0]);
    const sav=r.save();
    assert.equal(sav.length,16);
    //Read the next two numbers after the save
    assert.equal(r.rawNext(),seq_def[1]);
    assert.equal(r.rawNext(),seq_def[2]);
    //r2 should still be 1 number in
    const r2=Xoshiro128p.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1]);

    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro128+")>0,true,'toString is set');
});

tsts.run();
