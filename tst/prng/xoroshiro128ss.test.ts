
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro128ss } from '../../src/prng/xoroshiro128';
import { hex } from '../../src/codec/Hex';
import { U64 } from '../../src/primitive/number/U64';

const tsts = suite('Xoroshiro128**');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq_def: string[] = [
    'DEC90D521E93E35D',
    '6D33AC6F18895E08',
    'AB21904EEC6FA48A',
    '87AFDBC188423FBE',
];
const rng_def=Xoroshiro128ss.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoroshiro128**().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_1_2:string[]=[
    '0000000000001680',
    '00000016C3804380',
    '86B5B3AD00004380',
    '800044A4CD1497B2',
];
const rng_1_2=Xoroshiro128ss.seed(U64.fromUint32Pair(1,0),U64.fromUint32Pair(2,0));
i=0;
for (const expect of seq_1_2) {
    const act = rng_1_2.rawNext();
    tsts(`Xoroshiro128**(1,2).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
    });
    i++;
}

tsts(`Xoroshiro128**(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro128ss.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro128ss.restore(sav));
})

tsts(`Xoroshiro128**().save/restore loop`,()=>{
    const r=Xoroshiro128ss.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro128ss.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro128**")>0,true,'toString is set');
});


tsts.run();
