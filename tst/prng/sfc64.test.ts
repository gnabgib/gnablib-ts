
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Sfc64 } from '../../src/prng/sfc64';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('Sfc64');

//Just to show with no seed, reasonable random
const seq_def: string[] = [
    '509946A41CD733A4',
    '3CE745DC80536FC9',
    'B1E3CF34CACDB80C',
    '58EC42788FA0D1DC',
    'B991E9ACFA9464AC',
    'CD48EAA1B860F2A5',
    '27D998076F04D2F9',
    '3EFF44826F906165'
];
const rng_def=Sfc64.new();
let i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`Sfc64().rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Todo find a viable testing source of a 2 part (1 U64) key
const seq_1_2:string[]=[
    '7C0ACB6F88B52BF7',
    'C2B84D8F374F9F68',
    'EB98768B2F214403'
];
const rng_4294967298=Sfc64.seed(U64.fromI32s(1,2));
i=0;
for (const expect of seq_1_2) {
    const act = rng_4294967298.rawNext();
    tsts(`Sfc64(U64(1,2)).rawNext[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

//Todo find a viable testing source of a 6 part (3 U64) key
//s1:0000000200000001 | 8589934593
//s2:0000000400000003 | 17179869187
//s3:0000000600000005 | 25769803781

const seq_1_2_3_4_5_6:string[]=[
    'BD2CBADC9DD7D15F',
    '28F734DE11AC1CF6',
    '84A43DDE75BF539C'
];
const rng_3_U64=Sfc64.seed(U64.fromI32s(1,2),U64.fromI32s(3,4),U64.fromI32s(5,6));
i=0;
for (const expect of seq_1_2_3_4_5_6) {
    const act = rng_3_U64.rawNext();
    tsts(`Sfc64(U64(1,2),U64(3,4),U64(5,6))[${i}]`, () => {
        assert.equal(act.toString(),expect);
    });
    i++;
}

tsts(`Sfc64(,false) save returns empty, restore throws`,()=>{
    const r=Sfc64.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Sfc64.restore(sav));
})

tsts(`Sfc64().save/restore loop`,()=>{
    const r=Sfc64.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Sfc64.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("sfc64")>0,true,'toString is set');
});


tsts.run();