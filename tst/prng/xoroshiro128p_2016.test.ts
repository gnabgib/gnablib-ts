
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro128p_2016 } from '../../src/prng/xoroshiro128';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('Xoroshiro128+ 2016');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq_def: string[] = [
    '509946A41CD733A3',
    '00885667B1934BFA',
    '1061F9AD258FD5D5',
    '3F8BE44897A4317C',
];
const rng_def=Xoroshiro128p_2016.new();
let i=0;
for (const expect of seq_def) {
    const act = rng_def.rawNext();
    tsts(`Xoroshiro128+_2016().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
    });
    i++;
}

//Sourced from: https://github.com/mscharley/rust-xoroshiro128/blob/master/src/tests/xoroshiro.rs
//Which also uses the 2016 a/b/c values
const seq_2016_F:string[] = [
    '402C70C3B05BF3B8',
    '4FE2A6B2DCE63BBB',
]
const rng_2016_f=Xoroshiro128p_2016.seed(
    U64.fromI32s(0x75376EA4,0x4E6932AD),
    U64.fromI32s(0x3B248514,0xF1C33E16));
i=0;
for (const expect of seq_2016_F) {
    const act = rng_2016_f.rawNext();
    tsts(`Xoroshiro128+_2016(F).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
    });
    i++;
}

//Tests from: https://asecuritysite.com/random/xo_solv
// Which uses out of date a/b/c values (55,14,36), but proves accuracy
const seq_2016:string[]=[
    '3AF8FB7F3E891315',
    '206B72696B6C6166',
    '6AE4FC311F25F529',
    'A33BAA2383A54F0A',
    'A403C782681093E4',
    '1FC7F9C48D35A4F9',
    'BDAEFBC90D9A43A2',
    '06DD63958CB5E47B',
    'A9FAAC455D0E31E1',
    '5CE24B9D2D87C94D',
];
const rng_3=Xoroshiro128p_2016.seed(
    U64.fromI32s(0x32C4CD14,0x8BE85000),
    U64.fromI32s(0x0BC44601,0xAF10AB7F));
i=0;
for (const expect of seq_2016) {
    const act = rng_3.rawNext();
    tsts(`Xoroshiro128+_2016(3).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
    });
    i++;
}

tsts(`Xoroshiro128+(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro128p_2016.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro128p_2016.restore(sav));
})

tsts(`Xoroshiro128+().save/restore loop`,()=>{
    const r=Xoroshiro128p_2016.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro128p_2016.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro128+_2016")>0,true,'toString is set');
});

tsts.run();
