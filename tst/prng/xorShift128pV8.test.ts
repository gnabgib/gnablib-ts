
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XorShift128pV8 } from '../../src/prng/xorShift128p';
import { U64 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('XorShift128+v8');
//https://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
//No reasonable source for vectors found (yet), but note the first number matches xorShift128plus 
// (because different a/b/c change the second and subsequent rounds)
const seq_12: string[] = [
    '000000001CF622FA', 
    '0003ADE7644D33FD',
    '000D0EB01E895FBB',
    'F3B74E5BC54ECE74',
    '8B7141A43B09F3B5',
];

const rng_12=XorShift128pV8.seed(U64.fromUint32Pair(123456789,0),U64.fromUint32Pair(362436069,0));
//0x000000000 159A55E5 00000000 075BCD15 / 6685765407924336135579094293
let i = 0;
for (const expect of seq_12) {
	const act = rng_12.rawNext();
	tsts(`XorShift128+(15..).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Unsourced, but shows that without a seed reasonable PRNG are generated
const seq_def:string[] =[
    '509946A41CD733A3',
    'FF5E664AA2264AB1',
    '5CB3706844353952',
    '76F611E25A5011E3',
]
const rng_def=XorShift128pV8.new();
i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`XorShift128+v8().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
    });
    i++;
}

tsts(`XorShift128+v8(,false) save returns empty, restore throws`,()=>{
    const r=XorShift128pV8.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>XorShift128pV8.restore(sav));
})

tsts(`XorShift128+v8().save/restore loop`,()=>{
    const r=XorShift128pV8.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=XorShift128pV8.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xorshift128+v8")>0,true,'toString is set');
});


tsts.run();
