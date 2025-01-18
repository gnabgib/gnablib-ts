
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro128pp } from '../../src/prng/xoroshiro128';
import { hex } from '../../src/codec/Hex';
import { U64 } from '../../src/primitive/number';

const tsts = suite('Xoroshiro128++');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq_def: string[] = [
    '6F68E1E7E2646EE1',
    'BF971B7F454094AD',
    '48F2DE556F30DE38',
    '6EA7C59F89BBFC75',
];
const rng_def=Xoroshiro128pp.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoroshiro128++().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_1_2:string[]=[
    '0000000000060001',
    '000260C000660007',
    '180ACC04718606D3',
    '9E226D35036FC4C7',
];
const rng_1_2=Xoroshiro128pp.seed(U64.fromUint32Pair(1,0),U64.fromUint32Pair(2,0));
i=0;
for (const expect of seq_1_2) {
	const act = rng_1_2.rawNext();
	tsts(`Xoroshiro128++(1,2).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`Xoroshiro128++(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro128pp.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro128pp.restore(sav));
})

tsts(`Xoroshiro128++().save/restore loop`,()=>{
    const r=Xoroshiro128pp.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro128pp.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro128++")>0,true,'toString is set');
});

tsts.run();
