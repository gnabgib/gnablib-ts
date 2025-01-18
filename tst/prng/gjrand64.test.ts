
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Gjrand64 } from '../../src/prng/gjrand64';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('Gjrand64');

//Unsourced, just showing the default seed provides reasonable randomness
const seq_def:string[]=[
    '2BB34ED3C4AED29C',
    'D541637C127368E1',
    'F836ACAFB2B05C26',
    '13183A03CE2DDD89',
    '2EF5E00C3CEA590B',
    '1847036B41FCB7F5',
    '3E3F7C895FEEEF26',
    '2DE09C062C181F4C'
];
const rnd_def=Gjrand64.new();
let i=0;
for (const expect of seq_def) {
    const act = rnd_def.rawNext();
    tsts(`Gjrand64().rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Unfortunately GJrand kat.c mixes various modes in 64bit.. but here we are
const seq_64:string[] = [
    '2235350C5555A578', 
    'B6212D855D88A8F7'
];
const rng_64b=Gjrand64.seed(U64.fromUint32Pair(987654321,123456789));
i=0;
for (const expect of seq_64) {
    const act = rng_64b.rawNext();
    tsts(`Gjrand64(U64).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

const seq_128:string[] = [
    'D30BD8DFD8821DB0', 
    'C56106C70292A42D'
];
const rng_128=Gjrand64.seed(U64.fromUint32Pair(123, 456),U64.fromUint32Pair(789, 987654321));
i=0;
for (const expect of seq_128) {
    const act = rng_128.rawNext();
    tsts(`Gjrand64(U64,U64).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Unsourced, just proving 32bit seeding also works
const seq_32:string[]=[
    'ED6ECC39FB3FAE62', 
    '422E4DEE7B74A27B'
];
const rng_32=Gjrand64.seed(42);
i=0;
for (const expect of seq_32) {
    const act = rng_32.rawNext();
    tsts(`Gjrand64(42).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

tsts(`Gjrand64(,false) save returns empty, restore throws`,()=>{
    const r=Gjrand64.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Gjrand64.restore(sav));
})

tsts(`Gjrand64().save/restore loop`,()=>{
    const r=Gjrand64.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Gjrand64.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("gjrand64")>0,true,'toString is set');
});

tsts.run();