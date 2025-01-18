import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro256p } from '../../src/prng/xoshiro256';
import { U64 } from '../../src/primitive/number';
import { hex } from '../../src/codec/Hex';

const tsts = suite('Xoshiro256+');

//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 21149
const seq_def: string[] = [
    'DAAC60E1ED6A4F9B',
    '3156A1DA0DC08435',
    'F9BA3E3285D046AB',
    '4FD194611DBA7B01',
    '40B78599C31791BF',
    '03B1DD310503D6F4',
    'B238D3A721D5092B',
    '11017BBA8A0F8ADF',
    'A6A988BED1F59149',
    'DB4000FB8D550622',
    '5B3947BECB71EF9D',
    '53CDA86134220DBA',
    '95AA43DE2A55BFE9',
    '2A6A597CC890C649',
    'A159BE94778C6782',
    '057CC5712467F9BE',
    'FD5116670C452ECA',
    '5965EF754974BEDB',
    '7E6232B5E4D2282D',
    '13BF0121EDF46AC4',
];
const rng_def=Xoshiro256p.new();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoshiro256+().rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Sourced from another repo that implements xoshiro256+
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 16845
const seq_1: string[] = [
    '037717133586F728',
    '062AF0D9E6C231D4',
    'A85FE375203BD7A8',
    '72B5E4F790D2F3FA',
    '6CF76A708668CBF9',
    'D9F228F27DE00ED0',
    '7510A654D0AFAEFE',
    'B7665AF4A4AA67D6',
    'F4ADF6E24E007BE3',
    'B963E14C255ECE56',
    'AE4CB423AD6D6DD0',
    'C63221639361C4BC',
    '0A8FFDE943D03C75',
    'CE71D69BB93F09E5',
    '85253A715745F00E',
    '685D7C537809E4C1',
    '6879C4460CA2E862',
    '3BC4A1338F564A5A',
    '03B1C2102E1CA2A0',
    '9B8C1D6E46E065BB',
];
const rng_1c=Xoshiro256p.seed(
    U64.fromUint32Pair(0x36ed852f,0x96a1743c),
    U64.fromUint32Pair(0x32c50c9f,0x8c0ac257),
    U64.fromUint32Pair(0xc2947a21,0xec65ea85),
    U64.fromUint32Pair(0xfe9971f9,0x6cd5a2d6));
i = 0;
for (const expect of seq_1) {
	const act = rng_1c.rawNext();
	tsts(`Xoshiro256+(seed).rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`Xoshiro256+(,false) save returns empty, restore throws`,()=>{
    const r=Xoshiro256p.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoshiro256p.restore(sav));
})

tsts(`Xoshiro256+().save/restore loop`,()=>{
    const r=Xoshiro256p.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoshiro256p.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro256+")>0,true,'toString is set');
});

tsts.run();
