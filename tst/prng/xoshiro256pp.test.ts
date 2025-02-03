import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Xoshiro256pp } from '../../src/prng/xoshiro256';
import { U64 } from '../../src/primitive/number/U64';
import { hex } from '../../src/codec/Hex';

const tsts = suite('Xoshiro256++');
//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 10213
const seq_def: string[] = [
    '53175D61490B23DF',
    '61DA6F3DC380D507',
    '5C0FDF91EC9A7BFC',
    '02EEBF8C3BBE5E1A',
    '7ECA04EBAF4A5EEA',
    '0543C37757F08D9A',
    'DB7490C75AB5026E',
    'D87343E6464BC959',
    '4B7DA0A02389F0FF',
    '1300FC58C0424C16',
    '5084843206C19968',
    '10EA073DE9AA4DFC',
    '1AAE554343960CC1',
    '1804139F10FAE720',
    '10D790E7B8AC10FA',
    '667D2BFFDD1496F7',
    'A04620D3D0FC04A8',
    '1D50881230AF9CC3',
    '53BE287DED35F698',
    '673235793F7908E1',
];
const rng_def=Xoshiro256pp.new();
let i = 0;
for (const expect of seq_def) {
	const act = rng_def.rawNext();
	tsts(`Xoshiro256++().rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

//Sourced from another repo that implements xoshiro256++
//https://gitgud.io/anglekh/prng-xoshiro/-/blob/master/test/test.js?ref_type=heads 5612
const seq_1: string[] = [
    '203C37B7CAEF40BA',
    'E37175D6E4B50DC1',
    'C9ACB234A4716244',
    '644DD17E4E82BEC2',
	'5AFD858E9BF9ADED',
	'115821A57A363613',
	'5B3389120FD5A727',
	'6A3E34447240D834',
	'8FD8B8F4F305E1E1',
	'2FB61DD0F5DFA6D5',
	'C84C42DFB97C70B6',
	'0CCDD497BBD12C43',
	'ABAE288671D9D72C',
	'03C095C2B55B842C',
	'DA4D1AE10E4DE9FC',
	'DAC0BF311F031C57',
	'8B265A95A7732C36',
	'CEAC80C020DCBBFA',
    'DE88940ED4198C8C',
	'13999C602F7C1112',
];
const rng_1c=Xoshiro256pp.seed(
    U64.fromI32s(0x36ed852f,0x96a1743c),
    U64.fromI32s(0x32c50c9f,0x8c0ac257),
    U64.fromI32s(0xc2947a21,0xec65ea85),
    U64.fromI32s(0xfe9971f9,0x6cd5a2d6));
i = 0;
for (const expect of seq_1) {
	const act = rng_1c.rawNext();
	tsts(`Xoshiro256++(seed).rawNext[${i}]`, () => {
		assert.equal(hex.fromBytes(act.toBytesBE()), expect);
	});
	i++;
}

tsts(`Xoshiro256++(,false) save returns empty, restore throws`,()=>{
    const r=Xoshiro256pp.new();
    const sav=r.save();
    assert.equal(sav.length,0);
    assert.throws(()=>Xoshiro256pp.restore(sav));
})

tsts(`Xoshiro256++().save/restore loop`,()=>{
    const r=Xoshiro256pp.new(true);
    assert.equal(r.rawNext().toString(),seq_def[0],'r consume[0]');
    const sav=r.save();
    assert.equal(sav.length,32,'save length');
    assert.equal(r.rawNext().toString(),seq_def[1],'r consume[1]');
    assert.equal(r.rawNext().toString(),seq_def[2],'r consume[2]');

    const r2=Xoshiro256pp.restore(sav);    
    assert.equal(r2.rawNext().toString(),seq_def[1],'r2 still at [1]');
    assert.equal(r.rawNext().toString(),seq_def[3],'r consume[3]');

    assert.is(Object.prototype.toString.call(r).indexOf("xoshiro256++")>0,true,'toString is set');
});

tsts.run();
