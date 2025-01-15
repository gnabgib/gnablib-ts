
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Well512 } from '../../src/prng/well512';

const tsts = suite('Well512');

//Sourced from well512.c https://github.com/Bill-Gray/prngs/blob/master/well512.c
const seq_def: number[] = [
    0x295732ff, 0x479c6a8a, 0x331e895b, 0x4f8f1ca9, 0x33a9405a, 0x240d9004, 0x703cbf6f, 0x71aa84b5,
    0xb9be8a42, 0xe07d4269, 0x43c98c07, 0x97fae94e, 0x963fef44, 0xced6ebd0, 0x1fcd1ee1, 0x8bec1508,
    0xc8ced044, 0x312aab1f, 0xaaa46a34, 0xdb213327, 0x73f035b0, 0xc02c39d8, 0xfc0cc9ba, 0x4716020b,
    0x96e7270e, 0xf652bd19, 0xe0a505a9, 0xd266fa44, 0xe7cde7d0, 0x6c755150, 0x524a69b7, 0x2c2c3fb7,
    0x1c8a5b5b, 0x885561a7, 0x7830fa69, 0xec7cc104, 0xfa9bcc9c, 0x828f7341, 0x05d4881b, 0x31a7216e
];
const rng_def=Well512.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Well512().rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

const seq_1s:number[]=[
    268435492,
    278135812
];
const rng_1s=Well512.seed(1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1);
i=0;
for (const expect of seq_1s) {
	const act = rng_1s.rawNext();
	tsts(`Well512(seed 1s).rawNext[${i}]`, () => {
        assert.equal(act,expect);
	});
	i++;
}

tsts(`Well512(,false) save returns empty, restore throws`,()=>{
    const r=Well512.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Well512.restore(sav));
})

tsts(`Well512().save/restore loop`,()=>{
    const r=Well512.new(true);
    assert.equal(r.rawNext(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,65,'save length');
    assert.equal(r.rawNext(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext(),seq_def[2],'r consume[2]');

    const r2=Well512.restore(sav);    
    assert.equal(r2.rawNext(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("well512")>0,true,'toString is set');
});

tsts.run();
