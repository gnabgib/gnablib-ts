
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoroshiro128p } from '../../src/prng/xoroshiro128';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('Xoroshiro128+');

//Unsourced, but prove that the unseeded version generates reasonable values
const seq_def: string[] = [
    '509946A41CD733A3',
    'D805FCAC6824536E',
    'DADC02F3E3CF7BE3',
    '622E4DD99D2720E5',
];
const rng_def=Xoroshiro128p.new();
let i=0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoroshiro128+().rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

const seq_F:string[] = [
    '402C70C3B05BF3B8',
    'E0E1EBDDF72F19EB',
]
const rng_f=Xoroshiro128p.seed(
    U64.fromI32s(0x75376EA4,0x4E6932AD),
    U64.fromI32s(0x3B248514,0xF1C33E16));
i=0;
for (const expect of seq_F) {
	const act = rng_f.rawNext();
	tsts(`Xoroshiro128+(F).rawNext[${i}]`, () => {
        assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`Xoroshiro128+(,false) save returns empty, restore throws`,()=>{
    const r=Xoroshiro128p.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoroshiro128p.restore(sav));
})

tsts(`Xoroshiro128+().save/restore loop`,()=>{
    const r=Xoroshiro128p.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,16,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoroshiro128p.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoroshiro128+")>0,true,'toString is set');
});

tsts.run();
